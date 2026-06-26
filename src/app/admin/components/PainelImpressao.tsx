"use client";

import { useState, useEffect } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { ImpressaoService } from "@/services/impressaoService";

export function PainelImpressao() {
  const STORAGE_KEY = "qz_impressora_padrao";

  const [impressoras, setImpressoras] = useState<string[]>([]);
  const [selecionada, setSelecionada] = useState<string>("");
  const [carregando, setCarregando] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [status, setStatus] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);

  function handleSelecionar(nome: string) {
    setSelecionada(nome);
    localStorage.setItem(STORAGE_KEY, nome);
  }

  async function carregarImpressoras() {
    setCarregando(true);
    setStatus(null);
    try {
      const lista = await ImpressaoService.listarImpressoras();
      setImpressoras(lista);

      const salva = localStorage.getItem(STORAGE_KEY);
      const PREFERIDA = "EPSON TM-T20 Receipt";

      const inicial =
        (salva && lista.includes(salva)) ? salva :
        lista.includes(PREFERIDA)        ? PREFERIDA :
        lista[0] ?? "";

      setSelecionada(inicial);
      if (inicial) localStorage.setItem(STORAGE_KEY, inicial);
    } catch {
      setStatus({ tipo: "erro", msg: "Não foi possível conectar ao QZ Tray. Verifique se está em execução." });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarImpressoras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSimularImpressao() {
    if (!selecionada) return;
    setImprimindo(true);
    setStatus(null);
    try {
      await ImpressaoService.imprimirTeste(selecionada);
      setStatus({ tipo: "sucesso", msg: `Teste enviado para "${selecionada}" com sucesso!` });
    } catch {
      setStatus({ tipo: "erro", msg: `Falha ao enviar para "${selecionada}". Verifique a impressora.` });
    } finally {
      setImprimindo(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
            <Printer size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Impressora</p>
            <p className="text-xs text-gray-400">Teste de impressão via QZ Tray</p>
          </div>
        </div>
        <button
          onClick={carregarImpressoras}
          disabled={carregando}
          title="Atualizar lista de impressoras"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-40"
        >
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-2">
        <select
          id="select-impressora"
          value={selecionada}
          onChange={(e) => handleSelecionar(e.target.value)}
          disabled={carregando || impressoras.length === 0}
          className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando && <option value="">Carregando...</option>}
          {!carregando && impressoras.length === 0 && (
            <option value="">Nenhuma impressora encontrada</option>
          )}
          {impressoras.map((imp) => (
            <option key={imp} value={imp}>{imp}</option>
          ))}
        </select>

        <button
          id="btn-simular-impressao"
          onClick={handleSimularImpressao}
          disabled={imprimindo || !selecionada || carregando}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Printer size={14} />
          {imprimindo ? "Enviando..." : "Simular impressão"}
        </button>
      </div>

      {status && (
        <p className={`mt-3 text-xs px-3 py-2 rounded-xl ${
          status.tipo === "sucesso"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
