"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Acesso negado.");
}

// ─── Ingredientes ──────────────────────────────────────────────────────────────

export async function getIngredients() {
  return prisma.ingredient.findMany({ orderBy: { name: "asc" } });
}

export async function getLowStockIngredients() {
  const all = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  return all.filter((i) => Number(i.currentStock) < Number(i.minimumStock));
}

export async function createIngredient(data: {
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
}) {
  await requireAdmin();

  if (!data.name.trim()) return { error: "Nome obrigatório." };
  if (!data.unit.trim()) return { error: "Unidade obrigatória." };

  const exists = await prisma.ingredient.findUnique({ where: { name: data.name.trim() } });
  if (exists) return { error: "Já existe um ingrediente com este nome." };

  await prisma.ingredient.create({
    data: {
      name: data.name.trim(),
      unit: data.unit.trim(),
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
    },
  });

  revalidatePath("/admin/estoque");
  return { success: true };
}

export async function updateIngredient(
  id: string,
  data: { name: string; unit: string; currentStock: number; minimumStock: number }
) {
  await requireAdmin();

  if (!data.name.trim()) return { error: "Nome obrigatório." };

  await prisma.ingredient.update({
    where: { id },
    data: {
      name: data.name.trim(),
      unit: data.unit.trim(),
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
    },
  });

  revalidatePath("/admin/estoque");
  revalidatePath("/admin/cardapio");
  return { success: true };
}

export async function deleteIngredient(id: string) {
  await requireAdmin();
  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/admin/estoque");
  return { success: true };
}

// ─── Ficha Técnica ─────────────────────────────────────────────────────────────

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export async function getProductRecipe(productId: string) {
  const items = await prisma.productIngredient.findMany({
    where: { productId },
    include: { ingredient: { select: { id: true, name: true, unit: true } } },
    orderBy: { ingredient: { name: "asc" } },
  });
  return items.map((i) => ({
    ingredientId: i.ingredientId,
    ingredientName: i.ingredient.name,
    unit: i.ingredient.unit,
    quantity: parseFloat(String(i.quantity)),
  }));
}

export async function saveProductRecipe(productId: string, items: RecipeItem[]) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    // Remove toda a ficha técnica atual
    await tx.productIngredient.deleteMany({ where: { productId } });

    if (items.length > 0) {
      await tx.productIngredient.createMany({
        data: items.map((i) => ({
          productId,
          ingredientId: i.ingredientId,
          quantity: i.quantity,
        })),
      });
    }
  });

  revalidatePath("/admin/cardapio");
  return { success: true };
}
