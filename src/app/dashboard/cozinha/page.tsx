export const dynamic = "force-dynamic";
import { getKitchenOrders } from "@/app/actions/kitchen";
import KitchenClient from "./_components/KitchenClient";
import { getSession } from "@/lib/session";

export default async function CozinhaPage() {
  const session = await getSession();
  const orders = await getKitchenOrders();

  // Serializa datas para o Client Component
  const serialized = orders.map((o) => ({
    ...o,
    createdAt: new Date(o.createdAt),
    items: o.items.map((i) => ({
      ...i,
      unitPrice: parseFloat(String(i.unitPrice)),
      createdAt: new Date(i.createdAt),
    })),
  }));

  return <KitchenClient initialOrders={serialized} userRole={session?.role || "COZINHA"} />;
}
