"use client";

import { useState, useTransition } from "react";
import { XCircle, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { cancelarNfceDocument } from "@/app/actions/fiscal";

interface Props {
  nfceId: string;
  status: string;
}

export default function DanfceActions({ nfceId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (status !== "AUTORIZADA") return null;

  function handleCancelar() {
    startTransition(async () => {
      const res = await cancelarNfceDocument(nfceId, justificativa);
      if ("error" in res && res.error) {
        setResult({ ok: false, msg: res.error });
      } else if (res.success) {
        setResult({ ok: true, msg: "NFC-e cancelada com sucesso." });
        setShowModal(false);
      } else {
        setResult({ ok: false, msg: `SEFAZ ${res.cStat}: ${res.xMotivo}` });
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
      >
        Cancelar NFC-e
      </button>

      {result && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
          ${result.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-600"}`}
        >
          {result.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {result.msg}
          <button onClick={() => setResult(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-orange-600">
              <XCircle size={20} />
              <h2 className="font-bold text-base">Cancelar NFC-e</h2>
            </div>

            <p className="text-sm text-gray-500">
              O cancelamento só é aceito pela SEFAZ dentro do prazo (geralmente 30 minutos após a autorização). Informe a justificativa:
            </p>

            <div>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
                placeholder="Motivo do cancelamento (mínimo 15 caracteres)"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{justificativa.length} / mín. 15 caracteres</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={justificativa.trim().length < 15 || isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition"
              >
                {isPending ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</> : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
