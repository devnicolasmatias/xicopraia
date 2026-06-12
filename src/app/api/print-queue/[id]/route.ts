import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { id } = await params;
    const { status } = await req.json() as { status: "DONE" | "FAILED" };

    if (status !== "DONE" && status !== "FAILED") {
      return NextResponse.json({ error: "status deve ser DONE ou FAILED." }, { status: 400 });
    }

    await prisma.printJob.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PrintQueue] Erro ao atualizar job:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
