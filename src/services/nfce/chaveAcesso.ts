import { createHash } from "crypto";

// ─── Códigos de UF ────────────────────────────────────────────────────────────

export const UF_CODES: Record<string, number> = {
  AC: 12, AL: 27, AP: 16, AM: 13, BA: 29, CE: 23, DF: 53,
  ES: 32, GO: 52, MA: 21, MT: 51, MS: 50, MG: 31, PA: 15,
  PB: 25, PR: 41, PE: 26, PI: 22, RJ: 33, RN: 24, RS: 43,
  RO: 11, RR: 14, SC: 42, SP: 35, SE: 28, TO: 17,
};

// ─── Dígito verificador (Módulo 11) ──────────────────────────────────────────

function calcularCDV(chave43: string): number {
  let soma = 0;
  let mult = 2;
  for (let i = chave43.length - 1; i >= 0; i--) {
    soma += parseInt(chave43[i]) * mult;
    mult = mult === 9 ? 2 : mult + 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

// ─── Gerador de cNF aleatório ─────────────────────────────────────────────────

export function gerarCNF(): number {
  return Math.floor(10000000 + Math.random() * 90000000);
}

// ─── Chave de acesso (44 dígitos) ─────────────────────────────────────────────

export function gerarChaveAcesso(params: {
  uf: string;
  aamm: string;    // "AAMM" ex: "2401"
  cnpj: string;
  serie: number;
  nNF: number;
  tpEmis?: number; // 1=normal
  cNF: number;
}): string {
  const cUF = UF_CODES[params.uf.toUpperCase()];
  if (!cUF) throw new Error(`UF inválida: ${params.uf}`);

  const tpEmis = params.tpEmis ?? 1;
  const mod = 65; // NFC-e

  const chaveSemDV = [
    String(cUF).padStart(2, "0"),
    params.aamm,
    params.cnpj.replace(/\D/g, "").padStart(14, "0"),
    String(mod).padStart(2, "0"),
    String(params.serie).padStart(3, "0"),
    String(params.nNF).padStart(9, "0"),
    String(tpEmis),
    String(params.cNF).padStart(8, "0"),
  ].join("");

  const cDV = calcularCDV(chaveSemDV);
  return chaveSemDV + cDV;
}

// ─── Hash QR Code: SHA-1(chave|2|tpAmb|cIdToken + CSC) ──────────────────────

export function gerarHashQRCode(chave: string, tpAmb: number, cIdToken: string, csc: string): string {
  const cIdTokenNum = String(parseInt(cIdToken.trim(), 10));
  const cscFinal = csc.trim();
  const input = `${chave}|2|${tpAmb}|${cIdTokenNum}${cscFinal}`;
  const hash = createHash("sha1").update(input).digest("hex").toUpperCase();
  console.log("[QR Hash] cIdToken:", cIdTokenNum, "| csc len:", cscFinal.length, "| hash:", hash);
  return hash;
}

// ─── URL do QR Code ───────────────────────────────────────────────────────────

// Retorna a URL base de consulta do QR Code por UF e ambiente
export function getQRCodeBaseUrl(uf: string, tpAmb: number, urlCustom?: string | null): string {
  if (urlCustom) return urlCustom;

  const urls: Record<string, { hom: string; prod: string }> = {
    SP: {
      hom:  "https://www.homologacao.nfce.fazenda.sp.gov.br/consulta",
      prod: "https://www.nfce.fazenda.sp.gov.br/consulta",
    },
    RS: {
      hom:  "https://www.nfce-homologacao.sefaz.rs.gov.br/consulta",
      prod: "https://www.nfce.sefaz.rs.gov.br/consulta",
    },
    PR: {
      hom:  "https://www.fazenda.pr.gov.br/nfce/qrcode",
      prod: "https://www.fazenda.pr.gov.br/nfce/qrcode",
    },
    MG: {
      hom:  "https://hnfce.fazenda.mg.gov.br/nfce/consultaQR",
      prod: "https://nfce.fazenda.mg.gov.br/nfce/consultaQR",
    },
    RJ: {
      hom:  "https://www.nfce.fazenda.rj.gov.br/consulta",
      prod: "https://www.nfce.fazenda.rj.gov.br/consulta",
    },
    SC: {
      hom:  "https://www.sat.sef.sc.gov.br/nfce/consulta",
      prod: "https://www.sat.sef.sc.gov.br/nfce/consulta",
    },
    // Estados SVRS: QR Code via portal da SEFAZ do próprio estado
    PB: {
      hom:  "http://www.sefaz.pb.gov.br/nfcehom",
      prod: "http://www.sefaz.pb.gov.br/nfce",
    },
    CE: {
      hom:  "https://nfceh.sefaz.ce.gov.br/pages/consultaNFCe.jsf",
      prod: "https://nfce.sefaz.ce.gov.br/pages/consultaNFCe.jsf",
    },
    PE: {
      hom:  "https://nfcehomolog.sefaz.pe.gov.br/nfce/consulta.aspx",
      prod: "https://nfce.sefaz.pe.gov.br/nfce/consulta.aspx",
    },
    BA: {
      hom:  "https://hnfce.sefaz.ba.gov.br/servicos/nfce/default.aspx",
      prod: "https://nfe.sefaz.ba.gov.br/servicos/nfce/default.aspx",
    },
    GO: {
      hom:  "https://www.homologacao.nfce.go.gov.br/consulta",
      prod: "https://www.nfce.go.gov.br/consulta",
    },
    MA: {
      hom:  "https://www.hom.nfce.sefaz.ma.gov.br/portal/consultaNFCe.do",
      prod: "https://www.nfce.sefaz.ma.gov.br/portal/consultaNFCe.do",
    },
    MT: {
      hom:  "https://homologacao.sefaz.mt.gov.br/nfce/consultanfce",
      prod: "https://www.sefaz.mt.gov.br/nfce/consultanfce",
    },
    MS: {
      hom:  "https://www.dfe.ms.gov.br/nfce/consulta",
      prod: "https://www.dfe.ms.gov.br/nfce/consulta",
    },
  };

  const entry = urls[uf.toUpperCase()];
  if (entry) return tpAmb === 1 ? entry.prod : entry.hom;

  // Fallback SVRS genérico
  return tpAmb === 1
    ? `https://www.nfce.sefaz.${uf.toLowerCase()}.gov.br/consulta`
    : `https://www.nfce-homologacao.sefaz.${uf.toLowerCase()}.gov.br/consulta`;
}

// ─── Endpoint SOAP por UF ──────────────────────────────────────────────────────

const SVRS_STATES = ["RS","SC","MS","MT","GO","MA","CE","AM","RN","AL","SE","PB","PI","RO","TO","AC","RR","PA","AP","PE","ES","RJ","BA","DF"];

export function getSefazEndpoint(uf: string, tpAmb: number, urlCustom?: string | null): string {
  if (urlCustom) return urlCustom;

  const endpoints: Record<string, { hom: string; prod: string }> = {
    SP: {
      hom:  "https://homologacao.nfe.fazenda.sp.gov.br/nfce/services/NfceAutorizacao4",
      prod: "https://nfe.fazenda.sp.gov.br/nfce/services/NfceAutorizacao4",
    },
    PR: {
      hom:  "https://homologacao.nfe.fazenda.pr.gov.br/nfce/services/NfceAutorizacao4",
      prod: "https://nfe.fazenda.pr.gov.br/nfce/services/NfceAutorizacao4",
    },
    MG: {
      hom:  "https://hnfe.fazenda.mg.gov.br/nfce/services/NfceAutorizacao4",
      prod: "https://nfe.fazenda.mg.gov.br/nfce/services/NfceAutorizacao4",
    },
    SVRS: {
      hom:  "https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx",
      prod: "https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx",
    },
  };

  const key = SVRS_STATES.includes(uf.toUpperCase()) ? "SVRS" : uf.toUpperCase();
  const entry = endpoints[key] ?? endpoints["SVRS"];
  return tpAmb === 1 ? entry.prod : entry.hom;
}

export function getCancelEndpoint(uf: string, tpAmb: number): string {
  const endpoints: Record<string, { hom: string; prod: string }> = {
    SP: {
      hom:  "https://homologacao.nfe.fazenda.sp.gov.br/nfce/services/NfceRecepcaoEvento4",
      prod: "https://nfe.fazenda.sp.gov.br/nfce/services/NfceRecepcaoEvento4",
    },
    PR: {
      hom:  "https://homologacao.nfe.fazenda.pr.gov.br/nfce/services/NfceRecepcaoEvento4",
      prod: "https://nfe.fazenda.pr.gov.br/nfce/services/NfceRecepcaoEvento4",
    },
    MG: {
      hom:  "https://hnfe.fazenda.mg.gov.br/nfce/services/NfceRecepcaoEvento4",
      prod: "https://nfe.fazenda.mg.gov.br/nfce/services/NfceRecepcaoEvento4",
    },
    SVRS: {
      hom:  "https://nfce-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx",
      prod: "https://nfce.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx",
    },
  };
  const key = SVRS_STATES.includes(uf.toUpperCase()) ? "SVRS" : uf.toUpperCase();
  const entry = endpoints[key] ?? endpoints["SVRS"];
  return tpAmb === 1 ? entry.prod : entry.hom;
}

export function getInutilizacaoEndpoint(uf: string, tpAmb: number): string {
  const endpoints: Record<string, { hom: string; prod: string }> = {
    SP: {
      hom:  "https://homologacao.nfe.fazenda.sp.gov.br/nfce/services/NfceInutilizacao4",
      prod: "https://nfe.fazenda.sp.gov.br/nfce/services/NfceInutilizacao4",
    },
    PR: {
      hom:  "https://homologacao.nfe.fazenda.pr.gov.br/nfce/services/NfceInutilizacao4",
      prod: "https://nfe.fazenda.pr.gov.br/nfce/services/NfceInutilizacao4",
    },
    MG: {
      hom:  "https://hnfe.fazenda.mg.gov.br/nfce/services/NfceInutilizacao4",
      prod: "https://nfe.fazenda.mg.gov.br/nfce/services/NfceInutilizacao4",
    },
    SVRS: {
      hom:  "https://nfce-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx",
      prod: "https://nfce.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx",
    },
  };
  const key = SVRS_STATES.includes(uf.toUpperCase()) ? "SVRS" : uf.toUpperCase();
  const entry = endpoints[key] ?? endpoints["SVRS"];
  return tpAmb === 1 ? entry.prod : entry.hom;
}
