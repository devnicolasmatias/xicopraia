import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';
import type { Role } from '@/generated/prisma';

// Dicionário de Permissões: Fácil manutenção
// Define as rotas base que cada Role pode acessar.
const rolePermissions: Record<Role, string[]> = {
  ADMIN: ['/admin', '/dashboard/mesas', '/dashboard/cozinha', '/pdv'],
  GERENTE: ['/admin', '/dashboard/cozinha'],
  GARCOM: ['/admin', '/dashboard/mesas'],
  COZINHA: ['/admin', '/dashboard/cozinha'],
  CAIXA: ['/admin', '/pdv', '/dashboard/mesas'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extrai o token do cookie
  const token = request.cookies.get('session')?.value;
  const session = await decrypt(token);

  // Se não houver sessão ativa
  if (!session) {
    // Permite rotas públicas (ex: login e api do whatsapp)
    if (
      pathname === '/login' ||
      pathname.startsWith('/api/whatsapp') ||
      pathname.startsWith('/cadastro') ||
      pathname.startsWith('/totem') ||
      pathname.startsWith('/menu')
    ) {
      return NextResponse.next();
    }
    // Caso contrário, bloqueia e manda pro login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se usuário já está logado e tenta ir para /login ou raiz, manda sempre pro Painel
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // --- Regras de Autorização (Role-based Access Control) ---
  const userRole = session.role as Role;
  const allowedPrefixes = rolePermissions[userRole] || [];

  // Se a rota for a API do whatsapp, deixa passar
  if (pathname.startsWith('/api/whatsapp')) {
    return NextResponse.next();
  }

  // Verifica se o pathname acessado começa com algum dos prefixos permitidos para a role
  const hasPermission = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!hasPermission) {
    // Acesso Negado. Redireciona para a página principal daquela role.
    if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    if (userRole === 'GERENTE') return NextResponse.redirect(new URL('/admin', request.url));
    if (userRole === 'GARCOM') return NextResponse.redirect(new URL('/dashboard/mesas', request.url));
    if (userRole === 'COZINHA') return NextResponse.redirect(new URL('/dashboard/cozinha', request.url));
    if (userRole === 'CAIXA') return NextResponse.redirect(new URL('/pdv', request.url));
    
    // Fallback de segurança extrema
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Configura o proxy para não rodar em rotas estáticas (imagens, css, etc)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo\\.png|sitemap\\.xml|robots\\.txt).*)',
  ],
};
