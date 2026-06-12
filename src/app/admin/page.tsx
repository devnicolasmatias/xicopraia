import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { getTables } from "@/app/actions/tables";
import { getProducts } from "@/app/actions/products";
import { getIngredients } from "@/app/actions/ingredients";
import { getFiscalConfig } from "@/app/actions/fiscal";
import {
  UtensilsCrossed, LayoutGrid, ChefHat, BarChart2,
  Package, FileText, LogOut, ArrowRight, AlertTriangle, Monitor, Users, Gift, CalendarDays,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PainelImpressao } from "@/app/admin/components/PainelImpressao";
import { FilaImpressaoDebug } from "@/app/admin/components/FilaImpressaoDebug";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role;

  const [tables, products, ingredients, fiscalConfig] = await Promise.all([
    getTables(),
    getProducts(),
    getIngredients(),
    getFiscalConfig(),
  ]);

  const ocupadas = tables.filter((t) => t.status === "OCUPADA" || t.status === "PEDIU_CONTA").length;
  const livres = tables.filter((t) => t.status === "LIVRE").length;
  const lowStock = ingredients.filter((i) => Number(i.currentStock) < Number(i.minimumStock)).length;
  const prodAtivos = products.filter((p) => p.available).length;

  const modules = [
    {
      href: "/dashboard/mesas",
      icon: <LayoutGrid size={24} />,
      label: "Mapa de Mesas",
      desc: "Abrir, gerenciar e fechar mesas",
      badge: ocupadas > 0 ? `${ocupadas} ocupada${ocupadas > 1 ? "s" : ""}` : null,
      badgeColor: "bg-orange-100 text-orange-600 border-orange-200",
      color: "text-orange-500",
      iconBg: "bg-orange-50",
      roles: ["ADMIN", "GARCOM", "CAIXA"],
    },
    {
      href: "/admin/cardapio",
      icon: <UtensilsCrossed size={24} />,
      label: "Cardápio",
      desc: "Produtos, categorias e fichas técnicas",
      badge: `${prodAtivos} ativos`,
      badgeColor: "bg-green-100 text-green-600 border-green-200",
      color: "text-green-600",
      iconBg: "bg-green-50",
      roles: ["ADMIN"],
    },
    {
      href: "/admin/estoque",
      icon: <Package size={24} />,
      label: "Estoque",
      desc: "Ingredientes e controle de insumos",
      badge: lowStock > 0 ? `${lowStock} para repor` : "OK",
      badgeColor: lowStock > 0
        ? "bg-orange-100 text-orange-600 border-orange-200"
        : "bg-green-100 text-green-600 border-green-200",
      color: "text-blue-600",
      iconBg: "bg-blue-50",
      roles: ["ADMIN"],
    },
    {
      href: "/admin/estoque-diario",
      icon: <CalendarDays size={24} />,
      label: "Estoque Diário",
      desc: "Contagem diária (Snapshot) e cadastro do inventário",
      badge: null,
      badgeColor: "",
      color: "text-teal-600",
      iconBg: "bg-teal-50",
    },
    {
      href: "/dashboard/cozinha",
      icon: <ChefHat size={24} />,
      label: "Cozinha",
      desc: "Tela de preparo e status dos pedidos",
      badge: null,
      badgeColor: "",
      color: "text-yellow-600",
      iconBg: "bg-yellow-50",
      roles: ["ADMIN", "COZINHA"],
    },
    {
      href: "/admin/fiscal",
      icon: <FileText size={24} />,
      label: "Fiscal (NFC-e)",
      desc: "Certificado digital, SEFAZ e emissão",
      badge: fiscalConfig?.certBase64 ? "Certificado OK" : "Sem certificado",
      badgeColor: fiscalConfig?.certBase64
        ? "bg-green-100 text-green-600 border-green-200"
        : "bg-yellow-100 text-yellow-600 border-yellow-200",
      color: "text-purple-600",
      iconBg: "bg-purple-50",
      roles: ["ADMIN"],
    },
    {
      href: "/admin/financeiro",
      icon: <BarChart2 size={24} />,
      label: "Financeiro",
      desc: "Faturamento, ticket médio e transações",
      badge: "Relatórios",
      badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
      color: "text-pink-600",
      iconBg: "bg-pink-50",
      roles: ["ADMIN"],
    },
    {
      href: "/pdv",
      icon: <Monitor size={24} />,
      label: "PDV",
      desc: "Ponto de venda e vendas no balcão",
      badge: null,
      badgeColor: "",
      color: "text-indigo-600",
      iconBg: "bg-indigo-50",
      roles: ["ADMIN", "CAIXA"],
    },
    {
      href: "/admin/crm",
      icon: <Users size={24} />,
      label: "CRM",
      desc: "Clientes, cashback e conversas WhatsApp",
      badge: null,
      badgeColor: "",
      color: "text-violet-600",
      iconBg: "bg-violet-50",
      roles: ["ADMIN", "CAIXA"],
    },
    {
      href: "/admin/cashback",
      icon: <Gift size={24} />,
      label: "Cashback Rápido",
      desc: "Lançar cashback sem passar pela venda",
      badge: null,
      badgeColor: "",
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
      roles: ["ADMIN", "CAIXA"],
    },
    {
      href: "/admin/usuarios",
      icon: <UserCog size={24} />,
      label: "Equipe e Acessos",
      desc: "Gerenciar funcionários e permissões",
      badge: null,
      badgeColor: "",
      color: "text-blue-600",
      iconBg: "bg-blue-50",
      roles: ["ADMIN"],
    },
  ];

  // Filtra os módulos permitidos
  const allowedModules = modules.filter(m => !m.roles || m.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 sm:px-10 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Xico Praia" width={52} height={52} unoptimized />
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Xico Praia</h1>
            <p className="text-gray-500 text-sm">
              Bem-vindo, <span className="text-orange-500 font-medium">{session.name}</span>
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl transition"
          >
            <LogOut size={14} /> Sair
          </button>
        </form>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8">

        {role === "ADMIN" && (
          <>
            {/* Status rápido */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Mesas ocupadas", value: ocupadas, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                { label: "Mesas livres", value: livres, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                { label: "Produtos ativos", value: prodAtivos, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                { label: "Itens p/ repor", value: lowStock, color: lowStock > 0 ? "text-orange-600" : "text-gray-400", bg: lowStock > 0 ? "bg-orange-50" : "bg-gray-50", border: lowStock > 0 ? "border-orange-100" : "border-gray-200" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 shadow-sm`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Alertas */}
            {lowStock > 0 && (
              <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm text-orange-600">
                <AlertTriangle size={16} />
                <span>{lowStock} ingrediente{lowStock > 1 ? "s" : ""} abaixo do estoque mínimo.</span>
                <Link href="/admin/estoque?tab=reposicao" className="ml-auto flex items-center gap-1 text-xs hover:underline font-medium">
                  Ver estoque <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {!fiscalConfig?.certBase64 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm text-yellow-700">
                <AlertTriangle size={16} />
                <span>Certificado digital não configurado. NFC-e indisponível.</span>
                <Link href="/admin/fiscal" className="ml-auto flex items-center gap-1 text-xs hover:underline font-medium">
                  Configurar <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </>
        )}

        {/* Módulos */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allowedModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md rounded-2xl p-5 flex flex-col gap-3 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className={`${mod.iconBg} ${mod.color} p-2.5 rounded-xl transition`}>
                  {mod.icon}
                </div>
                {mod.badge && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{mod.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-orange-500 transition mt-auto">
                Acessar <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>

        {/* Atalhos rápidos */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-4">Atalhos rápidos</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/dashboard/mesas", label: "Mapa de Mesas", roles: ["ADMIN", "GARCOM", "CAIXA"] },
            { href: "/admin/cardapio", label: "Novo Produto", roles: ["ADMIN"] },
            { href: "/admin/estoque", label: "Ajustar Estoque", roles: ["ADMIN"] },
            { href: "/admin/estoque-diario", label: "Estoque Diário", roles: ["ADMIN", "GARCOM", "CAIXA", "COZINHA"] },
            { href: "/admin/fiscal", label: "Config. Fiscal", roles: ["ADMIN"] },
            { href: "/admin/financeiro", label: "Financeiro", roles: ["ADMIN"] },
            { href: "/pdv", label: "PDV / Balcão", roles: ["ADMIN", "CAIXA"] },
            { href: "/admin/crm", label: "CRM", roles: ["ADMIN", "CAIXA"] },
            { href: "/admin/cashback", label: "Cashback Rápido", roles: ["ADMIN", "CAIXA"] },
            { href: "/dashboard/cozinha", label: "Tela Cozinha", roles: ["ADMIN", "COZINHA"] },
            { href: "/admin/usuarios", label: "Gerir Equipe", roles: ["ADMIN"] },
          ].filter(a => a.roles.includes(role)).map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="px-4 py-2 text-sm bg-white border border-gray-200 hover:border-orange-300 hover:text-orange-600 text-gray-600 rounded-xl transition shadow-sm"
            >
              {a.label}
            </Link>
          ))}
        </div>
        <br />

        {/* Painel de Impressão — só visível para ADMIN */}
        {role === "ADMIN" && (
          <div className="mb-8 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Impressão</h2>
            <PainelImpressao />
            <FilaImpressaoDebug />
          </div>
        )}

      </div>
    </div>
  );
}
