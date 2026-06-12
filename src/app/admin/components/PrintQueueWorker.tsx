"use client";

import { useEffect, useRef, useState } from "react";
import { ImpressaoService } from "@/services/impressaoService";

const POLL_INTERVAL_MS = 5000;

export function PrintQueueWorker() {
  const isProcessingRef = useRef(false);
  const qzDisponivel = useRef<boolean | null>(null); // null=não testado, true/false=resultado
  const [lastQueued, setLastQueued] = useState<string | null>(null);

  useEffect(() => {
    if (lastQueued) {
      const t = setTimeout(() => setLastQueued(null), 5000);
      return () => clearTimeout(t);
    }
  }, [lastQueued]);

  useEffect(() => {
    const poll = async () => {
      if (isProcessingRef.current) return;

      const printerName = localStorage.getItem("qz_impressora_padrao");
      if (!printerName) return;

      // Se já confirmamos que QZ Tray não está disponível neste dispositivo,
      // não tenta mais — evita spam no console e ciclo infinito.
      if (qzDisponivel.current === false) return;

      try {
        await ImpressaoService.conectarQZ();
        qzDisponivel.current = true;
      } catch {
        qzDisponivel.current = false;
        return;
      }

      let job: { id: string; content: string } | null = null;
      try {
        const res = await fetch("/api/print-queue/claim", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.id) return;
        job = data as { id: string; content: string };
      } catch {
        return;
      }

      isProcessingRef.current = true;
      try {
        await ImpressaoService.imprimirRaw(printerName, [atob(job.content)]);
        await fetch(`/api/print-queue/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "DONE" }),
        });
        setLastQueued(`Job impresso: ${job.id.slice(-6)}`);
      } catch (err) {
        console.error("[PrintQueueWorker] Falha ao imprimir job:", job.id, err);
        qzDisponivel.current = null; // força re-teste na próxima tentativa
        await fetch(`/api/print-queue/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "FAILED" }),
        }).catch(() => {});
      } finally {
        isProcessingRef.current = false;
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!lastQueued) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white text-xs px-4 py-2 rounded-xl shadow-lg">
      ✓ {lastQueued}
    </div>
  );
}
