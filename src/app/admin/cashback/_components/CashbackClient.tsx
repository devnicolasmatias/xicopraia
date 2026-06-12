"use client";

import { useState, useTransition } from "react";
import { Search, Gift, Check, X, AlertTriangle, UserPlus } from "lucide-react";
import { searchCustomers, createCustomer } from "@/app/actions/crm";
import { manualCashback } from "@/app/actions/cashback";

interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  cashbackBalance: number;
  cashbackExpiresAt: string | null;
}

interface Props {
  configPercentage: number;
  configExpiryDays: number;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export default function CashbackClient({ configPercentage, configExpiryDays }: Props) {
  const [isPending, startTransition] = useTransition();

  // Step 1 state
  const [tab, setTab] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CustomerResult | null>(null);

  // New customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newError, setNewError] = useState("");

  // Step 2 state
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [success, setSuccess] = useState<{ amount: number; expiresAt: string } | null>(null);
  const [error, setError] = useState("");

  const cashbackPreview = (() => {
    const v = parseFloat(purchaseAmount.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) return null;
    return Number(((v * configPercentage) / 100).toFixed(2));
  })();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await searchCustomers(query);
      setResults(
        r.map((c) => ({
          ...c,
          cashbackBalance: Number(c.cashbackBalance),
          cashbackExpiresAt:
            c.cashbackExpiresAt?.toISOString?.() ??
            (c.cashbackExpiresAt as string | null),
        }))
      );
    } finally {
      setSearching(false);
    }
  }

  function handleSelect(c: CustomerResult) {
    setSelected(c);
    setResults([]);
    setQuery(c.name);
    setError("");
    setSuccess(null);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setError("");
    setSuccess(null);
    setPurchaseAmount("");
    setNewName("");
    setNewPhone("");
    setNewCpf("");
    setNewError("");
  }

  function handleCreateNew() {
    setNewError("");
    if (!newName.trim()) { setNewError("Nome obrigatório."); return; }
    if (!newPhone.trim()) { setNewError("Telefone obrigatório."); return; }

    startTransition(async () => {
      try {
        const customer = await createCustomer({
          name: newName,
          phone: newPhone,
          cpf: newCpf || undefined,
        });
        setSelected({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          cashbackBalance: 0,
          cashbackExpiresAt: null,
        });
        setError("");
        setSuccess(null);
      } catch (err) {
        setNewError(err instanceof Error ? err.message : "Erro ao criar cliente.");
      }
    });
  }

  function handleApply() {
    if (!selected) { setError("Selecione um cliente."); return; }
    const v = parseFloat(purchaseAmount.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) { setError("Informe um valor de compra válido."); return; }

    setError("");
    startTransition(async () => {
      try {
        const result = await manualCashback(selected.id, v);
        setSuccess({
          amount: result.amount,
          expiresAt: result.expiresAt.toISOString?.() ?? String(result.expiresAt),
        });
        setPurchaseAmount("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao lançar cashback.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Config info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4 flex items-center gap-3">
        <Gift size={20} className="text-indigo-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">
            {configPercentage}% de cashback · validade {configExpiryDays} dias
          </p>
          <p className="text-xs text-indigo-500">Configuração atual do CRM</p>
        </div>
      </div>

      {/* Step 1: select or create customer */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <h2 className="font-bold text-gray-900 mb-4">1. Selecione o cliente</h2>

          {selected ? (
            /* Selected state */
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900">{selected.name}</p>
                <p className="text-xs text-indigo-500">{maskPhone(selected.phone)}</p>
              </div>
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-100 mb-4">
                <button
                  onClick={() => setTab("search")}
                  className={`flex-1 pb-2.5 text-sm font-medium transition ${
                    tab === "search"
                      ? "text-indigo-600 border-b-2 border-indigo-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Buscar existente
                </button>
                <button
                  onClick={() => setTab("new")}
                  className={`flex-1 pb-2.5 text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                    tab === "new"
                      ? "text-indigo-600 border-b-2 border-indigo-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <UserPlus size={14} /> Novo cliente
                </button>
              </div>

              {tab === "search" && (
                <div className="space-y-3">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nome ou telefone…"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      {searching ? "…" : "Buscar"}
                    </button>
                  </form>

                  {results.length === 0 && query && !searching && (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Nenhum cliente encontrado.{" "}
                      <button
                        onClick={() => setTab("new")}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Cadastrar novo?
                      </button>
                    </p>
                  )}

                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        className="w-full text-left px-2 py-3 hover:bg-indigo-50 transition rounded-xl"
                      >
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{maskPhone(c.phone)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "new" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Nome *</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Telefone *</label>
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">CPF (opcional)</label>
                    <input
                      value={newCpf}
                      onChange={(e) => setNewCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {newError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      {newError}
                    </p>
                  )}
                  <button
                    onClick={handleCreateNew}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                  >
                    <Check size={15} />
                    {isPending ? "Criando…" : "Criar e selecionar"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Step 2: purchase amount */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">2. Valor da compra</h2>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Valor total da compra (R$)
            </label>
            <input
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {cashbackPreview != null && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">Cashback que será gerado</p>
              <p className="text-xl font-bold text-green-700">{money(cashbackPreview)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {configPercentage}% de {purchaseAmount} · válido por {configExpiryDays} dias
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <div>
                <p className="font-semibold">Cashback de {money(success.amount)} gerado!</p>
                <p className="text-xs text-green-600">
                  Mensagem WhatsApp enviada · Expira em{" "}
                  {new Date(success.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={isPending || !cashbackPreview}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            <Gift size={16} />
            {isPending ? "Gerando cashback…" : "Gerar cashback"}
          </button>
        </div>
      )}
    </div>
  );
}
