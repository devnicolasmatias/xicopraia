"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Acesso negado.");
}

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
}

export async function getCustomers(search?: string) {
  await requireAuth();
  const where = search?.trim()
    ? {
        OR: [
          { name: { contains: search.trim(), mode: "insensitive" as const } },
          { phone: { contains: search.trim() } },
        ],
      }
    : {};

  return prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      phone: true,
      cpf: true,
      cashbackBalance: true,
      cashbackExpiresAt: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}

export async function searchCustomers(query: string) {
  await requireAuth();
  const q = query.trim();
  if (!q) return [];

  const digits = q.replace(/\D/g, "");

  type Row = { id: string; name: string; phone: string; cashbackBalance: unknown; cashbackExpiresAt: Date | null };

  // Busca por nome ou telefone literal
  const byNameOrPhone = await prisma.$queryRaw<Row[]>`
    SELECT id, name, phone, "cashbackBalance", "cashbackExpiresAt"
    FROM customers
    WHERE name ILIKE ${"%" + q + "%"} OR phone ILIKE ${"%" + q + "%"}
    LIMIT 10
  `;

  // Busca adicional por dígitos normalizados (captura "11999" dentro de "(11) 99999-...")
  let byDigits: Row[] = [];
  if (digits.length >= 3) {
    byDigits = await prisma.$queryRaw<Row[]>`
      SELECT id, name, phone, "cashbackBalance", "cashbackExpiresAt"
      FROM customers
      WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${"%" + digits + "%"}
      LIMIT 10
    `;
  }

  // Une e remove duplicatas por id
  const seen = new Set<string>();
  const result: Row[] = [];
  for (const row of [...byNameOrPhone, ...byDigits]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      result.push(row);
    }
  }
  return result.slice(0, 10);
}

export async function getCustomer(id: string) {
  await requireAuth();
  return prisma.customer.findUnique({
    where: { id },
    include: {
      cashbackTransactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          transaction: {
            select: { total: true, paymentMethod: true, paidAt: true },
          },
        },
      },
    },
  });
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  cpf?: string;
}) {
  await requireAuth();

  const phone = data.phone.replace(/\D/g, "");
  if (!phone) throw new Error("Telefone inválido.");
  if (!data.name.trim()) throw new Error("Nome obrigatório.");

  const customer = await prisma.customer.create({
    data: {
      name: data.name.trim(),
      phone,
      cpf: data.cpf?.replace(/\D/g, "") || null,
    },
  });

  revalidatePath("/admin/crm");
  return customer;
}

export async function updateCustomer(
  id: string,
  data: { name?: string; phone?: string; cpf?: string }
) {
  await requireAuth();

  const update: Record<string, string | null> = {};
  if (data.name) update.name = data.name.trim();
  if (data.phone) update.phone = data.phone.replace(/\D/g, "");
  if (data.cpf !== undefined) update.cpf = data.cpf?.replace(/\D/g, "") || null;

  const customer = await prisma.customer.update({ where: { id }, data: update });
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${id}`);
  return customer;
}

export async function getCashbackConfig() {
  return prisma.cashbackConfig.findFirst();
}

export async function saveCashbackConfig(data: {
  percentage: number;
  expiryDays: number;
}) {
  await requireAdmin();

  if (data.percentage <= 0 || data.percentage > 100)
    throw new Error("Percentual inválido (1–100).");
  if (data.expiryDays <= 0) throw new Error("Prazo inválido.");

  const existing = await prisma.cashbackConfig.findFirst();
  const result = existing
    ? await prisma.cashbackConfig.update({
        where: { id: existing.id },
        data: { percentage: data.percentage, expiryDays: data.expiryDays },
      })
    : await prisma.cashbackConfig.create({
        data: { percentage: data.percentage, expiryDays: data.expiryDays },
      });

  revalidatePath("/admin/crm");
  revalidatePath("/admin/cashback");
  return result;
}

export async function selfRegisterCustomer(data: {
  name: string;
  phone: string;
  cpf?: string;
}) {
  // Validação básica
  const name = data.name?.trim();
  const phone = data.phone?.replace(/\D/g, "");
  const cpf = data.cpf?.replace(/\D/g, "") || null;

  if (!name) throw new Error("Nome é obrigatório.");
  if (!phone || phone.length < 10) throw new Error("Telefone inválido.");

  // Verifica se já existe — se sim, retorna sucesso silenciosamente (sem duplicar)
  const existing = await prisma.customer.findFirst({ where: { phone } });
  if (existing) return { success: true, alreadyExists: true };

  await prisma.customer.create({
    data: { name, phone, cpf },
  });

  revalidatePath("/admin/crm");
  return { success: true, alreadyExists: false };
}
