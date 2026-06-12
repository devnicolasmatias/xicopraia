export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getIngredients } from "@/app/actions/ingredients";
import EstoqueClient from "./_components/EstoqueClient";

export default async function EstoquePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/pdv");

  const ingredients = await getIngredients();

  const serialized = ingredients.map((i) => ({
    ...i,
    currentStock: parseFloat(String(i.currentStock)),
    minimumStock: parseFloat(String(i.minimumStock)),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return <EstoqueClient ingredients={serialized} />;
}
