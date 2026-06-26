"use client";

import { useState, useTransition } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { createInventoryCategory, updateInventoryCategory } from "@/app/actions/inventory";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Props {
  category?: Category | null;
  onClose: (saved?: boolean) => void;
}

export default function CategoryModal({ category, onClose }: Props) {
  const [form, setForm] = useState({
    name: category?.name || "",
    color: category?.color || "#6b7280",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const inp = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";

  function handleSave() {
    if (!form.name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    setError("");
    
    startTransition(async () => {
      try {
        if (category) {
          await updateInventoryCategory(category.id, form);
        } else {
          await createInventoryCategory(form);
        }
        onClose(true);
      } catch (err) {
        setError("Ocorreu um erro ao salvar a categoria.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? "Editar Categoria" : "Nova Categoria"}
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
              placeholder="Ex: Carnes, Bebidas..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Cor</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                className="h-10 w-10 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-sm text-gray-500 uppercase font-medium">{form.color}</span>
            </div>
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
            disabled={isPending}
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
