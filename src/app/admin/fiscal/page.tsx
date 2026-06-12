export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFiscalConfig } from "@/app/actions/fiscal";
import FiscalConfigClient from "./_components/FiscalConfigClient";

export default async function FiscalPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/pdv");

  const config = await getFiscalConfig();

  const serialized = config ? {
    ...config,
    certValidade: config.certValidade?.toISOString() ?? null,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
    // Nunca expõe certBase64 ou certSenha ao cliente
    certBase64: undefined,
    certSenha: undefined,
    hasCert: !!config.certBase64,
    tlsVersion: config.tlsVersion,
    tpEmis: config.tpEmis,
    dhContingencia: config.dhContingencia?.toISOString() ?? null,
    xJustContingencia: config.xJustContingencia ?? null,
  } : null;

  return <FiscalConfigClient config={serialized} defaultSerie={config?.serie ?? 1} />;
}
