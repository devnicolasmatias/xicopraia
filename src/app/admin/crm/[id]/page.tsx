import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageSquare, Gift } from "lucide-react";
import { getSession } from "@/lib/session";
import { getCustomer } from "@/app/actions/crm";
import CustomerDetailClient from "./_components/CustomerDetailClient";

const CASHBACK_LABELS: Record<string, string> = {
  EARNED: "Ganho",
  REDEEMED: "Resgatado",
  MANUAL: "Manual",
};

const PAY_LABELS: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Cartão Débito",
  CARTAO_CREDITO: "Cartão Crédito",
};

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const balance = Number(customer.cashbackBalance);
  const isExpired =
    customer.cashbackExpiresAt != null && customer.cashbackExpiresAt < new Date();
  const hasValidCashback = balance > 0 && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
        <Link
          href="/admin/crm"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-gray-900 truncate">{customer.name}</h1>
          <p className="text-xs text-gray-500">{customer.phone}</p>
        </div>
        <Link
          href={`/admin/crm/conversas?phone=${customer.phone}`}
          className="flex items-center gap-2 text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-2 rounded-xl transition shrink-0"
        >
          <MessageSquare size={15} /> Conversar
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Cashback status */}
        <div
          className={`rounded-2xl border p-5 shadow-sm ${
            hasValidCashback
              ? "bg-green-50 border-green-200"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-1">
            <Gift size={20} className={hasValidCashback ? "text-green-600" : "text-gray-400"} />
            <h2 className="font-bold text-gray-900">Cashback</h2>
          </div>
          {hasValidCashback ? (
            <div>
              <p className="text-2xl font-bold text-green-700">{money(balance)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Expira em:{" "}
                {customer.cashbackExpiresAt?.toLocaleDateString("pt-BR") ?? "—"}
              </p>
            </div>
          ) : balance > 0 && isExpired ? (
            <p className="text-sm text-gray-400">
              Saldo expirado ({money(balance)})
            </p>
          ) : (
            <p className="text-sm text-gray-400">Sem cashback ativo.</p>
          )}
        </div>

        <CustomerDetailClient customer={{ id: customer.id, name: customer.name, phone: customer.phone, cpf: customer.cpf ?? null }} />

        {/* Cashback history */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Histórico de cashback</h3>
          </div>
          {customer.cashbackTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-6">Nenhum registro.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {customer.cashbackTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          tx.type === "EARNED"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : tx.type === "REDEEMED"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {CASHBACK_LABELS[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {tx.type === "REDEEMED" ? "− " : "+ "}
                      {money(Number(tx.amount))}
                    </td>
                    {tx.purchaseAmount ? (
                      <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        Compra: {money(Number(tx.purchaseAmount))}
                      </td>
                    ) : (
                      <td className="hidden sm:table-cell" />
                    )}
                    <td className="px-5 py-3 text-gray-400 text-xs text-right">
                      {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Order history */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Compras pelo sistema</h3>
          </div>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-6">Nenhuma compra registrada.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3 text-gray-500">
                      {order.transaction?.paidAt
                        ? new Date(order.transaction.paidAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {money(Number(order.transaction?.total ?? order.total))}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {PAY_LABELS[order.transaction?.paymentMethod ?? ""] ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
