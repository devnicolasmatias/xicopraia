import * as libxml from "libxmljs2";
import * as fs from "fs";
import * as path from "path";
import { buildNfceXml } from "./xmlBuilder";
import type { NfceInput } from "./types";

// ─── Dados de teste ───────────────────────────────────────────────────────────

const input: NfceInput = {
  config: {
    cnpj: "12.345.678/0001-90",
    razaoSocial: "BOTECO 4075 LTDA",
    nomeFantasia: "Xico Praia",
    ie: "123456789",
    crt: 1,
    logradouro: "Rua das Flores",
    numero: "100",
    complemento: null,
    bairro: "Centro",
    municipio: "Porto Alegre",
    cMunicipio: "4314902",
    uf: "RS",
    cep: "90000-000",
    telefone: null,
    serie: 1,
    proximoNNF: 1,
    tpAmb: 2,
    cfop: "5102",
    csosn: "400",
    cIdToken: "000001",
    csc: "1234567890ABCDEF1234567890ABCDEF",
    urlAutorizacao: null,
    urlQrCode: "https://www.sefaz.rs.gov.br/NFCE/NF-CEDEV.aspx",
    tpEmis: 1,
  },
  nNF: 1,
  dhEmi: new Date("2026-06-11T10:30:00-03:00"),
  items: [
    {
      nItem: 1,
      cProd: "001",
      xProd: "CERVEJA LONG NECK 355ML",
      ncm: "22030000",
      cfop: "5102",
      uCom: "UN",
      qCom: 2,
      vUnCom: 8.00,
      vProd: 16.00,
      csosn: "400",
      crt: 1,
    },
  ],
  total: 16.00,
  serviceFee: 0,
  discount: 0,
  paymentMethod: "PIX",
};

// ─── Gera chave com CDV correto (43 dígitos fixos + CDV calculado) ────────────

function calcCDV(chave43: string): number {
  let soma = 0, mult = 2;
  for (let i = chave43.length - 1; i >= 0; i--) {
    soma += parseInt(chave43[i]) * mult;
    mult = mult === 9 ? 2 : mult + 1;
  }
  const r = soma % 11;
  return r < 2 ? 0 : 11 - r;
}

// cUF=43 aamm=2606 cnpj=12345678000190 mod=65 serie=001 nNF=000000001 tpEmis=1 cNF=12345678
const chaveSemDV = "4326061234567800019065001000000001112345678";
const cdv = calcCDV(chaveSemDV);
const chave = chaveSemDV + cdv;
console.log(`Chave (${chave.length} dígitos): ${chave}  CDV=${cdv}\n`);

// ─── Gera XML ─────────────────────────────────────────────────────────────────

const xml = buildNfceXml(input, chave, 12345678);

// ─── Valida contra XSD ────────────────────────────────────────────────────────

const schemasDir = path.join(__dirname, "schemas");
const xsdPath = path.join(schemasDir, "nfe_v4.00.xsd");

const xsdDoc = libxml.parseXml(fs.readFileSync(xsdPath, "utf8"), {
  baseUrl: schemasDir + "/",
});

const xmlDoc = libxml.parseXml(xml);

const valid = xmlDoc.validate(xsdDoc);

if (valid) {
  console.log("✅ XML VÁLIDO — nenhum erro de schema encontrado.");
} else {
  const errors = xmlDoc.validationErrors;
  console.log(`❌ XML INVÁLIDO — ${errors.length} erro(s) encontrado(s):\n`);
  errors.forEach((err, i) => {
    console.log(`[${i + 1}] Linha ${err.line}, Coluna ${err.column}`);
    console.log(`    ${err.message.trim()}\n`);
  });
}

console.log("\n─── XML gerado ───────────────────────────────────────────────────");
console.log(xml);
