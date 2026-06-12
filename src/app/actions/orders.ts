"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  return session;
}

export interface CartItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/** Retorna todos os pedidos (abertos/enviados) de uma mesa com seus itens */
export async function getTableOrders(tableId: string) {
  return prisma.order.findMany({
    where: {
      tableId,
      status: { in: ["ABERTO", "ENVIADO"] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });
}

/** Busca produtos disponíveis com categorias para o seletor */
export async function getProductsForPDV() {
  const [products, categories] = await Promise.all([
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
  return { products, categories };
}

/** Confirma o pedido: salva no banco, atualiza status da mesa */
export async function confirmOrder(tableId: string, items: CartItemInput[]) {
  await requireAuth();

  if (!items.length) return { error: "Carrinho vazio." };

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  await prisma.$transaction(async (tx) => {
    // Cria o pedido com seus itens
    const order = await tx.order.create({
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
    });

    // Garante que a mesa está OCUPADA e registra currentOrderId
    await tx.table.update({
      where: { id: tableId },
      data: {
        status: "OCUPADA",
        currentOrderId: order.id,
        openedAt: (await tx.table.findUnique({ where: { id: tableId } }))?.openedAt ?? new Date(),
      },
    });
  });

  revalidatePath(`/dashboard/mesas/${tableId}`);
  revalidatePath("/dashboard/mesas");
  return { success: true };
}
