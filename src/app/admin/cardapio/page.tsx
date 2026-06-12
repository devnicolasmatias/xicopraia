export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCategories } from "@/app/actions/categories";
import { getProducts } from "@/app/actions/products";
import { getIngredients } from "@/app/actions/ingredients";
import CardapioClient from "./_components/CardapioClient";

export default async function CardapioPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/pdv");

  const [categories, products, ingredients] = await Promise.all([
    getCategories(),
    getProducts(),
    getIngredients(),
  ]);

  const serializedProducts = products.map((p) => ({
    ...p,
    price: parseFloat(String(p.price)),
    costPrice: p.costPrice != null ? parseFloat(String(p.costPrice)) : null,
  }));

  const serializedIngredients = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
  }));

  return (
    <CardapioClient
      categories={categories}
      products={serializedProducts}
      ingredients={serializedIngredients}
    />
  );
}
