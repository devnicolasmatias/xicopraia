"use client";

import { useState, useTransition } from "react";
import { Search, UserPlus, X, Check, Gift } from "lucide-react";
import { searchCustomers, createCustomer } from "@/app/actions/crm";

export interface SelectedCustomer {
  id: string;
  name: string;
  phone: string;
  cashbackBalance: number;
  cashbackExpiresAt: string | null;
  hasValidCashback: boolean;
}

interface Props {
  onSelect: (customer: SelectedCustomer) => void;
  onClose: () => void;
  mandatory?: boolean;
}

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export default function CustomerSelectorModal({ onSelect, onClose, mandatory = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedCustomer[]>([]);
  const [searching, setSearching] = useState(false);

  // New customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newError, setNewError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const raw = await searchCustomers(query);
      const now = new Date();
      const mapped = raw.map((c) => {
        const balance = Number(c.cashbackBalance);
        const expiresAt = c.cashbackExpiresAt
          ? (c.cashbackExpiresAt instanceof Date
              ? c.cashbackExpiresAt.toISOString()
              : String(c.cashbackExpiresAt))
          : null;
        const isExpired = expiresAt != null && new Date(expiresAt) < now;
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          cashbackBalance: balance,
          cashbackExpiresAt: expiresAt,
          hasValidCashback: balance > 0 && !isExpired,
        };
      });
      setResults(mapped);
      if (mapped.length === 0) {
        // pré-preenche telefone se a busca parecer um número
        const digits = query.replace(/\D/g, "");
        setNewPhone(digits.length >= 8 ? query : "");
        setNewName("");
        setNewError("");
      }
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function handleCreateNew() {
    setNewError("");
    if (!newName.trim()) { setNewError("Nome obrigatório."); return; }
    if (!newPhone.trim()) { setNewError("Telefone obrigatório."); return; }

    startTransition(async () => {
      try {
        const customer = await createCustomer({ name: newName, phone: newPhone });
        onSelect({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          cashbackBalance: 0,
          cashbackExpiresAt: null,
          hasValidCashback: false,
        });
      } catch (err) {
        setNewError(err instanceof Error ? err.message : "Erro ao criar cliente.");
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Associar cliente</h2>
            {mandatory && (
              <p className="text-xs text-orange-600 mt-0.5">Obrigatório para finalizar a venda</p>
            )}
          </div>
          {!mandatory && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("search")}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              tab === "search"
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Buscar cliente
          </button>
          <button
            onClick={() => setTab("new")}
            className={`flex-1 py-2.5 text-sm font-medium transition flex items-center justify-center gap-1 ${
              tab === "new"
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserPlus size={14} /> Novo
          </button>
        </div>

        <div className="p-5">
          {tab === "search" && (
            <div className="space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nome ou telefone…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {searching ? "…" : "OK"}
                </button>
              </form>

              {results.length === 0 && searched && !searching && (
                <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs text-gray-400 text-center">
                    Nenhum cliente encontrado. Cadastre rapidamente:
                  </p>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Nome *</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Telefone *</label>
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  {newError && (
                    <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                      {newError}
                    </p>
                  )}
                  <button
                    onClick={handleCreateNew}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm transition"
                  >
                    <UserPlus size={14} />
                    {isPending ? "Criando…" : "Criar e selecionar"}
                  </button>
                </div>
              )}

              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="w-full text-left px-2 py-3 hover:bg-orange-50 transition rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{maskPhone(c.phone)}</p>
                      </div>
                      {c.hasValidCashback && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                          <Gift size={11} />
                          {money(c.cashbackBalance)}
                        </span>
                      )}
                    </div>
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
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Telefone *</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {newError && (
                <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  {newError}
                </p>
              )}
              <button
                onClick={handleCreateNew}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                <Check size={15} />
                {isPending ? "Criando…" : "Criar e selecionar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
