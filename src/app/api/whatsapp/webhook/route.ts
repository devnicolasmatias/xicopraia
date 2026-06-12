import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event: string = body?.event ?? "";
    if (event !== "messages.upsert") return NextResponse.json({ ok: true });

    // Evolution v1: { data: { messages: [...] } }
    // Evolution v2: { data: { key: {...}, message: {...} } }  ← sem array
    const messages: unknown[] = Array.isArray(body?.data?.messages)
      ? body.data.messages
      : body?.data?.key
        ? [body.data]
        : [];

    for (const msg of messages) {
      const m = msg as Record<string, unknown>;
      const key = m.key as Record<string, unknown> | undefined;
      if (key?.fromMe) continue;

      const jid: string = (key?.remoteJid as string) ?? "";
      const phone = jid
        .replace("@s.whatsapp.net", "")
        .replace("@c.us", "")
        .replace(/\D/g, "");
      if (!phone) continue;

      const message = m.message as Record<string, unknown> | undefined;
      // v2 expõe messageType diretamente; v1 inferimos pela primeira chave de message
      const msgType: string = (m.messageType as string)
        ?? (message ? Object.keys(message)[0] : "conversation");

      let type: "TEXT" | "AUDIO" | "IMAGE" | "FILE" = "TEXT";
      let content: string | null = null;
      let mediaName: string | null = null;

      if (msgType === "conversation") {
        content = (message?.conversation as string) ?? null;
      } else if (msgType === "extendedTextMessage") {
        const ext = message?.extendedTextMessage as Record<string, unknown>;
        content = (ext?.text as string) ?? null;
      } else if (msgType === "imageMessage") {
        type = "IMAGE";
        const img = message?.imageMessage as Record<string, unknown>;
        content = (img?.caption as string) ?? null;
      } else if (msgType === "audioMessage" || msgType === "pttMessage") {
        type = "AUDIO";
      } else if (msgType === "documentMessage") {
        type = "FILE";
        const doc = message?.documentMessage as Record<string, unknown>;
        mediaName = (doc?.fileName as string) ?? null;
        content = (doc?.caption as string) ?? null;
      }

      const messageId = key?.id as string | undefined;

      try {
        await prisma.whatsappMessage.create({
          data: {
            phone,
            direction: "INBOUND",
            type,
            content,
            mediaName,
            messageId: messageId ?? null,
          },
        });
      } catch {
        // Duplicate messageId — ignore
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
