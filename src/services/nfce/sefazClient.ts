import axios from "axios";
import https from "https";
import { constants } from "crypto";
import forge from "node-forge";
import type { SefazResponse } from "./types";

// ─── Cache em memória para cadeia de CAs intermediários (por URL) ─────────────

const caChainCache = new Map<string, string>();

// Extrai a URL de CA Issuers do campo AIA embutido no DER do certificado.
// O campo AIA contém URLs em ASCII puro dentro do DER, então basta buscar
// com regex — evita parsing ASN.1 manual do campo.
function extractCaIssuersUrl(certPem: string): string | null {
  try {
    const b64 = certPem.replace(/-----[^-]+-----|[\r\n\s]/g, "");
    const der  = Buffer.from(b64, "base64").toString("binary");
    // URLs de CA Issuers quase sempre apontam para .p7b, .cer ou .crt
    const m = der.match(/https?:\/\/[^\x00-\x1f\x80-\xff]+\.(?:p7b|p7c|cer|crt|der)/i);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}

// Baixa e converte o p7b/cer do CA intermediário em PEM(s) concatenados.
// Resultado é cacheado em memória — um único download por processo/CA.
async function fetchIntermediateChainPem(url: string): Promise<string> {
  if (caChainCache.has(url)) return caChainCache.get(url)!;

  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 8000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const buf  = Buffer.from(res.data);
    const der  = forge.util.createBuffer(buf.toString("binary"));
    const pems: string[] = [];

    // Tenta PKCS#7 SignedData (formato .p7b) — estrutura: ContentInfo > [0] > SignedData > [0] certs
    try {
      const asn1       = forge.asn1.fromDer(der);
      const signedData = (asn1.value as forge.asn1.Asn1[])[1]?.value[0] as forge.asn1.Asn1;
      if (signedData) {
        for (const item of signedData.value as forge.asn1.Asn1[]) {
          if (item.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && item.type === 0) {
            for (const certAsn1 of item.value as forge.asn1.Asn1[]) {
              try { pems.push(forge.pki.certificateToPem(forge.pki.certificateFromAsn1(certAsn1))); } catch { /* pula */ }
            }
          }
        }
      }
    } catch { /* não é p7b */ }

    // Fallback: DER simples (certificado único)
    if (pems.length === 0) {
      try {
        const asn1Single = forge.asn1.fromDer(forge.util.createBuffer(buf.toString("binary")));
        pems.push(forge.pki.certificateToPem(forge.pki.certificateFromAsn1(asn1Single)));
      } catch { /* não é DER */ }
    }

    const result = pems.join("\n");
    if (result) caChainCache.set(url, result);
    return result;
  } catch (e) {
    console.warn("[SEFAZ] Não foi possível buscar CA intermediário:", String(e));
    return "";
  }
}

// ─── Configura agente HTTPS com o certificado do cliente ─────────────────────

