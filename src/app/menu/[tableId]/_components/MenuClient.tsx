"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  ChevronRight, Package, X, CheckCircle2, RefreshCw,
} from "lucide-react";
import { submitGuestOrder, type GuestCartItem } from "@/app/actions/guestOrders";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  category: Category;
}

interface TableData {
  id: string;
  number: number;
  status: string;
  customerName: string | null;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface Props {
  table: TableData;
  products: Product[];
  categories: Category[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuClient({ table, products, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fmtPrice = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.categoryId === categoryFilter;
    return matchSearch && matchCat;
  });

  const productsByCategory = categories
    .map((cat) => ({
      category: cat,
      items: filteredProducts.filter((p) => p.categoryId === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, notes: "" }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  }

  function updateNotes(productId: string, notes: string) {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, notes } : i));
  }

  const cartQty = useCallback(
    (productId: string) => cart.find((i) => i.productId === productId)?.quantity ?? 0,
    [cart]
  );

  function handleSubmit() {
    setError(null);
    const payload: GuestCartItem[] = cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.price,
      notes: i.notes || undefined,
    }));

    startTransition(async () => {
      const res = await submitGuestOrder(table.id, payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.orderId) {
        router.push(`/menu/${table.id}/status/${res.orderId}`);
      }
    });
  }

  // ── Mesa fechada ─────────────────────────────────────────────────────────────

  if (table.status === "LIVRE") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Package size={28} className="text-gray-400" />
          </div>
          <h2 className="text-gray-900 font-bold text-lg">Mesa {table.number}</h2>
          <p className="text-gray-500 text-sm">Esta mesa ainda não foi aberta. Aguarde um atendente.</p>
        </div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Xico Praia" width={36} height={36} unoptimized />
            <div>
              <h1 className="font-bold text-base text-gray-900">Mesa {table.number}</h1>
              {table.customerName && (
                <p className="text-xs text-gray-500">{table.customerName}</p>
              )}
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
            Cardápio
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 mt-2 scrollbar-none">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition
              ${!categoryFilter ? "bg-orange-500 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            Tudo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition
                ${categoryFilter === cat.id ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              style={categoryFilter === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product list by category ── */}
      <div className="px-4 pt-4 space-y-6">
        {productsByCategory.length === 0 && (
          <p className="text-center text-gray-400 py-16 text-sm">Nenhum produto encontrado.</p>
        )}

        {productsByCategory.map(({ category, items }) => (
          <div key={category.id}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                {category.name}
              </h2>
            </div>

            <div className="space-y-2">
              {items.map((product) => {
                const qty = cartQty(product.id);
                return (
                  <div
                    key={product.id}
                    className={`flex gap-3 bg-white rounded-2xl p-3 border-2 transition shadow-sm
                      ${qty > 0 ? "border-orange-400" : "border-gray-100 hover:border-orange-200"}`}
                  >
                    {/* Image */}
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Package size={24} className="text-gray-300" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-orange-500 font-bold text-sm">{fmtPrice(product.price)}</span>

                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
                          >
                            <Plus size={13} /> Adicionar
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(product.id, -1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-orange-500">{qty}</span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Floating cart button ── */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-4 rounded-2xl shadow-2xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span>Ver carrinho</span>
            </div>
            <span>{fmtPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Cart drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl border-t border-gray-200 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="font-bold text-lg text-gray-900">Seu pedido</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 space-y-3 pb-2">
              {cart.map((item) => (
                <div key={item.productId} className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-orange-500 text-xs">{fmtPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={() => updateQty(item.productId, -item.quantity)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition ml-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {editingNotes === item.productId ? (
                    <input
                      autoFocus
                      value={item.notes}
                      onChange={(e) => updateNotes(item.productId, e.target.value)}
                      onBlur={() => setEditingNotes(null)}
                      placeholder="Observação (ex: sem cebola...)"
                      className="mt-2 w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingNotes(item.productId)}
                      className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      {item.notes ? `📝 ${item.notes}` : "+ Adicionar observação"}
                    </button>
                  )}

                  <p className="text-right text-xs text-gray-500 mt-1">
                    {fmtPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 space-y-3">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total</span>
                <span className="font-bold text-gray-900 text-base">{fmtPrice(cartTotal)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition text-base shadow-sm"
              >
                {isPending ? (
                  <><RefreshCw size={18} className="animate-spin" /> Enviando...</>
                ) : (
                  <><ChevronRight size={18} /> Confirmar pedido</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400">
                Seu pedido será enviado diretamente para a cozinha
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
