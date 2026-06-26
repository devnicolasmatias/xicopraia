"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Plus, Minus, Trash2,
  ShoppingCart, ChefHat, CheckCircle2, Clock,
  Send, RefreshCw, Package, DollarSign,
} from "lucide-react";
import { confirmOrder, removeOrderItem, type CartItemInput } from "@/app/actions/orders";
import { ImpressaoService } from "@/services/impressaoService";
import type { TableStatus, OrderItemStatus } from "@/generated/prisma";

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

interface OrderItemData {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: OrderItemStatus;
  product: { id: string; name: string; imageUrl: string | null };
}

interface OrderData {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItemData[];
  userName: string | null;
}

interface TableData {
  id: string;
  number: number;
  status: TableStatus;
  customerName: string | null;
  openedAt: Date | null;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

interface Props {
  table: TableData;
  products: Product[];
  categories: Category[];
  orders: OrderData[];
  userName: string;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const ITEM_STATUS_CONFIG: Record<OrderItemStatus, { label: string; icon: React.ReactNode; color: string }> = {
  PENDENTE:   { label: "Pendente",   icon: <Clock size={12} />,        color: "text-yellow-600" },
  PREPARANDO: { label: "Preparando", icon: <ChefHat size={12} />,      color: "text-orange-600" },
  PRONTO:     { label: "Pronto",     icon: <CheckCircle2 size={12} />, color: "text-green-600"  },
  ENTREGUE:   { label: "Entregue",   icon: <CheckCircle2 size={12} />, color: "text-gray-400"   },
  CANCELADO:  { label: "Cancelado",  icon: <Minus size={12} />,        color: "text-red-500"    },
};

const TABLE_STATUS_LABEL: Record<string, string> = {
  LIVRE: "Livre", OCUPADA: "Ocupada", PEDIU_CONTA: "Pediu a conta",
  RESERVADA: "Reservada", AGUARDANDO_LIMPEZA: "Aguardando limpeza",
};

// ─── Toast ─────────────────────────────────────────────────────────────────────

interface Toast { id: number; msg: string; type: "success" | "error" }

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MesaDetailClient({ table, products, categories, orders: initialOrders, userName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [tab, setTab] = useState<"cardapio" | "pedido">("cardapio");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((msg: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  useEffect(() => setOrders(initialOrders), [initialOrders]);

  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function handleRemoveItem(itemId: string) {
    if (confirmRemoveId === itemId) {
      setConfirmRemoveId(null);
      setRemovingItemId(itemId);
      startTransition(async () => {
        const res = await removeOrderItem(itemId);
        setRemovingItemId(null);
        if (res.error) {
          addToast(res.error, "error");
        } else {
          addToast("Item removido!", "success");
          router.refresh();
        }
      });
    } else {
      setConfirmRemoveId(itemId);
      setTimeout(() => setConfirmRemoveId((cur) => cur === itemId ? null : cur), 3000);
    }
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1, notes: "" }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateNotes(productId: string, notes: string) {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, notes } : i));
  }

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  async function imprimirPedidoCozinha(itens: CartItem[]) {
    const COLS = 48;
    const sep = `${"-".repeat(COLS)}\n`;
    const firstName = userName.split(" ")[0];

    const comandos: string[] = [
      "\x1B\x40",
      "\x1B\x61\x01",
      "\x1B\x21\x30",
      `MESA ${table.number}\n`,
      "\x1B\x21\x10",
      "PEDIDO COZINHA\n",
      `Garcom: ${firstName}\n`,
      `${new Date().toLocaleString("pt-BR")}\n`,
      "\x1B\x61\x00",
      sep,
      ...itens.flatMap((item) => {
        const lines: string[] = [`${item.quantity}x ${item.name}\n`];
        if (item.notes) lines.push(`  >> ${item.notes}\n`);
        return lines;
      }),
      sep,
      "\n\n\n",
      "\x1D\x56\x41\x03",
    ];

    const nomeImpressora = localStorage.getItem("qz_impressora_padrao") ?? "";

    const enfileirar = async () => {
      await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: btoa(comandos.join("")),
          descricao: `Mesa ${table.number} - Pedido Cozinha`,
        }),
      });
    };

    if (!nomeImpressora) {
      await enfileirar();
      return;
    }

    try {
      await ImpressaoService.imprimirRaw(nomeImpressora, comandos);
    } catch {
      await enfileirar();
    }
  }

  function handleConfirm() {
    if (!cart.length) return;
    const payload: CartItemInput[] = cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      notes: i.notes || undefined,
    }));

    startTransition(async () => {
      const res = await confirmOrder(table.id, payload);
      if (res.error) {
        addToast(res.error, "error");
      } else {
        const cartSnapshot = [...cart];
        setCart([]);
        setTab("pedido");
        addToast("Pedido enviado para a cozinha!", "success");
        router.refresh();
        imprimirPedidoCozinha(cartSnapshot).catch(() => {});
      }
    });
  }

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.categoryId === categoryFilter;
    return matchSearch && matchCat;
  });

  const fmtPrice = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const allLaunchedItems = orders.flatMap((o) => o.items);
  const activeLaunchedItems = allLaunchedItems.filter((i) => i.status !== "CANCELADO");
  const launchedTotal = activeLaunchedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
              ${t.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
              }`}
          >
            {t.type === "success" ? <CheckCircle2 size={15} /> : null}
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push("/dashboard/mesas")}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-none text-gray-900">Mesa {table.number}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {TABLE_STATUS_LABEL[table.status]}
            {table.customerName ? ` · ${table.customerName}` : ""}
          </p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/mesas/${table.id}/fechamento`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-600 hover:text-white hover:bg-green-600 border border-green-300 transition"
        >
          <DollarSign size={14} /> Fechar Conta
        </button>
        <button
          onClick={() => router.refresh()}
          disabled={isPending}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <RefreshCw size={15} className={isPending ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setTab("cardapio")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition border-b-2
            ${tab === "cardapio" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400"}`}
        >
          <Package size={15} /> Cardápio
        </button>
        <button
          onClick={() => setTab("pedido")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition border-b-2 relative
            ${tab === "pedido" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400"}`}
        >
          <ShoppingCart size={15} /> Pedido
          {cartCount > 0 && (
            <span className="absolute top-2 right-6 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Product Selector ══════════════════════════════════════════ */}
        <div className={`flex flex-col w-full lg:w-1/2 xl:w-3/5 overflow-y-auto bg-gray-50
          ${tab === "cardapio" ? "flex" : "hidden"} lg:flex`}
        >
          {/* Search + category filter */}
          <div className="sticky top-0 bg-gray-50 z-[5] px-4 pt-3 pb-2 space-y-2 border-b border-gray-200">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition
                  ${!categoryFilter ? "bg-orange-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700"}`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition border
                    ${categoryFilter === cat.id ? "text-white border-transparent shadow-sm" : "bg-white border-gray-200 text-gray-500 hover:text-gray-700"}`}
                  style={categoryFilter === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredProducts.length === 0 && (
              <p className="col-span-full text-center text-gray-400 py-10 text-sm">Nenhum produto encontrado.</p>
            )}
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white border-2 rounded-xl p-3 text-left transition-all hover:shadow-md relative ${inCart ? "border-orange-400" : "border-gray-200 hover:border-orange-300"}`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center z-10">
                      {inCart.quantity}
                    </span>
                  )}
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2 bg-gray-100"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg mb-2 bg-gray-100 flex items-center justify-center">
                      <Package size={24} className="text-gray-300" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-xs font-semibold text-orange-500">{fmtPrice(product.price)}</p>
                  <span
                    className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: product.category.color + "22", color: product.category.color }}
                  >
                    {product.category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ RIGHT: Cart + Launched Items ════════════════════════════════════ */}
        <div className={`flex flex-col w-full lg:w-1/2 xl:w-2/5 border-l border-gray-200 overflow-y-auto bg-white
          ${tab === "pedido" ? "flex" : "hidden"} lg:flex`}
        >

          {/* ── Itens já lançados ── */}
          {allLaunchedItems.length > 0 && (
            <div className="px-4 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Já lançado na mesa
              </p>
              <div className="space-y-1 mb-3">
                {allLaunchedItems.map((item) => {
                  const cfg = ITEM_STATUS_CONFIG[item.status];
                  const isConfirming = confirmRemoveId === item.id;
                  const isRemoving = removingItemId === item.id;
                  if (item.status === "CANCELADO") return null;
                  return (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <span className="text-gray-400 text-sm w-5 text-center">{item.quantity}×</span>
                      <span className="flex-1 text-sm text-gray-800 truncate">{item.product.name}</span>
                      {item.notes && (
                        <span className="text-xs text-gray-400 truncate max-w-[80px]">{item.notes}</span>
                      )}
                      <span className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        {fmtPrice(item.unitPrice * item.quantity)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0
                          ${isConfirming
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                          } ${isRemoving ? "opacity-40 cursor-not-allowed" : ""}`}
                        title={isConfirming ? "Clique novamente para confirmar" : "Remover item"}
                      >
                        {isRemoving ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mb-4">
                <span className="text-gray-500">Total lançado</span>
                <span className="font-semibold text-gray-900">{fmtPrice(launchedTotal)}</span>
              </div>
            </div>
          )}

          {/* ── Novo Pedido (carrinho) ── */}
          <div className="px-4 pt-2 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Novo lançamento
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 text-gray-300">
              <ShoppingCart size={36} className="mb-3 opacity-50" />
              <p className="text-sm text-gray-500">Nenhum item no carrinho.</p>
              <p className="text-xs mt-1 text-gray-400">Toque em um produto para adicionar.</p>
            </div>
          ) : (
            <div className="flex-1 px-4 space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-orange-500">{fmtPrice(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {editingNotes === item.productId ? (
                    <input
                      autoFocus
                      value={item.notes}
                      onChange={(e) => updateNotes(item.productId, e.target.value)}
                      onBlur={() => setEditingNotes(null)}
                      placeholder="Observação (ex: sem gelo, bem passado...)"
                      className="mt-2 w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingNotes(item.productId)}
                      className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      {item.notes ? `📝 ${item.notes}` : "+ Adicionar observação"}
                    </button>
                  )}

                  <p className="text-xs text-right text-gray-500 mt-1">
                    {fmtPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Footer do carrinho ── */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 space-y-3">
            {cart.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total do lançamento</span>
                <span className="font-bold text-gray-900 text-base">{fmtPrice(cartTotal)}</span>
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={isPending || cart.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm"
            >
              {isPending ? (
                <><RefreshCw size={16} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={16} /> Confirmar Pedido</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