async function buildHttpsAgent(pfxBase64: string, password: string, tlsVersion = "TLSv1.2"): Promise<https.Agent> {
  console.log("[SEFAZ AGENT] buildHttpsAgent iniciado | tlsVersion:", tlsVersion);
  console.log("[SEFAZ AGENT] SSL_OP_LEGACY_SERVER_CONNECT:", constants.SSL_OP_LEGACY_SERVER_CONNECT);
  console.log("[SEFAZ AGENT] SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION:", constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION);

  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const p12Der  = forge.util.decode64(pfxBase64);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    console.log("[SEFAZ AGENT] PFX parsed OK");
  } catch (e) {
    console.error("[SEFAZ AGENT] ERRO ao parsear PFX:", String(e));
    throw e;
  }

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) throw new Error("Chave privada não encontrada no certificado digital.");
  console.log("[SEFAZ AGENT] Chave privada extraída");

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const allCertBags = certBags[forge.pki.oids.certBag] ?? [];
  if (allCertBags.length === 0) throw new Error("Certificado não encontrado no arquivo .pfx.");
  console.log("[SEFAZ AGENT] Certificados no PFX:", allCertBags.length);

  const leafCertPem = forge.pki.certificateToPem(allCertBags[0].cert!);
  const keyPem      = forge.pki.privateKeyToPem(keyBag.key);

  let certPem: string;
  if (allCertBags.length > 1) {
    certPem = allCertBags.filter(b => b.cert).map(b => forge.pki.certificateToPem(b.cert!)).join("\n");
    console.log("[SEFAZ AGENT] Cadeia montada do PFX | certs:", allCertBags.length, "| bytes:", certPem.length);
  } else {
    const caUrl = extractCaIssuersUrl(leafCertPem);
    const chainPem = caUrl ? await fetchIntermediateChainPem(caUrl) : "";
    certPem = chainPem ? leafCertPem + "\n" + chainPem : leafCertPem;
    console.log("[SEFAZ AGENT] Cadeia montada via AIA | caUrl:", caUrl, "| bytes:", certPem.length);
  }

  const secureOptions = constants.SSL_OP_LEGACY_SERVER_CONNECT | constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION;
  const agentOptions: https.AgentOptions = {
    cert: certPem,
    key: keyPem,
    rejectUnauthorized: false,
    secureOptions,
    ciphers: "DEFAULT:@SECLEVEL=0",
  };

  // "auto" ou vazio → TLSv1.2: SVRS não suporta TLS 1.3 e reseta conexão se for oferecido no ClientHello
  const effectiveVersion = (!tlsVersion || tlsVersion === "auto") ? "TLSv1.2" : tlsVersion;
  if (effectiveVersion !== "none") {
    const version = effectiveVersion as "TLSv1" | "TLSv1.1" | "TLSv1.2" | "TLSv1.3";
    agentOptions.minVersion = version;
    agentOptions.maxVersion = version;
  }
  console.log("[SEFAZ AGENT] TLS efetivo:", effectiveVersion);

  console.log("[SEFAZ AGENT] secureOptions:", secureOptions, "| rejectUnauthorized: false | ciphers: DEFAULT:@SECLEVEL=0");
  return new https.Agent(agentOptions);
}

// ─── Envelope SOAP 1.2 para NFC-e ────────────────────────────────────────────

