import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

export const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<Omit<SessionPayload, "expiresAt"> | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, role: true, password: true, active: true },
  });

  if (!user || !user.active) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}
