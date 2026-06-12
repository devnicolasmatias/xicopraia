export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getPublicMenuData } from "@/app/actions/guestOrders";
import MenuClient from "./_components/MenuClient";

interface Props {
  params: Promise<{ tableId: string }>;
}

export default async function MenuPage({ params }: Props) {
  const { tableId } = await params;
  const { table, products, categories } = await getPublicMenuData(tableId);

  if (!table) notFound();

  const serializedProducts = products.map((p) => ({
    ...p,
    price: parseFloat(String(p.price)),
  }));

  return (
    <MenuClient
      table={table}
      products={serializedProducts}
      categories={categories}
    />
  );
}