function buildEnvelope(cUF: number, signedXml: string): string {
  const nfeBody = signedXml.replace(/<\?xml[^?]*\?>\s*/, "").trim();

  // SEFAZ rejeita whitespace entre tags do enviNFe (cStat 588) — manter compacto
  return `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Header><nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><cUF>${cUF}</cUF><versaoDados>4.00</versaoDados></nfeCabecMsg></soap12:Header><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><idLote>1</idLote><indSinc>1</indSinc>${nfeBody}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}

// ─── Parser da resposta SEFAZ ─────────────────────────────────────────────────

function parseResponse(xml: string): SefazResponse {
  const getTag = (tag: string, src = xml) => src.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1] ?? "";

  let cStat   = parseInt(getTag("cStat") || "0");
  let xMotivo = getTag("xMotivo") || "Sem resposta";

  // cStat 104 = Lote processado (síncrono) — status real da NFC-e fica dentro de infProt
  if (cStat === 104) {
    const infProt = xml.match(/<infProt[^>]*>([\s\S]*?)<\/infProt>/)?.[1] ?? "";
    if (infProt) {
      cStat   = parseInt(getTag("cStat", infProt) || "0") || cStat;
      xMotivo = getTag("xMotivo", infProt) || xMotivo;
    }
  }

  const protNFe  = getTag("nProt") || undefined;
  const dhRecbto = getTag("dhRecbto") || undefined;
  const chave    = getTag("chNFe") || undefined;

  // 100 = Uso Autorizado, 150 = Autorizado fora do prazo
  const success = cStat === 100 || cStat === 150;

  return { success, cStat, xMotivo, protNFe, dhRecbto, chave };
}

function parseCancelResponse(xml: string): SefazResponse {
  const getTag = (tag: string) => xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1] ?? "";
  const cStat = parseInt(getTag("cStat") || "0");
  const xMotivo = getTag("xMotivo") || "Sem resposta";
  const protNFe = getTag("nProt") || undefined;
  const dhRecbto = getTag("dhRegEvento") || getTag("dhRecbto") || undefined;
  // 135 = Evento registrado e vinculado a NF-e
  const success = cStat === 135 || cStat === 136;
  return { success, cStat, xMotivo, protNFe, dhRecbto };
}

function parseInutilizacaoResponse(xml: string): SefazResponse {
  const getTag = (tag: string) => xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1] ?? "";
  const cStat = parseInt(getTag("cStat") || "0");
  const xMotivo = getTag("xMotivo") || "Sem resposta";
  const protNFe = getTag("nProt") || undefined;
  // 102 = Inutilização de Número Homologado
  const success = cStat === 102;
  return { success, cStat, xMotivo, protNFe };
}

// ─── Envelopes SOAP ──────────────────────────────────────────────────────────

function buildEventoEnvelope(cUF: number, signedXml: string): string {
  const body = signedXml.replace(/<\?xml[^?]*\?>\s*/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NfceRecepcaoEvento4">
      <cUF>${cUF}</cUF>
      <versaoDados>1.00</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NfceRecepcaoEvento4">
      ${body}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

function buildInutilizacaoEnvelope(cUF: number, signedXml: string): string {
  const body = signedXml.replace(/<\?xml[^?]*\?>\s*/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NfceInutilizacao4">
      <cUF>${cUF}</cUF>
      <versaoDados>4.00</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NfceInutilizacao4">
      ${body}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

// ─── Envio para SEFAZ ────────────────────────────────────────────────────────

export async function autorizarNfce(
  endpoint: string,
  cUF: number,
  signedXml: string,
  pfxBase64: string,
  certPassword: string,
  tlsVersion?: string,
): Promise<SefazResponse> {
  const envelope = buildEnvelope(cUF, signedXml);

  let agent: https.Agent;
  try {
    agent = await buildHttpsAgent(pfxBase64, certPassword, tlsVersion);
  } catch (agentErr) {
    console.error("[SEFAZ] ERRO ao construir agente HTTPS:", String(agentErr));
    return { success: false, cStat: 999, xMotivo: `Erro ao montar agente mTLS: ${String(agentErr)}` };
  }

  console.log("[SEFAZ] Enviando para:", endpoint, "| cUF:", cUF);

  try {
    const response = await axios.post(endpoint, envelope, {
      headers: {
        "Content-Type": 'application/soap+xml; charset=UTF-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote"',
      },
      httpsAgent: agent,
      timeout: 30000,
    });

    console.log("[SEFAZ] HTTP", response.status, "| bytes:", String(response.data).length);
    console.log("[SEFAZ DEBUG] RESPOSTA:", String(response.data).slice(0, 1000));

    return parseResponse(response.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const nodeCode = (err as { code?: string }).code;
      const rawData = err.response?.data ? String(err.response.data) : null;
      console.error("[SEFAZ] ERRO axios | code:", nodeCode, "| HTTP:", status, "| msg:", err.message);
      if (err.cause) console.error("[SEFAZ] cause:", String(err.cause));

      if (rawData) {
        const parsed = parseResponse(rawData);
        if (parsed.cStat && parsed.cStat !== 0 && parsed.xMotivo !== "Sem resposta") {
          return { success: false, cStat: parsed.cStat, xMotivo: `cStat ${parsed.cStat}: ${parsed.xMotivo}` };
        }
      }

      const parts: string[] = [];
      if (nodeCode) parts.push(nodeCode);
      if (status) parts.push(`HTTP ${status}`);
      parts.push(`Endpoint: ${endpoint}`);
      if (rawData) parts.push(`Resposta: ${rawData.slice(0, 400)}`);

      return { success: false, cStat: 999, xMotivo: `Erro de comunicação com SEFAZ — ${parts.join(" | ")}` };
    }
    console.error("[SEFAZ] ERRO inesperado:", String(err));
    return { success: false, cStat: 999, xMotivo: `Erro inesperado: ${String(err)} — Endpoint: ${endpoint}` };
  }
}

export async function cancelarNfce(
  endpoint: string,
  cUF: number,
  signedXml: string,
  pfxBase64: string,
  certPassword: string,
  tlsVersion?: string,
): Promise<SefazResponse> {
  const envelope = buildEventoEnvelope(cUF, signedXml);
  const agent = await buildHttpsAgent(pfxBase64, certPassword, tlsVersion);
  try {
    const response = await axios.post(endpoint, envelope, {
      headers: { "Content-Type": 'application/soap+xml; charset=UTF-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/NfceRecepcaoEvento4/nfeDadosMsg"' },
      httpsAgent: agent,
      timeout: 30000,
    });
    return parseCancelResponse(response.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const nodeCode = (err as { code?: string }).code;
      const rawData = err.response?.data ? String(err.response.data) : null;
      if (rawData) {
        const parsed = parseCancelResponse(rawData);
        if (parsed.cStat && parsed.cStat !== 0 && parsed.xMotivo !== "Sem resposta") {
          return { success: false, cStat: parsed.cStat, xMotivo: `cStat ${parsed.cStat}: ${parsed.xMotivo}` };
        }
      }
      const parts: string[] = [];
      if (nodeCode) parts.push(nodeCode);
      if (status) parts.push(`HTTP ${status}`);
      parts.push(`Endpoint: ${endpoint}`);
      if (rawData) parts.push(`Resposta: ${rawData.slice(0, 400)}`);
      return { success: false, cStat: 999, xMotivo: `Erro de comunicação (cancelamento) — ${parts.join(" | ")}` };
    }
    return { success: false, cStat: 999, xMotivo: `Erro inesperado: ${String(err)}` };
  }
}

export async function inutilizarNfce(
  endpoint: string,
  cUF: number,
  signedXml: string,
  pfxBase64: string,
  certPassword: string,
  tlsVersion?: string,
): Promise<SefazResponse> {
  const envelope = buildInutilizacaoEnvelope(cUF, signedXml);
  const agent = await buildHttpsAgent(pfxBase64, certPassword, tlsVersion);
  try {
    const response = await axios.post(endpoint, envelope, {
      headers: { "Content-Type": 'application/soap+xml; charset=UTF-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/NfceInutilizacao4/nfeDadosMsg"' },
      httpsAgent: agent,
      timeout: 30000,
    });
    return parseInutilizacaoResponse(response.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const nodeCode = (err as { code?: string }).code;
      const rawData = err.response?.data ? String(err.response.data) : null;
      if (rawData) {
        const parsed = parseInutilizacaoResponse(rawData);
        if (parsed.cStat && parsed.cStat !== 0 && parsed.xMotivo !== "Sem resposta") {
          return { success: false, cStat: parsed.cStat, xMotivo: `cStat ${parsed.cStat}: ${parsed.xMotivo}` };
        }
      }
      const parts: string[] = [];
      if (nodeCode) parts.push(nodeCode);
      if (status) parts.push(`HTTP ${status}`);
      parts.push(`Endpoint: ${endpoint}`);
      if (rawData) parts.push(`Resposta: ${rawData.slice(0, 400)}`);
      return { success: false, cStat: 999, xMotivo: `Erro de comunicação (inutilização) — ${parts.join(" | ")}` };
    }
    return { success: false, cStat: 999, xMotivo: `Erro inesperado: ${String(err)}` };
  }
}
