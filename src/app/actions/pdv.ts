"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { PaymentMethod } from "@/generated/prisma";
import type { CartItemInput } from "@/app/actions/orders";
import {
  PDV_TABLE_NUMBER,
  SELF_SERVICE_CATEGORY_NAME,
  SELF_SERVICE_PRODUCT_NAME,
  SELF_SERVICE_PRICE_PER_KG,
} from "@/lib/pdvConstants";

async function requirePdvAccess() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  if (session.role === "COZINHA") throw new Error("Sem permissão para o PDV.");
  return session;
}

export async function ensurePdvTable() {
  return prisma.table.upsert({
    where: { number: PDV_TABLE_NUMBER },
    update: {},
    create: {
      number: PDV_TABLE_NUMBER,
      capacity: 1,
      status: "LIVRE",
      customerName: "Balcão / PDV",
    },
  });
}

export async function ensureSelfServiceProduct() {
  const category = await prisma.category.upsert({
    where: { name: SELF_SERVICE_CATEGORY_NAME },
    update: { active: true },
    create: {
      name: SELF_SERVICE_CATEGORY_NAME,
      color: "#ea580c",
      active: true,
    },
  });

  const existing = await prisma.product.findFirst({
    where: { name: SELF_SERVICE_PRODUCT_NAME, categoryId: category.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: { available: true },
    });
    return;
  }

  await prisma.product.create({
    data: {
      name: SELF_SERVICE_PRODUCT_NAME,
      description: `Venda por peso (R$ ${SELF_SERVICE_PRICE_PER_KG.toFixed(2).replace(".", ",")} / kg)`,
      price: SELF_SERVICE_PRICE_PER_KG,
      categoryId: category.id,
      available: true,
    },
  });
}

export interface PdvSaleInput {
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  discountAmount: number;
  customerId?: string;
  redeemCashback?: boolean;
}

/**
 * Registra venda de balcão: pedido pago, transação, baixa de estoque (ficha técnica).
 * Itens vão como ENTREGUE para não aparecer na cozinha.
 */
export async function completePdvSale(input: PdvSaleInput) {
  await requirePdvAccess();

  const { items, paymentMethod, discountAmount, customerId, redeemCashback } = input;

  if (!items.length) return { error: "Carrinho vazio." };

  const pdvTable = await ensurePdvTable();

  // Resolve cashback redemption before starting the transaction
  let cashbackDiscountAmount = 0;
  if (customerId && redeemCashback) {
    const { redeemCashback: redeemFn } = await import("./cashback");
    const redemption = await redeemFn(customerId);
    cashbackDiscountAmount = Number(redemption.amount ?? 0);
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const serviceFee = 0;
  const discount = Math.max(0, Number(discountAmount) || 0);
  const total = Math.max(0, subtotal + serviceFee - discount - cashbackDiscountAmount);

  const { order, transactionId } = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tableId: pdvTable.id,
        customerId: customerId ?? null,
        total,
        status: "PAGO",
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes?.trim() || null,
            status: "ENTREGUE",
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
        },
      },
    });

    const txRecord = await tx.transaction.create({
      data: {
        orderId: created.id,
        paymentMethod,
        subtotal,
        serviceFee,
        discount,
        cashbackDiscount: cashbackDiscountAmount,
        total,
        splitCount: 1,
      },
    });

    const stockDeductions = new Map<string, number>();
    for (const item of created.items) {
      for (const pi of item.product.ingredients) {
        const qty = Number(pi.quantity) * item.quantity;
        stockDeductions.set(pi.ingredientId, (stockDeductions.get(pi.ingredientId) ?? 0) + qty);
      }
    }
    for (const [ingredientId, qty] of stockDeductions) {
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: { decrement: qty } },
      });
    }

    await tx.table.update({
      where: { id: pdvTable.id },
      data: { status: "LIVRE", currentOrderId: null },
    });

    return { order: created, transactionId: txRecord.id };
  });

  // Earn new cashback for this purchase (fire and forget)
  if (customerId) {
    const { earnCashback, sendCashbackWhatsApp } = await import("./cashback");
    earnCashback(customerId, subtotal, order.id)
      .then(async (result) => {
        if (result) {
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { phone: true },
          });
          if (customer) {
            sendCashbackWhatsApp(
              customer.phone,
              result.amount,
              result.expiresAt,
              result.expiryDays
            ).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }

  revalidatePath("/pdv");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/crm");
  revalidatePath("/dashboard/mesas");
  return { success: true, orderId: order.id, transactionId, total };
}

export async function getRecentPdvSales(limit = 20) {
  await requirePdvAccess();

  const pdvTable = await prisma.table.findUnique({
    where: { number: PDV_TABLE_NUMBER },
  });

  if (!pdvTable) return [];

  return prisma.order.findMany({
    where: { tableId: pdvTable.id, status: "PAGO" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      transaction: { select: { paymentMethod: true } },
      items: {
        where: { status: { not: "CANCELADO" } },
        select: { quantity: true },
      },
    },
  });
}
