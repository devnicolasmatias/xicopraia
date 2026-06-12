"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Acesso negado.");
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string) ?? "#6b7280";

  if (!name) return { error: "Nome da categoria é obrigatório." };

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return { error: "Já existe uma categoria com esse nome." };

  await prisma.category.create({ data: { name, color } });
  revalidatePath("/admin/cardapio");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string) ?? "#6b7280";

  if (!name) return { error: "Nome da categoria é obrigatório." };

  await prisma.category.update({ where: { id }, data: { name, color } });
  revalidatePath("/admin/cardapio");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0)
    return { error: `Não é possível excluir: há ${count} produto(s) nessa categoria.` };

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/cardapio");
  return { success: true };
}
