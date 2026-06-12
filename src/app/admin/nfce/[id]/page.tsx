export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getNfceDocument } from "@/app/actions/fiscal";
import { getFiscalConfig } from "@/app/actions/fiscal";
import DanfceActions from "./_components/DanfceActions";

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

  return (
    <>
      <style>{`
        @media screen { body { background: #111; display: flex; justify-content: center; padding: 2rem; } }
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <DanfceActions nfceId={nfce.id} status={nfce.status} />
        <button
          onClick={() => window.print()}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Imprimir DANFCE
        </button>
        <a
          href={`/api/nfce/${nfce.id}/xml`}
          download
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Baixar XML
        </a>
        <button
          onClick={() => window.close()}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          Fechar
        </button>
      </div>

      <div style={{
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        width: "72mm",
        background: "#fff",
        color: "#000",
        padding: "4mm",
        lineHeight: "1.4",
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: "4mm", borderBottom: "1px dashed #000", paddingBottom: "3mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>{config?.nomeFantasia || config?.razaoSocial}</div>
          <div>{config?.razaoSocial}</div>
          <div>CNPJ: {config?.cnpj}</div>
          <div>IE: {config?.ie}</div>
          {config && <div>{config.logradouro}, {config.numero} – {config.bairro}</div>}
          {config && <div>{config.municipio} – {config.uf} – CEP {config.cep}</div>}
          {config?.telefone && <div>Tel: {config.telefone}</div>}
        </div>

        {/* Identificação */}
        <div style={{ textAlign: "center", marginBottom: "3mm", borderBottom: "1px dashed #000", paddingBottom: "3mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px" }}>DANFE NFC-e</div>
          <div>Documento Auxiliar da Nota Fiscal</div>
          <div>de Consumidor Eletrônica</div>
          {nfce.tpAmb === 2 && (
            <div style={{ background: "#000", color: "#fff", padding: "1mm 2mm", marginTop: "2mm", fontSize: "10px" }}>
              EMITIDA EM HOMOLOGAÇÃO – SEM VALOR FISCAL
            </div>
          )}
        </div>

        {/* Itens */}
        <div style={{ marginBottom: "3mm" }}>
          <div style={{ fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "1mm", marginBottom: "2mm" }}>
            {"#".padEnd(2)} {"DESCRIÇÃO".padEnd(20)} {"QTD".padEnd(5)} {"VL.UNIT".padEnd(8)} {"TOTAL"}
          </div>
          {items.map((item, i) => {
            const unitPrice = parseFloat(String(item.unitPrice));
            const total = unitPrice * item.quantity;
            return (
              <div key={item.id} style={{ marginBottom: "1mm" }}>
                <div>{String(i + 1).padStart(2, "0")} {item.product.name}</div>
                <div style={{ paddingLeft: "4mm" }}>
                  {item.quantity} x {fmt(unitPrice).padStart(8)} = {fmt(total)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totais */}
        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "2mm 0", marginBottom: "3mm" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {serviceFee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Taxa de serviço</span><span>{fmt(serviceFee)}</span>
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
          {t.splitCount > 1 && (
            <div>Dividido por {t.splitCount} → {fmt(total / t.splitCount)} p/ pessoa</div>
          )}
        </div>

        {/* Dados fiscais */}
        <div style={{ borderBottom: "1px dashed #000", paddingBottom: "3mm", marginBottom: "3mm" }}>
          <div>NF-e nº {String(nfce.nNF).padStart(9, "0")} – Série {String(nfce.serie).padStart(3, "0")}</div>
          <div>Emissão: {nfce.createdAt.toLocaleString("pt-BR")}</div>
          {nfce.protNFe && <div>Protocolo: {nfce.protNFe}</div>}
          {nfce.dhRecbto && <div>Autorizado: {new Date(nfce.dhRecbto).toLocaleString("pt-BR")}</div>}
          <div style={{ marginTop: "2mm", fontSize: "9px", wordBreak: "break-all" }}>
            Chave: {chaveFormatted}
          </div>
        </div>

        {/* Status */}
        <div style={{ textAlign: "center", marginBottom: "3mm" }}>
          <div style={{ fontWeight: "bold" }}>
            {nfce.status === "AUTORIZADA" ? "✓ NOTA AUTORIZADA" : `⚠ ${nfce.status}`}
          </div>
          {nfce.xMotivo && <div style={{ fontSize: "10px" }}>{nfce.cStat} – {nfce.xMotivo}</div>}
        </div>

        {/* Mesa */}
        <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "3mm", fontSize: "10px" }}>
          <div>Mesa {t.order.table.number}</div>
          <div style={{ marginTop: "1mm" }}>Obrigado pela preferência!</div>
          <div style={{ fontSize: "9px", marginTop: "1mm", color: "#555" }}>Ciel POS</div>
        </div>
      </div>
    </>
  );
}
