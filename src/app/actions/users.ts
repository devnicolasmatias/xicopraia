"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import type { Role } from "@/generated/prisma";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas administradores podem gerenciar a equipe.");
  }
  return session;
}

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export async function createUser(data: UserInput) {
  await requireAdmin();

  if (!data.password) throw new Error("Senha é obrigatória para criar um usuário.");

  // Valida e-mail duplicado
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Já existe um usuário com este e-mail.");

  const hashed = await hashPassword(data.password);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
      active: true, // Novo usuário sempre entra ativado
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  await requireAdmin();

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
  };

  if (data.password && data.password.trim() !== "") {
    updateData.password = await hashPassword(data.password);
  }

  // Verifica se não está mudando o email para um já existente em outro ID
  if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) {
          throw new Error("Já existe outro usuário com este e-mail.");
      }
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserStatus(id: string, newStatus: boolean) {
  await requireAdmin();

  await prisma.user.update({
    where: { id },
    data: { active: newStatus },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}
