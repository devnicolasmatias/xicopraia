"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, AlertTriangle, CheckCircle2,
  Package, ShoppingCart, X, Save, ArrowLeft
} from "lucide-react";
import {
  createIngredient, updateIngredient, deleteIngredient,
} from "@/app/actions/ingredients";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
}

interface Props {
  ingredients: Ingredient[];
}

const EMPTY_FORM = { name: "", unit: "un", currentStock: "0", minimumStock: "0" };
const UNITS = ["un", "kg", "g", "l", "ml", "cx", "pct"];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function EstoqueClient({ ingredients: initial }: Props) {
  const [ingredients, setIngredients] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [modal, setModal] = useState<"new" | string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [tab, setTab] = useState<"todos" | "reposicao">("todos");

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setFormError("");
    setModal("new");
  }

  function openEdit(i: Ingredient) {
    setForm({
      name: i.name,
      unit: i.unit,
      currentStock: String(i.currentStock),
      minimumStock: String(i.minimumStock),
    });
    setFormError("");
    setModal(i.id);
  }

  function handleSave() {
    setFormError("");
    const data = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      currentStock: parseFloat(form.currentStock) || 0,
      minimumStock: parseFloat(form.minimumStock) || 0,
    };

    startTransition(async () => {
      let res: { error?: string; success?: boolean };

      if (modal === "new") {
        res = await createIngredient(data);
      } else {
        res = await updateIngredient(modal as string, data);
      }

      if (res.error) {
        setFormError(res.error);
        return;
      }

      setModal(null);
      showToast(modal === "new" ? "Ingrediente criado!" : "Ingrediente atualizado!", "success");

      window.location.reload();
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o ingrediente "${name}"?`)) return;
    startTransition(async () => {
      await deleteIngredient(id);
      setIngredients((prev) => prev.filter((i) => i.id !== id));
      showToast("Ingrediente excluído.", "success");
    });
  }

  const lowStock = ingredients.filter((i) => i.currentStock < i.minimumStock);
  const displayed = tab === "reposicao" ? lowStock : ingredients;

  function stockBadge(i: Ingredient) {
    const low = i.currentStock < i.minimumStock;
    const warn = i.minimumStock > 0 && i.currentStock < i.minimumStock * 1.2;
    if (low) return "bg-orange-100 text-orange-600 border-orange-200";
    if (warn) return "bg-yellow-100 text-yellow-600 border-yellow-200";
    return "bg-green-100 text-green-600 border-green-200";
  }

  function stockIcon(i: Ingredient) {
    if (i.currentStock < i.minimumStock) return <AlertTriangle size={13} />;
    return <CheckCircle2 size={13} />;
  }

  const inp = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
          ${toast.type === "error"
            ? "bg-orange-50 border-orange-200 text-orange-600"
            : "bg-green-50 border-green-200 text-green-700"}`}
        >
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="Xico Praia" width={44} height={44} unoptimized className="shrink-0 hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Estoque</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {ingredients.length} ingrediente(s)
              {lowStock.length > 0 && (
                <span className="ml-2 text-orange-600 font-medium">· {lowStock.length} abaixo do mínimo</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus size={16} /> Novo Ingrediente
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-8 pt-4 flex gap-1 border-b border-gray-200">
        {([
          { key: "todos", label: "Todos", icon: <Package size={14} /> },
          { key: "reposicao", label: `Reposição necessária (${lowStock.length})`, icon: <ShoppingCart size={14} /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px
              ${tab === key
                ? key === "reposicao" && lowStock.length > 0
                  ? "border-orange-500 text-orange-600"
                  : "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Reposição banner */}
      {tab === "reposicao" && lowStock.length === 0 && (
        <div className="mx-8 mt-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3 text-green-700 text-sm shadow-sm">
          <CheckCircle2 size={18} />
          Todos os ingredientes estão com estoque adequado.
        </div>
      )}

      {/* Table */}
      <div className="px-8 py-6">
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
                <th className="px-4 py-3 font-semibold">Ingrediente</th>
                <th className="px-4 py-3 font-semibold">Unidade</th>
                <th className="px-4 py-3 font-semibold">Estoque Atual</th>
                <th className="px-4 py-3 font-semibold">Mínimo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    {tab === "reposicao" ? "Nenhum ingrediente para repor." : "Nenhum ingrediente cadastrado."}
                  </td>
                </tr>
              )}
              {displayed.map((ing) => (
                <tr key={ing.id} className={`border-t border-gray-100 transition
                  ${ing.currentStock < ing.minimumStock ? "bg-orange-50/60 hover:bg-orange-50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{ing.name}</td>
                  <td className="px-4 py-3 text-gray-500">{ing.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${ing.currentStock < ing.minimumStock ? "text-orange-600" : "text-gray-900"}`}>
                      {ing.currentStock.toLocaleString("pt-BR")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ing.minimumStock.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stockBadge(ing)}`}>
                      {stockIcon(ing)}
                      {ing.currentStock < ing.minimumStock ? "Repor" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(ing)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(ing.id, ing.name)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === "new" ? "Novo Ingrediente" : "Editar Ingrediente"}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 font-medium">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inp}
                  placeholder="Ex: Carne bovina, Queijo prato..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5 font-medium">Unidade *</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className={inp}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Estoque Atual</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.currentStock}
                    onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.minimumStock}
                    onChange={(e) => setForm((f) => ({ ...f, minimumStock: e.target.value }))}
                    className={inp}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setModal(null)}
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
      )}
    </div>
  );
}
