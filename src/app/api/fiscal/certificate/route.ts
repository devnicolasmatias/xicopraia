import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { validateAndSaveCertificate } from "@/app/actions/fiscal";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("certificate") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Senha obrigatória." }, { status: 400 });

    // Converte para base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const result = await validateAndSaveCertificate(base64, password);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erro ao processar certificado." }, { status: 500 });
  }
}
