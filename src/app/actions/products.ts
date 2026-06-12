"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Acesso negado.");
}

export async function getProducts() {
  return prisma.product.findMany({
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    include: { category: { select: { id: true, name: true, color: true } } },
  });
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const priceRaw = formData.get("price") as string;
  const costPriceRaw = formData.get("costPrice") as string;
  const categoryId = formData.get("categoryId") as string;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;

  if (!name) return { error: "Nome do produto é obrigatório." };
  if (!priceRaw || isNaN(parseFloat(priceRaw)) || parseFloat(priceRaw) <= 0)
    return { error: "Preço inválido. Informe um valor maior que zero." };
  if (!categoryId) return { error: "Selecione uma categoria." };

  const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!categoryExists) return { error: "Categoria não encontrada." };

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(priceRaw),
      costPrice: costPriceRaw && !isNaN(parseFloat(costPriceRaw)) ? parseFloat(costPriceRaw) : null,
      categoryId,
      imageUrl,
      available: formData.get("available") === "true",
    },
  });

  revalidatePath("/admin/cardapio");
  return { success: true, productId: product.id };
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const priceRaw = formData.get("price") as string;
  const costPriceRaw = formData.get("costPrice") as string;
  const categoryId = formData.get("categoryId") as string;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;

  if (!name) return { error: "Nome do produto é obrigatório." };
  if (!priceRaw || isNaN(parseFloat(priceRaw)) || parseFloat(priceRaw) <= 0)
    return { error: "Preço inválido. Informe um valor maior que zero." };
  if (!categoryId) return { error: "Selecione uma categoria." };

  let updated;
  try {
    updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(priceRaw),
        costPrice: costPriceRaw && !isNaN(parseFloat(costPriceRaw)) ? parseFloat(costPriceRaw) : null,
        categoryId,
        imageUrl,
        available: formData.get("available") === "true",
      },
      include: { category: { select: { name: true } } },
    });
  } catch (err) {
    console.error("[updateProduct] erro ao atualizar produto:", err);
    return { error: "Erro ao salvar no banco. Veja o terminal para detalhes." };
  }

  revalidatePath("/admin/cardapio");
  revalidatePath("/pdv");
  revalidatePath("/dashboard/mesas", "layout");
  return {
    success: true,
    saved: {
      name: updated.name,
      price: parseFloat(String(updated.price)),
      category: updated.category.name,
      available: updated.available,
    },
  };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/cardapio");
  revalidatePath("/pdv");
  revalidatePath("/dashboard/mesas", "layout");
  return { success: true, error: undefined };
}

export async function toggleProductAvailability(id: string, available: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { available } });
  revalidatePath("/admin/cardapio");
  revalidatePath("/pdv");
  revalidatePath("/dashboard/mesas", "layout");
  return { success: true };
}
