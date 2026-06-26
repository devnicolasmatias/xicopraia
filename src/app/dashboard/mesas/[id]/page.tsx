export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { getTable } from "@/app/actions/tables";
import { getTableOrders, getProductsForPDV } from "@/app/actions/orders";
import { getSession } from "@/lib/session";
import MesaDetailClient from "./_components/MesaDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MesaDetailPage({ params }: Props) {
  const { id } = await params;

  const [session, table, orders, { products, categories }] = await Promise.all([
    getSession(),
    getTable(id),
    getTableOrders(id),
    getProductsForPDV(),
  ]);

  if (!session) redirect("/login");
  if (!table) notFound();

  // Serializa Decimal → number para passar ao Client Component
  const serializedProducts = products.map((p) => ({
    ...p,
    price: parseFloat(String(p.price)),
  }));

  const serializedOrders = orders.map((o) => ({
    ...o,
    total: parseFloat(String(o.total)),
    userName: o.user?.name ?? null,
    createdAt: new Date(o.createdAt),
    items: o.items.map((i) => ({
      ...i,
      unitPrice: parseFloat(String(i.unitPrice)),
      createdAt: new Date(i.createdAt),
    })),
  }));

  const serializedTable = {
    ...table,
    openedAt: table.openedAt ? new Date(table.openedAt) : null,
  };

  return (
    <MesaDetailClient
      table={serializedTable}
      products={serializedProducts}
      categories={categories}
      orders={serializedOrders}
      userName={session.name}
    />
  );
}
