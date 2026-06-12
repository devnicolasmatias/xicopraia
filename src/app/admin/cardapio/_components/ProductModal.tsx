"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, FlaskConical, CheckCircle2 } from "lucide-react";
import { createProduct, updateProduct } from "@/app/actions/products";
import { saveProductRecipe, getProductRecipe } from "@/app/actions/ingredients";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | { toString(): string };
  costPrice: number | { toString(): string } | null;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
}

interface RecipeRow {
  ingredientId: string;
  quantity: string;
}

interface Props {
  product?: Product | null;
  categories: Category[];
  ingredients: Ingredient[];
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SavedData {
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export default function ProductModal({ product, categories, ingredients, onClose }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [available, setAvailable] = useState(product?.available ?? true);
  const [savedData, setSavedData] = useState<SavedData | null>(null);

  const [recipe, setRecipe] = useState<RecipeRow[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);

  useEffect(() => {
    if (!product) return;
    setRecipeLoading(true);
    getProductRecipe(product.id).then((items) => {
      setRecipe(items.map((i) => ({ ingredientId: i.ingredientId, quantity: String(i.quantity) })));
      setRecipeLoading(false);
    });
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function addRecipeRow() {
    const firstUnused = ingredients.find((ing) => !recipe.some((r) => r.ingredientId === ing.id));
    if (!firstUnused) return;
    setRecipe((prev) => [...prev, { ingredientId: firstUnused.id, quantity: "1" }]);
  }

  function removeRecipeRow(idx: number) {
    setRecipe((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRecipeRow(idx: number, field: keyof RecipeRow, value: string) {
    setRecipe((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    fd.set("available", String(available));

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, fd)
        : await createProduct(fd);

      if (result.error) {
        setError(result.error);
        return;
      }

      const productId = product?.id ?? (result as { productId?: string }).productId;
      if (productId) {
        const validRecipe = recipe
          .filter((r) => r.ingredientId && parseFloat(r.quantity) > 0)
          .map((r) => ({ ingredientId: r.ingredientId, quantity: parseFloat(r.quantity) }));

        await saveProductRecipe(productId, validRecipe);
      }

      router.refresh();

      if (product && (result as { saved?: SavedData }).saved) {
        setSavedData((result as { saved: SavedData }).saved);
      } else {
        onClose();
      }
    });
  }

  const priceStr = product?.price != null ? String(product.price) : "";
  const costPriceStr = product?.costPrice != null ? String(product.costPrice) : "";

  const availableIngredients = ingredients.filter(
    (ing) => !recipe.some((r) => r.ingredientId === ing.id)
  );

  const inp = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";

  if (savedData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-8 shadow-2xl flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">Atualizado no banco</h2>
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-left space-y-1">
            <p><span className="text-gray-500">Nome:</span> <span className="font-medium text-gray-900">{savedData.name}</span></p>
            <p><span className="text-gray-500">Preço:</span> <span className="font-medium text-green-700">{savedData.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></p>
            <p><span className="text-gray-500">Categoria:</span> <span className="font-medium text-gray-900">{savedData.category}</span></p>
            <p><span className="text-gray-500">Status:</span> <span className="font-medium text-gray-900">{savedData.available ? "Disponível" : "Indisponível"}</span></p>
          </div>
          <p className="text-xs text-gray-400">Estes dados foram lidos do banco após o salvamento.</p>
          <button
            onClick={onClose}
            className="mt-1 w-full px-4 py-2.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? "Editar Produto" : "Novo Produto"}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Nome *</label>
            <input
              name="name"
              defaultValue={product?.name}
              required
              className={inp}
              placeholder="Ex: X-Burguer Clássico"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Descrição</label>
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              rows={2}
              className={`${inp} resize-none`}
              placeholder="Descrição opcional..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5 font-medium">Preço de Venda (R$) *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={priceStr}
                required
                className={inp}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5 font-medium">Custo (R$)</label>
              <input
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={costPriceStr}
                className={inp}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Categoria *</label>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              required
              className={inp}
            >
              <option value="" disabled>Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">URL da Imagem</label>
            <input
              name="imageUrl"
              type="url"
              defaultValue={product?.imageUrl ?? ""}
              className={inp}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAvailable(!available)}
              className={`relative w-10 h-5 rounded-full transition-colors ${available ? "bg-orange-500" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${available ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
            <span className="text-sm text-gray-700">
              {available ? "Disponível no cardápio" : "Indisponível"}
            </span>
          </div>

          {/* ── Ficha Técnica ── */}
          {ingredients.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical size={15} className="text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">Ficha Técnica</span>
                  <span className="text-xs text-gray-400">(composição do prato)</span>
                </div>
                <button
                  type="button"
                  onClick={addRecipeRow}
                  disabled={availableIngredients.length === 0}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 disabled:opacity-30 transition font-medium"
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>

              {recipeLoading && (
                <p className="text-xs text-gray-400 py-2">Carregando ficha técnica...</p>
              )}

              {!recipeLoading && recipe.length === 0 && (
                <p className="text-xs text-gray-400 py-2">
                  Nenhum ingrediente vinculado. Clique em "Adicionar" para criar a composição.
                </p>
              )}

              <div className="space-y-2">
                {recipe.map((row, idx) => {
                  const ing = ingredients.find((i) => i.id === row.ingredientId);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.ingredientId}
                        onChange={(e) => updateRecipeRow(idx, "ingredientId", e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {ing && <option value={ing.id}>{ing.name}</option>}
                        {ingredients
                          .filter((i) => !recipe.some((r, ri) => ri !== idx && r.ingredientId === i.id))
                          .filter((i) => i.id !== row.ingredientId)
                          .map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))
                        }
                      </select>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={row.quantity}
                        onChange={(e) => updateRecipeRow(idx, "quantity", e.target.value)}
                        className="w-24 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-500 w-6">{ing?.unit ?? ""}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipeRow(idx)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Botões ── */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
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
