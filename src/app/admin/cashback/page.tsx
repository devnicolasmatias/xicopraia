import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { getCashbackConfig } from "@/app/actions/crm";
import CashbackClient from "./_components/CashbackClient";

export default async function CashbackPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "CAIXA")) redirect("/login");

  const config = await getCashbackConfig();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
        <Link
          href="/admin"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 hidden sm:block" />
        <div className="min-w-0">
          <h1 className="font-bold text-gray-900 truncate">Cashback Rápido</h1>
          <p className="text-xs text-gray-500 truncate">Lançar cashback sem passar pela venda</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        {!config ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-amber-800 font-medium">Cashback não configurado.</p>
            <p className="text-sm text-amber-600">
              Configure o percentual e o prazo no módulo CRM antes de usar esta tela.
            </p>
            <Link
              href="/admin/crm"
              className="inline-block mt-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl transition"
            >
              Ir para o CRM
            </Link>
          </div>
        ) : (
          <CashbackClient
            configPercentage={Number(config.percentage)}
            configExpiryDays={config.expiryDays}
          />
        )}
      </div>
    </div>
  );
}
