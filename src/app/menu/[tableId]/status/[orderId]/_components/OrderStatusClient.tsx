"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, ChefHat, CheckCircle2, ArrowLeft, RefreshCw, Plus,
} from "lucide-react";
import { getGuestOrderStatus } from "@/app/actions/guestOrders";
import type { OrderItemStatus } from "@/generated/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  status: OrderItemStatus;
  product: { id: string; name: string };
}

interface OrderData {
  id: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  tableId: string;
  order: OrderData;
}

// ─── Status config ────────────────────────────────────────────────────────────

const ITEM_STATUS: Record<OrderItemStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  PENDENTE:   { label: "Aguardando",   icon: <Clock size={14} />,        color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  PREPARANDO: { label: "Preparando",   icon: <ChefHat size={14} />,      color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  PRONTO:     { label: "Pronto!",      icon: <CheckCircle2 size={14} />, color: "text-green-700",  bg: "bg-green-50 border-green-200"  },
  ENTREGUE:   { label: "Entregue",     icon: <CheckCircle2 size={14} />, color: "text-gray-500",   bg: "bg-gray-50 border-gray-200"    },
  CANCELADO:  { label: "Cancelado",    icon: <Clock size={14} />,        color: "text-red-600",    bg: "bg-red-50 border-red-200"      },
};

const POLL_INTERVAL = 8000;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderStatusClient({ tableId, order: initial }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [polling, setPolling] = useState(true);

  const allDone = order.items.every((i) => i.status === "PRONTO" || i.status === "ENTREGUE");
  const anyPreparing = order.items.some((i) => i.status === "PREPARANDO");
  const overallLabel = allDone
    ? "Tudo pronto! 🎉"
    : anyPreparing
    ? "Em preparo na cozinha"
    : "Pedido recebido";

  const overallColor = allDone
    ? "text-green-700"
    : anyPreparing
    ? "text-orange-700"
    : "text-yellow-700";

  const overallBg = allDone
    ? "bg-green-50 border-green-200"
    : anyPreparing
    ? "bg-orange-50 border-orange-200"
    : "bg-yellow-50 border-yellow-200";

  async function refresh() {
    const fresh = await getGuestOrderStatus(order.id);
    if (fresh) setOrder(fresh as OrderData);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    if (!polling || allDone) return;
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [polling, allDone, order.id]);

  const timeLabel = lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push(`/menu/${tableId}`)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex-1 font-bold text-base text-gray-900">Acompanhe seu pedido</h1>
        <button
          onClick={refresh}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Overall status banner */}
        <div className={`rounded-2xl border-2 px-5 py-4 text-center space-y-1 shadow-sm ${overallBg}`}>
          <p className={`text-xl font-bold ${overallColor}`}>{overallLabel}</p>
          <p className="text-xs text-gray-500">Atualizado às {timeLabel}</p>
          {!allDone && (
            <p className="text-xs text-gray-400 mt-1">
              Atualizando automaticamente a cada {POLL_INTERVAL / 1000}s
            </p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Itens do pedido
          </h2>
          {order.items.map((item) => {
            const cfg = ITEM_STATUS[item.status] ?? ITEM_STATUS.PENDENTE;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${cfg.bg} transition shadow-sm`}
              >
                <span className="text-gray-400 text-sm w-6 text-right shrink-0">{item.quantity}×</span>
                <p className="flex-1 text-sm font-medium text-gray-900">{item.product.name}</p>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress steps */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Progresso</h2>
          <div className="space-y-4">
            {[
              { label: "Pedido enviado", done: true, icon: <CheckCircle2 size={16} /> },
              { label: "Recebido na cozinha", done: true, icon: <CheckCircle2 size={16} /> },
              { label: "Em preparo", done: anyPreparing || allDone, icon: <ChefHat size={16} /> },
              { label: "Pronto para servir", done: allDone, icon: <CheckCircle2 size={16} /> },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition
                  ${step.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {step.icon}
                </div>
                <span className={`text-sm transition ${step.done ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => router.push(`/menu/${tableId}`)}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-3.5 rounded-2xl transition text-sm shadow-sm"
        >
          <Plus size={16} /> Adicionar mais itens
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Em caso de dúvidas, chame um atendente.
        </p>
      </div>
    </div>
  );
}
