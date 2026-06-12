export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { getTable } from "@/app/actions/tables";
import { getTableOrdersForCheckout } from "@/app/actions/checkout";
import FechamentoClient from "./_components/FechamentoClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FechamentoPage({ params }: Props) {
  const { id } = await params;

  const [table, orders] = await Promise.all([
    getTable(id),
    getTableOrdersForCheckout(id),
  ]);

  if (!table) notFound();

  // Mesa livre sem pedidos → redireciona
  if (table.status === "LIVRE" || !orders.length) {
    redirect(`/dashboard/mesas/${id}`);
  }

  const serializedOrders = orders.map((o) => ({
    ...o,
    total: parseFloat(String(o.total)),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      ...i,
      unitPrice: parseFloat(String(i.unitPrice)),
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  }));

  const serializedTable = {
    ...table,
    openedAt: table.openedAt?.toISOString() ?? null,
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
  };

  return <FechamentoClient table={serializedTable} orders={serializedOrders} />;
}
