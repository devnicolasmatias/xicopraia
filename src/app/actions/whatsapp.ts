"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const BASE_URL = () => process.env.EVOLUTION_API_URL ?? "";
const API_KEY = () => process.env.EVOLUTION_API_KEY ?? "";
const INSTANCE = () => process.env.EVOLUTION_INSTANCE_NAME ?? "";

function apiHeaders() {
  return { "Content-Type": "application/json", apikey: API_KEY() };
}

function toJid(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("55") ? `${d}@s.whatsapp.net` : `55${d}@s.whatsapp.net`;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
}

function isConfigured() {
  return Boolean(BASE_URL() && API_KEY() && INSTANCE());
}

export async function sendTextMessage(phone: string, text: string) {
  await requireAuth();
  if (!isConfigured()) throw new Error("Evolution API não configurada.");

  const res = await fetch(`${BASE_URL()}/message/sendText/${INSTANCE()}`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ number: toJid(phone), text }),
  });

  if (!res.ok) throw new Error(`Erro ao enviar mensagem: ${res.status}`);
  const data = await res.json();

  await prisma.whatsappMessage.create({
    data: {
      phone: phone.replace(/\D/g, ""),
      direction: "OUTBOUND",
      type: "TEXT",
      content: text,
      messageId: (data?.key?.id as string) ?? null,
    },
  });

  return { ok: true };
}

export async function sendMediaMessage(input: {
  phone: string;
  type: "IMAGE" | "AUDIO" | "FILE";
  mediaBase64?: string;
  mediaUrl?: string;
  caption?: string;
  fileName?: string;
  mimeType?: string;
}) {
  await requireAuth();
  if (!isConfigured()) throw new Error("Evolution API não configurada.");

  const { phone, type, mediaBase64, mediaUrl, caption, fileName, mimeType } = input;
  const mediatype = type === "IMAGE" ? "image" : type === "AUDIO" ? "audio" : "document";

  const body: Record<string, unknown> = {
    number: toJid(phone),
    mediatype,
    media: mediaBase64 ?? mediaUrl,
    mimetype: mimeType,
  };
  if (caption) body.caption = caption;
  if (fileName) body.fileName = fileName;

  const res = await fetch(`${BASE_URL()}/message/sendMedia/${INSTANCE()}`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Erro ao enviar mídia: ${res.status}`);
  const data = await res.json();

  await prisma.whatsappMessage.create({
    data: {
      phone: phone.replace(/\D/g, ""),
      direction: "OUTBOUND",
      type,
      content: caption ?? null,
      mediaUrl: mediaUrl ?? null,
      mediaName: fileName ?? null,
      messageId: (data?.key?.id as string) ?? null,
    },
  });

  return { ok: true };
}

export async function getConversationList() {
  await requireAuth();

  const latest = await prisma.$queryRaw<
    { phone: string; direction: string; type: string; content: string | null; createdAt: Date }[]
  >`
    SELECT DISTINCT ON (phone) phone, direction, type, content, "createdAt"
    FROM whatsapp_messages
    ORDER BY phone, "createdAt" DESC
  `;

  const phones = latest.map((m) => m.phone);
  const customers = await prisma.customer.findMany({
    where: { phone: { in: phones } },
    select: { phone: true, name: true, id: true },
  });
  const customerMap = new Map(customers.map((c) => [c.phone, c]));

  return latest.map((m) => ({
    ...m,
    customer: customerMap.get(m.phone) ?? null,
  }));
}

export async function getMessages(phone: string) {
  await requireAuth();
  const cleanPhone = phone.replace(/\D/g, "");

  const msgs = await prisma.whatsappMessage.findMany({
    where: { phone: cleanPhone },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return msgs.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function getNewMessagesSince(phone: string, since: string) {
  await requireAuth();
  const cleanPhone = phone.replace(/\D/g, "");

  const msgs = await prisma.whatsappMessage.findMany({
    where: { phone: cleanPhone, createdAt: { gt: new Date(since) } },
    orderBy: { createdAt: "asc" },
  });

  return msgs.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}
