export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getNfceDocument } from "@/app/actions/fiscal";
import { getFiscalConfig } from "@/app/actions/fiscal";
import { CheckCircle2, XCircle, AlertTriangle, FileText, Receipt, Store, CreditCard, Hash } from "lucide-react";
import DanfceActions from "./_components/DanfceActions";
import { PrintButton, BackButton, DownloadXmlButton } from "./_components/DanfceButtons";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DanfcePage({ params }: Props) {
  const { id } = await params;
  const [nfce, config] = await Promise.all([getNfceDocument(id), getFiscalConfig()]);
  if (!nfce) notFound();

  const t = nfce.transaction;
  const items = t.order.items;

  const subtotal = parseFloat(String(t.subtotal));
  const serviceFee = parseFloat(String(t.serviceFee));
  const discount = parseFloat(String(t.discount));
  const total = parseFloat(String(t.total));

  const payLabels: Record<string, string> = {
    DINHEIRO: "Dinheiro", PIX: "PIX",
    CARTAO_CREDITO: "Cartão de Crédito", CARTAO_DEBITO: "Cartão de Débito",
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const chave = nfce.chave;
  const chaveFormatted = chave.match(/.{1,4}/g)?.join(" ") ?? chave;

  const statusConfig = {
    AUTORIZADA: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Autorizada" },
    CANCELADA: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Cancelada" },
    REJEITADA: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Rejeitada" },
    PENDENTE: { icon: AlertTriangle, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", label: "Pendente" },
  }[nfce.status] ?? { icon: AlertTriangle, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", label: nfce.status };

  const StatusIcon = statusConfig.icon;

  return (
    <>
      {/* Print: cupom térmico 80mm */}
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; background: #fff !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>

      {/* ═══════════ TELA WEB ═══════════ */}
      <div className="screen-only min-h-screen bg-gray-50 text-gray-900">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton />
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">NFC-e #{String(nfce.nNF).padStart(6, "0")}</h1>
              <p className="text-xs text-gray-500 truncate">Série {String(nfce.serie).padStart(3, "0")} &middot; Mesa {t.order.table.number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DanfceActions nfceId={nfce.id} status={nfce.status} />
            <DownloadXmlButton nfceId={nfce.id} />
            <PrintButton />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Status badge */}
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${statusConfig.bg} ${statusConfig.border}`}>
            <StatusIcon size={20} className={statusConfig.color} />
            <div className="min-w-0 flex-1">
              <span className={`font-semibold text-sm ${statusConfig.color}`}>{statusConfig.label}</span>
              {nfce.xMotivo && <p className="text-xs text-gray-600 mt-0.5">cStat {nfce.cStat} &mdash; {nfce.xMotivo}</p>}
            </div>
            {nfce.tpAmb === 2 && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">Homologacao</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Itens */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Receipt size={16} className="text-gray-400" />
                <h2 className="font-semibold text-sm text-gray-900">Itens da Nota</h2>
                <span className="ml-auto text-xs text-gray-400">{items.length} {items.length === 1 ? "item" : "itens"}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item, i) => {
                  const unitPrice = parseFloat(String(item.unitPrice));
                  const itemTotal = unitPrice * item.quantity;
                  return (
                    <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono w-6 text-right shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x {fmt(unitPrice)}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900 tabular-nums">{fmt(itemTotal)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-4 border-t border-gray-200 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span className="tabular-nums">{fmt(subtotal)}</span>
                </div>
                {serviceFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxa de serviço</span><span className="tabular-nums">{fmt(serviceFee)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Desconto</span><span className="tabular-nums">-{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span><span className="tabular-nums">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                <h2 className="font-semibold text-sm text-gray-900">Pagamento</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Forma</span>
                  <span className="font-medium">{payLabels[t.paymentMethod] ?? t.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-medium tabular-nums">{fmt(total)}</span>
                </div>
                {t.splitCount > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Dividido por</span>
                    <span className="font-medium">{t.splitCount}x de {fmt(total / t.splitCount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dados fiscais */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <h2 className="font-semibold text-sm text-gray-900">Dados Fiscais</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Numero</span>
                  <span className="font-medium font-mono">{String(nfce.nNF).padStart(9, "0")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Serie</span>
                  <span className="font-medium font-mono">{String(nfce.serie).padStart(3, "0")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Emissao</span>
                  <span className="font-medium">{nfce.createdAt.toLocaleString("pt-BR")}</span>
                </div>
                {nfce.protNFe && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Protocolo</span>
                    <span className="font-medium font-mono">{nfce.protNFe}</span>
                  </div>
                )}
                {nfce.dhRecbto && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Autorizacao</span>
                    <span className="font-medium">{new Date(nfce.dhRecbto).toLocaleString("pt-BR")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Emitente */}
            {config && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Store size={16} className="text-gray-400" />
                  <h2 className="font-semibold text-sm text-gray-900">Emitente</h2>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Razao Social:</span> <span className="font-medium">{config.razaoSocial}</span></div>
                  {config.nomeFantasia && <div><span className="text-gray-500">Fantasia:</span> <span className="font-medium">{config.nomeFantasia}</span></div>}
                  <div><span className="text-gray-500">CNPJ:</span> <span className="font-medium font-mono">{config.cnpj}</span></div>
                  <div><span className="text-gray-500">IE:</span> <span className="font-medium font-mono">{config.ie}</span></div>
                  <div className="sm:col-span-2"><span className="text-gray-500">Endereco:</span> <span className="font-medium">{config.logradouro}, {config.numero} &mdash; {config.bairro}, {config.municipio}/{config.uf}</span></div>
                </div>
              </div>
            )}

            {/* Chave de acesso */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Hash size={16} className="text-gray-400" />
                <h2 className="font-semibold text-sm text-gray-900">Chave de Acesso</h2>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm font-mono text-gray-700 tracking-wider break-all leading-relaxed select-all">{chaveFormatted}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ IMPRESSAO: cupom térmico 80mm ═══════════ */}
      <div className="print-only hidden" style={{
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        width: "72mm",
        background: "#fff",
        color: "#000",
        padding: "4mm",
        lineHeight: "1.4",
      }}>
        <div style={{ textAlign: "center", marginBottom: "4mm", borderBottom: "1px dashed #000", paddingBottom: "3mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>{config?.nomeFantasia || config?.razaoSocial}</div>
          <div>{config?.razaoSocial}</div>
          <div>CNPJ: {config?.cnpj}</div>
          <div>IE: {config?.ie}</div>
          {config && <div>{config.logradouro}, {config.numero} - {config.bairro}</div>}
          {config && <div>{config.municipio} - {config.uf} - CEP {config.cep}</div>}
          {config?.telefone && <div>Tel: {config.telefone}</div>}
        </div>

        <div style={{ textAlign: "center", marginBottom: "3mm", borderBottom: "1px dashed #000", paddingBottom: "3mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px" }}>DANFE NFC-e</div>
          <div>Documento Auxiliar da Nota Fiscal</div>
          <div>de Consumidor Eletronica</div>
          {nfce.tpAmb === 2 && (
            <div style={{ background: "#000", color: "#fff", padding: "1mm 2mm", marginTop: "2mm", fontSize: "10px" }}>
              EMITIDA EM HOMOLOGACAO - SEM VALOR FISCAL
            </div>
          )}
        </div>

        <div style={{ marginBottom: "3mm" }}>
          {items.map((item, i) => {
            const unitPrice = parseFloat(String(item.unitPrice));
            const itemTotal = unitPrice * item.quantity;
            return (
              <div key={item.id} style={{ marginBottom: "1mm" }}>
                <div>{String(i + 1).padStart(2, "0")} {item.product.name}</div>
                <div style={{ paddingLeft: "4mm" }}>
                  {item.quantity} x {fmt(unitPrice)} = {fmt(itemTotal)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "2mm 0", marginBottom: "3mm" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {serviceFee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Taxa de servico</span><span>{fmt(serviceFee)}</span>
            </div>
          )}
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Desconto</span><span>-{fmt(discount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", marginTop: "1mm" }}>
            <span>TOTAL</span><span>{fmt(total)}</span>
          </div>
          <div style={{ marginTop: "1mm" }}>
            Pagamento: {payLabels[t.paymentMethod] ?? t.paymentMethod}
          </div>
        </div>

        <div style={{ borderBottom: "1px dashed #000", paddingBottom: "3mm", marginBottom: "3mm" }}>
          <div>NF-e n {String(nfce.nNF).padStart(9, "0")} - Serie {String(nfce.serie).padStart(3, "0")}</div>
          <div>Emissao: {nfce.createdAt.toLocaleString("pt-BR")}</div>
          {nfce.protNFe && <div>Protocolo: {nfce.protNFe}</div>}
          <div style={{ marginTop: "2mm", fontSize: "9px", wordBreak: "break-all" }}>
            Chave: {chaveFormatted}
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "3mm" }}>
          <div style={{ fontWeight: "bold" }}>
            {nfce.status === "AUTORIZADA" ? "NOTA AUTORIZADA" : nfce.status}
          </div>
        </div>

        <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "3mm", fontSize: "10px" }}>
          <div>Mesa {t.order.table.number}</div>
          <div style={{ marginTop: "1mm" }}>Obrigado pela preferencia!</div>
        </div>
      </div>
    </>
  );
}
