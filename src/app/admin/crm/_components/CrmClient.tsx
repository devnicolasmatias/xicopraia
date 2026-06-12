"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Users, Settings, X, Check, AlertTriangle, Gift, QrCode } from "lucide-react";
import { createCustomer, saveCashbackConfig } from "@/app/actions/crm";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  cashbackBalance: number;
  cashbackExpiresAt: string | null;
  createdAt: string;
  _count: { orders: number };
}

interface CashbackConfig {
  id: string;
  percentage: number;
  expiryDays: number;
}

interface Props {
  customers: Customer[];
  cashbackConfig: CashbackConfig | null;
  isAdmin: boolean;
  initialSearch: string;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export default function CrmClient({
  customers,
  cashbackConfig,
  isAdmin,
  initialSearch,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"clientes" | "config">("clientes");
  const [search, setSearch] = useState(initialSearch);

  // New customer modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newError, setNewError] = useState("");

  // Cashback config
  const [percentage, setPercentage] = useState(String(cashbackConfig?.percentage ?? ""));
  const [expiryDays, setExpiryDays] = useState(String(cashbackConfig?.expiryDays ?? "30"));
  const [configMsg, setConfigMsg] = useState("");
  const [configError, setConfigError] = useState("");

  // QR Code modal
  const [showQr, setShowQr] = useState(false);
  const cadastroUrl = typeof window !== "undefined"
    ? `${window.location.origin}/cadastro`
    : "/cadastro";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/admin/crm?q=${encodeURIComponent(search)}`);
  }

  function handleNewCustomer() {
    setNewError("");
    if (!newName.trim()) { setNewError("Nome obrigatório."); return; }
    if (!newPhone.trim()) { setNewError("Telefone obrigatório."); return; }

    startTransition(async () => {
      try {
        await createCustomer({ name: newName, phone: newPhone, cpf: newCpf || undefined });
        setShowNewModal(false);
        setNewName(""); setNewPhone(""); setNewCpf("");
        router.refresh();
      } catch (err) {
        setNewError(err instanceof Error ? err.message : "Erro ao criar cliente.");
      }
    });
  }

  function handleSaveConfig() {
    setConfigMsg(""); setConfigError("");
    const pct = parseFloat(percentage.replace(",", "."));
    const days = parseInt(expiryDays);

    startTransition(async () => {
      try {
        await saveCashbackConfig({ percentage: pct, expiryDays: days });
        setConfigMsg("Configuração salva com sucesso!");
        setTimeout(() => setConfigMsg(""), 3000);
      } catch (err) {
        setConfigError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  const now = new Date();

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => setTab("clientes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "clientes"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Users size={15} /> Clientes
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab("config")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "config"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Settings size={15} /> Config. Cashback
          </button>
        )}
      </div>

      {/* ── TAB CLIENTES ── */}
      {tab === "clientes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou telefone…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
              >
                Buscar
              </button>
            </form>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <UserPlus size={15} /> Novo cliente
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <QrCode size={15} /> QR de Cadastro
            </button>
          </div>

          {/* Modal QR Code */}
          {showQr && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
              <div
                className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between w-full">
                  <h2 className="font-bold text-gray-900 text-lg">QR de Auto-cadastro</h2>
                  <button onClick={() => setShowQr(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-orange-200 shadow-inner" id="qr-print-area">
                  <QRCodeSVG
                    value={cadastroUrl}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#1e1e2e"
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-700">Escaneie para se cadastrar</p>
                  <p className="text-xs text-gray-400 break-all">{cadastroUrl}</p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm transition"
                >
                  🖨️ Imprimir QR Code
                </button>
              </div>
            </div>
          )}

          {customers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm shadow-sm">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Telefone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Compras</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Cashback</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => {
                    const hasBalance = c.cashbackBalance > 0;
                    const isExpired =
                      c.cashbackExpiresAt != null && new Date(c.cashbackExpiresAt) < now;
                    const isValid = hasBalance && !isExpired;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          {c.cpf && <p className="text-xs text-gray-400">CPF: {c.cpf}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                          {maskPhone(c.phone)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {c._count.orders}
                        </td>
                        <td className="px-4 py-3">
                          {hasBalance ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                                isValid
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-400 border-gray-200 line-through"
                              }`}
                            >
                              <Gift size={11} />
                              {money(c.cashbackBalance)}
                              {isExpired && " (expirado)"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/crm/${c.id}`}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONFIG ── */}
      {tab === "config" && isAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-md space-y-5">
          <div>
            <h2 className="font-bold text-gray-900 mb-0.5">Configuração de Cashback</h2>
            <p className="text-xs text-gray-500">Define o percentual e o prazo para uso do saldo.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Percentual de cashback (%)
              </label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Ex: 5"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Percentual sobre o valor total da compra.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Prazo para uso (dias)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[7, 15, 30, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExpiryDays(String(d))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      expiryDays === String(d)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {configError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} /> {configError}
            </div>
          )}
          {configMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <Check size={14} /> {configMsg}
            </div>
          )}

          <button
            onClick={handleSaveConfig}
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition"
          >
            {isPending ? "Salvando…" : "Salvar configuração"}
          </button>
        </div>
      )}

      {/* ── MODAL NOVO CLIENTE ── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Novo cliente</h2>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nome *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Telefone *</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">CPF (opcional)</label>
                <input
                  value={newCpf}
                  onChange={(e) => setNewCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {newError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {newError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleNewCustomer}
                disabled={isPending}
                className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
              >
                {isPending ? "Criando…" : "Criar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
