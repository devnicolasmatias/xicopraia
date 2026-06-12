"use client";

import { useTransition } from "react";
import { ChefHat, CheckCircle2, Clock, AlertTriangle, Zap } from "lucide-react";
import { updateItemStatus, markOrderReady } from "@/app/actions/kitchen";
import type { OrderItemStatus } from "@/generated/prisma";

interface KitchenItem {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: OrderItemStatus;
  createdAt: Date;
  product: { id: string; name: string };
}

interface KitchenOrder {
  id: string;
  createdAt: Date;
  table: { id: string; number: number };
  items: KitchenItem[];
}

interface Props {
  order: KitchenOrder;
  onActionDone?: () => void;
}

function elapsedLabel(since: Date): string {
  const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function elapsedMinutes(since: Date): number {
  return Math.floor((Date.now() - new Date(since).getTime()) / 60000);
}

export default function OrderCard({ order, onActionDone }: Props) {
  const [isPending, startTransition] = useTransition();

  const elapsed = elapsedMinutes(order.createdAt);
  const isUrgent = elapsed >= 15;
  const isExtreme = elapsed >= 25;

  const allPrepping = order.items.every((i) => i.status === "PREPARANDO");

  function handleItemStatus(itemId: string, status: OrderItemStatus) {
    startTransition(async () => {
      await updateItemStatus(itemId, status);
      onActionDone?.();
    });
  }

  function handleMarkAllReady() {
    startTransition(async () => {
      await markOrderReady(order.id);
      onActionDone?.();
    });
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border-2 overflow-hidden transition-all shadow-sm
        ${isExtreme
          ? "border-orange-400 shadow-orange-100 animate-pulse bg-white"
          : isUrgent
          ? "border-orange-300 shadow-orange-50 bg-white"
          : "border-gray-200 bg-white"
        }`}
    >
      {/* Card header */}
      <div className={`px-4 py-3 flex items-center justify-between
        ${isExtreme ? "bg-orange-50" : isUrgent ? "bg-orange-50/50" : "bg-gray-50"}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-gray-900">
            {order.table.number}
          </span>
          <div>
            <p className="text-xs text-gray-400 leading-none">Mesa</p>
            <p className={`text-xs font-medium flex items-center gap-1 mt-0.5
              ${isUrgent ? "text-orange-600" : "text-gray-500"}`}
            >
              {isUrgent ? <AlertTriangle size={11} /> : <Clock size={11} />}
              {elapsedLabel(order.createdAt)}
              {isUrgent && " — Urgente!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExtreme && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
              <Zap size={9} /> URGENTE
            </span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            {/* Qty badge */}
            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
              ${item.status === "PREPARANDO" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}
            >
              {item.quantity}
            </span>

            {/* Name + notes */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight
                ${item.status === "PREPARANDO" ? "text-gray-900" : "text-gray-700"}`}
              >
                {item.product.name}
              </p>
              {item.notes && (
                <p className="text-xs text-yellow-600 mt-0.5 leading-tight">
                  ⚠ {item.notes}
                </p>
              )}
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {item.status === "PENDENTE" && (
                <button
                  onClick={() => handleItemStatus(item.id, "PREPARANDO")}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 transition disabled:opacity-40"
                >
                  <ChefHat size={12} /> Preparar
                </button>
              )}
              {item.status === "PREPARANDO" && (
                <button
                  onClick={() => handleItemStatus(item.id, "PRONTO")}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 transition disabled:opacity-40"
                >
                  <CheckCircle2 size={12} /> Pronto
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: mark all ready */}
      <div className="px-4 pb-3 border-t border-gray-100 pt-3">
        <button
          onClick={handleMarkAllReady}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
            bg-green-50 hover:bg-green-100 border border-green-200
            text-green-600 text-sm font-medium transition disabled:opacity-40"
        >
          <CheckCircle2 size={14} />
          {allPrepping ? "Tudo Pronto" : "Marcar Tudo Pronto"}
        </button>
      </div>
    </div>
  );
}
