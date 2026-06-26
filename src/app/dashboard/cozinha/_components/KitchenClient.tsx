"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat, BarChart3, RefreshCw, Wifi, WifiOff,
  Clock, Package, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import OrderCard from "./OrderCard";
import type { OrderItemStatus } from "@/generated/prisma";

interface KitchenItem {
  id: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: OrderItemStatus;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; name: string };
}

interface KitchenOrder {
  id: string;
  createdAt: Date;
  table: { id: string; number: number };
  items: KitchenItem[];
}

interface SummaryRow {
  productName: string;
  total: number;
  pendente: number;
  preparando: number;
}

interface Props {
  initialOrders: KitchenOrder[];
  refreshInterval?: number;
  userRole?: string;
}

const REFRESH_INTERVAL = 15_000;

export default function KitchenClient({ initialOrders, refreshInterval = REFRESH_INTERVAL, userRole }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [orders, setOrders] = useState(initialOrders);
  const [showSummary, setShowSummary] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [countdown, setCountdown] = useState(refreshInterval / 1000);

  useEffect(() => { setOrders(initialOrders); }, [initialOrders]);

  const doRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setLastRefresh(new Date());
      setCountdown(refreshInterval / 1000);
    });
  }, [router, refreshInterval, startTransition]);

  useEffect(() => {
    const interval = setInterval(doRefresh, refreshInterval);
    return () => clearInterval(interval);
  }, [doRefresh, refreshInterval]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? refreshInterval / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [refreshInterval]);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const summaryMap = new Map<string, SummaryRow>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.product.name;
      const row = summaryMap.get(key) ?? { productName: key, total: 0, pendente: 0, preparando: 0 };
      row.total += item.quantity;
      if (item.status === "PENDENTE") row.pendente += item.quantity;
      if (item.status === "PREPARANDO") row.preparando += item.quantity;
      summaryMap.set(key, row);
    }
  }
  const summary = [...summaryMap.values()].sort((a, b) => b.total - a.total);

  const totalItems = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
  const urgentCount = orders.filter((o) => {
    const allPrepping = o.items.every((i) => i.status === "PREPARANDO");
    if (allPrepping) {
      const oldest = Math.min(...o.items.map((i) => new Date(i.updatedAt).getTime()));
      return Math.floor((Date.now() - oldest) / 60000) >= 15;
    }
    const pendentes = o.items.filter((i) => i.status === "PENDENTE");
    const oldest = Math.min(...pendentes.map((i) => new Date(i.createdAt).getTime()));
    return Math.floor((Date.now() - oldest) / 60000) >= 5;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="Boteco4075" width={36} height={36} unoptimized className="shrink-0 hidden sm:block" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-none text-gray-900">Cozinha — KDS</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={10} />
                Atualiza em {countdown}s
              </span>
              <span className={`text-xs flex items-center gap-1 ${isOnline ? "text-green-600" : "text-red-500"}`}>
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Stats chips */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            {urgentCount > 0 && (
              <span className="text-xs bg-red-100 border border-red-200 text-red-600 px-2.5 py-1 rounded-full font-medium">
                {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Controls */}
          <button
            onClick={() => setShowSummary(!showSummary)}
            className={`p-2 rounded-lg transition ${showSummary ? "bg-orange-100 text-orange-600" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
            title="Visão resumida"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={doRefresh}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            title="Atualizar agora"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Mobile stats */}
        <div className="sm:hidden flex gap-2 px-4 pb-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {orders.length} pedidos · {totalItems} itens
          </span>
          {urgentCount > 0 && (
            <span className="text-xs bg-red-100 border border-red-200 text-red-600 px-2 py-0.5 rounded-full">
              {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Summary panel ── */}
      {showSummary && (
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Resumo da fila
          </p>
          {summary.length === 0 ? (
            <p className="text-sm text-gray-400">Fila vazia.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.map((row) => (
                <div key={row.productName} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{row.productName}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500">{row.total} total</span>
                    {row.pendente > 0 && (
                      <span className="text-xs text-yellow-600">{row.pendente} pendente{row.pendente > 1 ? "s" : ""}</span>
                    )}
                    {row.preparando > 0 && (
                      <span className="text-xs text-orange-600">{row.preparando} prep.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Orders grid ── */}
      <div className="flex-1 px-4 sm:px-6 py-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-4 bg-gray-100 rounded-2xl mb-4">
              <Package size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">Nenhum pedido na fila</p>
            <p className="text-gray-400 text-sm mt-1">
              Atualização automática a cada {refreshInterval / 1000}s
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onActionDone={doRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Last refresh bar ── */}
      <div className="border-t border-gray-200 bg-white px-4 py-2 text-center">
        <p className="text-xs text-gray-400">
          Última atualização:{" "}
          {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {" · "}próxima em {countdown}s
        </p>
      </div>
    </div>
  );
}
