"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Tag, Package,
  ToggleLeft, ToggleRight, AlertCircle, ArrowLeft, Search, X
} from "lucide-react";
import CategoryModal from "./CategoryModal";
import ProductModal from "./ProductModal";
import { deleteCategory } from "@/app/actions/categories";
import { deleteProduct, toggleProductAvailability } from "@/app/actions/products";

interface Category {
  id: string;
  name: string;
  color: string;
  _count: { products: number };
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
  category: { id: string; name: string; color: string };
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Props {
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
}

type Tab = "products" | "categories";

export default function CardapioClient({ categories, products, ingredients }: Props) {
  const [tab, setTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item?: Category | null }>({ open: false });
  const [productModal, setProductModal] = useState<{ open: boolean; item?: Product | null }>({ open: false });
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchTerm = search.trim().toLowerCase();
  const filteredProducts = searchTerm
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.category.name.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm)
      )
    : products;

  function showToast(msg: string, type: "error" | "success" = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleDeleteCategory(id: string) {
    if (!confirm("Excluir esta categoria?")) return;
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.error) showToast(res.error);
    });
  }

  function handleDeleteProduct(id: string) {
    if (!confirm("Excluir este produto?")) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.error) showToast(res.error);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleProductAvailability(id, !current);
    });
  }

  const fmtPrice = (val: number | { toString(): string }) =>
    parseFloat(String(val)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
            ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"}`}
        >
          <AlertCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="Boteco4075" width={44} height={44} unoptimized className="shrink-0 hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cardápio</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {products.length} produto(s) · {categories.length} categoria(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              tab === "products"
                ? setProductModal({ open: true, item: null })
                : setCategoryModal({ open: true, item: null })
            }
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            {tab === "products" ? "Novo Produto" : "Nova Categoria"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-8 pt-4 flex gap-1 border-b border-gray-200">
        {(["products", "categories"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px
              ${tab === t ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t === "products" ? <Package size={15} /> : <Tag size={15} />}
            {t === "products" ? "Produtos" : "Categorias"}
          </button>
        ))}
      </div>

      <div className="px-8 py-6">
        {/* ── PRODUCTS TAB ── */}
        {tab === "products" && (
          <>
            <div className="mb-4 relative max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, categoria ou descrição..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Preço</th>
                  <th className="px-4 py-3 font-semibold">Custo</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      {searchTerm ? `Nenhum produto encontrado para "${search}".` : "Nenhum produto cadastrado ainda."}
                    </td>
                  </tr>
                )}
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: p.category.color + "22", color: p.category.color }}
                      >
                        {p.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{fmtPrice(p.price)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.costPrice ? fmtPrice(p.costPrice) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(p.id, p.available)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 text-xs transition"
                      >
                        {p.available ? (
                          <>
                            <ToggleRight size={18} className="text-green-500" />
                            <span className="text-green-600">Disponível</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={18} className="text-gray-400" />
                            <span className="text-gray-400">Indisponível</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setProductModal({ open: true, item: p })}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
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
          </>
        )}

        {/* ── CATEGORIES TAB ── */}
        {tab === "categories" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.length === 0 && (
              <p className="col-span-full text-center text-gray-400 py-10">
                Nenhuma categoria cadastrada ainda.
              </p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat._count.products} produto(s)</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCategoryModal({ open: true, item: cat })}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.item}
          onClose={() => setCategoryModal({ open: false })}
        />
      )}
      {productModal.open && (
        <ProductModal
          product={productModal.item}
          categories={categories}
          ingredients={ingredients}
          onClose={() => setProductModal({ open: false })}
        />
      )}
    </div>
  );
}
