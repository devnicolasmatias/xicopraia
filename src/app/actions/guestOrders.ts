"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── Public menu data ─────────────────────────────────────────────────────────

export async function getPublicMenuData(tableId: string) {
  const [table, products, categories] = await Promise.all([
    prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, number: true, status: true, customerName: true },
    }),
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
  ]);

  return { table, products, categories };
}

// ─── Guest order submission ───────────────────────────────────────────────────

export interface GuestCartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export async function submitGuestOrder(tableId: string, items: GuestCartItem[]) {
  if (!items.length) return { error: "Carrinho vazio." };

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { id: true, status: true },
  });

  if (!table) return { error: "Mesa não encontrada." };
  if (table.status === "LIVRE") return { error: "Esta mesa não está aberta. Chame um garçom." };

  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        tableId,
        total,
        status: "ENVIADO",
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes || null,
            status: "PENDENTE",
          })),
        },
      },
      include: { items: true },
    });

    // Garante que a mesa está OCUPADA
    if (table.status !== "OCUPADA" && table.status !== "PEDIU_CONTA") {
      await tx.table.update({
        where: { id: tableId },
        data: { status: "OCUPADA", openedAt: new Date() },
      });
    }

    return newOrder;
  });

  revalidatePath("/dashboard/mesas");
  revalidatePath("/dashboard/cozinha");
  revalidatePath("/cozinha");

  return { success: true, orderId: order.id };
}

// ─── Order status (polling) ───────────────────────────────────────────────────

export async function getGuestOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          status: true,
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
  };
}
