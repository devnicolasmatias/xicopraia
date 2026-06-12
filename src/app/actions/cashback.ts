"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
}

export async function getCustomerCashbackStatus(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      name: true,
      phone: true,
      cashbackBalance: true,
      cashbackExpiresAt: true,
    },
  });
  if (!customer) return null;

  const balance = Number(customer.cashbackBalance);
  const isExpired =
    customer.cashbackExpiresAt != null &&
    customer.cashbackExpiresAt < new Date();

  return {
    ...customer,
    cashbackBalance: balance,
    isExpired,
    hasValidCashback: balance > 0 && !isExpired,
  };
}

export async function earnCashback(
  customerId: string,
  purchaseAmount: number,
  orderId?: string
) {
  const config = await prisma.cashbackConfig.findFirst();
  if (!config) return null;

  const amount = Number(
    ((purchaseAmount * Number(config.percentage)) / 100).toFixed(2)
  );
  if (amount <= 0) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.expiryDays);

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      cashbackBalance: amount,
      cashbackExpiresAt: expiresAt,
      cashbackTransactions: {
        create: {
          type: "EARNED",
          amount,
          purchaseAmount,
          orderId: orderId ?? null,
          expiresAt,
        },
      },
    },
  });

  return { amount, expiresAt, expiryDays: config.expiryDays };
}

export async function redeemCashback(customerId: string, orderId?: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Cliente não encontrado.");

  const balance = Number(customer.cashbackBalance);
  if (balance <= 0) return { amount: 0 };

  if (
    customer.cashbackExpiresAt != null &&
    customer.cashbackExpiresAt < new Date()
  ) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { cashbackBalance: 0, cashbackExpiresAt: null },
    });
    return { amount: 0, expired: true };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      cashbackBalance: 0,
      cashbackExpiresAt: null,
      cashbackTransactions: {
        create: {
          type: "REDEEMED",
          amount: balance,
          orderId: orderId ?? null,
        },
      },
    },
  });

  return { amount: balance };
}

export async function manualCashback(customerId: string, purchaseAmount: number) {
  await requireAuth();

  if (purchaseAmount <= 0) throw new Error("Valor inválido.");

  const result = await earnCashback(customerId, purchaseAmount);
  if (!result) throw new Error("Cashback não configurado. Configure o % no CRM primeiro.");

  // Send WhatsApp notification (fire and forget)
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { phone: true },
  });
  if (customer) {
    sendCashbackWhatsApp(customer.phone, result.amount, result.expiresAt, result.expiryDays).catch(
      () => {}
    );
  }

  revalidatePath("/admin/cashback");
  revalidatePath("/admin/crm");
  return result;
}

async function sendCashbackWhatsApp(
  phone: string,
  amount: number,
  expiresAt: Date,
  expiryDays: number
) {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;
  if (!baseUrl || !apiKey || !instance) return;

  const digits = phone.replace(/\D/g, "");
  const jid = digits.startsWith("55") ? `${digits}@s.whatsapp.net` : `55${digits}@s.whatsapp.net`;

  const formattedAmount = amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const expiryDate = expiresAt.toLocaleDateString("pt-BR");

  const text =
    `🎉 Você ganhou *${formattedAmount}* de cashback no Xico Praia!\n\n` +
    `💰 Use na sua próxima visita como desconto.\n` +
    `⏳ Válido por ${expiryDays} dias (até ${expiryDate}).\n\n` +
    `Obrigado pela preferência! 🍽️`;

  await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: jid, text }),
  });

  await prisma.whatsappMessage.create({
    data: {
      phone: digits,
      direction: "OUTBOUND",
      type: "TEXT",
      content: text,
    },
  }).catch(() => {});
}

export { sendCashbackWhatsApp };
