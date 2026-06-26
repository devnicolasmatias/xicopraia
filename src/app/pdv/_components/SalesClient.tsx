"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  CheckCircle2, AlertCircle, Loader2, UserCircle, Gift, X, ArrowLeft,
  FileText, RefreshCw, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { completePdvSale } from "@/app/actions/pdv";
import { emitirNfceParaTransacao } from "@/app/actions/fiscal";
import { ImpressaoService } from "@/services/impressaoService";
import type { PaymentMethod } from "@/generated/prisma";
import { SELF_SERVICE_PRODUCT_NAME } from "@/lib/pdvConstants";
import CustomerSelectorModal, { type SelectedCustomer } from "./CustomerSelectorModal";

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

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  displayQty?: string;
  notes?: string;
}

export interface RecentSaleRow {
  id: string;
  createdAt: string;
  total: number;
  paymentMethod: PaymentMethod;
  itemsCount: number;
}

interface Props {
  operatorName: string;
  operatorRole: string;
  products: Product[];
  categories: Category[];
  recentSales: RecentSaleRow[];
}

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function isSelfServiceProduct(product: Product) {
  return product.name.trim().toLowerCase() === SELF_SERVICE_PRODUCT_NAME.toLowerCase();
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_DEBITO", label: "Cartão débito" },
  { value: "CARTAO_CREDITO", label: "Cartão crédito" },
];

function paymentLabel(method: PaymentMethod) {
  return PAYMENT_OPTIONS.find((o) => o.value === method)?.label ?? method;
}

