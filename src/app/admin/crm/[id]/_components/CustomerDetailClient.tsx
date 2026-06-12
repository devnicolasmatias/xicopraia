"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Check, X } from "lucide-react";
import { updateCustomer } from "@/app/actions/crm";

interface Props {
  customer: {
    id: string;
    name: string;
    phone: string;
    cpf: string | null;
  };
}

export default function CustomerDetailClient({ customer }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [cpf, setCpf] = useState(customer.cpf ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    startTransition(async () => {
      try {
        await updateCustomer(customer.id, { name, phone, cpf: cpf || undefined });
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handleCancel() {
    setName(customer.name);
    setPhone(customer.phone);
    setCpf(customer.cpf ?? "");
    setEditing(false);
    setError("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Dados do cliente</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition"
          >
            <Edit2 size={12} /> Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">CPF (opcional)</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              <X size={13} /> Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              <Check size={13} /> {isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-gray-400 font-medium mb-0.5">Nome</dt>
            <dd className="text-sm text-gray-900 font-medium">{customer.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 font-medium mb-0.5">Telefone</dt>
            <dd className="text-sm text-gray-900">{customer.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 font-medium mb-0.5">CPF</dt>
            <dd className="text-sm text-gray-900">{customer.cpf ?? "—"}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
