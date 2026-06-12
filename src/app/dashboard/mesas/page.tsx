export const dynamic = "force-dynamic";
import { getTables } from "@/app/actions/tables";
import MesasClient from "./_components/MesasClient";

import { getSession } from "@/lib/session";

export default async function MesasPage() {
  const session = await getSession();
  const tables = await getTables();

  const serialized = tables.map((t) => ({
    ...t,
    openedAt: t.openedAt ? new Date(t.openedAt) : null,
  }));

  return <MesasClient tables={serialized} userRole={session?.role || "GARCOM"} />;
}