export default function SalesClient({
  operatorName,
  operatorRole,
  products,
  categories,
  recentSales,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selfServiceKgByProduct, setSelfServiceKgByProduct] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DINHEIRO");
  const [discountRaw, setDiscountRaw] = useState("");
  const [cashPaidRaw, setCashPaidRaw] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [nfceState, setNfceState] = useState<
    { status: "idle" } |
    { status: "loading" } |
    { status: "ok"; nfceId: string; chave: string } |
    { status: "error"; msg: string; cStat?: number }
  >({ status: "idle" });

  // Customer state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerModalMandatory, setCustomerModalMandatory] = useState(false);
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null);
  const [usesCashback, setUsesCashback] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  const discountPercent = useMemo(() => {
    const n = parseFloat(discountRaw.replace(",", "."));
    return Number.isFinite(n) && n > 0 && n <= 100 ? n : 0;
  }, [discountRaw]);

  const discountAmount = useMemo(() => {
    return subtotal > 0 ? Number(((subtotal * discountPercent) / 100).toFixed(2)) : 0;
  }, [subtotal, discountPercent]);

  const cashbackDiscount = customer?.hasValidCashback && usesCashback
    ? customer.cashbackBalance
    : 0;

  const total = Math.max(0, subtotal - discountAmount - cashbackDiscount);

  const cashPaid = useMemo(() => {
    const n = parseFloat(cashPaidRaw.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [cashPaidRaw]);
  const troco = cashPaid > 0 ? cashPaid - total : 0;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 }];
    });
  }

  function addSelfServiceToCart(product: Product) {
    const rawKg = (selfServiceKgByProduct[product.id] ?? "").replace(",", ".");
    const kg = parseFloat(rawKg);
    if (!Number.isFinite(kg) || kg <= 0) {
      setErrorMessage("Informe um peso válido para o self-service (kg).");
      return;
    }

    const pricePerKg = product.price;
    const totalPrice = Number((kg * pricePerKg).toFixed(2));
    const labelKg = `${kg.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;

    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        unitPrice: totalPrice,
        quantity: 1,
        displayQty: labelKg,
        notes: `Peso: ${labelKg} (R$ ${pricePerKg.toFixed(2).replace(".", ",")}/kg)`,
      },
    ]);
    setErrorMessage(null);
    setSelfServiceKgByProduct((prev) => ({ ...prev, [product.id]: "" }));
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(indexToRemove: number) {
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function getQty(productId: string) {
    return cart.find((item) => item.productId === productId)?.quantity ?? 0;
  }

  function handleSelectCustomer(c: SelectedCustomer) {
    setCustomer(c);
    setShowCustomerModal(false);
    setUsesCashback(false);
    if (customerModalMandatory) {
      setCustomerModalMandatory(false);
      finalizeSale(c);
    }
  }

  async function imprimirRecibo(
    itens: CartItem[],
    totalVenda: number,
    metodo: PaymentMethod,
    desconto: number,
    valorPago: number,
    trocoValor: number,
  ) {
    const COLS = 48;
    const sep = `${"-".repeat(COLS)}\n`;
    const padLine = (esq: string, dir: string) => {
      const maxEsq = COLS - dir.length - 1;
      const esqTrunc = esq.length > maxEsq ? esq.slice(0, maxEsq - 1) + "." : esq;
      return esqTrunc + " ".repeat(COLS - esqTrunc.length - dir.length) + dir + "\n";
    };
    const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
    const labelMetodo = PAYMENT_OPTIONS.find((o) => o.value === metodo)?.label ?? metodo;

    const comandos: string[] = [
      "\x1B\x40",
      "\x1B\x21\x10",
      "\x1B\x61\x01",
      "\x1B\x21\x30", "COMPROVANTE PDV\n", "\x1B\x21\x10",
      `${new Date().toLocaleString("pt-BR")}\n`,
      "\x1B\x61\x00",
      sep,
      ...itens.map((item) =>
        padLine(
          `${item.displayQty ?? `${item.quantity}x`} ${item.name}`,
          fmt(item.unitPrice * item.quantity),
        )
      ),
      sep,
      ...(desconto > 0 ? [padLine(`Desconto (${discountPercent}%)`, `- ${fmt(desconto)}`)] : []),
      "\x1B\x21\x30",
      padLine("TOTAL", fmt(totalVenda)),
      "\x1B\x21\x10",
      `Pagamento: ${labelMetodo}\n`,
      ...(metodo === "DINHEIRO" && valorPago > 0
        ? [padLine("Recebido", fmt(valorPago)), padLine("Troco", fmt(trocoValor))]
        : []),
      "\n",
      "\x1B\x61\x01", "Obrigado pela preferencia!\n",
      "\x0A\x0A\x0A",
      "\x1D\x56\x41\x03",
    ];

    const nomeImpressora = localStorage.getItem("qz_impressora_padrao") ?? "";
    const enfileirar = async () => {
      const res = await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: btoa(comandos.join("")), descricao: "PDV - Venda" }),
      });
      if (res.ok) {
        setSuccessMessage((prev) => (prev ? prev + " · Comprovante na fila de impressão." : "Comprovante enviado para a fila de impressão."));
      } else {
        setErrorMessage("Não foi possível enfileirar o comprovante.");
      }
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

  function handleEmitirNfce() {
    if (!lastTransactionId) return;
    setNfceState({ status: "loading" });
    startTransition(async () => {
      const res = await emitirNfceParaTransacao(lastTransactionId);
      if ("error" in res && res.error) {
        setNfceState({ status: "error", msg: res.error });
      } else if (res.success && res.nfceId) {
        setNfceState({ status: "ok", nfceId: res.nfceId!, chave: res.chave! });
        if (localStorage.getItem("nfce_auto_download_xml") === "true") {
          const a = document.createElement("a");
          a.href = `/api/nfce/${res.nfceId}/xml`;
          a.download = "";
          a.click();
        }
      } else {
        setNfceState({ status: "error", msg: res.xMotivo ?? "Erro desconhecido na SEFAZ.", cStat: res.cStat });
      }
    });
  }

  function finalizeSale(customerOverride?: SelectedCustomer) {
    if (!cart.length) return;

    const resolvedCustomer = customerOverride ?? customer;
    if (!resolvedCustomer) {
      setCustomerModalMandatory(true);
      setShowCustomerModal(true);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLastTransactionId(null);
    setNfceState({ status: "idle" });

    const items = cart.map((row) => ({
      productId: row.productId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      notes: row.notes,
    }));

    startTransition(async () => {
      const res = await completePdvSale({
        items,
        paymentMethod,
        discountAmount,
        customerId: resolvedCustomer?.id,
        redeemCashback: usesCashback,
      });

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      // Imprime antes de limpar o carrinho (dados ainda disponíveis no closure)
      imprimirRecibo(cart, res.total ?? total, paymentMethod, discountAmount, cashPaid, troco).catch(() => {});

      setCart([]);
      setDiscountRaw("");
      setCashPaidRaw("");
      setCustomer(null);
      setUsesCashback(false);
      if (res.transactionId) setLastTransactionId(res.transactionId);
      const totalLabel = money(res.total ?? total);
      const cashbackNote = customer
        ? ` · Cashback gerado!`
        : "";
      setSuccessMessage(`Venda concluída: ${totalLabel} · ${paymentLabel(paymentMethod)}${cashbackNote}`);
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    });
  }

  return (
    <div className="text-gray-900 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <header className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Nova venda</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Operador: <span className="text-orange-600 font-medium">{operatorName}</span> ({operatorRole})
                </p>
              </div>
            </div>

            {/* Customer button */}
            <div className="flex items-center gap-2">
              {customer ? (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <UserCircle size={18} className="text-orange-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                    {customer.hasValidCashback && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Gift size={11} /> {money(customer.cashbackBalance)} disponível
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setCustomer(null); setUsesCashback(false); }}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="flex items-center gap-2 text-sm font-medium border border-gray-200 hover:border-orange-300 hover:text-orange-600 text-gray-600 px-3 py-2 rounded-xl transition"
                >
                  <UserCircle size={16} />
                  <span className="hidden sm:inline">Associar cliente</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {errorMessage}
          </div>
        )}

        {lastTransactionId && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-orange-500" />
              <span className="text-sm font-semibold text-gray-900">Nota Fiscal (NFC-e)</span>
            </div>

            {nfceState.status === "idle" && (
              <button
                onClick={handleEmitirNfce}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition shadow-sm"
              >
                <FileText size={14} /> Emitir NFC-e
              </button>
            )}

            {nfceState.status === "loading" && (
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-2">
                <RefreshCw size={14} className="animate-spin" /> Comunicando com SEFAZ...
              </div>
            )}

            {nfceState.status === "ok" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 size={14} /> NFC-e autorizada!
                </div>
                <p className="text-xs text-gray-400 font-mono break-all">{nfceState.chave}</p>
                <button
                  onClick={() => window.open(`/admin/nfce/${(nfceState as { status: "ok"; nfceId: string }).nfceId}`, "_blank")}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-xl transition"
                >
                  <ExternalLink size={13} /> Abrir DANFCE
                </button>
              </div>
            )}

            {nfceState.status === "error" && (
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1.5">
                  {nfceState.cStat && (
                    <p className="text-xs font-mono font-semibold text-red-500">cStat {nfceState.cStat}</p>
                  )}
                  <p className="text-sm text-red-700 break-all whitespace-pre-wrap">{nfceState.msg}</p>
                </div>
                <button
                  onClick={handleEmitirNfce}
                  className="text-xs text-gray-400 hover:text-gray-700 transition"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <section className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    !categoryFilter ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryFilter((prev) => (prev === category.id ? null : category.id))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      categoryFilter === category.id ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    style={categoryFilter === category.id ? { backgroundColor: category.color } : {}}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[min(70vh,720px)] overflow-y-auto">
              {filteredProducts.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full py-8 text-center">Nenhum produto encontrado.</p>
              )}

              {filteredProducts.map((product) => {
                const qty = getQty(product.id);
                const isSelfService = isSelfServiceProduct(product);
                const selfServiceKg = selfServiceKgByProduct[product.id] ?? "";
                return (
                  <article key={product.id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-orange-600 font-semibold text-sm shrink-0">
                        {isSelfService ? `${money(product.price)} / kg` : money(product.price)}
                      </span>
                      {isSelfService ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            value={selfServiceKg}
                            onChange={(event) =>
                              setSelfServiceKgByProduct((prev) => ({ ...prev, [product.id]: event.target.value }))
                            }
                            placeholder="kg"
                            inputMode="decimal"
                            className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => addSelfServiceToCart(product)}
                            className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            <Plus size={12} /> Lançar
                          </button>
                        </div>
                      ) : qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <Plus size={12} /> Adicionar
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-4 text-center text-sm font-semibold">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShoppingCart size={16} />
                Carrinho
              </h3>

              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {cart.length === 0 && (
                  <p className="text-sm text-gray-400 py-6 text-center">Adicione produtos para vender.</p>
                )}

                {cart.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="border border-gray-200 rounded-xl p-2.5">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {money(item.unitPrice)}
                          {item.displayQty ? ` · ${item.displayQty}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="text-gray-400 hover:text-red-500 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {item.displayQty ? (
                      <p className="mt-2 text-xs text-gray-400">Item por peso lançado diretamente no valor final.</p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, -1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, 1)}
                          className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 space-y-3">
                <div>
                  <label htmlFor="pdv-payment" className="text-xs font-medium text-gray-500 block mb-1">
                    Forma de pagamento
                  </label>
                  <select
                    id="pdv-payment"
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as PaymentMethod);
                      setCashPaidRaw("");
                    }}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {PAYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {paymentMethod === "DINHEIRO" && (
                  <div>
                    <label htmlFor="pdv-cash-paid" className="text-xs font-medium text-gray-500 block mb-1">
                      Valor recebido (R$)
                    </label>
                    <input
                      id="pdv-cash-paid"
                      inputMode="decimal"
                      value={cashPaidRaw}
                      onChange={(e) => setCashPaidRaw(e.target.value)}
                      placeholder="0,00"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {cashPaid > 0 && cashPaid < total && (
                      <p className="text-xs text-red-500 mt-1">Valor insuficiente</p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="pdv-discount" className="text-xs font-medium text-gray-500 block mb-1">
                    Desconto (%)
                  </label>
                  <div className="relative">
                    <input
                      id="pdv-discount"
                      inputMode="decimal"
                      value={discountRaw}
                      onChange={(e) => setDiscountRaw(e.target.value)}
                      placeholder="0"
                      max={100}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                </div>

                {/* Cashback redemption */}
                {customer?.hasValidCashback && (
                  <label className="flex items-center gap-2.5 cursor-pointer bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={usesCashback}
                      onChange={(e) => setUsesCashback(e.target.checked)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                        <Gift size={13} /> Usar cashback
                      </p>
                      <p className="text-xs text-green-600">
                        Desconto de {money(customer.cashbackBalance)}
                      </p>
                    </div>
                  </label>
                )}

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Itens</span><span>{cartQty}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span><span>{money(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Desconto ({discountPercent}%)</span><span>− {money(discountAmount)}</span>
                  </div>
                )}
                {cashbackDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Cashback</span><span>− {money(cashbackDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-orange-600">{money(total)}</span>
                </div>
                {paymentMethod === "DINHEIRO" && troco > 0 && (
                  <div className="flex justify-between text-sm font-bold bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <span className="text-green-700">Troco</span>
                    <span className="text-green-700">{money(troco)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => finalizeSale()}
                  disabled={!cart.length || isPending}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition"
                >
                  {isPending ? (
                    <><Loader2 size={16} className="animate-spin" /> Finalizando…</>
                  ) : (
                    "Finalizar venda"
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-2">Últimas vendas (balcão)</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {recentSales.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">Nenhuma venda registrada ainda.</p>
                )}
                {recentSales.map((sale) => (
                  <div key={sale.id} className="border border-gray-200 rounded-xl p-2.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">{sale.itemsCount} item(ns)</span>
                      <span className="font-semibold text-orange-600 shrink-0">{money(sale.total)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(sale.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs text-gray-600">{paymentLabel(sale.paymentMethod)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showCustomerModal && (
        <CustomerSelectorModal
          onSelect={handleSelectCustomer}
          mandatory={customerModalMandatory}
          onClose={() => {
            if (customerModalMandatory) return;
            setShowCustomerModal(false);
          }}
        />
      )}
    </div>
  );
}
