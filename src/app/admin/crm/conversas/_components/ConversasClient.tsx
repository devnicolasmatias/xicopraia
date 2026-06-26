"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Send, Image as ImageIcon, Mic, FileText, Loader2,
  MessageSquare, Paperclip, X,
} from "lucide-react";
import { sendTextMessage, sendMediaMessage, getMessages, getNewMessagesSince } from "@/app/actions/whatsapp";

interface Conversation {
  phone: string;
  direction: string;
  type: string;
  content: string | null;
  createdAt: string;
  customer: { phone: string; name: string; id: string } | null;
}

interface Message {
  id: string;
  phone: string;
  direction: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
  createdAt: string;
}

interface Props {
  conversations: Conversation[];
  initialPhone: string | null;
  initialMessages: Message[];
}

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

type SendMode = "text" | "image" | "audio" | "file";

export default function ConversasClient({
  conversations,
  initialPhone,
  initialMessages,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedPhone, setSelectedPhone] = useState<string | null>(initialPhone);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sendMode, setSendMode] = useState<SendMode>("text");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const [error, setError] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageTimeRef = useRef<string>(
    initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString()
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 3 seconds
  const pollMessages = useCallback(async () => {
    if (!selectedPhone) return;
    try {
      const newMsgs = await getNewMessagesSince(selectedPhone, lastMessageTimeRef.current);
      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
        lastMessageTimeRef.current = newMsgs.at(-1)!.createdAt;
      }
    } catch {
      // silent
    }
  }, [selectedPhone]);

  useEffect(() => {
    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [pollMessages]);

  async function handleSelectPhone(phone: string) {
    setSelectedPhone(phone);
    setLoadingMessages(true);
    setError("");
    try {
      const msgs = await getMessages(phone);
      setMessages(msgs);
      lastMessageTimeRef.current = msgs.at(-1)?.createdAt ?? new Date(0).toISOString();
    } finally {
      setLoadingMessages(false);
    }
    router.replace(`/admin/crm/conversas?phone=${phone}`, { scroll: false });
  }

  async function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleSend() {
    if (!selectedPhone) return;
    setError("");

    if (sendMode === "text") {
      if (!text.trim()) return;
      const msgText = text.trim();
      setText("");

      startTransition(async () => {
        try {
          await sendTextMessage(selectedPhone, msgText);
          const msgs = await getMessages(selectedPhone);
          setMessages(msgs);
          lastMessageTimeRef.current = msgs.at(-1)?.createdAt ?? lastMessageTimeRef.current;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao enviar.");
        }
      });
    } else {
      if (!mediaFile) { setError("Selecione um arquivo."); return; }
      const file = mediaFile;
      const caption = mediaCaption;
      const mode = sendMode;

      startTransition(async () => {
        try {
          const base64 = await toBase64(file);
          const typeMap: Record<SendMode, "IMAGE" | "AUDIO" | "FILE"> = {
            image: "IMAGE",
            audio: "AUDIO",
            file: "FILE",
            text: "FILE",
          };
          await sendMediaMessage({
            phone: selectedPhone,
            type: typeMap[mode],
            mediaBase64: base64,
            caption: caption || undefined,
            fileName: file.name,
            mimeType: file.type,
          });
          setMediaFile(null);
          setMediaCaption("");
          setSendMode("text");
          const msgs = await getMessages(selectedPhone);
          setMessages(msgs);
          lastMessageTimeRef.current = msgs.at(-1)?.createdAt ?? lastMessageTimeRef.current;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao enviar mídia.");
        }
      });
    }
  }

  const activeConv = selectedPhone
    ? conversations.find((c) => c.phone === selectedPhone)
    : null;

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 65px)" }}>
      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col hidden sm:flex">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conversas</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {conversations.length === 0 && (
            <p className="text-sm text-gray-400 p-4">Nenhuma conversa ainda.</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.phone}
              onClick={() => handleSelectPhone(conv.phone)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                selectedPhone === conv.phone ? "bg-indigo-50" : ""
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 truncate">
                {conv.customer?.name ?? maskPhone(conv.phone)}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {conv.direction === "INBOUND" ? "← " : "→ "}
                {conv.type === "TEXT"
                  ? (conv.content ?? "(sem texto)")
                  : `[${conv.type}]`}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3">
            <MessageSquare size={48} strokeWidth={1.5} />
            <p className="text-sm">Selecione uma conversa para começar.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 shrink-0">
              <p className="font-bold text-gray-900">
                {activeConv?.customer?.name ?? maskPhone(selectedPhone)}
              </p>
              <p className="text-xs text-gray-400">{maskPhone(selectedPhone)}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMessages && (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma mensagem.</p>
              )}
              {messages.map((msg) => {
                const isOut = msg.direction === "OUTBOUND";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isOut
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      {msg.type === "TEXT" && (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.type === "IMAGE" && (
                        <div>
                          <p className="text-xs opacity-70 mb-1">[Imagem]</p>
                          {msg.content && <p className="text-xs">{msg.content}</p>}
                        </div>
                      )}
                      {msg.type === "AUDIO" && (
                        <p className="text-xs opacity-70">[Áudio]</p>
                      )}
                      {msg.type === "FILE" && (
                        <div>
                          <p className="text-xs opacity-70">📎 {msg.mediaName ?? "Arquivo"}</p>
                          {msg.content && <p className="text-xs">{msg.content}</p>}
                        </div>
                      )}
                      <p className={`text-[10px] mt-1 ${isOut ? "text-indigo-200" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mb-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                {error}
                <button onClick={() => setError("")}><X size={13} /></button>
              </div>
            )}

            {/* Send bar */}
            <div className="bg-white border-t border-gray-200 p-3 shrink-0">
              {/* Mode selector */}
              <div className="flex gap-1 mb-2">
                {(["text", "image", "audio", "file"] as SendMode[]).map((mode) => {
                  const icons: Record<SendMode, React.ReactNode> = {
                    text: <Send size={13} />,
                    image: <ImageIcon size={13} />,
                    audio: <Mic size={13} />,
                    file: <FileText size={13} />,
                  };
                  const labels: Record<SendMode, string> = {
                    text: "Texto",
                    image: "Imagem",
                    audio: "Áudio",
                    file: "Arquivo",
                  };
                  return (
                    <button
                      key={mode}
                      onClick={() => { setSendMode(mode); setMediaFile(null); }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        sendMode === mode
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {icons[mode]} {labels[mode]}
                    </button>
                  );
                })}
              </div>

              {sendMode === "text" ? (
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Escreva uma mensagem…"
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isPending || !text.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition"
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm border border-dashed border-gray-300 rounded-xl px-3 py-2 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex-1"
                    >
                      <Paperclip size={14} />
                      {mediaFile ? mediaFile.name : `Selecionar ${sendMode === "image" ? "imagem" : sendMode === "audio" ? "áudio" : "arquivo"}`}
                    </button>
                    {mediaFile && (
                      <button onClick={() => setMediaFile(null)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={
                      sendMode === "image"
                        ? "image/*"
                        : sendMode === "audio"
                        ? "audio/*"
                        : undefined
                    }
                    onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex gap-2">
                    <input
                      value={mediaCaption}
                      onChange={(e) => setMediaCaption(e.target.value)}
                      placeholder="Legenda (opcional)"
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isPending || !mediaFile}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition"
                    >
                      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
