"use client";

import { useEffect, useTransition } from "react";
import { X, Users } from "lucide-react";
import { openTable } from "@/app/actions/tables";

interface Props {
  table: { id: string; number: number; capacity: number };
  onClose: () => void;
}

export default function AbrirMesaModal({ table, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const customerName = fd.get("customerName") as string;

    startTransition(async () => {
      await openTable(table.id, customerName || undefined);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Abrir Mesa {table.number}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Users size={13} /> Capacidade: {table.capacity} pessoas
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">
              Nome do cliente <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              name="customerName"
              autoFocus
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-sm"
            >
              {isPending ? "Abrindo..." : "Abrir Mesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
