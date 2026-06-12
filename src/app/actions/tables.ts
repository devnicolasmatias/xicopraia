"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { TableStatus } from "@/generated/prisma";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  return session;
}

export async function getTables() {
  return prisma.table.findMany({ orderBy: { number: "asc" } });
}

export async function getTable(id: string) {
  return prisma.table.findUnique({ where: { id } });
}

export async function openTable(id: string, customerName?: string) {
  await requireAuth();

  await prisma.table.update({
    where: { id },
    data: {
      status: "OCUPADA",
      customerName: customerName?.trim() || null,
      openedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/mesas");
  return { success: true };
}

export async function updateTableStatus(id: string, status: TableStatus) {
  await requireAuth();

  const data: Parameters<typeof prisma.table.update>[0]["data"] = { status };

  // Ao liberar a mesa, limpa todos os campos de ocupação
  if (status === "LIVRE") {
    data.customerName = null;
    data.openedAt = null;
    data.currentOrderId = null;
  }

  await prisma.table.update({ where: { id }, data });

  revalidatePath("/dashboard/mesas");
  return { success: true };
}
