"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { FinancialReport, OrderDetail } from "@/app/actions/financeiro";
import { deleteTransaction, getOrderDetail } from "@/app/actions/financeiro";
import { emitirNfceParaTransacao } from "@/app/actions/fiscal";
import type { PaymentMethod } from "@/generated/prisma";
import { Wallet, PieChart, Receipt, TrendingUp, FileText, Loader2, Trash2, X, Eye } from "lucide-react";

interface Props {
  initialFrom: string;
  initialTo: string;
  report: FinancialReport;
  userRole: string;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PAY_LABELS: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Cartão débito",
  CARTAO_CREDITO: "Cartão crédito",
};

export default function FinanceiroClient({ initialFrom, initialTo, report, userRole }: Props) {
  const { totals, byPayment, byChannel, transactions } = report;
  const canManage = userRole === "ADMIN" || userRole === "GERENTE";
  const [isPending, startTransition] = useTransition();
  const [emittingId, setEmittingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleEmitirNfce(transactionId: string) {
    setEmittingId(transactionId);
    startTransition(async () => {
      const res = await emitirNfceParaTransacao(transactionId);
      setEmittingId(null);
      if (res.error) {
        showToast(res.error, "error");
      } else if (res.success) {
        showToast(`NFC-e emitida com sucesso! cStat: ${res.cStat}`, "success");
      } else {
        showToast(`NFC-e rejeitada: ${res.xMotivo}`, "error");
      }
    });
  }
  function handleViewOrder(orderId: string) {
    setLoadingOrderId(orderId);
    startTransition(async () => {
      const detail = await getOrderDetail(orderId);
      setLoadingOrderId(null);
      if (detail) setOrderDetail(detail);
      else showToast("Pedido não encontrado.", "error");
    });
  }

  function handleDeleteTransaction() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    startTransition(async () => {
      const res = await deleteTransaction(deleteTarget.id, deletePassword);
      setDeletingId(null);
      setDeleteTarget(null);
      setDeletePassword("");
      if (res.error) {
        showToast(res.error, "error");
      } else {
        showToast("Venda excluída com sucesso.", "success");
        window.location.reload();
      }
    });
  }

  const channelSum = byChannel.mesa + byChannel.balcao;
  const channelDenom = channelSum > 0 ? channelSum : 1;
  const pctMesa = (byChannel.mesa / channelDenom) * 100;
  const pctBalcao = (byChannel.balcao / channelDenom) * 100;
  const maxPay = Math.max(...byPayment.map((p) => p.total), 1);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
            ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"}`}
        >
          {toast.msg}
        </div>
      )}

      {canManage && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Excluir venda</h3>
              <button onClick={() => { setDeleteTarget(null); setDeletePassword(""); }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-1">Tem certeza que deseja excluir esta venda?</p>
            <p className="text-sm font-medium text-gray-800 mb-4">{deleteTarget.label}</p>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Senha de confirmação</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && deletePassword) handleDeleteTransaction(); }}
              placeholder="Digite a senha"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setDeleteTarget(null); setDeletePassword(""); }}
                className="flex-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTransaction}
                disabled={!deletePassword || !!deletingId}
                className="flex-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deletingId ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
      {orderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Detalhes do Pedido</h3>
                <p className="text-xs text-gray-500">
                  Mesa {orderDetail.tableNumber}
                  {orderDetail.userName ? ` · Garçom: ${orderDetail.userName.split(" ")[0]}` : ""}
                  {" · "}
                  {new Date(orderDetail.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button onClick={() => setOrderDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {orderDetail.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5">
                  <span className="text-gray-400 text-sm w-6 text-right">{item.quantity}×</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.name}</p>
                    {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {money(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm">
              <span className="text-gray-500">Total dos itens</span>
              <span className="font-semibold text-gray-900">
                {money(orderDetail.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {canManage && (
        <>
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
        </>
      )}

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
                {canManage && <th className="px-3 py-2 font-semibold text-right hidden md:table-cell">Taxa</th>}
                {canManage && <th className="px-3 py-2 font-semibold text-right hidden md:table-cell">Desc.</th>}
                <th className="px-3 py-2 font-semibold text-right">Total</th>
                <th className="px-3 py-2 font-semibold">Pagamento</th>
                {canManage && <th className="px-3 py-2 font-semibold text-right">NFC-e</th>}
                <th className="px-3 py-2 font-semibold text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 9 : 6} className="px-3 py-10 text-center text-gray-400">
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
                  {canManage && (
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">
                      {money(t.serviceFee)}
                    </td>
                  )}
                  {canManage && (
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">
                      {money(t.discount)}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-right font-medium text-gray-900">{money(t.total)}</td>
                  <td className="px-3 py-2.5 text-gray-600">{PAY_LABELS[t.paymentMethod] ?? t.paymentMethod}</td>
                  {canManage && (
                    <td className="px-3 py-2.5 text-right">
                      {t.nfce ? (
                        t.nfce.status === "AUTORIZADA" ? (
                          <Link
                            href={`/admin/nfce/${t.nfce.id}`}
                            className="text-orange-600 hover:underline text-xs font-medium"
                          >
                            DANFC-e
                          </Link>
                        ) : t.nfce.status === "CANCELADA" ? (
                          <Link
                            href={`/admin/nfce/${t.nfce.id}`}
                            className="text-gray-400 hover:underline text-xs font-medium"
                          >
                            CANCELADA
                          </Link>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/admin/nfce/${t.nfce.id}`}
                              className="text-red-500 hover:underline text-xs font-medium"
                            >
                              {t.nfce.status}
                            </Link>
                            <button
                              onClick={() => handleEmitirNfce(t.id)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-md transition disabled:opacity-50"
                            >
                              {emittingId === t.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <FileText size={11} />
                              )}
                              Reemitir
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => handleEmitirNfce(t.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {emittingId === t.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <FileText size={12} />
                          )}
                          {emittingId === t.id ? "Emitindo…" : "Emitir NFC-e"}
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleViewOrder(t.orderId)}
                        disabled={loadingOrderId === t.orderId}
                        className="text-gray-400 hover:text-blue-500 transition"
                        title="Ver pedido"
                      >
                        {loadingOrderId === t.orderId
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Eye size={14} />}
                      </button>
                      {canManage && (
                        <button
                          onClick={() => setDeleteTarget({
                            id: t.id,
                            label: `${t.channelLabel} — ${money(t.total)} — ${new Date(t.paidAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
                          })}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Excluir venda"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
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
