import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const jobs = await prisma.printJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, descricao: true, status: true, claimedBy: true, createdAt: true },
    });
    return NextResponse.json(jobs);
  } catch (err) {
    console.error("[PrintQueue] Erro ao listar jobs:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { content, descricao } = await req.json() as { content: string; descricao?: string };

    if (!content) {
      return NextResponse.json({ error: "content é obrigatório." }, { status: 400 });
    }

    const job = await prisma.printJob.create({
      data: { content, descricao: descricao ?? null },
    });

    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PrintQueue] Erro ao criar job:", msg);
    return NextResponse.json({ error: "Erro interno.", detail: msg }, { status: 500 });
  }
}
