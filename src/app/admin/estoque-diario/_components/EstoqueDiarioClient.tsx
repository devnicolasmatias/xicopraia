"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Tag, Package, Plus, Pencil, Trash2,
  AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Lock, ArrowLeft
} from "lucide-react";
import { UnitOfMeasure } from "@/generated/prisma";
import { getDaysWithStock } from "@/app/actions/dailyStock";
import { deleteInventoryCategory, deleteInventoryItem } from "@/app/actions/inventory";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import CategoryModal from "./CategoryModal";
import ItemModal from "./ItemModal";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Item {
  id: string;
  name: string;
  unitOfMeasure: UnitOfMeasure;
  categoryId: string;
  category: { id: string; name: string; color: string };
}

interface Props {
  userRole: string;
  initialCategories: Category[];
  initialItems: Item[];
}

type Tab = "calendar" | "items" | "categories";

export default function EstoqueDiarioClient({ userRole, initialCategories, initialItems }: Props) {
  const router = useRouter();
  const isAdmin = userRole === "ADMIN";
  const [tab, setTab] = useState<Tab>("calendar");
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysWithStock, setDaysWithStock] = useState<Date[]>([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);

  // Modals
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item?: Category | null }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: Item | null }>({ open: false });
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth]);

  async function loadMonthData(date: Date) {
    setIsLoadingMonth(true);
    try {
      const datesStrs = await getDaysWithStock(date.getMonth(), date.getFullYear());
      setDaysWithStock(datesStrs.map((d: string) => parseISO(d)));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMonth(false);
    }
  }

  function showToast(msg: string, type: "error" | "success" = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleDeleteCategory(id: string) {
    if (!confirm("Excluir esta categoria? O histórico passado não será afetado.")) return;
    startTransition(async () => {
      try {
        await deleteInventoryCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
        showToast("Categoria excluída com sucesso", "success");
      } catch {
        showToast("Erro ao excluir categoria");
      }
    });
  }

  function handleDeleteItem(id: string) {
    if (!confirm("Excluir este item? O histórico passado não será afetado.")) return;
    startTransition(async () => {
      try {
        await deleteInventoryItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
        showToast("Item excluído com sucesso", "success");
      } catch {
        showToast("Erro ao excluir item");
      }
    });
  }

  // Render Calendar
  const handleDayClick = (day: Date) => {
    const isTodayDate = isToday(day);
    if (!isAdmin && !isTodayDate) {
      showToast("Acesso negado: Você só pode editar o estoque do dia atual.", "error");
      return;
    }
    const dateStr = format(day, "yyyy-MM-dd");
    router.push(`/admin/estoque-diario/${dateStr}`);
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
            ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"}`}>
          <AlertCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Voltar ao Admin"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <Image src="/logo.png" alt="Boteco4075" width={44} height={44} unoptimized />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Estoque Diário</h1>
            <p className="text-gray-500 text-sm mt-0.5">Gestão de Snapshot Diário</p>
          </div>
        </div>
        {isAdmin && tab !== "calendar" && (
          <button
            onClick={() => tab === "items" ? setItemModal({ open: true, item: null }) : setCategoryModal({ open: true, item: null })}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            {tab === "items" ? "Novo Item" : "Nova Categoria"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 md:px-8 pt-4 flex flex-wrap gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px
            ${tab === "calendar" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <CalendarDays size={15} /> Contagem Diária
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setTab("items")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px
                ${tab === "items" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Package size={15} /> Itens
            </button>
            <button
              onClick={() => setTab("categories")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-px
                ${tab === "categories" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Tag size={15} /> Categorias
            </button>
          </>
        )}
      </div>

      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* ── CALENDAR TAB ── */}
        {tab === "calendar" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wider">{d}</div>
              ))}

              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {days.map((day) => {
                const hasStock = daysWithStock.some(d => isSameDay(d, day));
                const isTodayDate = isToday(day);
                const isLocked = !isAdmin && !isTodayDate;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    disabled={isLoadingMonth}
                    className={`
                      relative flex flex-col items-center justify-center p-2 rounded-xl transition-all border
                      ${isTodayDate ? "ring-2 ring-orange-500 border-transparent" : "border-gray-100 hover:border-gray-300"}
                      ${hasStock ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-white"}
                      ${isLocked ? "opacity-60 cursor-not-allowed hover:bg-white hover:border-gray-100" : "cursor-pointer"}
                    `}
                  >
                    <span className={`text-sm font-semibold ${hasStock ? "text-green-700" : "text-gray-700"}`}>
                      {format(day, "d")}
                    </span>
                    {hasStock && <CheckCircle2 size={14} className="text-green-500 absolute top-1 right-1" />}
                    {isLocked && <Lock size={12} className="text-gray-400 absolute top-1 left-1" />}
                  </button>
                );
              })}
            </div>
            {isLoadingMonth && <div className="mt-6 text-center text-sm text-gray-400 animate-pulse">Carregando...</div>}
          </div>
        )}

        {/* ── ITEMS TAB ── */}
        {tab === "items" && isAdmin && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Mobile: cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {items.length === 0 && (
                <p className="px-4 py-10 text-center text-gray-400">Nenhum item cadastrado.</p>
              )}
              {items.map((i) => (
                <div key={i.id} className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{i.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: i.category.color + "22", color: i.category.color }}>
                        {i.category.name}
                      </span>
                      <span className="text-xs text-gray-400">{i.unitOfMeasure}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setItemModal({ open: true, item: i })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDeleteItem(i.id)} disabled={isPending} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <table className="w-full text-sm hidden sm:table">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Unidade</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">Nenhum item cadastrado.</td>
                  </tr>
                )}
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{i.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: i.category.color + "22", color: i.category.color }}>
                        {i.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{i.unitOfMeasure}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setItemModal({ open: true, item: i })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteItem(i.id)} disabled={isPending} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CATEGORIES TAB ── */}
        {tab === "categories" && isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">Nenhuma categoria cadastrada.</p>}
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{cat.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCategoryModal({ open: true, item: cat })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} disabled={isPending} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.item}
          onClose={(saved) => {
            setCategoryModal({ open: false });
            if (saved) router.refresh();
          }}
        />
      )}
      {itemModal.open && (
        <ItemModal
          item={itemModal.item}
          categories={categories}
          onClose={(saved) => {
            setItemModal({ open: false });
            if (saved) router.refresh();
          }}
        />
      )}
    </div>
  );
}
