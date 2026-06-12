"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { selfRegisterCustomer } from "@/app/actions/crm";

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function CadastroPage() {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        await selfRegisterCustomer({
          name,
          phone,
          cpf: cpf || undefined,
        });
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao cadastrar. Tente novamente.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo + cabeçalho */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="Logo" width={56} height={56} unoptimized />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 text-center leading-tight">
            Xico Praia
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Cadastre-se e ganhe benefícios exclusivos 🎁
          </p>
        </div>

        {done ? (
          /* ── Tela de sucesso ── */
          <div className="bg-white rounded-3xl shadow-xl px-6 py-10 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-900">Cadastro realizado!</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Bem-vindo(a) ao nosso programa de cashback. Toda vez que comprar conosco
              você acumula saldo para usar nas próximas visitas!
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mt-2">
              <p className="text-sm text-orange-700 font-medium">
                Mostre este cadastro ao caixa para já começar a acumular na sua próxima compra.
              </p>
            </div>
          </div>
        ) : (
          /* ── Formulário ── */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl px-6 py-8 space-y-5"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Seu nome completo <span className="text-orange-500">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                WhatsApp / Celular <span className="text-orange-500">*</span>
              </label>
              <input
                required
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(99) 99999-9999"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                CPF <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {error && (
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition shadow-md"
            >
              {isPending ? "Cadastrando…" : "Cadastrar e participar 🎁"}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              Seus dados são usados exclusivamente para o programa de fidelidade e nunca serão compartilhados.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
