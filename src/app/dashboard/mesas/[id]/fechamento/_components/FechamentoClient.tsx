"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, CheckCircle2, CreditCard,
  Banknote, Smartphone, Receipt, Users, Percent, Tag,
  RefreshCw, FileText, ExternalLink,
} from "lucide-react";
import { closeOrder } from "@/app/actions/checkout";
import { ImpressaoService } from "@/services/impressaoService";
import { emitirNfceParaTransacao } from "@/app/actions/fiscal";
import type { PaymentMethod, OrderItemStatus } from "@/generated/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItemData {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: OrderItemStatus;
  product: { id: string; name: string };
}

interface OrderData {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItemData[];
}

interface TableData {
  id: string;
  number: number;
  customerName: string | null;
  openedAt: string | null;
}

interface Props {
  table: TableData;
  orders: OrderData[];
}

// ─── Payment methods config ────────────────────────────────────────────────────

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "DINHEIRO",       label: "Dinheiro",        icon: <Banknote size={18} /> },
  { value: "PIX",            label: "PIX",             icon: <Smartphone size={18} /> },
  { value: "CARTAO_DEBITO",  label: "Débito",          icon: <CreditCard size={18} /> },
  { value: "CARTAO_CREDITO", label: "Crédito",         icon: <CreditCard size={18} /> },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function FechamentoClient({ table, orders }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const allItems = orders.flatMap((o) =>
    o.items.filter((i) => i.status !== "CANCELADO")
  );

  const subtotal = allItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [serviceFeePercent, setServiceFeePercent] = useState(10);
  const [discountType, setDiscountType] = useState<"percent" | "value">("percent");
  const [discountInput, setDiscountInput] = useState("0");
  const [splitCount, setSplitCount] = useState(1);
  const [imprimindo, setImprimindo] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nfceState, setNfceState] = useState<
    { status: "idle" } |
    { status: "loading" } |
    { status: "ok"; nfceId: string; chave: string } |
    { status: "error"; msg: string }
  >({ status: "idle" });

  const discountAmount =
    discountType === "percent"
      ? subtotal * (parseFloat(discountInput || "0") / 100)
      : parseFloat(discountInput || "0");

  const serviceFee = subtotal * (serviceFeePercent / 100);
  const total = Math.max(0, subtotal + serviceFee - discountAmount);
  const perPerson = splitCount > 1 ? total / splitCount : null;

  const fmtPrice = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  async function handlePrint() {
    // Lê a impressora local — pode ser null em celulares (sem QZ Tray)
    const nomeImpressora = localStorage.getItem("qz_impressora_padrao") ?? "";

    const COLS = 48;
    const separador = `${"-".repeat(COLS)}\n`;

    const padLine = (esq: string, dir: string): string => {
      const maxEsq = COLS - dir.length - 1;
      const esqTrunc = esq.length > maxEsq ? esq.slice(0, maxEsq - 1) + "." : esq;
      return esqTrunc + " ".repeat(COLS - esqTrunc.length - dir.length) + dir + "\n";
    };

    const labelPagamento = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod;

    const comandos: string[] = [
      "\x1B\x40",                   // inicializar impressora
      "\x1B\x61\x01",               // centralizar
      "\x1B\x45\x01",               // negrito on
      "COMPROVANTE\n",
      "\x1B\x45\x00",               // negrito off
      `Mesa ${table.number}${table.customerName ? ` - ${table.customerName}` : ""}\n`,
      `${new Date().toLocaleString("pt-BR")}\n`,
      "\x1B\x61\x00",               // alinhar esquerda
      separador,
      ...allItems.map((item) =>
        padLine(`${item.quantity}x ${item.product.name}`, fmtPrice(item.unitPrice * item.quantity))
      ),
      separador,
      padLine("Subtotal", fmtPrice(subtotal)),
      ...(serviceFee > 0
        ? [padLine(`Taxa servico (${serviceFeePercent}%)`, fmtPrice(serviceFee))]
        : []),
      ...(discountAmount > 0
        ? [padLine("Desconto", `- ${fmtPrice(discountAmount)}`)]
        : []),
      separador,
      "\x1B\x45\x01",               // negrito on
      padLine("TOTAL", fmtPrice(total)),
      "\x1B\x45\x00",               // negrito off
      ...(splitCount > 1
        ? [padLine(`${splitCount}x por pessoa`, fmtPrice(total / splitCount))]
        : []),
      "\n",
      `Pagamento: ${labelPagamento}\n`,
      "\n",
      "\x1B\x61\x01",               // centralizar
      "Obrigado pela preferencia!\n",
      "\x0A\x0A\x0A",               // avancar papel
      "\x1B\x6D",                   // guilhotina
    ];

    const enfileirar = async () => {
      const res = await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: btoa(comandos.join("")),
          descricao: `Mesa ${table.number} - Fechamento`,
        }),
      });
      if (!res.ok) throw new Error();
    };

    setImprimindo(true);
    try {
      // Sem impressora configurada → fila imediata, sem tentar QZ Tray
      if (!nomeImpressora) {
        await enfileirar();
        return;
      }
      await ImpressaoService.imprimirRaw(nomeImpressora, comandos);
    } catch {
      try {
        await enfileirar();
      } catch {
        console.error("[FechamentoClient] Falha ao enfileirar job de impressão.");
        setError("Sem impressora disponível e não foi possível enfileirar o comprovante.");
      }
    } finally {
      setImprimindo(false);
    }
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await closeOrder({
        tableId: table.id,
        paymentMethod,
        serviceFeePercent,
        discountAmount,
        splitCount,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setConfirmed(true);
        if ("transactionId" in res && res.transactionId) {
          setTransactionId(res.transactionId as string);
        }
      }
    });
  }

  function handleEmitirNfce() {
    if (!transactionId) return;
    setNfceState({ status: "loading" });
    startTransition(async () => {
      const res = await emitirNfceParaTransacao(transactionId);
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
        setNfceState({ status: "error", msg: res.xMotivo ?? "Erro desconhecido na SEFAZ." });
      }
    });
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Pagamento Confirmado!</h2>
            <p className="text-gray-500 text-sm">Mesa {table.number} liberada com sucesso.</p>
          </div>

          {/* NFC-e */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-orange-500" />
              <span className="text-sm font-semibold text-gray-900">Nota Fiscal (NFC-e)</span>
            </div>

            {nfceState.status === "idle" && transactionId && (
              <button
                onClick={handleEmitirNfce}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-xl transition shadow-sm"
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
                  onClick={() => window.open(`/admin/nfce/${nfceState.status === "ok" ? (nfceState as {nfceId:string}).nfceId : ""}`, "_blank")}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-xl transition"
                >
                  <ExternalLink size={13} /> Abrir DANFCE
                </button>
              </div>
            )}

            {nfceState.status === "error" && (
              <div className="space-y-2">
                <p className="text-sm text-red-600">{nfceState.msg}</p>
                <button
                  onClick={handleEmitirNfce}
                  className="text-xs text-gray-400 hover:text-gray-700 transition"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!transactionId && nfceState.status === "idle" && (
              <p className="text-xs text-gray-400">ID da transação não disponível.</p>
            )}
          </div>

          <button
            onClick={() => router.push("/dashboard/mesas")}
            className="w-full text-gray-400 hover:text-gray-700 text-sm py-2 transition"
          >
            Voltar ao mapa de mesas
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base leading-none text-gray-900">Fechar Conta — Mesa {table.number}</h1>
            {table.customerName && (
              <p className="text-xs text-gray-500 mt-0.5">{table.customerName}</p>
            )}
          </div>
          <button
            onClick={handlePrint}
            disabled={imprimindo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {imprimindo
              ? <><RefreshCw size={15} className="animate-spin" /> Imprimindo...</>
              : <><Printer size={15} /> Imprimir</>
            }
          </button>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

          {/* ── Resumo de itens ── */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Receipt size={15} className="text-orange-500" />
              <h2 className="font-semibold text-sm text-gray-900">Itens Consumidos</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {allItems.length === 0 && (
                <p className="text-center text-gray-400 py-6 text-sm">Nenhum item lançado.</p>
              )}
              {allItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-gray-400 text-sm w-6 text-right">{item.quantity}×</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.product.name}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-400 truncate">{item.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{fmtPrice(item.unitPrice)}</span>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {fmtPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex justify-between text-sm bg-gray-50">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{fmtPrice(subtotal)}</span>
            </div>
          </section>

          {/* ── Taxa e Desconto ── */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Percent size={15} className="text-orange-500" />
              <h2 className="font-semibold text-sm text-gray-900">Taxa e Desconto</h2>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Taxa de serviço */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Taxa de Serviço</p>
                  <p className="text-xs text-gray-400">Opcional — padrão 10%</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 10, 12, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setServiceFeePercent(pct)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition
                        ${serviceFeePercent === pct
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Desconto */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={13} className="text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">Desconto</p>
                  <div className="ml-auto flex rounded-lg overflow-hidden border border-gray-200">
                    <button
                      onClick={() => setDiscountType("percent")}
                      className={`px-3 py-1 text-xs transition ${discountType === "percent" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-400 hover:text-gray-700"}`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setDiscountType("value")}
                      className={`px-3 py-1 text-xs transition ${discountType === "value" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-400 hover:text-gray-700"}`}
                    >
                      R$
                    </button>
                  </div>
                </div>
                <div className="relative">
                  {discountType === "value" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  )}
                  <input
                    type="number"
                    min="0"
                    step={discountType === "percent" ? "1" : "0.01"}
                    max={discountType === "percent" ? "100" : undefined}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className={`w-full bg-gray-50 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                      ${discountType === "value" ? "pl-9 pr-3" : "px-3"}`}
                  />
                  {discountType === "percent" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Totalizador */}
            <div className="px-4 pb-4 space-y-1.5 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Taxa de serviço ({serviceFeePercent}%)</span>
                  <span>+ {fmtPrice(serviceFee)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>- {fmtPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="text-orange-500">{fmtPrice(total)}</span>
              </div>
            </div>
          </section>

          {/* ── Divisão de conta ── */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-orange-500" />
              <h2 className="font-semibold text-sm text-gray-900">Dividir Conta</h2>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSplitCount((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition font-bold text-lg"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-gray-900">{splitCount}</p>
                  <p className="text-xs text-gray-400">{splitCount === 1 ? "pessoa" : "pessoas"}</p>
                </div>
                <button
                  onClick={() => setSplitCount((p) => p + 1)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition font-bold text-lg"
                >
                  +
                </button>
              </div>
              {perPerson !== null && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-orange-600 mb-1">Cada pessoa paga</p>
                  <p className="text-2xl font-bold text-orange-500">{fmtPrice(perPerson)}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Método de pagamento ── */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <CreditCard size={15} className="text-orange-500" />
              <h2 className="font-semibold text-sm text-gray-900">Método de Pagamento</h2>
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition font-medium text-sm
                    ${paymentMethod === value
                      ? "bg-orange-50 border-orange-400 text-orange-600"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Erro ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── Confirmar ── */}
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition shadow-sm"
          >
            {isPending ? (
              <><RefreshCw size={18} className="animate-spin" /> Processando...</>
            ) : (
              <><CheckCircle2 size={18} /> Confirmar Pagamento · {fmtPrice(total)}</>
            )}
          </button>

          <div className="pb-8" />
        </div>
      </div>

    </>
  );
}
