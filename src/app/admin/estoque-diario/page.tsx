export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getInventoryCategories, getInventoryItems } from "@/app/actions/inventory";
import EstoqueDiarioClient from "./_components/EstoqueDiarioClient";

export default async function EstoqueDiarioPage() {
  const session = await getSession();
  
  if (!session || (session.role !== "ADMIN" && session.role !== "COZINHA")) {
    redirect("/pdv");
  }

  const [categories, items] = await Promise.all([
    getInventoryCategories(),
    getInventoryItems(),
  ]);

  const serializedCategories = categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }));

  const serializedItems = items.map((i: any) => ({
    id: i.id,
    name: i.name,
    unitOfMeasure: i.unitOfMeasure,
    categoryId: i.categoryId,
    category: {
      id: i.category.id,
      name: i.category.name,
      color: i.category.color,
    },
  }));

  return (
    <EstoqueDiarioClient 
      userRole={session.role}
      initialCategories={serializedCategories}
      initialItems={serializedItems}
    />
  );
}
