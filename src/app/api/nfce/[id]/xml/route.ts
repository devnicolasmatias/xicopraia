import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const nfce = await prisma.nfceDocument.findUnique({
    where: { id },
    select: { xmlProcNFe: true, xmlNFe: true, chave: true },
  });

  if (!nfce) return NextResponse.json({ error: "NFC-e não encontrada." }, { status: 404 });

  const xml = nfce.xmlProcNFe ?? nfce.xmlNFe;
  if (!xml) return NextResponse.json({ error: "XML não disponível." }, { status: 404 });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="nfce-${nfce.chave}.xml"`,
    },
  });
}
