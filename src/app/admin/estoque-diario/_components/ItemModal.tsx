"use client";

import { useState, useTransition } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { createInventoryItem, updateInventoryItem } from "@/app/actions/inventory";
import { UnitOfMeasure } from "@/generated/prisma";


interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  unitOfMeasure: UnitOfMeasure;
  categoryId: string;
}

interface Props {
  item?: Item | null;
  categories: Category[];
  onClose: (saved?: boolean) => void;
}

const UNITS = Object.values(UnitOfMeasure);

export default function ItemModal({ item, categories, onClose }: Props) {
  const [form, setForm] = useState({
    name: item?.name || "",
    categoryId: item?.categoryId || (categories.length > 0 ? categories[0].id : ""),
    unitOfMeasure: item?.unitOfMeasure || "UN" as UnitOfMeasure,
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const inp = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";

  function handleSave() {
    if (!form.name.trim() || !form.categoryId) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        if (item) {
          await updateInventoryItem(item.id, form);
        } else {
          await createInventoryItem(form);
        }
        onClose(true);
      } catch (err) {
        setError("Ocorreu um erro ao salvar o item.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? "Editar Item" : "Novo Item"}
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className={inp}
              placeholder="Ex: Arroz 5kg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Categoria *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className={inp}
            >
              <option value="" disabled>Selecione uma categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Unidade de Medida *</label>
            <select
              value={form.unitOfMeasure}
              onChange={(e) => setForm(f => ({ ...f, unitOfMeasure: e.target.value as UnitOfMeasure }))}
              className={inp}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || categories.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-sm"
          >
            <Save size={14} />
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
