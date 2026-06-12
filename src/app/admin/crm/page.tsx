import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/session";
import { getCustomers, getCashbackConfig } from "@/app/actions/crm";
import CrmClient from "./_components/CrmClient";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "CAIXA")) redirect("/login");

  const sp = await searchParams;
  const [customers, cashbackConfig] = await Promise.all([
    getCustomers(sp.q),
    getCashbackConfig(),
  ]);

  const serialized = customers.map((c) => ({
    ...c,
    cashbackBalance: Number(c.cashbackBalance),
    cashbackExpiresAt: c.cashbackExpiresAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  const configSerialized = cashbackConfig
    ? {
        id: cashbackConfig.id,
        percentage: Number(cashbackConfig.percentage),
        expiryDays: cashbackConfig.expiryDays,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 truncate">CRM</h1>
            <p className="text-xs text-gray-500 truncate">Clientes e cashback</p>
          </div>
        </div>
        <Link
          href="/admin/crm/conversas"
          className="flex items-center gap-2 text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-2 rounded-xl transition"
        >
          <MessageSquare size={15} />
          Conversas
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <CrmClient
          customers={serialized}
          cashbackConfig={configSerialized}
          isAdmin={session.role === "ADMIN"}
          initialSearch={sp.q ?? ""}
        />
      </div>
    </div>
  );
}
