"use client";

import { Printer, ArrowLeft, FileText, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
    >
      <Printer size={16} />
      Imprimir
    </button>
  );
}

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
      aria-label="Voltar"
    >
      <ArrowLeft size={18} />
    </button>
  );
}

export function DownloadXmlButton({ nfceId }: { nfceId: string }) {
  return (
    <a
      href={`/api/nfce/${nfceId}/xml`}
      download
      className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
    >
      <Download size={16} />
      Baixar XML
    </a>
  );
}
