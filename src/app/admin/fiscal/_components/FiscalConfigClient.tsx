"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Save, Upload, CheckCircle2, AlertTriangle, Shield,
  Building2, FileText, Key, Wifi, RefreshCw, X, ArrowLeft, Wrench
} from "lucide-react";
import { saveFiscalConfig } from "@/app/actions/fiscal";
import InutilizacaoPanel from "./InutilizacaoPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FiscalConfig {
  id: string;
  cnpj: string; razaoSocial: string; nomeFantasia: string | null;
  ie: string; crt: number;
  logradouro: string; numero: string; complemento: string | null;
  bairro: string; municipio: string; cMunicipio: string;
  uf: string; cep: string; telefone: string | null;
  serie: number; tpAmb: number; cfop: string; csosn: string;
  cIdToken: string; csc: string;
  urlAutorizacao: string | null; urlQrCode: string | null;
  certCn: string | null; certValidade: string | null;
  tlsVersion: string | null;
  tpEmis: number;
  dhContingencia: string | null;
  xJustContingencia: string | null;
  hasCert: boolean;
}

interface Props {
  config: Omit<FiscalConfig, "certBase64" | "certSenha"> | null;
  defaultSerie?: number;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const CRTS = [
  { value: 1, label: "1 – Simples Nacional" },
  { value: 2, label: "2 – Simples Nacional – Excesso" },
  { value: 3, label: "3 – Regime Normal" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FiscalConfigClient({ config, defaultSerie = 1 }: Props) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"empresa" | "nfce" | "certificado" | "operacoes">("empresa");
  const [autoDownloadXml, setAutoDownloadXml] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("nfce_auto_download_xml") === "true";
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [certPassword, setCertPassword] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certInfo, setCertInfo] = useState<{ cn: string; validTo: string } | null>(
    config?.hasCert ? { cn: config.certCn ?? "", validTo: config.certValidade ?? "" } : null
  );

  const [form, setForm] = useState({
    cnpj: config?.cnpj ?? "",
    razaoSocial: config?.razaoSocial ?? "",
    nomeFantasia: config?.nomeFantasia ?? "",
    ie: config?.ie ?? "",
    crt: config?.crt ?? 1,
    logradouro: config?.logradouro ?? "",
    numero: config?.numero ?? "",
    complemento: config?.complemento ?? "",
    bairro: config?.bairro ?? "",
    municipio: config?.municipio ?? "",
    cMunicipio: config?.cMunicipio ?? "",
    uf: config?.uf ?? "SP",
    cep: config?.cep ?? "",
    telefone: config?.telefone ?? "",
    serie: config?.serie ?? 1,
    tpAmb: config?.tpAmb ?? 2,
    cfop: config?.cfop ?? "5102",
    csosn: config?.csosn ?? "400",
    cIdToken: config?.cIdToken ?? "",
    csc: config?.csc ?? "",
    urlAutorizacao: config?.urlAutorizacao ?? "",
    urlQrCode: config?.urlQrCode ?? "",
    tlsVersion: config?.tlsVersion ?? "TLSv1.2",
    tpEmis: config?.tpEmis ?? 1,
    dhContingencia: config?.dhContingencia
      ? new Date(config.dhContingencia).toISOString().slice(0, 16)
      : "",
    xJustContingencia: config?.xJustContingencia ?? "",
  });

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function setField(key: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveFiscalConfig({
        ...form,
        cIdToken: form.cIdToken.trim(),
        csc: form.csc.trim(),
        serie: Number(form.serie),
        tpAmb: Number(form.tpAmb),
        crt: Number(form.crt),
        nomeFantasia: form.nomeFantasia || undefined,
        complemento: form.complemento || undefined,
        telefone: form.telefone || undefined,
        urlAutorizacao: form.urlAutorizacao || undefined,
        urlQrCode: form.urlQrCode || undefined,
        tlsVersion: form.tlsVersion || "TLSv1.2",
        tpEmis: Number(form.tpEmis),
        dhContingencia: form.tpEmis == 9 && form.dhContingencia ? form.dhContingencia : undefined,
        xJustContingencia: form.tpEmis == 9 && form.xJustContingencia ? form.xJustContingencia : undefined,
      });
      if (res.success) showToast("Configurações salvas!", "success");
    });
  }

  async function handleCertUpload() {
    if (!certFile || !certPassword) return;
    setCertUploading(true);

    const fd = new FormData();
    fd.append("certificate", certFile);
    fd.append("password", certPassword);

    try {
      const res = await fetch("/api/fiscal/certificate", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
      } else {
        setCertInfo({ cn: data.cn, validTo: data.validTo });
        setCertFile(null);
        setCertPassword("");
        if (fileRef.current) fileRef.current.value = "";
        showToast("Certificado instalado com sucesso!", "success");
      }
    } catch {
      showToast("Erro ao enviar o certificado.", "error");
    } finally {
      setCertUploading(false);
    }
  }

  const inp = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition";
  const lbl = "block text-xs text-gray-600 mb-1.5 font-medium";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
          ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"}`}
        >
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 text-current opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="Xico Praia" width={44} height={44} unoptimized className="shrink-0 hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Configurações Fiscais</h1>
            <p className="text-gray-500 text-sm mt-0.5">NFC-e · Certificado Digital · Dados da Empresa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            {isPending ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            Salvar
          </button>
        </div>
      </div>

      {/* Ambiente banner */}
      <div className={`mx-8 mt-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border shadow-sm
        ${form.tpAmb === 1
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-yellow-50 border-yellow-200 text-yellow-700"
        }`}
      >
        <Wifi size={15} />
        {form.tpAmb === 1
          ? "Ambiente de PRODUÇÃO — notas emitidas têm valor fiscal real."
          : "Ambiente de HOMOLOGAÇÃO — notas sem valor fiscal para testes."
        }
      </div>

      {/* Tabs */}
      <div className="bg-white mx-0 px-8 pt-4 flex gap-1 border-b border-gray-200 mt-4">
        {[
          { key: "empresa",    label: "Dados da Empresa",    icon: <Building2 size={14} /> },
          { key: "nfce",       label: "Config. NFC-e",       icon: <FileText size={14} /> },
          { key: "certificado", label: "Certificado Digital", icon: <Key size={14} /> },
          { key: "operacoes",  label: "Operações Fiscais",   icon: <Wrench size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px
              ${activeTab === key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="px-8 py-6 max-w-3xl">

        {/* ── Empresa ── */}
        {activeTab === "empresa" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>CNPJ *</label>
                <input className={inp} value={form.cnpj} onChange={(e) => setField("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <label className={lbl}>Inscrição Estadual *</label>
                <input className={inp} value={form.ie} onChange={(e) => setField("ie", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={lbl}>Razão Social *</label>
              <input className={inp} value={form.razaoSocial} onChange={(e) => setField("razaoSocial", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Nome Fantasia</label>
              <input className={inp} value={form.nomeFantasia} onChange={(e) => setField("nomeFantasia", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Regime Tributário *</label>
              <select className={inp} value={form.crt} onChange={(e) => setField("crt", Number(e.target.value))}>
                {CRTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Endereço</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Logradouro *</label>
                  <input className={inp} value={form.logradouro} onChange={(e) => setField("logradouro", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Número *</label>
                  <input className={inp} value={form.numero} onChange={(e) => setField("numero", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={lbl}>Complemento</label>
                  <input className={inp} value={form.complemento} onChange={(e) => setField("complemento", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Bairro *</label>
                  <input className={inp} value={form.bairro} onChange={(e) => setField("bairro", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className={lbl}>Município *</label>
                  <input className={inp} value={form.municipio} onChange={(e) => setField("municipio", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Código IBGE *</label>
                  <input className={inp} value={form.cMunicipio} onChange={(e) => setField("cMunicipio", e.target.value)} placeholder="Ex: 3550308" />
                </div>
                <div>
                  <label className={lbl}>UF *</label>
                  <select className={inp} value={form.uf} onChange={(e) => setField("uf", e.target.value)}>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={lbl}>CEP *</label>
                  <input className={inp} value={form.cep} onChange={(e) => setField("cep", e.target.value)} placeholder="00000-000" />
                </div>
                <div>
                  <label className={lbl}>Telefone</label>
                  <input className={inp} value={form.telefone} onChange={(e) => setField("telefone", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NFC-e ── */}
        {activeTab === "nfce" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>UF *</label>
                <select className={inp} value={form.uf} onChange={(e) => setField("uf", e.target.value)}>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Define os endpoints SEFAZ utilizados.</p>
              </div>
              <div>
                <label className={lbl}>Versão TLS</label>
                <select className={inp} value={form.tlsVersion} onChange={(e) => setField("tlsVersion", e.target.value)}>
                  <option value="TLSv1.2">TLS 1.2 (recomendado — SVRS/maioria dos estados)</option>
                  <option value="TLSv1.3">TLS 1.3</option>
                  <option value="TLSv1.1">TLS 1.1 (legado)</option>
                  <option value="TLSv1">TLS 1.0 (legado)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Em caso de ECONNRESET, tente TLS 1.2.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Ambiente</label>
                <select className={inp} value={form.tpAmb} onChange={(e) => setField("tpAmb", Number(e.target.value))}>
                  <option value={2}>Homologação (teste)</option>
                  <option value={1}>Produção</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Série</label>
                <input type="number" min={1} max={999} className={inp} value={form.serie} onChange={(e) => setField("serie", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>CFOP padrão</label>
                <input className={inp} value={form.cfop} onChange={(e) => setField("cfop", e.target.value)} placeholder="5102" />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tipo de Emissão</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Modo de Emissão</label>
                  <select
                    className={inp}
                    value={form.tpEmis}
                    onChange={(e) => setField("tpEmis", Number(e.target.value))}
                  >
                    <option value={1}>1 – Emissão Normal</option>
                    <option value={9}>9 – Contingência Off-Line</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Use contingência quando o SEFAZ estiver indisponível.</p>
                </div>
              </div>
              {form.tpEmis == 9 && (
                <div className="mt-4 space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs font-semibold text-yellow-700">Dados de Contingência (obrigatórios)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Data/hora início contingência *</label>
                      <input
                        type="datetime-local"
                        className={inp}
                        value={form.dhContingencia}
                        onChange={(e) => setField("dhContingencia", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Justificativa *</label>
                      <input
                        className={inp}
                        value={form.xJustContingencia}
                        onChange={(e) => setField("xJustContingencia", e.target.value)}
                        placeholder="Mín. 15 caracteres"
                        maxLength={256}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>CSOSN (Simples Nacional)</label>
                <select className={inp} value={form.csosn} onChange={(e) => setField("csosn", e.target.value)}>
                  <option value="400">400 – Não tributado</option>
                  <option value="500">500 – Trib. por Substituição Tributária</option>
                  <option value="102">102 – Tributado sem permissão de crédito</option>
                  <option value="300">300 – Imune</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">QR Code (obtenha no site da SEFAZ do seu estado)</p>
              <p className="text-xs text-gray-400 mb-3">Acesse o portal da SEFAZ → Credenciamento NFC-e → solicite o CSC e o cIdToken.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>cIdToken *</label>
                  <input className={inp} value={form.cIdToken} onChange={(e) => setField("cIdToken", e.target.value)} placeholder="000001" />
                </div>
                <div>
                  <label className={lbl}>CSC (Código de Segurança) *</label>
                  <input className={inp} type="password" value={form.csc} onChange={(e) => setField("csc", e.target.value)} placeholder="••••••••••••••••" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comportamento</p>
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  checked={autoDownloadXml}
                  onChange={(e) => {
                    setAutoDownloadXml(e.target.checked);
                    localStorage.setItem("nfce_auto_download_xml", String(e.target.checked));
                  }}
                  className="w-4 h-4 accent-orange-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Baixar XML automaticamente após autorização</p>
                  <p className="text-xs text-gray-400">O arquivo XML da NFC-e será baixado assim que a SEFAZ autorizar.</p>
                </div>
              </label>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Endpoints personalizados (opcional)</p>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>URL Autorização SOAP</label>
                  <input className={inp} value={form.urlAutorizacao} onChange={(e) => setField("urlAutorizacao", e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className={lbl}>URL Base QR Code</label>
                  <input className={inp} value={form.urlQrCode} onChange={(e) => setField("urlQrCode", e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Operações Fiscais ── */}
        {activeTab === "operacoes" && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Inutilização de Números</p>
              <p className="text-xs text-gray-500 mb-4">Declare à SEFAZ faixas de numeração que nunca foram utilizadas.</p>
              <InutilizacaoPanel defaultSerie={defaultSerie} />
            </div>
          </div>
        )}

        {/* ── Certificado ── */}
        {activeTab === "certificado" && (
          <div className="space-y-6">

            {/* Status atual */}
            {certInfo?.cn ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 text-sm">Certificado instalado</p>
                  <p className="text-gray-900 text-sm mt-0.5">{certInfo.cn}</p>
                  {certInfo.validTo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Válido até: {new Date(certInfo.validTo).toLocaleDateString("pt-BR")}
                      {new Date(certInfo.validTo) < new Date() && (
                        <span className="ml-2 text-red-600 font-medium">EXPIRADO</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center gap-3 text-yellow-700 text-sm shadow-sm">
                <AlertTriangle size={18} />
                Nenhum certificado instalado. A emissão de NFC-e não funcionará sem o certificado.
              </div>
            )}

            {/* Upload */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-900">
                <Upload size={15} className="text-orange-500" />
                {certInfo?.cn ? "Atualizar Certificado" : "Instalar Certificado A1"}
              </h3>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p>• O certificado deve ser do tipo A1, no formato <strong className="text-gray-700">.pfx</strong> ou <strong className="text-gray-700">.p12</strong></p>
                <p>• Deve ser o certificado da empresa (e-CNPJ) emitido por uma AC credenciada</p>
                <p>• A senha é a mesma usada na instalação do certificado</p>
                <p>• O arquivo é armazenado de forma segura no banco de dados</p>
              </div>

              <div>
                <label className={lbl}>Arquivo .pfx / .p12 *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pfx,.p12"
                  onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl px-3 py-2 text-sm file:mr-3 file:bg-orange-500 file:text-white file:border-0 file:rounded-lg file:px-2 file:py-1 file:text-xs cursor-pointer"
                />
              </div>

              <div>
                <label className={lbl}>Senha do certificado *</label>
                <input
                  type="password"
                  value={certPassword}
                  onChange={(e) => setCertPassword(e.target.value)}
                  className={inp}
                  placeholder="Senha do arquivo .pfx"
                  autoComplete="new-password"
                />
              </div>

              <button
                onClick={handleCertUpload}
                disabled={!certFile || !certPassword || certUploading}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                {certUploading
                  ? <><RefreshCw size={14} className="animate-spin" /> Validando...</>
                  : <><Upload size={14} /> Instalar certificado</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
