export const dynamic = "force-dynamic";
import { getSession } from "@/lib/session";
import { getProductsForPDV } from "@/app/actions/orders";
import { ensurePdvTable, ensureSelfServiceProduct, getRecentPdvSales } from "@/app/actions/pdv";
import SalesClient from "./_components/SalesClient";

export default async function PdvPage() {
  const session = await getSession();
  await Promise.all([ensurePdvTable(), ensureSelfServiceProduct()]);

  const [{ products, categories }, recentOrders] = await Promise.all([
    getProductsForPDV(),
    getRecentPdvSales(25),
  ]);

  const serializedProducts = products.map((product) => ({
    ...product,
    price: parseFloat(String(product.price)),
  }));

  const recentSales = recentOrders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    total: parseFloat(String(order.total)),
    paymentMethod: order.transaction?.paymentMethod ?? "DINHEIRO",
    itemsCount: order.items.reduce((sum, row) => sum + row.quantity, 0),
  }));

  return (
    <SalesClient
      operatorName={session?.name ?? "Operador"}
      operatorRole={session?.role ?? "CAIXA"}
      products={serializedProducts}
      categories={categories}
      recentSales={recentSales}
    />
  );
}
