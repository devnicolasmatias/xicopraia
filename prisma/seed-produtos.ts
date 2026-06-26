import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Limpando produtos e categorias existentes ===");

  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("Produtos e categorias removidos.\n");

  // --- Categorias ---
  const categorias = [
    { name: "Produtos Preparados", color: "#f97316" },
    { name: "Bebidas",             color: "#06b6d4" },
    { name: "Destilados e Doses",  color: "#8b5cf6" },
    { name: "Drinks Preparados",   color: "#ec4899" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categorias) {
    const c = await prisma.category.create({ data: cat });
    catMap[cat.name] = c.id;
    console.log(`Categoria criada: ${cat.name}`);
  }

  // --- Produtos ---
  const produtos: { name: string; ncm: string; price: number; categoryName: string }[] = [
    // PRODUTOS PREPARADOS
    { name: "Cupim Especial",                  ncm: "21069090", price: 20.00, categoryName: "Produtos Preparados" },
    { name: "Carne",                           ncm: "21069090", price: 16.00, categoryName: "Produtos Preparados" },
    { name: "Carne de Sol",                    ncm: "21069090", price: 14.00, categoryName: "Produtos Preparados" },
    { name: "Picanha Argentina",               ncm: "21069090", price: 24.00, categoryName: "Produtos Preparados" },
    { name: "Picanha Nacional",                ncm: "21069090", price: 18.50, categoryName: "Produtos Preparados" },
    { name: "Carneiro",                        ncm: "21069090", price: 17.00, categoryName: "Produtos Preparados" },
    { name: "Carneiro com Osso",               ncm: "21069090", price: 15.00, categoryName: "Produtos Preparados" },
    { name: "Carne com Bacon",                 ncm: "21069090", price: 13.00, categoryName: "Produtos Preparados" },
    { name: "Pão de Alho",                     ncm: "21069090", price:  7.00, categoryName: "Produtos Preparados" },
    { name: "Queijo com Carne",                ncm: "21069090", price: 15.00, categoryName: "Produtos Preparados" },
    { name: "Queijo com Bacon",                ncm: "21069090", price: 13.00, categoryName: "Produtos Preparados" },
    { name: "Costela Suína",                   ncm: "21069090", price: 13.00, categoryName: "Produtos Preparados" },
    { name: "Carne Suína",                     ncm: "21069090", price: 12.00, categoryName: "Produtos Preparados" },
    { name: "Carne Moída com Charque",         ncm: "21069090", price: 11.50, categoryName: "Produtos Preparados" },
    { name: "Romeu e Julieta",                 ncm: "21069090", price: 12.00, categoryName: "Produtos Preparados" },
    { name: "Pernil",                          ncm: "21069090", price:  0.00, categoryName: "Produtos Preparados" },
    { name: "Coxa-Asa",                        ncm: "21069090", price: 13.00, categoryName: "Produtos Preparados" },
    { name: "Queijo",                          ncm: "21069090", price: 13.00, categoryName: "Produtos Preparados" },
    { name: "Frango",                          ncm: "21069090", price: 13.00, categoryName: "Produtos Preparados" },
    { name: "Frango com Bacon",                ncm: "21069090", price: 16.00, categoryName: "Produtos Preparados" },
    { name: "Coração",                         ncm: "21069090", price: 12.00, categoryName: "Produtos Preparados" },
    { name: "Batata Frita",                    ncm: "21069090", price: 25.00, categoryName: "Produtos Preparados" },
    { name: "Tripa Bovina",                    ncm: "21069090", price: 18.00, categoryName: "Produtos Preparados" },
    { name: "Carne de Sol na Manteiga",        ncm: "21069090", price: 60.00, categoryName: "Produtos Preparados" },
    { name: "Carne de Sol Desfiada Acebolada", ncm: "21069090", price: 49.00, categoryName: "Produtos Preparados" },
    { name: "Camarão",                         ncm: "21069090", price: 69.00, categoryName: "Produtos Preparados" },
    { name: "Ovo de Codorna",                  ncm: "21069090", price: 15.00, categoryName: "Produtos Preparados" },
    { name: "Bolinho de Bacalhau",             ncm: "21069090", price: 28.00, categoryName: "Produtos Preparados" },
    { name: "Macaxeira Frita",                 ncm: "21069090", price: 18.00, categoryName: "Produtos Preparados" },
    { name: "Caldinho de Feijoada e Fava",     ncm: "21042000", price: 12.00, categoryName: "Produtos Preparados" },
    { name: "Caldinho de Camarão",             ncm: "21042000", price: 16.00, categoryName: "Produtos Preparados" },
    { name: "Caldinho de Caranguejo",          ncm: "21042000", price: 16.00, categoryName: "Produtos Preparados" },
    { name: "Caldinho de Marisco",             ncm: "21042000", price: 16.00, categoryName: "Produtos Preparados" },

    // BEBIDAS
    { name: "Heineken 600ml",           ncm: "22030000", price: 20.00, categoryName: "Bebidas" },
    { name: "Heineken Long Neck",       ncm: "22030000", price: 15.00, categoryName: "Bebidas" },
    { name: "Heineken Long Neck Zero",  ncm: "22029100", price: 13.00, categoryName: "Bebidas" },
    { name: "Amstel 600ml",             ncm: "22030000", price: 14.00, categoryName: "Bebidas" },
    { name: "Original 600ml",           ncm: "22030000", price: 15.00, categoryName: "Bebidas" },
    { name: "Stella Artois Puro Gold",  ncm: "22030000", price: 15.00, categoryName: "Bebidas" },
    { name: "Red Bull",                 ncm: "22029900", price: 15.00, categoryName: "Bebidas" },
    { name: "Refrigerante Lata",        ncm: "22021000", price:  8.50, categoryName: "Bebidas" },
    { name: "Água Mineral 500ml",       ncm: "22011000", price:  5.50, categoryName: "Bebidas" },
    { name: "Água Mineral com Gás",     ncm: "22011000", price:  5.90, categoryName: "Bebidas" },
    { name: "Água de Coco",             ncm: "20098990", price:  9.00, categoryName: "Bebidas" },
    { name: "Suco Copo",               ncm: "20098990", price:  8.00, categoryName: "Bebidas" },

    // DESTILADOS E DOSES
    { name: "Johnnie Walker Red",       ncm: "22083020", price: 15.00, categoryName: "Destilados e Doses" },
    { name: "Johnnie Walker Black",     ncm: "22083020", price: 26.90, categoryName: "Destilados e Doses" },
    { name: "Old Parr",                 ncm: "22083020", price: 18.90, categoryName: "Destilados e Doses" },
    { name: "Black & White",            ncm: "22083020", price: 10.00, categoryName: "Destilados e Doses" },
    { name: "Gin",                      ncm: "22085000", price: 18.00, categoryName: "Destilados e Doses" },
    { name: "Campari",                  ncm: "22087000", price:  9.50, categoryName: "Destilados e Doses" },
    { name: "Vodka Smirnoff",           ncm: "22086000", price:  8.90, categoryName: "Destilados e Doses" },
    { name: "Vodka Absolut",            ncm: "22086000", price: 18.90, categoryName: "Destilados e Doses" },
    { name: "Preciosa do Vale Cristal", ncm: "22084000", price:  8.50, categoryName: "Destilados e Doses" },
    { name: "Matuta Cristal",           ncm: "22084000", price: 25.90, categoryName: "Destilados e Doses" },
    { name: "Matuta Mel e Limão",       ncm: "22084000", price: 22.90, categoryName: "Destilados e Doses" },

    // DRINKS PREPARADOS
    { name: "Aperol Spritz",            ncm: "22089000", price: 28.90, categoryName: "Drinks Preparados" },
    { name: "Drink Boteco 4075",        ncm: "22089000", price: 26.00, categoryName: "Drinks Preparados" },
    { name: "Drink XD",                 ncm: "22089000", price: 28.00, categoryName: "Drinks Preparados" },
    { name: "Caipirinha",               ncm: "22089000", price: 13.00, categoryName: "Drinks Preparados" },
    { name: "Caipirosca Smirnoff",      ncm: "22089000", price: 15.00, categoryName: "Drinks Preparados" },
    { name: "Caipirosca Absolut",       ncm: "22089000", price: 18.90, categoryName: "Drinks Preparados" },
  ];

  let count = 0;
  for (const p of produtos) {
    await prisma.product.create({
      data: {
        name: p.name,
        ncm: p.ncm,
        price: p.price,
        categoryId: catMap[p.categoryName],
        available: true,
      },
    });
    count++;
  }

  console.log(`\n${count} produtos cadastrados com sucesso!`);
  console.log("─────────────────────────────");
  console.log("Categorias:");
  for (const cat of categorias) {
    const qtd = produtos.filter(p => p.categoryName === cat.name).length;
    console.log(`  ${cat.name}: ${qtd} produtos`);
  }
  console.log("─────────────────────────────");
  console.log("\nNota: Pernil cadastrado com preço R$ 0,00 (não constava no cardápio).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
