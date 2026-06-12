"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { OrderItemStatus } from "@/generated/prisma";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
}

/** Busca todos os itens PENDENTE/PREPARANDO, agrupados por pedido+mesa */
export async function getKitchenOrders() {
  return prisma.order.findMany({
    where: {
      items: { some: { status: { in: ["PENDENTE", "PREPARANDO"] } } },
    },
    orderBy: { createdAt: "asc" },
    include: {
      table: { select: { id: true, number: true } },
      items: {
        where: { status: { in: ["PENDENTE", "PREPARANDO"] } },
        orderBy: { createdAt: "asc" },
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });
}

/** Atualiza o status de um item */
export async function updateItemStatus(itemId: string, status: OrderItemStatus) {
  await requireAuth();

  await prisma.orderItem.update({ where: { id: itemId }, data: { status } });

  revalidatePath("/dashboard/cozinha");
  revalidatePath("/dashboard/mesas");
  return { success: true };
}

/** Marca todos os itens pendentes/preparando de um pedido como PRONTO */
export async function markOrderReady(orderId: string) {
  await requireAuth();

  await prisma.orderItem.updateMany({
    where: { orderId, status: { in: ["PENDENTE", "PREPARANDO"] } },
    data: { status: "PRONTO" },
  });

  revalidatePath("/dashboard/cozinha");
  revalidatePath("/dashboard/mesas");
  return { success: true };
}
