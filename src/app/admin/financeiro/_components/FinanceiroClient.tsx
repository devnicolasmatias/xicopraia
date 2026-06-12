"use client";

import Link from "next/link";
import type { FinancialReport } from "@/app/actions/financeiro";
import type { PaymentMethod } from "@/generated/prisma";
import { Wallet, PieChart, Receipt, TrendingUp } from "lucide-react";

interface Props {
  initialFrom: string;
  initialTo: string;
  report: FinancialReport;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PAY_LABELS: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Cartão débito",
  CARTAO_CREDITO: "Cartão crédito",
};

export default function FinanceiroClient({ initialFrom, initialTo, report }: Props) {
  const { totals, byPayment, byChannel, transactions } = report;
  const channelSum = byChannel.mesa + byChannel.balcao;
  const channelDenom = channelSum > 0 ? channelSum : 1;
  const pctMesa = (byChannel.mesa / channelDenom) * 100;
  const pctBalcao = (byChannel.balcao / channelDenom) * 100;
  const maxPay = Math.max(...byPayment.map((p) => p.total), 1);

  return (
    <div className="space-y-6">
      <form
        action="/admin/financeiro"
        method="get"
        className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="fin-from" className="text-xs font-medium text-gray-500">
            De
          </label>
          <input
            id="fin-from"
            type="date"
            name="from"
            defaultValue={initialFrom}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fin-to" className="text-xs font-medium text-gray-500">
            Até
          </label>
          <input
            id="fin-to"
            type="date"
            name="to"
            defaultValue={initialTo}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50"
          />
        </div>
        <button
          type="submit"
          className="sm:self-end bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition"
        >
          Atualizar
        </button>
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Wallet size={14} /> Faturamento
          </div>
          <p className="text-xl font-bold text-orange-600">{money(totals.revenue)}</p>
          <p className="text-xs text-gray-400 mt-1">Total líquido no período</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <Receipt size={14} /> Transações
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.transactionCount}</p>
          <p className="text-xs text-gray-400 mt-1">Fechamentos registrados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <TrendingUp size={14} /> Ticket médio
          </div>
          <p className="text-xl font-bold text-gray-900">{money(totals.avgTicket)}</p>
          <p className="text-xs text-gray-400 mt-1">Por transação</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
            <PieChart size={14} /> Descontos
          </div>
          <p className="text-xl font-bold text-gray-900">{money(totals.discount)}</p>
          <p className="text-xs text-gray-400 mt-1">Taxa serviço: {money(totals.serviceFee)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Por forma de pagamento</h2>
          {byPayment.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sem dados no período.</p>
          ) : (
            <ul className="space-y-3">
              {byPayment.map((row) => (
                <li key={row.method}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{PAY_LABELS[row.method] ?? row.method}</span>
                    <span className="font-medium text-gray-900">{money(row.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${(row.total / maxPay) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{row.count} transação(ões)</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Mesa × Balcão (PDV)</h2>
          {totals.transactionCount === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sem dados no período.</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-2">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${pctMesa}%` }} title="Mesas" />
                <div
                  className="bg-orange-500 h-full transition-all"
                  style={{ width: `${pctBalcao}%` }}
                  title="Balcão"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium">Mesas: {money(byChannel.mesa)}</span>
                <span className="text-orange-600 font-medium">Balcão: {money(byChannel.balcao)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm text-gray-900">Transações recentes</h2>
          <p className="text-xs text-gray-500">Até 200 registros no período selecionado</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
                <th className="px-3 py-2 font-semibold whitespace-nowrap">Data</th>
                <th className="px-3 py-2 font-semibold">Origem</th>
                <th className="px-3 py-2 font-semibold text-right">Subtotal</th>
                <th className="px-3 py-2 font-semibold text-right hidden md:table-cell">Taxa</th>
                <th className="px-3 py-2 font-semibold text-right hidden md:table-cell">Desc.</th>
                <th className="px-3 py-2 font-semibold text-right">Total</th>
                <th className="px-3 py-2 font-semibold">Pagamento</th>
                <th className="px-3 py-2 font-semibold text-right">NFC-e</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-gray-400">
                    Nenhuma transação no período.
                  </td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {new Date(t.paidAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-gray-900">{t.channelLabel}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{money(t.subtotal)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">
                    {money(t.serviceFee)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">
                    {money(t.discount)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-900">{money(t.total)}</td>
                  <td className="px-3 py-2.5 text-gray-600">{PAY_LABELS[t.paymentMethod] ?? t.paymentMethod}</td>
                  <td className="px-3 py-2.5 text-right">
                    {t.nfce ? (
                      <Link
                        href={`/admin/nfce/${t.nfce.id}`}
                        className="text-orange-600 hover:underline text-xs font-medium"
                      >
                        {t.nfce.status === "AUTORIZADA" ? "DANFC-e" : t.nfce.status}
                      </Link>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
