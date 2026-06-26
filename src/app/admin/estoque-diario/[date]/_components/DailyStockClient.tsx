"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, Minus, Plus, Tag, Search, ChevronDown, ChevronUp } from "lucide-react";
import { saveDailyStock, SaveDailyStockInput } from "@/app/actions/dailyStock";
import { UnitOfMeasure } from "@/generated/prisma";

type DailyItem = {
  itemId: string;
  itemName: string;
  categoryName: string;
  categoryColor: string;
  unitOfMeasure: UnitOfMeasure;
  quantity: number;
};

type DailyStockData = {
  id: string | null;
  date: string;
  items: DailyItem[];
};

export default function DailyStockClient({ initialData, dateStr }: { initialData: DailyStockData; dateStr: string }) {
  const router = useRouter();
  const [items, setItems] = useState<DailyItem[]>(initialData.items);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  function showToast(msg: string, type: "error" | "success" = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filteredItems = items.filter(item => 
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.categoryName]) {
      acc[item.categoryName] = [];
    }
    acc[item.categoryName].push(item);
    return acc;
  }, {} as Record<string, DailyItem[]>);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: SaveDailyStockInput = items.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        categoryName: item.categoryName,
        unitOfMeasure: item.unitOfMeasure,
        quantity: item.quantity,
      }));

      await saveDailyStock(dateStr, payload);
      showToast("Estoque salvo com sucesso!", "success");
      setTimeout(() => router.push("/admin/estoque-diario"), 1000);
    } catch (error) {
      showToast("Falha ao salvar estoque. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
            ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"}`}>
          <AlertCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => router.push("/admin/estoque-diario")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
              <ArrowLeft size={20} className="text-gray-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <Image src="/logo.png" alt="Boteco4075" width={36} height={36} unoptimized />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">Contagem de Estoque</h1>
              <p className="text-xs text-gray-500">
                {new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-3 md:px-5 py-2 md:py-2.5 rounded-xl transition shadow-sm shrink-0"
          >
            <Save size={16} />
            <span className="hidden sm:inline">{isSaving ? "Salvando..." : "Salvar Contagem"}</span>
            <span className="sm:hidden">{isSaving ? "..." : "Salvar"}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 md:px-8 pt-6 pb-2 max-w-5xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto space-y-6 md:space-y-8">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">Nenhum item cadastrado no sistema.</p>
            <p className="text-sm text-gray-400 mt-2">Peça para o administrador cadastrar as categorias e itens primeiro.</p>
          </div>
        ) : Object.keys(groupedItems).length === 0 && searchTerm ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">Nenhum item encontrado para "{searchTerm}".</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([categoryName, catItems]) => (
            <div key={categoryName} className="bg-white rounded-2xl shadow-sm overflow-hidden border transition-all" style={{ borderColor: `${catItems[0].categoryColor}40` }}>
              <div 
                onClick={() => toggleCategory(categoryName)}
                className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b cursor-pointer hover:bg-black/5 transition-colors" 
                style={{ backgroundColor: `${catItems[0].categoryColor}15`, borderBottomColor: `${catItems[0].categoryColor}30` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ backgroundColor: catItems[0].categoryColor }}>
                    <Tag size={16} className="text-white" />
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-gray-900">
                    {categoryName}
                  </h2>
                </div>
                {collapsedCategories[categoryName] ? (
                  <ChevronDown size={20} className="text-gray-600" />
                ) : (
                  <ChevronUp size={20} className="text-gray-600" />
                )}
              </div>

              {!collapsedCategories[categoryName] && (
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-white">
                  {catItems.map((item) => (
                    <div key={item.itemId} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-between">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 text-base">{item.itemName}</h3>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{item.unitOfMeasure}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
                        <button
                          onClick={() => handleQuantityChange(item.itemId, (item.quantity || 0) - 1)}
                          className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600 active:scale-95 transition-all"
                        >
                          <Minus size={20} />
                        </button>

                        <input
                          type="number"
                          value={item.quantity === 0 ? "" : item.quantity}
                          placeholder="0"
                          onChange={(e) => handleQuantityChange(item.itemId, Number(e.target.value))}
                          className="w-full h-12 text-center text-xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 placeholder:text-gray-300"
                          min="0"
                          step="0.01"
                        />

                        <button
                          onClick={() => handleQuantityChange(item.itemId, (item.quantity || 0) + 1)}
                          className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600 active:scale-95 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
