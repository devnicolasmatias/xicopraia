import qz from "qz-tray";

// Cole aqui o conteúdo completo do arquivo digital-certificate.txt,
// preservando o cabeçalho, o corpo em Base64 e o rodapé do certificado.
const DIGITAL_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEFzCCAv+gAwIBAgIUbZXiy7u05oyLs7P24CVqf2TRTZYwDQYJKoZIhvcNAQEL
BQAwgZkxCzAJBgNVBAYTAkJSMREwDwYDVQQIDAhQYXJhwqFiYTEVMBMGA1UEBwwM
Sm/Dhm8gUGVzc29hMREwDwYDVQQKDAhCZW0gTGFiczERMA8GA1UECwwIQmVtIExh
YnMxETAPBgNVBAMMCEJlbSBMYWJzMScwJQYJKoZIhvcNAQkBFhhiZW1jb21wYW55
bGFic0BnbWFpbC5jb20wIBcNMjYwNjAyMTMxMjExWhgPMjA1NzExMjUxMzEyMTFa
MIGZMQswCQYDVQQGEwJCUjERMA8GA1UECAwIUGFyYcKhYmExFTATBgNVBAcMDEpv
w4ZvIFBlc3NvYTERMA8GA1UECgwIQmVtIExhYnMxETAPBgNVBAsMCEJlbSBMYWJz
MREwDwYDVQQDDAhCZW0gTGFiczEnMCUGCSqGSIb3DQEJARYYYmVtY29tcGFueWxh
YnNAZ21haWwuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwveh
KnCB9zR5EfDjCuJfMmlCEVi6wKcvGUhMQWq3GlOpy1idzOqqYoCbvoWuNtWxM5ia
kC/ykChsNeZEFS6ko6E0dqP0ZmidvlDSYgxIYidc/fGPtAunyEwArf1SV1Lday+W
Y/cub0CbhxEM5Ros/xdkv9ue+luYG8TmYM2aUw2kpQnosCsmUcFwup0HgQE6KGEi
WPRepno3fn3+pbQTNaiJGNx/K6ciZdzj87QwSXWy9t1OGqT2/ZXWKgAQKZFQ2MC6
1FVrnkn06NYG5jOXu5AfRG3lb1poHDGt3i+os4Eoa8UVNTiEPl+dvwHWQLA3PFer
0LsaxkzxCcHJBf0QJQIDAQABo1MwUTAdBgNVHQ4EFgQUdepTRPaL2g+OE+t+lvjA
54Da+4cwHwYDVR0jBBgwFoAUdepTRPaL2g+OE+t+lvjA54Da+4cwDwYDVR0TAQH/
BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAacn0XivDLIyFKIba4zvx4kB7rhcg
ByxBM9Mea7IeGU1ItGk8BN1s14xWzaEEu4HOVDlzLziiiBSkq0TF4Cy69fl8iiZH
KrPSJ8vLZLC2t1jwMgoAkoqkaHCgfghHIyFa5C00jdSOB+vZ1Ppbtk8GvGb22H7p
y6qsKIheKnXF98b1ehVUa4nl+VrBYja0tr7AWAqBup+TsGz5J1AXcOSc8lTHT5ij
vT2wMvM48reBWreoj3uCSCR9JfRnz3G8tcpo0ehSLjKGg/esxR2HUo6QQjALX0B8
9+3FuaBXFoPDDndHusBSRWfFCnu4xzTlvgGjcv1KumvEnedRGZPFLGjieA==
-----END CERTIFICATE-----
`;

/**
 * Interface para os itens de dados de impressão do QZ Tray
 */
export interface QZPrintData {
  type: 'raw' | 'pixel' | 'pdf' | 'html' | 'image';
  format: 'command' | 'html' | 'file' | 'plain' | 'base64';
  flavor: 'plain' | 'hex' | 'xml' | 'json';
  data: string | string[] | ArrayBuffer | Blob;
  options?: Record<string, unknown>;
}

export const ImpressaoService = {
  /**
   * Configura a segurança do QZ Tray (certificado público + assinatura via API).
   * Deve ser chamado uma única vez antes de conectar.
   *
   * - Certificado público: /public/digital-certificate.txt (servido estaticamente)
   * - Assinatura: GET /api/qz/sign?request=... (lê private-key.pem server-side)
   */
  _configurarSeguranca(): void {
    qz.security.setSignatureAlgorithm("SHA512");

    qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
      resolve(DIGITAL_CERTIFICATE);
    });

    // QZ Tray chama new Promise(retorno) internamente — o retorno DEVE ser uma função executora
    qz.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void, reject: (err: unknown) => void) => {
        fetch(`/api/qz/sign?request=${encodeURIComponent(toSign)}`, {
          cache: "no-store",
          headers: { "Content-Type": "text/plain" },
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Falha ao obter assinatura QZ (HTTP ${res.status}).`);
            return res.text();
          })
          .then(resolve)
          .catch(reject);
      };
    });
  },

  /**
   * Conecta ao QZ Tray via WebSocket caso não esteja ativo.
   * Configura a segurança automaticamente antes de conectar.
   * Só funciona no ambiente do navegador (cliente).
   */
  async conectarQZ(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("O QZ Tray só pode ser executado no navegador (client-side).");
    }

    if (!qz.websocket.isActive()) {
      try {
        this._configurarSeguranca();

        await Promise.race([
          qz.websocket.connect({
            host: "localhost.qz.io",
            port: { secure: [8181], insecure: [8182] },
            retries: 0,
            delay: 0,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("QZ Tray não respondeu em 3s")), 3000)
          ),
        ]);

        console.log("[QZ Tray] Conectado e autenticado com sucesso!");
      } catch (err) {
        console.error("[QZ Tray] Falha na conexão:", err);
        throw err;
      }
    }
  },

  /**
   * Lista todas as impressoras disponíveis no sistema.
   * @returns Lista de strings com os nomes das impressoras.
   */
  async listarImpressoras(): Promise<string[]> {
    await this.conectarQZ();
    return qz.printers.find() as Promise<string[]>;
  },

  /**
   * Envia dados brutos (RAW) genéricos para a impressora especificada.
   * @param nomeImpressora Nome da impressora de destino.
   * @param comandos Array de comandos brutos (ESC/POS, TSPL, ZPL, etc.).
   */
  async imprimirRaw(nomeImpressora: string, comandos: string[]): Promise<void> {
    try {
      await this.conectarQZ();

      const config = qz.configs.create(nomeImpressora);

      const printData: QZPrintData[] = [{
        type: 'raw',
        format: 'command',
        flavor: 'plain',
        // QZ Tray exige string única — array fragmenta o stream ESC/POS e corrompe o job
        data: comandos.join(''),
      }];

      await qz.print(config, printData);
      console.log(`[ImpressaoService] Impressão enviada com sucesso para: ${nomeImpressora}`);
    } catch (error) {
      console.error(`[ImpressaoService] Erro ao imprimir em ${nomeImpressora}:`, error);
      throw error;
    }
  },

  /**
   * Envia um teste de impressão simples em comandos ESC/POS (RAW)
   * para verificar o funcionamento e a comunicação com a impressora.
   * @param nomeImpressora Nome da impressora de destino.
   */
  async imprimirTeste(nomeImpressora: string): Promise<void> {
    const agora = new Date().toLocaleString("pt-BR");
    const separador = "--------------------------------\n";

    const comandosTeste = [
      "\x1B\x40",           // inicializar impressora
      "\x1B\x61\x01",       // centralizar
      "\x1B\x21\x30",       // fonte dupla altura + largura
      "Ciel\n",
      "\x1B\x21\x00",       // fonte normal
      "Teste de Impressao\n",
      "\x1B\x61\x00",       // alinhar esquerda
      separador,
      `Impressora: OK\n`,
      `Data: ${agora}\n`,
      separador,
      "\x1B\x61\x01",       // centralizar
      "Epson TM-T20\n",
      "\x0A\x0A\x0A",       // avançar papel antes do corte
      "\x1D\x56\x41\x03",   // GS V A — corte parcial com avanço (mais compatível que ESC m)
    ];

    await this.imprimirRaw(nomeImpressora, comandosTeste);
  },
};
