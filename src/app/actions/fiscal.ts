"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { emitirNfce } from "@/services/nfce/emitter";
import { parsePfx, signEventoXml, signInutilizacaoXml } from "@/services/nfce/xmlSigner";
import { cancelarNfce, inutilizarNfce } from "@/services/nfce/sefazClient";
import { UF_CODES, getCancelEndpoint, getInutilizacaoEndpoint } from "@/services/nfce/chaveAcesso";
import type { NfceItem } from "@/services/nfce/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Acesso negado.");
}

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Acesso negado.");
}

// ─── Fiscal Config ────────────────────────────────────────────────────────────

export async function getFiscalConfig() {
  return prisma.fiscalConfig.findFirst();
}

export async function saveFiscalConfig(data: {
  cnpj: string; razaoSocial: string; nomeFantasia?: string;
  ie: string; crt: number;
  logradouro: string; numero: string; complemento?: string;
  bairro: string; municipio: string; cMunicipio: string;
  uf: string; cep: string; telefone?: string;
  serie: number; tpAmb: number; cfop: string; csosn: string;
  cIdToken: string; csc: string;
  urlAutorizacao?: string; urlQrCode?: string;
  tlsVersion?: string;
  tpEmis?: number;
  dhContingencia?: string;
  xJustContingencia?: string;
}) {
  await requireAdmin();

  const existing = await prisma.fiscalConfig.findFirst();

  if (existing) {
    await prisma.fiscalConfig.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
  } else {
    await prisma.fiscalConfig.create({ data });
  }

  revalidatePath("/admin/fiscal");
  return { success: true };
}

export async function validateAndSaveCertificate(certBase64: string, password: string) {
  await requireAdmin();

  // Valida o certificado antes de salvar
  let certInfo: { cn: string; validTo: Date };
  try {
    certInfo = parsePfx(certBase64, password);
  } catch {
    return { error: "Certificado inválido ou senha incorreta." };
  }

  const existing = await prisma.fiscalConfig.findFirst();
  if (!existing) return { error: "Salve as configurações fiscais antes de enviar o certificado." };

  await prisma.fiscalConfig.update({
    where: { id: existing.id },
    data: {
      certBase64,
      certSenha: password,
      certValidade: certInfo.validTo,
      certCn: certInfo.cn,
    },
  });

  revalidatePath("/admin/fiscal");
  return { success: true, cn: certInfo.cn, validTo: certInfo.validTo };
}

// ─── Emissão NFC-e ────────────────────────────────────────────────────────────

