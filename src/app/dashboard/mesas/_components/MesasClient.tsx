"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Receipt, RefreshCw, DollarSign, QrCode, X, Download, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import MesaCard from "./MesaCard";
import AbrirMesaModal from "./AbrirMesaModal";
import { updateTableStatus } from "@/app/actions/tables";
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

type Filter = "TODAS" | "LIVRE" | "OCUPADA" | "PEDIU_CONTA";

interface Props {
  tables: Table[];
  userRole: string;
}

export default function MesasClient({ tables, userRole }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("TODAS");
  const [openModal, setOpenModal] = useState<Table | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = {
    TODAS: tables.length,
    LIVRE: tables.filter((t) => t.status === "LIVRE").length,
    OCUPADA: tables.filter((t) => t.status === "OCUPADA").length,
    PEDIU_CONTA: tables.filter((t) => t.status === "PEDIU_CONTA").length,
  };

  const filtered =
    filter === "TODAS" ? tables : tables.filter((t) => t.status === filter);

  function handleCardClick(table: Table) {
    if (table.status === "LIVRE") {
      setOpenModal(table);
      return;
    }
    setActionMenu(actionMenu === table.id ? null : table.id);
  }

  function handleStatusChange(id: string, status: TableStatus) {
    setActionMenu(null);
    startTransition(async () => {
      await updateTableStatus(id, status);
    });
  }

  function goToDetail(id: string) {
    router.push(`/dashboard/mesas/${id}`);
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "TODAS",      label: `Todas (${counts.TODAS})` },
    { key: "LIVRE",      label: `Livres (${counts.LIVRE})` },
    { key: "OCUPADA",    label: `Ocupadas (${counts.OCUPADA})` },
    { key: "PEDIU_CONTA", label: `Pediu conta (${counts.PEDIU_CONTA})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
                <ArrowLeft size={18} />
              </Link>
              <Image src="/logo.png" alt="Xico Praia" width={36} height={36} unoptimized className="shrink-0 hidden sm:block" />
              <h1 className="text-lg font-bold text-gray-900">Mapa de Mesas</h1>
            </div>
            <div className="flex items-center gap-1">
              {(userRole === "ADMIN" || userRole === "CAIXA") && (
                <Link
                  href="/pdv"
                  className="text-xs font-medium text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 transition"
                >
                  PDV
                </Link>
              )}
              <button
                onClick={() => router.refresh()}
                disabled={isPending}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                title="Atualizar"
              >
                <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
                  ${filter === key
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-16">Nenhuma mesa encontrada.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((table) => (
            <div key={table.id} className="relative">
              <MesaCard table={table} onClick={handleCardClick} />

              {/* Menu de ações (mesa ocupada/pediu conta) */}
              {actionMenu === table.id && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <button
                    onClick={() => goToDetail(table.id)}
                    className="w-full px-3 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                  >
                    Ver pedidos
                  </button>

                  <button
                    onClick={() => { setActionMenu(null); setQrTable(table); }}
                    className="w-full px-3 py-2.5 text-sm text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <QrCode size={14} /> QR Code da mesa
                  </button>

                  <button
                    onClick={() => { setActionMenu(null); router.push(`/dashboard/mesas/${table.id}/fechamento`); }}
                    className="w-full px-3 py-2.5 text-sm text-left text-green-600 hover:bg-green-50 flex items-center gap-2"
                  >
                    <DollarSign size={14} /> Fechar conta
                  </button>

                  {table.status === "OCUPADA" && (
                    <button
                      onClick={() => handleStatusChange(table.id, "PEDIU_CONTA")}
                      disabled={isPending}
                      className="w-full px-3 py-2.5 text-sm text-left text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
                    >
                      <Receipt size={14} /> Pediu a conta
                    </button>
                  )}

                  {table.status === "PEDIU_CONTA" && (
                    <button
                      onClick={() => handleStatusChange(table.id, "OCUPADA")}
                      disabled={isPending}
                      className="w-full px-3 py-2.5 text-sm text-left text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                    >
                      Voltar para Ocupada
                    </button>
                  )}

                  <button
                    onClick={() => handleStatusChange(table.id, "AGUARDANDO_LIMPEZA")}
                    disabled={isPending}
                    className="w-full px-3 py-2.5 text-sm text-left text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                  >
                    Aguardando limpeza
                  </button>

                  <button
                    onClick={() => handleStatusChange(table.id, "LIVRE")}
                    disabled={isPending}
                    className="w-full px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    <LogOut size={14} /> Liberar mesa
                  </button>

                  <button
                    onClick={() => setActionMenu(null)}
                    className="w-full px-3 py-2 text-xs text-center text-gray-400 hover:text-gray-600 border-t border-gray-100"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          {[
            { color: "bg-green-500",  label: "Livre" },
            { color: "bg-red-500",    label: "Ocupada" },
            { color: "bg-yellow-500", label: "Pediu a conta" },
            { color: "bg-blue-500",   label: "Reservada" },
            { color: "bg-gray-400",   label: "Aguardando limpeza" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Overlay para fechar menu */}
      {actionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenu(null)}
        />
      )}

      {/* Modal abrir mesa */}
      {openModal && (
        <AbrirMesaModal
          table={openModal}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* Modal QR Code */}
      {qrTable && (
        <QrCodeModal table={qrTable} onClose={() => setQrTable(null)} />
      )}
    </div>
  );
}

// ─── QR Code Modal ─────────────────────────────────────────────────────────────

function QrCodeModal({ table, onClose }: { table: { id: string; number: number }; onClose: () => void }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/menu/${table.id}`
    : `/menu/${table.id}`;

  function handleDownload() {
    const svg = document.getElementById("qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `qrcode-mesa-${table.number}.svg`;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">QR Code — Mesa {table.number}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Aponte a câmera para acessar o cardápio</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
            <QRCodeSVG
              id="qr-svg"
              value={url}
              size={200}
              level="M"
              marginSize={0}
            />
          </div>

          <p className="text-xs text-gray-400 text-center break-all max-w-[220px]">{url}</p>

          <div className="flex gap-2 w-full">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition"
            >
              <Download size={14} /> Baixar SVG
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(url); }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-sm font-medium py-2.5 rounded-xl transition"
            >
              Copiar link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
