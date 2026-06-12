import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";

export default async function PdvLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "COZINHA") redirect("/dashboard/cozinha");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/logo.png" alt="Xico Praia" width={40} height={40} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Módulo</p>
            <h1 className="font-bold text-gray-900 leading-tight truncate">PDV — Ponto de venda</h1>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm order-3 sm:order-0 w-full sm:w-auto justify-end sm:justify-start">
          {session.role === "ADMIN" && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-600 transition"
            >
              Admin
            </Link>
          )}
          <Link
            href="/dashboard/mesas"
            className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-600 transition"
          >
            Mesas
          </Link>
          {session.role === "ADMIN" && (
            <Link
              href="/admin/estoque"
              className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-600 transition"
            >
              Estoque
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs text-gray-500 truncate max-w-[140px]">
            {session.name}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5 transition"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
