import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { getConversationList, getMessages } from "@/app/actions/whatsapp";
import ConversasClient from "./_components/ConversasClient";

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "CAIXA")) redirect("/login");

  const sp = await searchParams;
  const [conversations, initialMessages] = await Promise.all([
    getConversationList(),
    sp.phone ? getMessages(sp.phone) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm shrink-0">
        <Link
          href="/admin/crm"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 hidden sm:block" />
        <div className="min-w-0">
          <h1 className="font-bold text-gray-900 truncate">Conversas WhatsApp</h1>
          <p className="text-xs text-gray-500 truncate">Mensagens via Evolution API</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ConversasClient
          conversations={conversations.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          }))}
          initialPhone={sp.phone ?? null}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
