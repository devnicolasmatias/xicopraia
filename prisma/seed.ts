import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed...");

  // Usuário administrador padrão
  const adminEmail = "admin@xicopraia.com.br";
  const adminPassword = "Admin@123";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`Usuário admin já existe: ${adminEmail}`);
  } else {
    const hashed = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        name: "Administrador",
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
        active: true,
      },
    });
    console.log(`Admin criado: ${admin.email}`);
  }

  // Mesas iniciais (1 a 10)
  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: { number: i, capacity: 4, status: "LIVRE" },
    });
  }
  // Mesa virtual do PDV (balcão) — alinhado a `src/lib/pdvConstants.ts`
  await prisma.table.upsert({
    where: { number: 99 },
    update: {},
    create: {
      number: 99,
      capacity: 1,
      status: "LIVRE",
      customerName: "Balcão / PDV",
    },
  });
  console.log("10 mesas + PDV (99) criados.");

  // Categorias e Produtos de exemplo
  const categoryData = [
    { name: "Pratos Principais", color: "#f97316" },
    { name: "Bebidas",           color: "#06b6d4" },
    { name: "Sobremesas",        color: "#ec4899" },
    { name: "Entradas",          color: "#22c55e" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories[cat.name] = c.id;
  }
  console.log(`${categoryData.length} categorias criadas.`);

  const products = [
    { name: "Filé com fritas",  price: 45.9, costPrice: 18.0, categoryName: "Pratos Principais" },
    { name: "Coca-Cola 350ml",  price: 7.5,  costPrice: 2.5,  categoryName: "Bebidas" },
    { name: "Pudim de leite",   price: 12.0, costPrice: 4.0,  categoryName: "Sobremesas" },
    { name: "Pão de alho",      price: 8.0,  costPrice: 2.0,  categoryName: "Entradas" },
  ];

  for (const p of products) {
    const { categoryName, ...rest } = p;
    await prisma.product.create({
      data: { ...rest, categoryId: createdCategories[categoryName], available: true },
    }).catch(() => null); // ignora duplicatas em re-seed
  }
  console.log(`${products.length} produtos criados.`);

  console.log("\nSeed concluído!");
  console.log("─────────────────────────────");
  console.log(`Email:  ${adminEmail}`);
  console.log(`Senha:  ${adminPassword}`);
  console.log("─────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
