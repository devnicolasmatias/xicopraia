import forge from "node-forge";
import { SignedXml } from "xml-crypto";

// ─── Parse do certificado .pfx ────────────────────────────────────────────────

export interface CertData {
  privateKeyPem: string;
  certPem: string;
  cn: string;
  validTo: Date;
}

export function parsePfx(pfxBase64: string, password: string): CertData {
  const p12Der = forge.util.decode64(pfxBase64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

  // Chave privada
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) throw new Error("Chave privada não encontrada no certificado.");
  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);

  // Certificado
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error("Certificado não encontrado no .pfx.");
  const cert = certBag.cert;
  const certPem = forge.pki.certificateToPem(cert);

  // CN e validade
  const cn = cert.subject.getField("CN")?.value ?? "Desconhecido";
  const validTo = new Date(cert.validity.notAfter);

  return { privateKeyPem, certPem, cn, validTo };
}

// ─── Assinatura XML (RSA-SHA1 + C14N envelopada) ─────────────────────────────

function signXml(xmlUnsigned: string, privateKeyPem: string, certPem: string, refXpath: string, locationXpath: string): string {
  const sig = new SignedXml({
    privateKey: privateKeyPem,
    publicCert: certPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  });

  const idMatch = xmlUnsigned.match(/Id="([^"]+)"/);
  if (!idMatch) throw new Error("Id do elemento não encontrado no XML.");
  const refUri = `#${idMatch[1]}`;

  sig.addReference({
    xpath: `//*[@Id='${idMatch[1]}']`,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    uri: refUri,
    isEmptyUri: false,
  });

  sig.computeSignature(xmlUnsigned, {
    location: { reference: locationXpath, action: "after" },
  });

  return sig.getSignedXml();
}

export function signNfceXml(xmlUnsigned: string, privateKeyPem: string, certPem: string): string {
  // Signature deve vir após infNFeSupl, conforme sequência TNFe: infNFe → infNFeSupl → Signature
  return signXml(xmlUnsigned, privateKeyPem, certPem,
    "//*[@Id]",
    "//*[local-name()='infNFeSupl']",
  );
}

export function signEventoXml(xmlUnsigned: string, privateKeyPem: string, certPem: string): string {
  return signXml(xmlUnsigned, privateKeyPem, certPem,
    "//*[@Id]",
    "//*[local-name()='infEvento']",
  );
}

export function signInutilizacaoXml(xmlUnsigned: string, privateKeyPem: string, certPem: string): string {
  return signXml(xmlUnsigned, privateKeyPem, certPem,
    "//*[@Id]",
    "//*[local-name()='infInut']",
  );
}
