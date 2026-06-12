import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUsers } from "@/app/actions/users";
import UsersClient from "./_components/UsersClient";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const users = await getUsers();

  return <UsersClient initialUsers={users} />;
}
