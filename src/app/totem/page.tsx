import { getTotemMenuData } from "@/app/actions/totem";
import TotemClient from "./_components/TotemClient";

export const dynamic = "force-dynamic";

export default async function TotemPage() {
  const data = await getTotemMenuData();
  return <TotemClient {...data} />;
}
