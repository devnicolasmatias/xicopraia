import { UF_CODES, gerarCNF, gerarChaveAcesso, getSefazEndpoint } from "./chaveAcesso";
import { buildNfceXml } from "./xmlBuilder";
import { parsePfx, signNfceXml } from "./xmlSigner";
import { autorizarNfce } from "./sefazClient";
import type { NfceInput, SefazResponse } from "./types";

export interface EmissionResult {
  success: boolean;
  chave: string;
  xmlNFe: string;
  xmlProcNFe?: string;
  sefaz: SefazResponse;
}

export async function emitirNfce(input: NfceInput): Promise<EmissionResult> {
  const { config } = input;

  // 1. Validações
  if (!config.certBase64) throw new Error("Certificado digital não configurado.");
  if (!config.certSenha)  throw new Error("Senha do certificado não configurada.");
  if (!config.cnpj)       throw new Error("CNPJ não configurado.");
  if (!config.csc)        throw new Error("CSC (Código de Segurança do Contribuinte) não configurado.");
  if (!config.cIdToken)   throw new Error("cIdToken não configurado.");

  // 2. Parse do certificado
  const cert = parsePfx(config.certBase64, config.certSenha);

  // 3. Gera chave de acesso
  const cNF = gerarCNF();
  const aamm = `${String(input.dhEmi.getFullYear()).slice(2)}${String(input.dhEmi.getMonth() + 1).padStart(2, "0")}`;
  const chave = gerarChaveAcesso({
    uf: config.uf,
    aamm,
    cnpj: config.cnpj,
    serie: config.serie,
    nNF: input.nNF,
    cNF,
  });

  // 4. Monta XML e compacta antes de assinar (evita cStat 588 sem invalidar assinatura)
  const xmlUnsigned = buildNfceXml(input, chave, cNF)
    .replace(/>\s+</g, "><");

  // 5. Assina
  const xmlSigned = signNfceXml(xmlUnsigned, cert.privateKeyPem, cert.certPem);

  // 6. Envia para SEFAZ
  const cUF = UF_CODES[config.uf.toUpperCase()];
  if (!cUF) throw new Error(`UF inválida: ${config.uf}`);

  const endpoint = getSefazEndpoint(config.uf, config.tpAmb, config.urlAutorizacao);
  const sefazResult = await autorizarNfce(endpoint, cUF, xmlSigned, config.certBase64, config.certSenha, config.tlsVersion ?? undefined);

  // 7. Monta XML processado (nfeProc) se autorizado
  let xmlProcNFe: string | undefined;
  if (sefazResult.success && sefazResult.protNFe) {
    xmlProcNFe = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  ${xmlSigned.replace(/<\?xml[^?]*\?>\s*/, "")}
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${config.tpAmb}</tpAmb>
      <verAplic>CielPOS</verAplic>
      <chNFe>${chave}</chNFe>
      <dhRecbto>${sefazResult.dhRecbto ?? new Date().toISOString()}</dhRecbto>
      <nProt>${sefazResult.protNFe}</nProt>
      <digVal></digVal>
      <cStat>${sefazResult.cStat}</cStat>
      <xMotivo>${sefazResult.xMotivo}</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
  }

  return {
    success: sefazResult.success,
    chave,
    xmlNFe: xmlSigned,
    xmlProcNFe,
    sefaz: sefazResult,
  };
}
