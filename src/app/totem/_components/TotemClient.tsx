"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, CheckCircle2, ChevronRight, CreditCard, Loader2,
  Minus, Package, Phone, Plus, QrCode, ShoppingCart, Trash2,
  Wallet, X, Gift, Banknote, AlertCircle,
} from "lucide-react";
import {
  findCustomerByPhone,
  createTotemCustomer,
  completeTotemOrder,
} from "@/app/actions/totem";
import type { PaymentMethod } from "@/generated/prisma";
import VirtualKeyboard from "./VirtualKeyboard";

// ─── Constants ────────────────────────────────────────────────────────────────

const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutes
const CONFIRM_RESET_MS = 8_000; // 8 seconds after pedido_confirmado

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | "boas_vindas"
  | "cashback_pergunta"
  | "cashback_telefone"
  | "cashback_confirmacao"
  | "cardapio"
  | "resumo_pedido"
  | "pagamento_escolha"
  | "pagamento_dinheiro"
  | "pagamento_maquineta"
  | "pagamento_pix"
  | "pagamento_recusado"
  | "pedido_confirmado";

interface Category { id: string; name: string; color: string; }
interface Product {
  id: string; name: string; description: string | null;
  price: number; imageUrl: string | null;
  categoryId: string; category: Category;
}
interface CartItem { productId: string; name: string; price: number; quantity: number; }

