import type { Role, TableStatus } from "@/generated/prisma";

export type { Role, TableStatus };

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
}

export interface CategoryDTO {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  imageUrl?: string | null;
  available: boolean;
  categoryId: string;
  category: CategoryDTO;
}

export interface TableDTO {
  id: string;
  number: number;
  status: TableStatus;
  capacity: number;
}
