"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PrintJob {
  id: string;
  descricao: string | null;
  status: "PENDING" | "CLAIMED" | "DONE" | "FAILED";
  claimedBy: string | null;
  createdAt: string;
}

const STATUS_STYLE: Record<PrintJob["status"], string> = {
  PENDING:  "bg-yellow-100 text-yellow-700 border border-yellow-200",
  CLAIMED:  "bg-blue-100   text-blue-700   border border-blue-200",
  DONE:     "bg-green-100  text-green-700  border border-green-200",
  FAILED:   "bg-orange-100    text-orange-700    border border-orange-200",
};

export function FilaImpressaoDebug() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/print-queue", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setJobs(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar fila");
    } finally {
      setLoading(false);
    }
  }, []);

  // carrega ao montar e a cada 5s
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Fila de Impressão (debug)</p>
          <p className="text-xs text-gray-400">Últimos 20 jobs · atualiza a cada 5s</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-orange-500 mb-3">{error} — a tabela print_jobs pode não existir ainda (rode a migration).</p>
      )}

      {!error && jobs.length === 0 && !loading && (
        <p className="text-xs text-gray-400">Nenhum job na fila.</p>
      )}

      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[job.status]}`}>
                {job.status}
              </span>
              <span className="flex-1 truncate text-gray-700">{job.descricao ?? "(sem descrição)"}</span>
              <span className="text-gray-400 shrink-0">
                {new Date(job.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