interface Props {
  products: Product[];
  categories: Category[];
  cashbackConfig: { percentage: number; expiryDays: number } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TotemClient({ products, categories, cashbackConfig }: Props) {
  const [screen, setScreen] = useState<Screen>("boas_vindas");
  const [isPending, startTransition] = useTransition();

  // Session state
  const [customerName, setCustomerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [cashbackApplied, setCashbackApplied] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | undefined>();
  const [orderTotal, setOrderTotal] = useState(0);
  const [cashbackEarned, setCashbackEarned] = useState(0);
  const [countdown, setCountdown] = useState(CONFIRM_RESET_MS / 1000);
  const [error, setError] = useState<string | null>(null);

  // Inactivity timer
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSession = useCallback(() => {
    setScreen("boas_vindas");
    setNameInput("");
    setCustomerName("");
    setCustomerId(undefined);
    setCashbackBalance(0);
    setCashbackApplied(false);
    setPhoneInput("");
    setCart([]);
    setPaymentMethod(undefined);
    setCategoryFilter(null);
    setOrderNumber(undefined);
    setOrderTotal(0);
    setCashbackEarned(0);
    setError(null);
  }, []);

  // Bloqueia o teclado virtual do SO — API VirtualKeyboard (Chrome 94+)
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.virtualKeyboard) {
        nav.virtualKeyboard.overlaysContent = true;
      }
    } catch { /* navegadores sem suporte ignoram */ }
  }, []);

  // Previne teclado do SO no Linux/GNOME com touchscreen:
  // intercepta qualquer foco que não seja em <input>/<textarea> e faz blur imediato.
  useEffect(() => {
    function onFocusIn(e: FocusEvent) {
      const el = e.target as HTMLElement;
      const tag = el.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA") {
        // defer para garantir que o foco já foi aplicado antes do blur
        requestAnimationFrame(() => el.blur());
      }
    }
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, []);

  const resetInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(resetSession, INACTIVITY_MS);
  }, [resetSession]);

  useEffect(() => {
    const events = ["mousedown", "touchstart", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetInactivity));
    resetInactivity();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivity));
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [resetInactivity]);

  // Auto-reset after pedido_confirmado
  useEffect(() => {
    if (screen !== "pedido_confirmado") return;
    setCountdown(CONFIRM_RESET_MS / 1000);
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timer = setTimeout(resetSession, CONFIRM_RESET_MS);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [screen, resetSession]);

  // Suporte a teclado físico na tela de telefone
  useEffect(() => {
    if (screen !== "cashback_telefone") return;
    function onKey(e: KeyboardEvent) {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "Backspace") { e.preventDefault(); setPhoneInput((v) => maskPhone(v.replace(/\D/g,"").slice(0,-1))); }
      else if (e.key === "Enter") { e.preventDefault(); handleSubmitPhone(); }
      else if (/^\d$/.test(e.key)) setPhoneInput((v) => maskPhone(v.replace(/\D/g,"") + e.key));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Auto-simulate TEF approval for card payments
  useEffect(() => {
    if (screen !== "pagamento_maquineta") return;
    const timer = setTimeout(handleConfirmPayment, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Auto-simulate PIX receipt
  useEffect(() => {
    if (screen !== "pagamento_pix") return;
    const timer = setTimeout(handleConfirmPayment, 9000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Cart helpers ─────────────────────────────────────────────────────────────

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0));
  }

  const cartQty = (productId: string) => cart.find((i) => i.productId === productId)?.quantity ?? 0;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - (cashbackApplied ? cashbackBalance : 0));
  const estimatedCashback = cashbackConfig ? Math.round((subtotal * cashbackConfig.percentage) / 100 * 100) / 100 : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleConfirmName() {
    const name = nameInput.trim();
    if (!name) return;
    setCustomerName(name);
    setScreen("cashback_pergunta");
  }

  function handlePhoneInput(val: string) {
    setPhoneInput(maskPhone(val));
  }

  function handleSubmitPhone() {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length < 10) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await findCustomerByPhone(digits);
        if (!result.found) {
          await createTotemCustomer(customerName, digits);
          setScreen("cardapio");
        } else {
          setCustomerId(result.id);
          setCashbackBalance(result.cashbackBalance);
          if (result.hasValidCashback) {
            setScreen("cashback_confirmacao");
          } else {
            setScreen("cardapio");
          }
        }
      } catch {
        setError("Ops, ocorreu um problema. Por favor, chame um atendente.");
      }
    });
  }

  function handleSelectPayment(method: PaymentMethod) {
    setPaymentMethod(method);
    if (method === "DINHEIRO") {
      setScreen("pagamento_dinheiro");
      handleConfirmPaymentWithMethod(method);
    } else if (method === "PIX") {
      setScreen("pagamento_pix");
    } else {
      setScreen("pagamento_maquineta");
    }
  }

  function handleConfirmPayment() {
    if (paymentMethod) handleConfirmPaymentWithMethod(paymentMethod);
  }

  function handleConfirmPaymentWithMethod(method: PaymentMethod) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await completeTotemOrder({
          customerName,
          customerId,
          shouldRedeemCashback: cashbackApplied,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price })),
          paymentMethod: method,
        });
        if ("error" in result) {
          setError(result.error ?? null);
          setScreen("pagamento_recusado");
          return;
        }
        setOrderNumber(result.orderNumber);
        setOrderTotal(result.total);
        setCashbackEarned(estimatedCashback);
        setScreen("pedido_confirmado");
      } catch {
        setError("Ops, ocorreu um problema. Por favor, chame um atendente.");
        setScreen("pagamento_recusado");
      }
    });
  }

  // ── Screen renderers ─────────────────────────────────────────────────────────

  function renderBoasVindas() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Xico Praia" width={56} height={56} unoptimized />
            <div>
              <p className="text-3xl font-black text-orange-500 leading-tight">Xico Praia</p>
              <p className="text-gray-500 text-base">Faça seu pedido aqui!</p>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-600">Qual é o seu nome?</p>
          <input
            type="text"
            inputMode="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Digite seu nome..."
            className="w-full max-w-2xl border-2 border-orange-400 rounded-2xl py-4 px-6 text-3xl text-center font-bold text-gray-900 bg-white shadow-inner outline-none placeholder:text-gray-300 placeholder:font-normal caret-orange-500"
          />
          <button
            onPointerDown={(e) => { e.preventDefault(); handleConfirmName(); }}
            disabled={!nameInput.trim()}
            className="w-full max-w-2xl bg-orange-500 disabled:opacity-40 text-white font-black text-2xl py-5 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            Começar <ChevronRight className="inline" size={26} />
          </button>
        </div>
        <VirtualKeyboard
          value={nameInput}
          onChange={setNameInput}
          onConfirm={handleConfirmName}
        />
      </div>
    );
  }

  function renderCashbackPergunta() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-10 px-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Gift size={48} className="text-orange-500" />
          </div>
          <h2 className="text-4xl font-black text-gray-900">Olá, {customerName}!</h2>
          <p className="text-2xl text-gray-600">Deseja acumular cashback<br />na próxima compra?</p>
          {cashbackConfig && (
            <p className="text-lg text-orange-500 font-semibold">
              Ganhe {cashbackConfig.percentage}% do valor da compra de volta!
            </p>
          )}
        </div>
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => setScreen("cashback_telefone")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl py-6 rounded-2xl transition shadow-lg"
          >
            Sim, quero cashback!
          </button>
          <button
            onClick={() => setScreen("cardapio")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xl py-5 rounded-2xl transition"
          >
            Não, obrigado
          </button>
        </div>
      </div>
    );
  }

  function renderCashbackTelefone() {
    const digits = phoneInput.replace(/\D/g, "");

    function handlePhoneKeyboard(val: string) {
      const d = val.replace(/\D/g, "").slice(0, 11);
      setPhoneInput(maskPhone(d));
    }

    return (
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 gap-6">
          <div className="text-center space-y-3">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Phone size={48} className="text-blue-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Seu número de celular</h2>
            <p className="text-xl text-gray-500">Com DDD, para identificar sua conta</p>
          </div>
          {error && (
            <p className="text-red-600 text-center text-lg bg-red-50 rounded-xl py-3 px-5">{error}</p>
          )}
          <div className="w-full max-w-sm border-2 border-blue-400 rounded-2xl py-5 px-6 text-center bg-white shadow-inner">
            {phoneInput ? (
              <span className="text-4xl font-bold text-gray-900 tracking-widest">{phoneInput}</span>
            ) : (
              <span className="text-4xl text-gray-300 tracking-widest">(83) 99999-9999</span>
            )}
          </div>
          {isPending && (
            <div className="flex items-center gap-2 text-gray-500 text-lg">
              <Loader2 size={22} className="animate-spin" /> Verificando...
            </div>
          )}
          <button onClick={() => setScreen("cashback_pergunta")} className="text-gray-400 text-lg flex items-center gap-1">
            <ArrowLeft size={18} /> Voltar
          </button>
        </div>
        <VirtualKeyboard
          value={digits}
          onChange={handlePhoneKeyboard}
          onConfirm={handleSubmitPhone}
          mode="numeric"
        />
      </div>
    );
  }

  function renderCashbackConfirmacao() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-10 px-8">
        <div className="text-center space-y-4">
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Gift size={56} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">Você tem cashback!</h2>
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl py-6 px-8">
            <p className="text-5xl font-black text-green-600">{fmtMoney(cashbackBalance)}</p>
            <p className="text-lg text-green-700 mt-1">disponível para usar</p>
          </div>
          <p className="text-xl text-gray-600">Deseja usar neste pedido?</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => { setCashbackApplied(true); setScreen("cardapio"); }}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-2xl py-6 rounded-2xl transition shadow-lg"
          >
            Sim, usar agora!
          </button>
          <button
            onClick={() => { setCashbackApplied(false); setScreen("cardapio"); }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xl py-5 rounded-2xl transition"
          >
            Guardar para depois
          </button>
        </div>
      </div>
    );
  }

  function renderCardapio() {
    const filtered = products.filter((p) => !categoryFilter || p.categoryId === categoryFilter);
    const grouped = categories
      .map((cat) => ({ cat, items: filtered.filter((p) => p.categoryId === cat.id) }))
      .filter((g) => g.items.length > 0);

    return (
      <div className="flex flex-col h-full">
        {/* Category pills */}
        <div className="flex gap-3 overflow-x-auto px-4 py-3 bg-white border-b border-gray-200 scrollbar-none shrink-0">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 px-5 py-2 rounded-full text-base font-semibold transition
              ${!categoryFilter ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Tudo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
              className={`shrink-0 px-5 py-2 rounded-full text-base font-semibold transition
                ${categoryFilter === cat.id ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={categoryFilter === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Cashback badge */}
        {cashbackApplied && (
          <div className="mx-4 mt-3 shrink-0 bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <Gift size={16} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Desconto de {fmtMoney(cashbackBalance)} será aplicado no pedido
            </span>
          </div>
        )}

        {/* Products */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-6">
          {grouped.length === 0 && (
            <p className="text-center text-gray-400 py-20 text-xl">Nenhum produto disponível.</p>
          )}
          {grouped.map(({ cat, items }) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <h2 className="font-bold text-base text-gray-700 uppercase tracking-wider">{cat.name}</h2>
              </div>
              <div className="space-y-3">
                {items.map((product) => {
                  const qty = cartQty(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`flex gap-3 bg-white rounded-2xl p-3 border-2 transition shadow-sm
                        ${qty > 0 ? "border-orange-400" : "border-gray-100"}`}
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={28} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-orange-500 font-black text-base">{fmtMoney(product.price)}</span>
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition text-sm"
                            >
                              <Plus size={16} /> Adicionar
                            </button>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateQty(product.id, -1)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                                <Minus size={16} />
                              </button>
                              <span className="text-lg font-black text-orange-500 w-6 text-center">{qty}</span>
                              <button onClick={() => updateQty(product.id, 1)} className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                                <Plus size={16} />
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

        {/* Floating cart button */}
        {cartCount > 0 && (
          <div className="absolute bottom-6 left-4 right-4">
            <button
              onClick={() => setScreen("resumo_pedido")}
              className="w-full flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-5 rounded-2xl shadow-2xl text-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={26} />
                  <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <span>Ver carrinho</span>
              </div>
              <span>{fmtMoney(total)}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderResumoPedido() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3 pb-4">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Seu pedido</h2>
          {cart.map((item) => (
            <div key={item.productId} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-base">{item.name}</p>
                <p className="text-sm text-gray-500">{fmtMoney(item.price)} × {item.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.productId, -1)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  {item.quantity === 1 ? <Trash2 size={15} className="text-red-400" /> : <Minus size={15} className="text-gray-600" />}
                </button>
                <span className="font-black text-base w-6 text-center text-gray-900">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, 1)} className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                  <Plus size={15} />
                </button>
              </div>
              <p className="font-black text-orange-500 text-base w-20 text-right">{fmtMoney(item.price * item.quantity)}</p>
            </div>
          ))}

          {/* Totals */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 mt-4">
            <div className="flex justify-between text-lg text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold">{fmtMoney(subtotal)}</span>
            </div>
            {cashbackApplied && cashbackBalance > 0 && (
              <div className="flex justify-between text-lg text-green-600">
                <span className="flex items-center gap-1"><Gift size={16} /> Cashback</span>
                <span className="font-semibold">- {fmtMoney(cashbackBalance)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between text-2xl font-black text-gray-900">
              <span>Total</span>
              <span className="text-orange-500">{fmtMoney(total)}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3 border-t border-gray-200">
          <button
            onClick={() => setScreen("pagamento_escolha")}
            disabled={cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-2xl py-6 rounded-2xl transition shadow-lg"
          >
            Confirmar pedido <ChevronRight className="inline" size={28} />
          </button>
          <button onClick={() => setScreen("cardapio")} className="w-full text-gray-500 text-lg py-2 flex items-center justify-center gap-1">
            <ArrowLeft size={18} /> Voltar ao cardápio
          </button>
        </div>
      </div>
    );
  }

  function renderPagamentoEscolha() {
    const options: { method: PaymentMethod; icon: React.ReactNode; label: string; sub: string }[] = [
      { method: "DINHEIRO", icon: <Banknote size={40} />, label: "Dinheiro", sub: "Pague no caixa" },
      { method: "CARTAO_CREDITO", icon: <CreditCard size={40} />, label: "Cartão de Crédito", sub: "Aproxime ou insira" },
      { method: "CARTAO_DEBITO", icon: <CreditCard size={40} />, label: "Cartão de Débito", sub: "Aproxime ou insira" },
      { method: "PIX", icon: <QrCode size={40} />, label: "PIX", sub: "QR Code instantâneo" },
    ];
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900">Como vai pagar?</h2>
          <p className="text-gray-500 text-lg mt-1">Total: <span className="font-black text-orange-500">{fmtMoney(total)}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {options.map(({ method, icon, label, sub }) => (
            <button
              key={method}
              onClick={() => handleSelectPayment(method)}
              className="flex flex-col items-center gap-3 bg-white border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 rounded-2xl py-8 px-4 transition shadow-sm"
            >
              <span className="text-orange-500">{icon}</span>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-base">{label}</p>
                <p className="text-gray-400 text-sm">{sub}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => setScreen("resumo_pedido")} className="text-gray-400 text-lg flex items-center gap-1">
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>
    );
  }

  function renderPagamentoDinheiro() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
          <Wallet size={56} className="text-green-500" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-gray-900">Pedido enviado!</h2>
          <p className="text-xl text-gray-600">Dirija-se ao caixa para efetuar<br />o pagamento em dinheiro.</p>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl py-4 px-6 mt-4">
            <p className="text-gray-600 text-lg">Valor a pagar</p>
            <p className="text-4xl font-black text-orange-500">{fmtMoney(total)}</p>
          </div>
        </div>
        {isPending && (
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={24} className="animate-spin" /> Registrando pedido...
          </div>
        )}
      </div>
    );
  }

  function renderPagamentoMaquineta() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
        <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center">
          <CreditCard size={56} className="text-blue-500" />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-gray-900">Aguardando pagamento</h2>
          <p className="text-xl text-gray-600">Aproxime ou insira seu cartão<br />na maquineta</p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl py-4 px-6">
            <p className="text-gray-600 text-lg">Valor</p>
            <p className="text-4xl font-black text-blue-600">{fmtMoney(total)}</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-500 text-lg">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span>Processando...</span>
          </div>
        </div>
      </div>
    );
  }

  function renderPagamentoPix() {
    const pixPayload = `00020126580014BR.GOV.BCB.PIX0136xicopraia-${Date.now()}520400005303986540${total.toFixed(2).padStart(6, "0")}5802BR5913Xico Praia 6009SAO PAULO6304ABCD`;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900">Pague com PIX</h2>
          <p className="text-xl text-gray-600 mt-1">Escaneie o QR Code com o app do seu banco</p>
        </div>
        <div className="bg-white border-4 border-gray-200 rounded-3xl p-6 shadow-xl">
          <QRCodeSVG value={pixPayload} size={220} level="M" />
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl py-3 px-6 text-center">
          <p className="text-gray-600">Valor</p>
          <p className="text-3xl font-black text-orange-500">{fmtMoney(total)}</p>
        </div>
        <div className="flex items-center gap-3 text-gray-500 text-lg">
          <Loader2 size={22} className="animate-spin text-orange-500" />
          <span>Aguardando pagamento...</span>
        </div>
      </div>
    );
  }

  function renderPagamentoRecusado() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle size={56} className="text-red-500" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-gray-900">Pagamento não aprovado</h2>
          <p className="text-xl text-gray-500">{error ?? "Não foi possível processar o pagamento."}</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => {
              if (paymentMethod) handleSelectPayment(paymentMethod);
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl py-5 rounded-2xl transition"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => setScreen("pagamento_escolha")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xl py-5 rounded-2xl transition"
          >
            Escolher outra forma
          </button>
        </div>
      </div>
    );
  }

  function renderPedidoConfirmado() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-gray-900">Pedido realizado!</h2>
          {orderNumber && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl py-4 px-8">
              <p className="text-gray-600 text-lg">Número do pedido</p>
              <p className="text-6xl font-black text-orange-500">#{orderNumber}</p>
            </div>
          )}
          <p className="text-xl text-gray-600">
            Total pago: <span className="font-black text-gray-900">{fmtMoney(orderTotal)}</span>
          </p>
          {cashbackEarned > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl py-4 px-6 flex items-center gap-3">
              <Gift size={28} className="text-green-500 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-green-800">Você ganhou cashback!</p>
                <p className="text-green-600 text-lg">{fmtMoney(cashbackEarned)} para a próxima compra</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-gray-400 text-base">Voltando ao início em {countdown}s...</p>
      </div>
    );
  }

  // ── Screen router ─────────────────────────────────────────────────────────────

  function renderScreen() {
    switch (screen) {
      case "boas_vindas": return renderBoasVindas();
      case "cashback_pergunta": return renderCashbackPergunta();
      case "cashback_telefone": return renderCashbackTelefone();
      case "cashback_confirmacao": return renderCashbackConfirmacao();
      case "cardapio": return renderCardapio();
      case "resumo_pedido": return renderResumoPedido();
      case "pagamento_escolha": return renderPagamentoEscolha();
      case "pagamento_dinheiro": return renderPagamentoDinheiro();
      case "pagamento_maquineta": return renderPagamentoMaquineta();
      case "pagamento_pix": return renderPagamentoPix();
      case "pagamento_recusado": return renderPagamentoRecusado();
      case "pedido_confirmado": return renderPedidoConfirmado();
    }
  }

  const showBackButton = ["cashback_pergunta", "cashback_telefone"].includes(screen);

  return (
    <div className="flex flex-col bg-gray-50 w-screen overflow-hidden" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="bg-orange-500 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Xico Praia" width={52} height={52} unoptimized />
          <div>
            <p className="text-white font-black text-2xl leading-tight">Xico Praia</p>
            <p className="text-orange-100 text-sm">Autoatendimento</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {customerName && screen !== "boas_vindas" && (
            <span className="text-orange-100 text-lg font-medium">
              Olá, {customerName.split(" ")[0]}!
            </span>
          )}
          {cashbackApplied && (
            <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
              <Gift size={16} /> Cashback
            </div>
          )}
          {screen !== "boas_vindas" && (
            <button
              onClick={resetSession}
              className="w-12 h-12 bg-orange-600 hover:bg-orange-700 rounded-full flex items-center justify-center transition"
              title="Cancelar e recomeçar"
            >
              <X size={22} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Screen content — min-h-0 permite que o flex-1 respeite a altura do container pai */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {renderScreen()}
      </div>
    </div>
  );
}
