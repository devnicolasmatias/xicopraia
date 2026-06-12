"use client";

import { useState, useTransition } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { inutilizarNumerosNfce } from "@/app/actions/fiscal";

interface Props {
  defaultSerie: number;
}

export default function InutilizacaoPanel({ defaultSerie }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nNFIni: "",
    nNFFin: "",
    justificativa: "",
    serie: String(defaultSerie),
    ano: String(new Date().getFullYear()),
  });
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const inp = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";
  const lbl = "block text-xs text-gray-600 mb-1.5 font-medium";

  function handleSubmit() {
    const nNFIni = parseInt(form.nNFIni);
    const nNFFin = parseInt(form.nNFFin);
    if (!nNFIni || !nNFFin) return;

    startTransition(async () => {
      const res = await inutilizarNumerosNfce({
        nNFIni,
        nNFFin,
        justificativa: form.justificativa,
        serie: parseInt(form.serie) || defaultSerie,
        ano: parseInt(form.ano) || new Date().getFullYear(),
      });

      if ("error" in res && res.error) {
        setResult({ ok: false, msg: res.error });
      } else if (res.success) {
        setResult({ ok: true, msg: `Inutilização homologada. Protocolo: ${res.protNFe ?? "–"}` });
        setForm((f) => ({ ...f, nNFIni: "", nNFFin: "", justificativa: "" }));
      } else {
        setResult({ ok: false, msg: `SEFAZ ${res.cStat}: ${res.xMotivo}` });
      }
    });
  }

  return (
    <div className="space-y-4">
      {result && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm border
          ${result.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-600"}`}
        >
          {result.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
          <span>{result.msg}</span>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
        Use a inutilização para declarar à SEFAZ números que nunca foram emitidos (ex: falha de sistema que pulou numeração). Não use para cancelar NFC-e já emitidas.
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={lbl}>Série</label>
          <input type="number" className={inp} value={form.serie} onChange={(e) => setForm((f) => ({ ...f, serie: e.target.value }))} />
        </div>
        <div>
          <label className={lbl}>Ano</label>
          <input type="number" className={inp} value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: e.target.value }))} placeholder={String(new Date().getFullYear())} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Número inicial *</label>
          <input type="number" min={1} className={inp} value={form.nNFIni} onChange={(e) => setForm((f) => ({ ...f, nNFIni: e.target.value }))} placeholder="Ex: 10" />
        </div>
        <div>
          <label className={lbl}>Número final *</label>
          <input type="number" min={1} className={inp} value={form.nNFFin} onChange={(e) => setForm((f) => ({ ...f, nNFFin: e.target.value }))} placeholder="Ex: 10" />
        </div>
      </div>

      <div>
        <label className={lbl}>Justificativa *</label>
        <textarea
          rows={3}
          className={`${inp} resize-none`}
          value={form.justificativa}
          onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))}
          placeholder="Motivo da inutilização (mínimo 15 caracteres)"
        />
        <p className="text-xs text-gray-400 mt-1">{form.justificativa.length} / mín. 15 caracteres</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!form.nNFIni || !form.nNFFin || form.justificativa.trim().length < 15 || isPending}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
      >
        {isPending ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</> : "Inutilizar números"}
      </button>
    </div>
  );
}
