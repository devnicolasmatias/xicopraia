import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { getFinancialReport } from "@/app/actions/financeiro";
import FinanceiroClient from "./_components/FinanceiroClient";

function formatInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const isGarcom = session.role === "GARCOM";
  if (!isGarcom && session.role !== "ADMIN" && session.role !== "GERENTE" && session.role !== "CAIXA") redirect("/pdv");

  const sp = await searchParams;
  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromStr = typeof sp.from === "string" && sp.from ? sp.from : formatInputDate(defaultFrom);
  const toStr = typeof sp.to === "string" && sp.to ? sp.to : formatInputDate(today);

  let report;
  let rangeError: string | null = null;
  try {
    report = await getFinancialReport(fromStr, toStr);
  } catch (e) {
    rangeError = e instanceof Error ? e.message : "Não foi possível carregar o relatório.";
    report = await getFinancialReport(formatInputDate(defaultFrom), formatInputDate(today));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0"
            aria-label="Voltar ao painel admin"
          >
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 truncate">Financeiro</h1>
            <p className="text-xs text-gray-500 truncate">
              {isGarcom ? "Consultar pedidos finalizados" : "Faturamento e transações"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {rangeError && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
            {rangeError}
          </div>
        )}
        <FinanceiroClient initialFrom={fromStr} initialTo={toStr} report={report} userRole={session.role} />
      </div>
    </div>
  );
}
