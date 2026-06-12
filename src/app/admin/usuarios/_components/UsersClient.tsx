"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Plus, Edit2, ShieldAlert, ShieldCheck, Save, X, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createUser, updateUser, toggleUserStatus, type UserInput } from "@/app/actions/users";
import type { Role } from "@/generated/prisma";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
};

interface Props {
  initialUsers: UserData[];
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  GARCOM: "Garçom",
  COZINHA: "Cozinha",
  CAIXA: "Caixa",
};

export default function UsersClient({ initialUsers }: Props) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [error, setError] = useState("");

  const filteredUsers = initialUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleOpenModal(user?: UserData) {
    setError("");
    setEditingUser(user || null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingUser(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as Role;
    const password = formData.get("password") as string;

    const data: UserInput = { name, email, role, password };

    startTransition(async () => {
      try {
        if (editingUser) {
          await updateUser(editingUser.id, data);
        } else {
          await createUser(data);
        }
        handleCloseModal();
      } catch (err: any) {
        setError(err.message || "Ocorreu um erro inesperado.");
      }
    });
  }

  function handleToggleStatus(id: string, currentStatus: boolean) {
    if (!confirm(`Deseja realmente ${currentStatus ? 'desativar' : 'ativar'} este acesso?`)) return;
    startTransition(async () => {
      await toggleUserStatus(id, !currentStatus);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-10">
      <div className="bg-white border-b border-gray-200 px-6 sm:px-10 py-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" aria-label="Voltar ao painel">
              <ArrowLeft size={18} />
            </Link>
            <Image src="/logo.png" alt="Xico Praia" width={44} height={44} unoptimized className="shrink-0 hidden sm:block" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Equipe e Acessos</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie os funcionários, garçons e as permissões de cada um.</p>
            </div>
          </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Plus size={18} /> Novo Usuário
            </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 mt-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Cargo / Nível</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border
                          ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                            user.role === 'GARCOM' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            user.role === 'CAIXA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center gap-1.5 ${user.active ? 'text-green-600' : 'text-red-500'}`}>
                           {user.active ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                           {user.active ? 'Ativo' : 'Bloqueado'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button
                             onClick={() => handleOpenModal(user)}
                             className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                             title="Editar"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button
                             onClick={() => handleToggleStatus(user.id, user.active)}
                             disabled={isPending}
                             className={`p-1.5 rounded-lg transition text-sm font-medium border
                               ${user.active 
                                 ? 'text-red-600 hover:bg-red-50 border-transparent hover:border-red-200' 
                                 : 'text-green-600 hover:bg-green-50 border-transparent hover:border-green-200'
                               }`}
                           >
                             {user.active ? 'Desativar' : 'Reativar'}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingUser?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login)</label>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={editingUser?.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso (Cargo)</label>
                  <select
                    name="role"
                    required
                    defaultValue={editingUser?.role || "GARCOM"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition bg-white"
                  >
                    <option value="ADMIN">Administrador (Acesso Total)</option>
                    <option value="GARCOM">Garçom (Acesso às Mesas)</option>
                    <option value="CAIXA">Caixa (Acesso ao PDV)</option>
                    <option value="COZINHA">Cozinha (Acesso ao Monitor KDS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {editingUser && <span className="text-gray-400 font-normal">(Deixe em branco para manter a atual)</span>}
                  </label>
                  <input
                    name="password"
                    type="password"
                    required={!editingUser}
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition disabled:opacity-70"
                >
                  <Save size={16} /> {isPending ? "Salvando..." : "Salvar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
