"use client";

import { Clock, Users, Receipt } from "lucide-react";
import type { TableStatus } from "@/generated/prisma";

interface Table {
  id: string;
  number: number;
  status: TableStatus;
  capacity: number;
  customerName: string | null;
  openedAt: Date | null;
  currentOrderId: string | null;
}

interface Props {
  table: Table;
  onClick: (table: Table) => void;
}

const STATUS_CONFIG: Record<TableStatus, { label: string; bg: string; border: string; dot: string; text: string }> = {
  LIVRE:              { label: "Livre",          bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",  text: "text-green-700"  },
  OCUPADA:            { label: "Ocupada",         bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-500",    text: "text-red-700"    },
  PEDIU_CONTA:        { label: "Pediu a conta",   bg: "bg-yellow-50",  border: "border-yellow-200", dot: "bg-yellow-500", text: "text-yellow-700" },
  RESERVADA:          { label: "Reservada",       bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",   text: "text-blue-700"   },
  AGUARDANDO_LIMPEZA: { label: "Limpeza",         bg: "bg-gray-100",   border: "border-gray-200",   dot: "bg-gray-400",   text: "text-gray-500"   },
};

function elapsedLabel(since: Date): string {
  const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function MesaCard({ table, onClick }: Props) {
  const cfg = STATUS_CONFIG[table.status];

  return (
    <button
      onClick={() => onClick(table)}
      className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md ${cfg.bg} ${cfg.border}`}
    >
      {/* Número */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl font-bold text-gray-900">{table.number}</span>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Capacidade */}
      <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
        <Users size={12} />
        <span>{table.capacity} lugares</span>
      </div>

      {/* Info quando ocupada */}
      {table.status !== "LIVRE" && (
        <div className="mt-2 space-y-1">
          {table.customerName && (
            <p className="text-sm text-gray-800 font-medium truncate">{table.customerName}</p>
          )}
          {table.openedAt && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} />
              {elapsedLabel(table.openedAt)}
            </p>
          )}
        </div>
      )}

      {/* Badge "Conta!" */}
      {table.status === "PEDIU_CONTA" && (
        <div className="absolute top-3 right-3 bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
          <Receipt size={9} /> Conta!
        </div>
      )}
    </button>
  );
}
