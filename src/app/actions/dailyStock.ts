"use server";

import { UnitOfMeasure } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isToday, parseISO } from "date-fns";

export async function getDaysWithStock(month: number, year: number) {
  // Retorna os dias do mês que já possuem DailyStock
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // último dia do mês

  const stocks = await prisma.dailyStock.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
    },
  });

  return stocks.map((s) => s.date.toISOString().split("T")[0]);
}

export async function getDailyStock(dateStr: string) {
  const date = new Date(dateStr);

  // Buscar se já existe registro para esse dia
  const existingStock = await prisma.dailyStock.findUnique({
    where: { date },
    include: {
      items: {
        include: {
          item: {
            include: { category: true }
          }
        }
      }
    },
  });

  if (existingStock) {
    return {
      id: existingStock.id,
      date: existingStock.date,
      items: existingStock.items.map((i) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        categoryName: i.categoryName,
        categoryColor: i.item?.category?.color || "#f97316",
        unitOfMeasure: i.unitOfMeasure,
        quantity: i.quantity,
      })),
    };
  }

  // Se não existe, vamos montar um template com os itens ativos
  const activeItems = await prisma.inventoryItem.findMany({
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

  const templateItems = activeItems.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    categoryName: item.category.name,
    categoryColor: item.category.color,
    unitOfMeasure: item.unitOfMeasure,
    quantity: 0,
  }));

  return {
    id: null,
    date,
    items: templateItems,
  };
}

export type SaveDailyStockInput = {
  itemId: string;
  itemName: string;
  categoryName: string;
  unitOfMeasure: UnitOfMeasure;
  quantity: number;
}[];

export async function saveDailyStock(dateStr: string, items: SaveDailyStockInput) {
  const session = await getSession();
  if (!session) throw new Error("Acesso negado.");

  if (session.role !== "ADMIN") {
    const isTodayDate = isToday(parseISO(dateStr));
    if (!isTodayDate) {
      throw new Error("Acesso negado: Você só pode editar o estoque do dia atual.");
    }
  }

  const date = new Date(dateStr);

  const result = await prisma.$transaction(async (tx) => {
    // Busca se já tem
    let dailyStock = await tx.dailyStock.findUnique({
      where: { date },
    });

    if (dailyStock) {
      // Se existe, limpa os itens antigos daquele dia para recriar
      await tx.dailyStockItem.deleteMany({
        where: { dailyStockId: dailyStock.id },
      });
    } else {
      // Cria novo
      dailyStock = await tx.dailyStock.create({
        data: { date },
      });
    }

    // Cria os novos itens (Snapshot)
    if (items.length > 0) {
      await tx.dailyStockItem.createMany({
        data: items.map((item) => ({
          dailyStockId: dailyStock!.id,
          itemId: item.itemId,
          itemName: item.itemName,
          categoryName: item.categoryName,
          unitOfMeasure: item.unitOfMeasure,
          quantity: item.quantity,
        })),
      });
    }

    return dailyStock;
  });

  revalidatePath("/cozinha/estoque");
  revalidatePath(`/cozinha/estoque/${dateStr}`);

  return result;
}
