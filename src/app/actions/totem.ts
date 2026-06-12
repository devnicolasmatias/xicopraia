"use server";

import { prisma } from "@/lib/prisma";
import { TOTEM_TABLE_NUMBER } from "@/lib/pdvConstants";
import type { PaymentMethod } from "@/generated/prisma";
import { earnCashback, redeemCashback, sendCashbackWhatsApp } from "./cashback";

async function ensureTotemTable() {
  return prisma.table.upsert({
    where: { number: TOTEM_TABLE_NUMBER },
    update: {},
    create: {
      number: TOTEM_TABLE_NUMBER,
      capacity: 1,
      status: "LIVRE",
      customerName: "Totem",
    },
  });
}

export async function getTotemMenuData() {
  const [products, categories, cashbackConfig] = await Promise.all([
    prisma.product.findMany({
      where: { available: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        categoryId: true,
        category: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.cashbackConfig.findFirst(),
  ]);

  return {
    products: products.map((p) => ({ ...p, price: Number(p.price) })),
    categories,
    cashbackConfig: cashbackConfig
      ? {
          percentage: Number(cashbackConfig.percentage),
          expiryDays: cashbackConfig.expiryDays,
        }
      : null,
  };
}

export async function findCustomerByPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const customer = await prisma.customer.findUnique({
    where: { phone: digits },
    select: {
      id: true,
      name: true,
      phone: true,
      cashbackBalance: true,
      cashbackExpiresAt: true,
    },
  });

  if (!customer) return { found: false as const };

  const balance = Number(customer.cashbackBalance);
  const isExpired =
    customer.cashbackExpiresAt != null && customer.cashbackExpiresAt < new Date();

  return {
    found: true as const,
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    cashbackBalance: isExpired ? 0 : balance,
    hasValidCashback: balance > 0 && !isExpired,
  };
}

export async function createTotemCustomer(name: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  return prisma.customer.create({
    data: { name, phone: digits, cashbackBalance: 0 },
    select: { id: true, name: true, phone: true },
  });
}

export interface TotemOrderInput {
  customerName: string;
  customerId?: string;
  shouldRedeemCashback?: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  paymentMethod: PaymentMethod;
}

export async function completeTotemOrder(input: TotemOrderInput) {
  const { customerName, customerId, shouldRedeemCashback, items, paymentMethod } = input;

  if (!items.length) return { error: "Carrinho vazio." };

  const totemTable = await ensureTotemTable();

  let cashbackDiscountAmount = 0;
  if (customerId && shouldRedeemCashback) {
    const redemption = await redeemCashback(customerId);
    cashbackDiscountAmount = Number(redemption.amount ?? 0);
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - cashbackDiscountAmount);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tableId: totemTable.id,
        customerId: customerId ?? null,
        total,
        status: "ENVIADO",
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes?.trim() || null,
            status: "PENDENTE",
          })),
        },
      },
    });

    await tx.transaction.create({
      data: {
        orderId: created.id,
        paymentMethod,
        subtotal,
        serviceFee: 0,
        discount: 0,
        cashbackDiscount: cashbackDiscountAmount,
        total,
        splitCount: 1,
      },
    });

    await tx.table.update({
      where: { id: totemTable.id },
      data: { status: "LIVRE", currentOrderId: null, customerName },
    });

    return created;
  });

  if (customerId) {
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

  // Generate a short display number from the order ID
  const orderNumber = (parseInt(order.id.replace(/\D/g, "").slice(-4) || "1", 10) % 900) + 100;

  return { success: true as const, orderId: order.id, orderNumber, total, subtotal, cashbackDiscountAmount };
}
