"use server";

import { redirect } from "next/navigation";
import { validateCredentials } from "@/lib/auth";
import { createSession, deleteSession, getSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const user = await validateCredentials(email, password);

  if (!user) {
    return { error: "E-mail ou senha inválidos." };
  }

  await createSession(user);

  // Redireciona sempre para o Painel Central
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function getCurrentUser() {
  return getSession();
}
