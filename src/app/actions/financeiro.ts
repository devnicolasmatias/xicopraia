"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PDV_TABLE_NUMBER } from "@/lib/pdvConstants";
import type { PaymentMethod } from "@/generated/prisma";

async function requireAdminOrGerente() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "GERENTE")) throw new Error("Acesso negado.");
  return session;
}

async function requireFinanceiroAccess() {
  const session = await getSession();
  if (!session) throw new Error("Acesso negado.");
  const allowed = ["ADMIN", "GERENTE", "CAIXA", "GARCOM"];
  if (!allowed.includes(session.role)) throw new Error("Acesso negado.");
  return session;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRange(fromStr: string, toStr: string) {
  if (!DATE_RE.test(fromStr) || !DATE_RE.test(toStr)) {
    throw new Error("Datas inválidas. Use o formato AAAA-MM-DD.");
  }
  const start = new Date(`${fromStr}T00:00:00`);
  const end = new Date(`${toStr}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Datas inválidas.");
  }
  if (start > end) throw new Error("A data inicial não pode ser maior que a final.");
  return { start, end };
}

export interface FinancialReport {
  from: string;
  to: string;
  totals: {
    revenue: number;
    subtotal: number;
    serviceFee: number;
    discount: number;
    transactionCount: number;
    avgTicket: number;
  };
  byPayment: { method: PaymentMethod; total: number; count: number }[];
  byChannel: { mesa: number; balcao: number };
  transactions: {
    id: string;
    paidAt: string;
    total: number;
    subtotal: number;
    serviceFee: number;
    discount: number;
    paymentMethod: PaymentMethod;
    splitCount: number;
    tableNumber: number;
    channelLabel: string;
    orderId: string;
    nfce: { id: string; status: string; nNF: number } | null;
  }[];
}

const DELETE_PASSWORD = "280223";

export async function deleteTransaction(transactionId: string, password: string) {
  await requireAdminOrGerente();

  if (password !== DELETE_PASSWORD) {
    return { error: "Senha incorreta." };
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { nfce: true },
  });
  if (!tx) return { error: "Transação não encontrada." };

  if (tx.nfce && tx.nfce.status === "AUTORIZADA") {
    return { error: "Não é possível excluir uma venda com NFC-e autorizada. Cancele a NFC-e primeiro." };
  }

  await prisma.$transaction(async (p) => {
    if (tx.nfce) {
      await p.nfceDocument.delete({ where: { id: tx.nfce.id } });
    }
    await p.transaction.delete({ where: { id: transactionId } });
    await p.orderItem.deleteMany({ where: { orderId: tx.orderId } });
    await p.order.delete({ where: { id: tx.orderId } });
  });

  return { success: true };
}

export interface OrderDetail {
  id: string;
  tableNumber: number;
  userName: string | null;
  createdAt: string;
  items: { name: string; quantity: number; unitPrice: number; notes: string | null }[];
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  await requireFinanceiroAccess();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: { select: { number: true } },
      user: { select: { name: true } },
      items: {
        where: { status: { not: "CANCELADO" } },
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    tableNumber: order.table.number,
    userName: order.user?.name ?? null,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: parseFloat(String(i.unitPrice)),
      notes: i.notes,
    })),
  };
}

export async function getFinancialReport(fromStr: string, toStr: string): Promise<FinancialReport> {
  await requireFinanceiroAccess();
  const { start, end } = parseRange(fromStr, toStr);

  const where = {
    paidAt: { gte: start, lte: end },
    NOT: { nfce: { status: "CANCELADA" } },
  };

  const [aggregate, paymentGroups, txRows] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { total: true, subtotal: true, serviceFee: true, discount: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.transaction.groupBy({
      by: ["paymentMethod"],
      where,
      _sum: { total: true },
      _count: true,
    }),
    prisma.transaction.findMany({
      where,
      orderBy: { paidAt: "desc" },
      take: 200,
      select: {
        id: true,
        paidAt: true,
        total: true,
        subtotal: true,
        serviceFee: true,
        discount: true,
        paymentMethod: true,
        splitCount: true,
        order: {
          select: {
            id: true,
            table: { select: { number: true } },
          },
        },
        nfce: { select: { id: true, status: true, nNF: true } },
      },
    }),
  ]);

  const revenue = parseFloat(String(aggregate._sum.total ?? 0));
  const subtotal = parseFloat(String(aggregate._sum.subtotal ?? 0));
  const serviceFee = parseFloat(String(aggregate._sum.serviceFee ?? 0));
  const discount = parseFloat(String(aggregate._sum.discount ?? 0));
  const transactionCount = aggregate._count;

  let channelMesa = 0;
  let channelBalcao = 0;
  for (const row of txRows) {
    const n = row.order.table.number;
    const val = parseFloat(String(row.total));
    if (n === PDV_TABLE_NUMBER) channelBalcao += val;
    else channelMesa += val;
  }

  const avgTicket =
    transactionCount > 0 ? revenue / transactionCount : parseFloat(String(aggregate._avg.total ?? 0));

  const byPayment = paymentGroups
    .map((g) => ({
      method: g.paymentMethod,
      total: parseFloat(String(g._sum.total ?? 0)),
      count: g._count,
    }))
    .sort((a, b) => b.total - a.total);

  const transactions = txRows.map((row) => {
    const n = row.order.table.number;
    return {
      id: row.id,
      paidAt: row.paidAt.toISOString(),
      total: parseFloat(String(row.total)),
      subtotal: parseFloat(String(row.subtotal)),
      serviceFee: parseFloat(String(row.serviceFee)),
      discount: parseFloat(String(row.discount)),
      paymentMethod: row.paymentMethod,
      splitCount: row.splitCount,
      tableNumber: n,
      channelLabel: n === PDV_TABLE_NUMBER ? "Balcão / PDV" : `Mesa ${n}`,
      orderId: row.order.id,
      nfce: row.nfce,
    };
  });

  return {
    from: fromStr,
    to: toStr,
    totals: {
      revenue,
      subtotal,
      serviceFee,
      discount,
      transactionCount,
      avgTicket: Number.isFinite(avgTicket) ? avgTicket : 0,
    },
    byPayment,
    byChannel: { mesa: channelMesa, balcao: channelBalcao },
    transactions,
  };
}
