// ─── Tipos internos do serviço NFC-e ─────────────────────────────────────────

export interface FiscalConfigData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  ie: string;
  crt: number;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  municipio: string;
  cMunicipio: string;
  uf: string;
  cep: string;
  telefone?: string | null;
  serie: number;
  proximoNNF: number;
  tpAmb: number;
  cfop: string;
  csosn: string;
  cIdToken: string;
  csc: string;
  urlAutorizacao?: string | null;
  urlQrCode?: string | null;
  tlsVersion?: string | null;
  tpEmis?: number | null;
  dhContingencia?: Date | string | null;
  xJustContingencia?: string | null;
  certBase64?: string | null;
  certSenha?: string | null;
}

export interface NfceItem {
  nItem: number;
  cProd: string;
  xProd: string;
  ncm: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  csosn: string;
  crt: number;
}

export interface NfceInput {
  config: FiscalConfigData;
  nNF: number;
  dhEmi: Date;
  items: NfceItem[];
  total: number;
  serviceFee: number;
  discount: number;
  paymentMethod: string; // 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO'
  customerCpf?: string;
}

export interface SefazResponse {
  success: boolean;
  cStat: number;
  xMotivo: string;
  protNFe?: string;
  dhRecbto?: string;
  chave?: string;
}
