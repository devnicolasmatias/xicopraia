import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * POST /api/print-queue/claim
 *
 * Reivindica atomicamente o próximo job PENDING usando SELECT FOR UPDATE SKIP LOCKED
 * do PostgreSQL, garantindo que dois dispositivos nunca imprimam o mesmo job.
 *
 * Retorna o job com { id, content } ou {} se não houver nada na fila.
 */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const job = await prisma.$transaction(async (tx) => {
      // SKIP LOCKED: se outro dispositivo já bloqueou este row, pula para o próximo.
      // Isso garante zero duplicatas mesmo com múltiplos computadores polling ao mesmo tempo.
      const rows = await tx.$queryRaw<{ id: string; content: string }[]>`
        SELECT id, content FROM print_jobs
        WHERE status = 'PENDING'
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) return null;

      const { id } = rows[0];

      return tx.printJob.update({
        where: { id },
        data: {
          status: "CLAIMED",
          claimedBy: session.userId ?? "unknown",
          claimedAt: new Date(),
        },
        select: { id: true, content: true },
      });
    });

    return NextResponse.json(job ?? {});
  } catch (err) {
    console.error("[PrintQueue] Erro ao reivindicar job:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
