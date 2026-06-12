"use server";

import { UnitOfMeasure } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Acesso negado: Apenas administradores podem realizar esta ação.");
  }
}

// --- CATEGORIES ---

export async function getInventoryCategories() {
  return prisma.inventoryCategory.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createInventoryCategory(data: { name: string; color: string }) {
  await requireAdmin();
  const result = await prisma.inventoryCategory.create({
    data,
  });
  revalidatePath("/cozinha/estoque/categorias");
  revalidatePath("/cozinha/estoque/itens");
  return result;
}

export async function updateInventoryCategory(id: string, data: { name: string; color: string }) {
  await requireAdmin();
  const result = await prisma.inventoryCategory.update({
    where: { id },
    data,
  });
  revalidatePath("/cozinha/estoque/categorias");
  revalidatePath("/cozinha/estoque/itens");
  return result;
}

export async function deleteInventoryCategory(id: string) {
  await requireAdmin();
  const result = await prisma.inventoryCategory.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
  revalidatePath("/cozinha/estoque/categorias");
  revalidatePath("/cozinha/estoque/itens");
  return result;
}

// --- ITEMS ---

export async function getInventoryItems() {
  return prisma.inventoryItem.findMany({
    where: {
      deletedAt: null,
      category: {
        deletedAt: null,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createInventoryItem(data: {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  categoryId: string;
}) {
  await requireAdmin();
  const result = await prisma.inventoryItem.create({
    data,
  });
  revalidatePath("/cozinha/estoque/itens");
  return result;
}

export async function updateInventoryItem(
  id: string,
  data: {
    name: string;
    unitOfMeasure: UnitOfMeasure;
    categoryId: string;
  }
) {
  await requireAdmin();
  const result = await prisma.inventoryItem.update({
    where: { id },
    data,
  });
  revalidatePath("/cozinha/estoque/itens");
  return result;
}

export async function deleteInventoryItem(id: string) {
  await requireAdmin();
  const result = await prisma.inventoryItem.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
  revalidatePath("/cozinha/estoque/itens");
  return result;
}
