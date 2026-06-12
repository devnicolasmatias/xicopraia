import { UF_CODES, gerarHashQRCode, getQRCodeBaseUrl } from "./chaveAcesso";
import type { NfceInput } from "./types";

// ─── Mapeamento método de pagamento → tPag ────────────────────────────────────

const TPAG: Record<string, string> = {
  DINHEIRO:       "01",
  CARTAO_CREDITO: "03",
  CARTAO_DEBITO:  "04",
  PIX:            "17",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt2(n: number) { return n.toFixed(2); }
function fmt4(n: number) { return n.toFixed(4); }
function fmt(n: number, dec = 2) { return n.toFixed(dec); }
function pad(s: string | number, len: number) { return String(s).padStart(len, "0"); }
function fmtDate(d: Date): string {
  // toISOString() retorna UTC; subtrai 3h para obter horário de Brasília (evita cStat 703)
  const brasilia = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return `${brasilia.toISOString().slice(0, 19)}-03:00`;
}
function strip(s: string) { return s.replace(/\D/g, ""); }

// ─── ICMS por regime ──────────────────────────────────────────────────────────

function buildIcms(item: NfceInput["items"][0]): string {
  if (item.crt === 1 || item.crt === 2) {
    // Simples Nacional → CSOSN
    const csosn = item.csosn || "400";
    // CSOSN 500: ST retida anteriormente — ICMSSN500
    if (csosn === "500") {
      return `<ICMS><ICMSSN500><orig>0</orig><CSOSN>500</CSOSN></ICMSSN500></ICMS>`;
    }
    // CSOSN 102/103/300/400 → ICMSSN102 (XSD NF-e 4.00 não tem ICMSSN400)
    return `<ICMS><ICMSSN102><orig>0</orig><CSOSN>${csosn}</CSOSN></ICMSSN102></ICMS>`;
  }
  // Regime Normal — CST 40 (isento) por padrão
  return `<ICMS><ICMS40><orig>0</orig><CST>40</CST></ICMS40></ICMS>`;
}

// ─── PIS / COFINS ─────────────────────────────────────────────────────────────

function buildPisCofins(crt: number, vProd: number): string {
  if (crt === 1 || crt === 2) {
    // Simples Nacional: CST 07 (isento) → PISNT/COFINSNT (XSD NF-e 4.00 não tem PISIsento)
    return `
      <PIS><PISNT><CST>07</CST></PISNT></PIS>
      <COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS>`;
  }
  // Regime Normal: CST 01 (alíquota básica)
  const pPIS   = 0.65;
  const pCOFINS = 3.00;
  const vPIS   = parseFloat(fmt2(vProd * pPIS / 100));
  const vCOFINS = parseFloat(fmt2(vProd * pCOFINS / 100));
  return `
    <PIS><PISAliq><CST>01</CST><vBC>${fmt2(vProd)}</vBC><pPIS>${fmt4(pPIS)}</pPIS><vPIS>${fmt2(vPIS)}</vPIS></PISAliq></PIS>
    <COFINS><COFINSAliq><CST>01</CST><vBC>${fmt2(vProd)}</vBC><pCOFINS>${fmt4(pCOFINS)}</pCOFINS><vCOFINS>${fmt2(vCOFINS)}</vCOFINS></COFINSAliq></COFINS>`;
}

// ─── Builder principal ────────────────────────────────────────────────────────

export function buildNfceXml(input: NfceInput, chave: string, cNF: number): string {
  const { config, nNF, dhEmi, items } = input;

  const cUF = UF_CODES[config.uf.toUpperCase()];
  const aamm = `${String(dhEmi.getFullYear()).slice(2)}${pad(dhEmi.getMonth() + 1, 2)}`;

  // Totais
  const vProdTotal = items.reduce((s, i) => s + i.vProd, 0);
  const vNF = Math.max(0, vProdTotal + input.serviceFee - input.discount);
  const vDesc = input.discount > 0 ? input.discount : 0;
  const vOutro = input.serviceFee > 0 ? input.serviceFee : 0;

  // tPag
  const tPag = TPAG[input.paymentMethod] ?? "01";

  // QR Code — formato V2: URL usa cIdToken sem zeros (XSD), hash usa 6 dígitos (NT2015.002 N6)
  const qrBase = getQRCodeBaseUrl(config.uf, config.tpAmb, config.urlQrCode);
  const hashQR  = gerarHashQRCode(chave, config.tpAmb, config.cIdToken, config.csc);
  const cIdTokenInt = parseInt(config.cIdToken.trim(), 10);
  const qrCodeUrl = `${qrBase}?p=${chave}|2|${config.tpAmb}|${cIdTokenInt}|${hashQR}`;

  const xProdHom = "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL";

  // ── Itens ──
  const detXml = items.map((item) => `
    <det nItem="${item.nItem}">
      <prod>
        <cProd>${item.cProd}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${config.tpAmb === 2 ? xProdHom : item.xProd.substring(0, 120)}</xProd>
        <NCM>${item.ncm.replace(/\D/g, "").padStart(8, "0")}</NCM>
        <CFOP>${item.cfop}</CFOP>
        <uCom>${item.uCom}</uCom>
        <qCom>${fmt4(item.qCom)}</qCom>
        <vUnCom>${fmt2(item.vUnCom)}</vUnCom>
        <vProd>${fmt2(item.vProd)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>${item.uCom}</uTrib>
        <qTrib>${fmt4(item.qCom)}</qTrib>
        <vUnTrib>${fmt2(item.vUnCom)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        ${buildIcms(item)}
        ${buildPisCofins(item.crt, item.vProd)}
      </imposto>
    </det>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${chave}">
    <ide>
      <cUF>${cUF}</cUF>
      <cNF>${pad(cNF, 8)}</cNF>
      <natOp>Venda de Mercadoria</natOp>
      <mod>65</mod>
      <serie>${config.serie}</serie>
      <nNF>${nNF}</nNF>
      <dhEmi>${fmtDate(dhEmi)}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${config.cMunicipio}</cMunFG>
      <tpImp>4</tpImp>
      <tpEmis>${config.tpEmis ?? 1}</tpEmis>
      ${(config.tpEmis === 9 && config.dhContingencia) ? `<dhCont>${fmtDate(new Date(config.dhContingencia))}</dhCont><xJust>${config.xJustContingencia ?? "Contingência ativada"}</xJust>` : ""}
      <cDV>${chave.slice(-1)}</cDV>
      <tpAmb>${config.tpAmb}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>CielPOS-1.0</verProc>
    </ide>
    <emit>
      <CNPJ>${strip(config.cnpj)}</CNPJ>
      <xNome>${config.razaoSocial.trim().substring(0, 60)}</xNome>
      ${config.nomeFantasia ? `<xFant>${config.nomeFantasia.trim().substring(0, 60)}</xFant>` : ""}
      <enderEmit>
        <xLgr>${config.logradouro.trim().substring(0, 60)}</xLgr>
        <nro>${config.numero.trim().substring(0, 60)}</nro>
        ${config.complemento ? `<xCpl>${config.complemento.trim().substring(0, 60)}</xCpl>` : ""}
        <xBairro>${config.bairro.trim().substring(0, 60)}</xBairro>
        <cMun>${config.cMunicipio}</cMun>
        <xMun>${config.municipio.trim().substring(0, 60)}</xMun>
        <UF>${config.uf.toUpperCase()}</UF>
        <CEP>${strip(config.cep).padStart(8, "0")}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
        ${config.telefone ? `<fone>${strip(config.telefone)}</fone>` : ""}
      </enderEmit>
      <IE>${strip(config.ie)}</IE>
      <CRT>${config.crt}</CRT>
    </emit>
    ${detXml}
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${fmt2(vProdTotal)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>${fmt2(vDesc)}</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>${fmt2(vOutro)}</vOutro>
        <vNF>${fmt2(vNF)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <tPag>${tPag}</tPag>
        <vPag>${fmt2(vNF)}</vPag>
      </detPag>
    </pag>
    ${config.tpAmb === 2 ? `<infAdic><infCpl>NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL</infCpl></infAdic>` : ""}
  </infNFe>
  <infNFeSupl>
    <qrCode>${qrCodeUrl}</qrCode>
    <urlChave>${qrBase}</urlChave>
  </infNFeSupl>
</NFe>`;

  return xml;
}
