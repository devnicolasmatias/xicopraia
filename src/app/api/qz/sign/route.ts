import { NextRequest, NextResponse } from "next/server";
import { createSign } from "crypto";

// Cole aqui o conteúdo completo do arquivo private-key.pem,
// preservando todas as quebras de linha do bloco criptográfico.
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDC96EqcIH3NHkR
8OMK4l8yaUIRWLrApy8ZSExBarcaU6nLWJ3M6qpigJu+ha421bEzmJqQL/KQKGw1
5kQVLqSjoTR2o/RmaJ2+UNJiDEhiJ1z98Y+0C6fITACt/VJXUt1rL5Zj9y5vQJuH
EQzlGiz/F2S/2576W5gbxOZgzZpTDaSlCeiwKyZRwXC6nQeBATooYSJY9F6mejd+
ff6ltBM1qIkY3H8rpyJl3OPztDBJdbL23U4apPb9ldYqABApkVDYwLrUVWueSfTo
1gbmM5e7kB9EbeVvWmgcMa3eL6izgShrxRU1OIQ+X52/AdZAsDc8V6vQuxrGTPEJ
wckF/RAlAgMBAAECggEAB3jlpqJ+vKp4bGlazkc8RkqV82O+7pTJv5KPh59PKrVj
p8066QhiZNmQfoYRlfztKHDUFawcxA0kjpFHcTdjLHlIcTaZ7pXaW9mton/dg1OG
Yx4vt4MN2GWfTgvMLNgab9n4TdcCotVrUIsk/x/YcyNio17Hskkx5HiQqsuee0nU
sJI/SuZkQFR/fmswpm6PpdUUaIxMVt07PAT6lT46Ilp7y3lcTHNCMeDqSe57q5rR
olf+Hbv+kPiN8w738lGY4xVAwJCx3e4VE7KVv0Z5mx0z96Lu5HRwI+Fn8fU9HmNS
uPysgKR9dqMQSYp0FGQtiIcUl4K0s9xS29di5WTAQQKBgQDl5UXJftjsZ4PAiJj1
NmKH46STxmr5FTcaKuYgQ825ZZInJ5630UVbSzZiJbUv8o6ORkrGiwVJUNI7UwPJ
myddkj8g3IEzmn7Na+PHNMBU5Js2d06iCPTFvpurLqzvoP0056n9zMAqSHaPSIc9
SY5QwkZg4ZQMdRcfWKSyo22VwQKBgQDZGwryAE3Nf9xsMnSv5lvuFNyJG0so9XgA
YYJaWL8MHYkN1h1QiFEmXFpN1zE2ZktIJEPmzvtZ5jw2AMGEhTyMi9Lf7gzKt6Nn
hFGtjYAdgIWNa4R3xfcXXSXqShSdcFbxHWFKYyU/4aAWu7WshkeX3/OSENUkBQWJ
g9XyqJ27ZQKBgA6zlb3n9blQeVVzpsxvmOd1wE2O78JT//0VZzgC/gHwI+OLHhRF
Nrk62xR1stuJGGKyzg9aTpE8sOUITwKygFb0hkL0tvJ0280JLDzN+8qx/9cA1C96
gSSwJsZQqtB8LBUZB37qfBN4JNTO348kyAwUEGobotsVFdB0W7vsxZJBAoGANacd
OVkh4RssGgEOHTpMlbXKGogINwMSuOVgFXvBGvlhmW3EqNZHV7eTCZGYs9zr1dRA
g5W7QChJ0P621E0o/YLAhl6KAr8HPtnQZZeGhcPxPVXI0uC1g6ydZh0QoyfUFJoy
JPQDjJnxuiyBZTV6E+pgg0RtqA0lpSpTgThyYpECgYBJTC6IeMF65+wpU2ifmd3+
PjPw6DtvCehP0pXSto3VdEUmXrt8WaU0iSolbkLr4DjaK3R2ziK21tWetkJ4wofX
ffi0XgjZlS8A8dxrwI6V+I8K/XnacAiq+3FidykIW8a6lASEkTu2E9ioOALc9SAm
W+nfRq0A7FuEvv5P76fyQA==
-----END PRIVATE KEY-----
`;

/**
 * GET /api/qz/sign?request=<toSign>
 *
 * Assina a string enviada pelo QZ Tray com a chave privada RSA usando
 * RSA-SHA512 e devolve a assinatura em Base64 puro (text/plain), que é
 * o formato estrito esperado pelo pacote frontend do QZ Tray.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const toSign = req.nextUrl.searchParams.get("request");

    if (!toSign) {
      return new NextResponse("Parâmetro 'request' ausente.", { status: 400 });
    }

    const sign = createSign("RSA-SHA512");
    sign.update(toSign);
    sign.end();

    const signature = sign.sign(PRIVATE_KEY, "base64");

    return new NextResponse(signature, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("[QZ Sign] Erro ao assinar requisição:", err);
    return new NextResponse("Erro interno ao assinar.", { status: 500 });
  }
}
