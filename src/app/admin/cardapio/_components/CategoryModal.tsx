"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { createCategory, updateCategory } from "@/app/actions/categories";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Props {
  category?: Category | null;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280",
];

export default function CategoryModal({ category, onClose }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedColor, setSelectedColor] = useState(category?.color ?? "#6b7280");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", selectedColor);

    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, fd)
        : await createCategory(fd);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Nome *</label>
            <input
              name="name"
              defaultValue={category?.name}
              required
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              placeholder="Ex: Hambúrgueres"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition shadow-sm"
                  style={{
                    backgroundColor: c,
                    borderColor: selectedColor === c ? "#1f2937" : "transparent",
                    outline: selectedColor === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-sm"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