export async function emitirNfceParaTransacao(transactionId: string) {
  await requireAuth();

  // Busca configuração fiscal
  const config = await prisma.fiscalConfig.findFirst();
  if (!config) return { error: "Configuração fiscal não encontrada. Configure em /admin/fiscal." };
  if (!config.certBase64) return { error: "Certificado digital não configurado." };

  // Busca transação com itens e produtos
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      order: {
        include: {
          items: {
            where: { status: { not: "CANCELADO" } },
            include: { product: { select: { id: true, name: true, ncm: true } } },
          },
        },
      },
      nfce: true,
    },
  });

  if (!transaction) return { error: "Transação não encontrada." };
  if (transaction.nfce?.status === "AUTORIZADA") {
    return { error: "NFC-e já emitida para esta transação.", nfceId: transaction.nfce.id };
  }

  // Monta itens da NFC-e
  const nfceItems: NfceItem[] = transaction.order.items.map((item, idx) => ({
    nItem: idx + 1,
    cProd: item.productId.slice(-6).toUpperCase(),
    xProd: item.product.name,
    ncm: item.product.ncm ?? "21069090",
    cfop: config.cfop,
    uCom: "UN",
    qCom: item.quantity,
    vUnCom: parseFloat(String(item.unitPrice)),
    vProd: parseFloat(String(item.unitPrice)) * item.quantity,
    csosn: config.csosn,
    crt: config.crt,
  }));

  // Número sequencial
  const nNF = config.proximoNNF;

  // Cria ou recupera registro NfceDocument
  let nfceDoc = await prisma.nfceDocument.findUnique({ where: { transactionId } });

  try {
    const result = await emitirNfce({
      config: {
        cnpj: config.cnpj,
        razaoSocial: config.razaoSocial,
        nomeFantasia: config.nomeFantasia,
        ie: config.ie,
        crt: config.crt,
        logradouro: config.logradouro,
        numero: config.numero,
        complemento: config.complemento,
        bairro: config.bairro,
        municipio: config.municipio,
        cMunicipio: config.cMunicipio,
        uf: config.uf,
        cep: config.cep,
        telefone: config.telefone,
        serie: config.serie,
        proximoNNF: nNF,
        tpAmb: config.tpAmb,
        cfop: config.cfop,
        csosn: config.csosn,
        cIdToken: config.cIdToken,
        csc: config.csc,
        urlAutorizacao: config.urlAutorizacao,
        urlQrCode: config.urlQrCode,
        tlsVersion: config.tlsVersion,
        tpEmis: config.tpEmis,
        dhContingencia: config.dhContingencia?.toISOString(),
        xJustContingencia: config.xJustContingencia,
        certBase64: config.certBase64,
        certSenha: config.certSenha,
      },
      nNF,
      dhEmi: new Date(),
      items: nfceItems,
      total: parseFloat(String(transaction.total)),
      serviceFee: parseFloat(String(transaction.serviceFee)),
      discount: parseFloat(String(transaction.discount)),
      paymentMethod: transaction.paymentMethod,
    });

    const status = result.success ? "AUTORIZADA" : "REJEITADA";

    // Salva NfceDocument
    if (nfceDoc) {
      nfceDoc = await prisma.nfceDocument.update({
        where: { id: nfceDoc.id },
        data: {
          chave: result.chave,
          nNF, serie: config.serie, tpAmb: config.tpAmb,
          status,
          protNFe: result.sefaz.protNFe,
          dhRecbto: result.sefaz.dhRecbto,
          cStat: result.sefaz.cStat,
          xMotivo: result.sefaz.xMotivo,
          xmlNFe: result.xmlNFe,
          xmlProcNFe: result.xmlProcNFe,
        },
      });
    } else {
      nfceDoc = await prisma.nfceDocument.create({
        data: {
          transactionId,
          chave: result.chave,
          nNF, serie: config.serie, tpAmb: config.tpAmb,
          status,
          protNFe: result.sefaz.protNFe,
          dhRecbto: result.sefaz.dhRecbto,
          cStat: result.sefaz.cStat,
          xMotivo: result.sefaz.xMotivo,
          xmlNFe: result.xmlNFe,
          xmlProcNFe: result.xmlProcNFe,
        },
      });
    }

    // Avança número sequencial apenas se autorizada
    if (result.success) {
      await prisma.fiscalConfig.update({
        where: { id: config.id },
        data: { proximoNNF: nNF + 1 },
      });
    }

    revalidatePath("/admin/fiscal");
    return {
      success: result.success,
      nfceId: nfceDoc.id,
      chave: result.chave,
      cStat: result.sefaz.cStat,
      xMotivo: result.sefaz.xMotivo,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// ─── Cancelamento NFC-e ───────────────────────────────────────────────────────

export async function cancelarNfceDocument(nfceId: string, justificativa: string) {
  await requireAdmin();

  if (justificativa.trim().length < 15)
    return { error: "Justificativa deve ter pelo menos 15 caracteres." };

  const config = await prisma.fiscalConfig.findFirst();
  if (!config?.certBase64) return { error: "Certificado digital não configurado." };

  const nfce = await prisma.nfceDocument.findUnique({ where: { id: nfceId } });
  if (!nfce) return { error: "NFC-e não encontrada." };
  if (nfce.status !== "AUTORIZADA") return { error: "Só é possível cancelar NFC-e autorizada." };
  if (!nfce.protNFe) return { error: "Protocolo de autorização não encontrado." };

  const cert = parsePfx(config.certBase64, config.certSenha!);
  const cUF = UF_CODES[config.uf.toUpperCase()];
  if (!cUF) return { error: `UF inválida: ${config.uf}` };

  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dhEvento = now.toISOString().slice(0, 19) + "-03:00";
  const idEvento = `ID110111${nfce.chave}01`;

  const xmlUnsigned = `<?xml version="1.0" encoding="UTF-8"?><envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe"><idLote>${Date.now()}</idLote><evento versao="1.00"><infEvento Id="${idEvento}"><cOrgao>${cUF}</cOrgao><tpAmb>${config.tpAmb}</tpAmb><CNPJ>${config.cnpj.replace(/\D/g, "")}</CNPJ><chNFe>${nfce.chave}</chNFe><dhEvento>${dhEvento}</dhEvento><tpEvento>110111</tpEvento><nSeqEvento>1</nSeqEvento><verEvento>1.00</verEvento><detEvento versao="1.00"><descEvento>Cancelamento</descEvento><nProt>${nfce.protNFe}</nProt><xJust>${justificativa.trim()}</xJust></detEvento></infEvento></evento></envEvento>`;

  try {
    const xmlSigned = signEventoXml(xmlUnsigned, cert.privateKeyPem, cert.certPem);
    const endpoint = getCancelEndpoint(config.uf, config.tpAmb);
    const result = await cancelarNfce(endpoint, cUF, xmlSigned, config.certBase64, config.certSenha!, config.tlsVersion ?? undefined);

    if (result.success) {
      await prisma.nfceDocument.update({
        where: { id: nfceId },
        data: { status: "CANCELADA", xMotivo: result.xMotivo },
      });
    }

    revalidatePath("/admin/financeiro");
    return { success: result.success, cStat: result.cStat, xMotivo: result.xMotivo };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Inutilização de Números ──────────────────────────────────────────────────

export async function inutilizarNumerosNfce(params: {
  nNFIni: number;
  nNFFin: number;
  justificativa: string;
  serie?: number;
  ano?: number;
}) {
  await requireAdmin();

  const { nNFIni, nNFFin, justificativa, serie, ano } = params;

  if (justificativa.trim().length < 15)
    return { error: "Justificativa deve ter pelo menos 15 caracteres." };
  if (nNFIni > nNFFin)
    return { error: "Número inicial deve ser menor ou igual ao número final." };

  const config = await prisma.fiscalConfig.findFirst();
  if (!config?.certBase64) return { error: "Certificado digital não configurado." };

  const cert = parsePfx(config.certBase64, config.certSenha!);
  const cUF = UF_CODES[config.uf.toUpperCase()];
  if (!cUF) return { error: `UF inválida: ${config.uf}` };

  const anoStr = String(ano ?? new Date().getFullYear()).slice(-2);
  const serieUse = serie ?? config.serie;
  const cnpj = config.cnpj.replace(/\D/g, "");
  const idInut = `ID${String(cUF).padStart(2,"0")}${anoStr}${cnpj}65${String(serieUse).padStart(3,"0")}${String(nNFIni).padStart(9,"0")}${String(nNFFin).padStart(9,"0")}`;

  const xmlUnsigned = `<?xml version="1.0" encoding="UTF-8"?><inutNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe"><infInut Id="${idInut}"><tpAmb>${config.tpAmb}</tpAmb><cUF>${cUF}</cUF><ano>${anoStr}</ano><CNPJ>${cnpj}</CNPJ><mod>65</mod><serie>${serieUse}</serie><nNFIni>${nNFIni}</nNFIni><nNFFin>${nNFFin}</nNFFin><xJust>${justificativa.trim()}</xJust></infInut></inutNFe>`;

  try {
    const xmlSigned = signInutilizacaoXml(xmlUnsigned, cert.privateKeyPem, cert.certPem);
    const endpoint = getInutilizacaoEndpoint(config.uf, config.tpAmb);
    const result = await inutilizarNfce(endpoint, cUF, xmlSigned, config.certBase64, config.certSenha!, config.tlsVersion ?? undefined);

    revalidatePath("/admin/fiscal");
    return { success: result.success, cStat: result.cStat, xMotivo: result.xMotivo, protNFe: result.protNFe };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Busca NFC-e pelo ID ──────────────────────────────────────────────────────

export async function getNfceDocument(id: string) {
  return prisma.nfceDocument.findUnique({
    where: { id },
    include: {
      transaction: {
        include: {
          order: {
            include: {
              table: { select: { number: true } },
              items: {
                where: { status: { not: "CANCELADO" } },
                include: { product: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });
}
