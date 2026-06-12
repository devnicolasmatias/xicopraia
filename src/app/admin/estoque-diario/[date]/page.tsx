import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDailyStock } from "@/app/actions/dailyStock";
import DailyStockClient from "./_components/DailyStockClient";
import { isToday, parseISO } from "date-fns";

export default async function DailyStockPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const session = await getSession();
  
  if (!session || (session.role !== "ADMIN" && session.role !== "COZINHA")) {
    redirect("/pdv");
  }

  const { date } = await params;
  
  // Bloqueio de segurança
  const isTodayDate = isToday(parseISO(date));
  if (session.role !== "ADMIN" && !isTodayDate) {
    redirect("/admin/estoque-diario");
  }

  const dailyStockData = await getDailyStock(date);

  const serialized = {
    ...dailyStockData,
    date: dailyStockData.date.toISOString(),
    items: dailyStockData.items.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity)
    }))
  };

  return <DailyStockClient initialData={serialized} dateStr={date} />;
}
