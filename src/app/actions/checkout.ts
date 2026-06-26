"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { PaymentMethod } from "@/generated/prisma";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  return session;
}

export async function getTableOrdersForCheckout(tableId: string) {
  return prisma.order.findMany({
    where: {
      tableId,
      status: { in: ["ABERTO", "ENVIADO", "FECHADO"] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true } },
      items: {
        where: { status: { not: "CANCELADO" } },
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export interface CloseOrderInput {
  tableId: string;
  paymentMethod: PaymentMethod;
  serviceFeePercent: number; // 0–100
  discountAmount: number;
  splitCount: number;
}

export async function closeOrder(input: CloseOrderInput) {
  await requireAuth();

  const { tableId, paymentMethod, serviceFeePercent, discountAmount, splitCount } = input;

  // Busca todos os pedidos abertos/enviados/fechados da mesa, incluindo ficha técnica
  const orders = await prisma.order.findMany({
    where: {
      tableId,
      status: { in: ["ABERTO", "ENVIADO", "FECHADO"] },
    },
    include: {
      items: {
        where: { status: { not: "CANCELADO" } },
        include: {
          product: {
            include: {
              ingredients: {
                include: { ingredient: true },
              },
            },
          },
        },
      },
    },
  });

  if (!orders.length) return { error: "Nenhum pedido em aberto para essa mesa." };

  const subtotal = orders.reduce((sum, order) =>
    sum + order.items.reduce((s, item) =>
      s + Number(item.unitPrice) * item.quantity, 0
    ), 0
  );

  const serviceFee = subtotal * (serviceFeePercent / 100);
  const total = Math.max(0, subtotal + serviceFee - discountAmount);

  await prisma.$transaction(async (tx) => {
    // Marca todos os pedidos como PAGO
    for (const order of orders) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAGO", total: order.total },
      });
    }

    // Cria a transação no pedido mais recente (representa o fechamento)
    const mainOrder = orders[orders.length - 1];
    await tx.transaction.create({
      data: {
        orderId: mainOrder.id,
        paymentMethod,
        subtotal,
        serviceFee,
        discount: discountAmount,
        total,
        splitCount,
      },
    });

    // Baixa de estoque: percorre ficha técnica de cada item vendido
    const stockDeductions = new Map<string, number>(); // ingredientId → quantidade total a deduzir
    for (const order of orders) {
      for (const item of order.items) {
        for (const pi of item.product.ingredients) {
          const total = Number(pi.quantity) * item.quantity;
          stockDeductions.set(pi.ingredientId, (stockDeductions.get(pi.ingredientId) ?? 0) + total);
        }
      }
    }
    for (const [ingredientId, qty] of stockDeductions) {
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: { decrement: qty } },
      });
    }

    // Marca itens pendentes/preparando como ENTREGUE para sumir do KDS
    for (const order of orders) {
      await tx.orderItem.updateMany({
        where: { orderId: order.id, status: { in: ["PENDENTE", "PREPARANDO"] } },
        data: { status: "ENTREGUE" },
      });
    }

    // Libera a mesa
    await tx.table.update({
      where: { id: tableId },
      data: {
        status: "LIVRE",
        customerName: null,
        openedAt: null,
        currentOrderId: null,
      },
    });
  });

  // Busca o ID da transação criada para retornar ao cliente
  const txn = await prisma.transaction.findFirst({
    where: { order: { tableId, status: "PAGO" } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  revalidatePath("/dashboard/mesas");
  revalidatePath(`/dashboard/mesas/${tableId}`);
  revalidatePath("/dashboard/cozinha");
  revalidatePath("/admin/financeiro");
  return { success: true, transactionId: txn?.id };
}
