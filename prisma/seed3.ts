/**
 * seed3.ts — Cardápio completo do Gonzaga's Restaurant
 *
 * Fonte: "produtos de venda.txt" (201 linhas, exportação Windows-1252)
 * Correções aplicadas:
 *   - Encoding: З→Ç, Б→Á, Г→Ã, Й→É
 *   - Preços: formato "X,Y,0000" → decimal (ex: 17,9,0000 → 17.90)
 *   - Typos: MILLANESA→MILANESA, BABATAS→BATATAS, TABUACHURRASCO→TÁBUA CHURRASCO, etc.
 *   - Duplicatas removidas: MOUSSE LIMÃO (×2), MOUSSE MARACUJÁ (×2),
 *     CAMPARI DOSE (R$6 removido, mantido R$10), COPO SOPA (R$9 removido, mantido R$10)
 *
 * Total: 12 categorias | 197 produtos
 *
 * Execução:
 *   npx ts-node --project tsconfig.json prisma/seed3.ts
 */

import { UnitOfMeasure, PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
// ─── Categorias ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
	{ name: 'Self Service', color: '#f97316' },
	{ name: 'Tábuas & Petiscos', color: '#22c55e' },
	{ name: 'Hambúrgueres', color: '#ef4444' },
	{ name: 'Combos & Barcas', color: '#8b5cf6' },
	{ name: 'Bebidas', color: '#06b6d4' },
	{ name: 'Cervejas & Chopps', color: '#f59e0b' },
	{ name: 'Drinks & Doses', color: '#7c3aed' },
	{ name: 'Vinhos & Espumantes', color: '#dc2626' },
	{ name: 'Caldos & Sopas', color: '#0284c7' },
	{ name: 'Cafés', color: '#92400e' },
	{ name: 'Sobremesas', color: '#ec4899' },
	{ name: 'Avulsos', color: '#6b7280' },
] as const;

type CatName = (typeof CATEGORIAS)[number]['name'];

// ─── Produtos ─────────────────────────────────────────────────────────────────

const PRODUTOS: { name: string; price: number; cat: CatName }[] = [
	// ── Self Service (15) ──────────────────────────────────────────────────────
	{ name: 'SELF SERVICE ALMOÇO', price: 77.99, cat: 'Self Service' },
	{ name: 'SELF SERVICE DE PROTEÍNAS', price: 99.99, cat: 'Self Service' },
	{ name: 'STROGONOFF DE FRANGO (3 ACOMPANHAMENTOS)', price: 18.0, cat: 'Self Service' },
	{ name: 'CHURRASCO 2 LINGUIÇAS (03 ACOMPANHAMENTOS)', price: 18.0, cat: 'Self Service' },
	{ name: 'FRANGO GRELHADO (3 ACOMPANHAMENTOS)', price: 18.0, cat: 'Self Service' },
	{ name: 'FRANGO À MILANESA (3 ACOMPANHAMENTOS)', price: 17.9, cat: 'Self Service' },
	{ name: 'SELF SERVICE', price: 62.99, cat: 'Self Service' },
	{ name: 'CARNE À PARMEGIANA (3 ACOMPANHAMENTOS)', price: 18.9, cat: 'Self Service' },
	{ name: 'CARNE GRELHADA (3 ACOMPANHAMENTOS)', price: 20.0, cat: 'Self Service' },
	{ name: 'CHURRASCO 2 LINGUIÇAS', price: 18.0, cat: 'Self Service' },
	{ name: 'STROGONOFF DE CARNE (3 ACOMPANHAMENTOS)', price: 20.0, cat: 'Self Service' },
	{ name: 'CAMARÃO CROCANTE À PARMEGIANA (3 ACOMPANHAMENTOS)', price: 30.0, cat: 'Self Service' },
	{ name: 'CAMARÃO CROCANTE (3 ACOMPANHAMENTOS)', price: 30.0, cat: 'Self Service' },
	{ name: 'PEIXE ATUM (3 ACOMPANHAMENTOS)', price: 20.0, cat: 'Self Service' },
	{ name: 'PEIXE À MILANESA (3 ACOMPANHAMENTOS)', price: 31.0, cat: 'Self Service' },

	// ── Bebidas (26) ──────────────────────────────────────────────────────────
	{ name: 'ÁGUA DE COCO', price: 9.0, cat: 'Bebidas' },
	{ name: 'ÁGUA MINERAL 500ML SEM GÁS', price: 5.0, cat: 'Bebidas' },
	{ name: 'ÁGUA MINERAL 500ML COM GÁS', price: 5.5, cat: 'Bebidas' },
	{ name: 'ICE TEA', price: 9.0, cat: 'Bebidas' },
	{ name: 'H2O 500ML', price: 9.0, cat: 'Bebidas' },
	{ name: 'SCHWEPPES CITRUS 350ML', price: 9.0, cat: 'Bebidas' },
	{ name: 'SCHWEPPES TÔNICA 350ML', price: 9.0, cat: 'Bebidas' },
	{ name: 'SUCO DE LARANJA 300ML', price: 9.0, cat: 'Bebidas' },
	{ name: 'SUCO DE LARANJA 500ML', price: 14.0, cat: 'Bebidas' },
	{ name: 'SUCO DE POLPA 300ML', price: 8.0, cat: 'Bebidas' },
	{ name: 'SUCO DE POLPA 500ML', price: 10.0, cat: 'Bebidas' },
	{ name: 'REFRIGERANTE 200ML', price: 5.9, cat: 'Bebidas' },
	{ name: 'REFRIGERANTE LATA 350ML', price: 7.9, cat: 'Bebidas' },
	{ name: 'REFRIGERANTE COCA COLA 500ML', price: 10.0, cat: 'Bebidas' },
	{ name: 'REFRIGERANTE COCA COLA 1L', price: 15.0, cat: 'Bebidas' },
	{ name: 'REFRIGERANTE GUARANÁ ANTARCTICA 1L', price: 13.0, cat: 'Bebidas' },
	{ name: 'RED BULL', price: 15.0, cat: 'Bebidas' },
	{ name: 'JARRA DE SUCO DE 1,5L', price: 26.0, cat: 'Bebidas' },
	{ name: 'TNT ENERGÉTICO', price: 11.0, cat: 'Bebidas' },
	{ name: 'REFRIGERANTE COCA COLA 2L', price: 22.0, cat: 'Bebidas' },
	{ name: 'JARRA DE SUCO DE 1,0L', price: 20.0, cat: 'Bebidas' },
	{ name: 'MONSTER ENERGÉTICO - 473ML', price: 15.0, cat: 'Bebidas' },
	{ name: 'SUCO SUMO 300ML', price: 8.0, cat: 'Bebidas' },
	{ name: 'TIK TOK LATA 350ML', price: 7.0, cat: 'Bebidas' },
	{ name: 'DEL VALLE PÊSSEGO 400ML', price: 9.0, cat: 'Bebidas' },
	{ name: 'DEL VALLE UVA 400ML', price: 9.0, cat: 'Bebidas' },

	// ── Drinks & Doses (21) ───────────────────────────────────────────────────
	{ name: 'BACARDI (DOSE)', price: 5.5, cat: 'Drinks & Doses' },
	{ name: 'BIG APPLE (DOSE)', price: 5.5, cat: 'Drinks & Doses' },
	{ name: 'CACHAÇA CABARÉ (DOSE)', price: 5.0, cat: 'Drinks & Doses' },
	{ name: 'CACHAÇA MATUTA (DOSE)', price: 7.5, cat: 'Drinks & Doses' },
	{ name: 'MARTINE (DOSE)', price: 5.5, cat: 'Drinks & Doses' },
	{ name: 'RUM MONTILLA (DOSE)', price: 5.5, cat: 'Drinks & Doses' },
	{ name: 'CACHAÇA PRECIOSA DO VALE', price: 7.0, cat: 'Drinks & Doses' },
	{ name: 'CAIPIROSCA NEVADA', price: 12.0, cat: 'Drinks & Doses' },
	{ name: "CAIPIROSCA GONZAGA'S", price: 12.0, cat: 'Drinks & Doses' },
	{ name: 'VODKA ORLOFF (DOSE)', price: 6.5, cat: 'Drinks & Doses' },
	{ name: 'VODKA SKY (DOSE)', price: 7.0, cat: 'Drinks & Doses' },
	{ name: 'VODKA SMIRNOFF (DOSE)', price: 6.5, cat: 'Drinks & Doses' },
	{ name: "WHISKY BALLANTINE'S (DOSE)", price: 12.0, cat: 'Drinks & Doses' },
	{ name: 'WHISKY BLACK & WHITE (DOSE)', price: 12.0, cat: 'Drinks & Doses' },
	{ name: 'WHISKY CHIVAS REGAL (DOSE)', price: 14.9, cat: 'Drinks & Doses' },
	{ name: 'WHISKY RED LABEL (DOSE)', price: 12.0, cat: 'Drinks & Doses' },
	{ name: "WHISKY TEACHER'S (DOSE)", price: 6.5, cat: 'Drinks & Doses' },
	{ name: 'WHISKY WHITE HORSE (DOSE)', price: 10.0, cat: 'Drinks & Doses' },
	{ name: 'WHISKY OLD PARR (DOSE)', price: 14.9, cat: 'Drinks & Doses' },
	{ name: 'CACHAÇA SERRA LIMPA', price: 49.0, cat: 'Drinks & Doses' },
	{ name: 'CAMPARI (DOSE)', price: 10.0, cat: 'Drinks & Doses' }, // mantido R$10 (linha 183); R$6 da linha 37 removido

	// ── Cervejas & Chopps (23) ────────────────────────────────────────────────
	{ name: 'LONG NECK BUDWEISER', price: 9.5, cat: 'Cervejas & Chopps' },
	{ name: 'LONG NECK STELLA ARTOIS', price: 11.0, cat: 'Cervejas & Chopps' },
	{ name: 'LONG NECK HEINEKEN', price: 12.0, cat: 'Cervejas & Chopps' },
	{ name: 'TULIPA CHOPP 300ML', price: 8.5, cat: 'Cervejas & Chopps' },
	{ name: 'TORRE DE CHOPP 1L', price: 30.0, cat: 'Cervejas & Chopps' },
	{ name: 'TORRE DE CHOPP 1,5L', price: 36.9, cat: 'Cervejas & Chopps' },
	{ name: 'TORRE DE CHOPP 2L', price: 50.0, cat: 'Cervejas & Chopps' },
	{ name: 'TORRE DE CHOPP 2,5L', price: 65.0, cat: 'Cervejas & Chopps' },
	{ name: 'TORRE DE CHOPP 3L', price: 75.0, cat: 'Cervejas & Chopps' },
	{ name: 'TORRE DE CHOPP 3,5L', price: 85.0, cat: 'Cervejas & Chopps' },
	{ name: 'CHOPP 500ML', price: 15.0, cat: 'Cervejas & Chopps' },
	{ name: 'CERVEJA LATA 350ML', price: 8.0, cat: 'Cervejas & Chopps' },
	{ name: 'CHOPP 200ML', price: 5.0, cat: 'Cervejas & Chopps' },
	{ name: 'BALDE COM 5 HEINEKEN LONG NECK', price: 60.0, cat: 'Cervejas & Chopps' },
	{ name: 'CERVEJA SKOL LATA 350ML', price: 6.5, cat: 'Cervejas & Chopps' },
	{ name: 'TULIPINHA DE CHOPP 200ML', price: 5.5, cat: 'Cervejas & Chopps' },
	{ name: 'LONG NECK ITAIPAVA 0,0% ÁLCOOL', price: 8.0, cat: 'Cervejas & Chopps' },
	{ name: 'ITAIPAVA 300ML', price: 8.0, cat: 'Cervejas & Chopps' },
	{ name: 'CERVEJA PETRA 600ML', price: 10.0, cat: 'Cervejas & Chopps' },
	{ name: 'HEINEKEN LATA ZERO 350ML', price: 10.0, cat: 'Cervejas & Chopps' },
	{ name: 'BALDE COM 5 BUDWEISER LONG NECK', price: 45.0, cat: 'Cervejas & Chopps' },
	{ name: 'PETRA 330ML', price: 10.0, cat: 'Cervejas & Chopps' },
	{ name: 'CERVEJA EISENBAHN 355ML', price: 10.0, cat: 'Cervejas & Chopps' },

	// ── Vinhos & Espumantes (8) ───────────────────────────────────────────────
	{ name: 'VINHO EM TAÇA - NACIONAL', price: 12.0, cat: 'Vinhos & Espumantes' },
	{ name: 'VINHO QUINTA DO MORGADO SUAVE (GARRAFA)', price: 32.0, cat: 'Vinhos & Espumantes' },
	{ name: 'VINHO SECO IMPORTADO (GARRAFA)', price: 58.0, cat: 'Vinhos & Espumantes' },
	{ name: 'VINHO TINTO SECO NACIONAL (GARRAFA)', price: 33.0, cat: 'Vinhos & Espumantes' },
	{ name: 'ESPUMANTE SAN MARTIN MOSCATEL (GARRAFA)', price: 39.99, cat: 'Vinhos & Espumantes' },
	{ name: 'VINHO SANTA HELENA (GARRAFA)', price: 57.0, cat: 'Vinhos & Espumantes' },
	{ name: 'VINHO IMPORTADO SECO 750ML', price: 57.0, cat: 'Vinhos & Espumantes' },
	{ name: 'VINHO OREMUS 245ML', price: 18.0, cat: 'Vinhos & Espumantes' },

	// ── Combos & Barcas (23) ─────────────────────────────────────────────────
	{ name: 'COMBO TÁBUA DE FRANGO E FRITAS + CHOPP DE 2,0L', price: 89.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO TÁBUA MISTÃO + CHOPP DE 2L', price: 99.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO TÁBUA COM FRITAS + CHOPP DE 2,0L', price: 69.9, cat: 'Combos & Barcas' },
	{ name: 'COMBO TÁBUA DE CAMARÃO CROCANTE + CHOPP DE 2,0L', price: 104.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO PETISCO MISTO (PRATO) + CHOPP DE 2,5L', price: 62.9, cat: 'Combos & Barcas' },
	{ name: "COMBO TÁBUA GONZAGA'S NA TELHA + CHOPP DE 2L", price: 139.9, cat: 'Combos & Barcas' },
	{ name: 'TÁBUA DE FRANGO CROCANTE + TORRE 2L', price: 99.99, cat: 'Combos & Barcas' },
	{ name: 'BARCA DANADA DE BOM + 01 GUARANÁ 1L', price: 69.99, cat: 'Combos & Barcas' },
	{ name: 'BARCA PAREA', price: 55.0, cat: 'Combos & Barcas' },
	{ name: 'BARCA ESTRIBADA - REFRI 1 LITRO', price: 99.0, cat: 'Combos & Barcas' },
	{ name: 'BARCA GONZAGÃO', price: 150.0, cat: 'Combos & Barcas' },
	{ name: 'BARCA RESPEITA JANUÁRIO', price: 99.99, cat: 'Combos & Barcas' },
	{ name: 'BARCA ARRETADA + GUARANÁ DE 1L', price: 59.99, cat: 'Combos & Barcas' },
	{ name: 'BARCA DOS INCANGADOS', price: 50.0, cat: 'Combos & Barcas' },
	{ name: 'COMBO TÁBUA MISTÃO + CHOPP DE 2,5L', price: 89.9, cat: 'Combos & Barcas' },
	{ name: 'COMBO CARNE DE SOL + CHOPP DE 2L', price: 69.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO TÁBUA DE FRANGO CROCANTE + CHOPP DE 2,0L', price: 74.9, cat: 'Combos & Barcas' },
	{ name: 'COMBO 1 HOT DOG', price: 29.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO 2 HOT DOG', price: 39.99, cat: 'Combos & Barcas' },
	{ name: "COMBO GONZAGA'S HOT DOG", price: 69.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO CHURRASCO MISTÃO + CHOPP DE 2L', price: 129.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO PICANHA + CHOPP DE 2L', price: 119.99, cat: 'Combos & Barcas' },
	{ name: 'COMBO TÁBUA DE FRANGO CROCANTE + CHOPP DE 2,0L (2)', price: 99.99, cat: 'Combos & Barcas' }, // linha 200 — preço diferente da linha 180

	// ── Hambúrgueres (12) ─────────────────────────────────────────────────────
	{ name: 'X BURGUER COM FRITAS', price: 24.9, cat: 'Hambúrgueres' },
	{ name: 'X BURGUER', price: 18.9, cat: 'Hambúrgueres' },
	{ name: 'CABULOSO COM FRITAS', price: 29.9, cat: 'Hambúrgueres' },
	{ name: 'CABULOSO', price: 24.9, cat: 'Hambúrgueres' },
	{ name: 'X-EGG BACON COM FRITAS', price: 27.9, cat: 'Hambúrgueres' },
	{ name: 'X-EGG BACON', price: 22.9, cat: 'Hambúrgueres' },
	{ name: 'X EGG COM FRITAS', price: 25.9, cat: 'Hambúrgueres' },
	{ name: 'X EGG', price: 20.9, cat: 'Hambúrgueres' },
	{ name: 'ARRETADO COM FRITAS', price: 29.9, cat: 'Hambúrgueres' },
	{ name: 'ARRETADO', price: 24.9, cat: 'Hambúrgueres' },
	{ name: 'INVOCADO COM FRITAS', price: 29.9, cat: 'Hambúrgueres' },
	{ name: 'INVOCADO', price: 24.9, cat: 'Hambúrgueres' },

	// ── Tábuas & Petiscos (47) ────────────────────────────────────────────────
	{ name: 'TÁBUA C/ BATATA FRITA (M)', price: 33.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ BATATA FRITA (G)', price: 50.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ CARNE E BATATA FRITA (M)', price: 60.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ CARNE E BATATA FRITA (G)', price: 79.0, cat: 'Tábuas & Petiscos' },
	{ name: 'MINI COXINHAS 15 UNIDADES', price: 30.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PETISCO INDIVIDUAL CAMARÃO CROCANTE 200G', price: 65.0, cat: 'Tábuas & Petiscos' },
	{ name: 'CAMARÃO ALHO E ÓLEO 400G', price: 50.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ FRANGO E BATATAS FRITAS (M)', price: 50.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ FRANGO E BATATAS FRITAS (G)', price: 65.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ CALABRESA E BATATAS FRITAS (M)', price: 50.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ CALABRESA E BATATAS FRITAS (G)', price: 65.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ CARNE, FRANGO E BATATAS FRITAS (M)', price: 60.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ CARNE, FRANGO E BATATAS FRITAS (G)', price: 79.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ FRANGO, CALABRESA E BATATAS FRITAS (G)', price: 60.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ PICANHA E BATATAS FRITAS (M)', price: 85.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ PICANHA E BATATAS FRITAS (G)', price: 90.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ FRANGO CROCANTE E BATATAS FRITAS (M)', price: 60.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA C/ FRANGO CROCANTE E BATATAS FRITAS (G)', price: 80.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA MISTÃO (M)', price: 65.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA MISTÃO (G)', price: 85.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA CAMARÃO CROCANTE E BATATA FRITA (M)', price: 70.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA CAMARÃO CROCANTE E BATATA FRITA (G)', price: 85.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA CHURRASCO MISTÃO COM BATATAS FRITAS (M)', price: 75.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA CHURRASCO MISTÃO COM BATATAS FRITAS (G)', price: 80.0, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA DE ESPETINHO (carne, frango, camarão e calabresa) FAROFA E VINAGRETE', price: 39.99, cat: 'Tábuas & Petiscos' },
	{ name: "TÁBUA GONZAGA'S", price: 100.0, cat: 'Tábuas & Petiscos' },
	{ name: 'ARRUMADINHO CALABRESA', price: 34.0, cat: 'Tábuas & Petiscos' },
	{ name: 'CAMARÃO AO ALHO E ÓLEO 200G', price: 50.0, cat: 'Tábuas & Petiscos' },
	{ name: 'CAMARÃO CROCANTE 200G', price: 60.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO CARNE C/ FRITAS INDIVIDUAL', price: 50.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO ANEL DE CEBOLA 150G', price: 35.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO MACAXEIRA FRITA 150G', price: 30.0, cat: 'Tábuas & Petiscos' },
	{ name: 'ESPETINHO DE CAMARÃO', price: 16.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO DE FRITAS (P) INDIVIDUAL', price: 12.9, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO QUEIJO COALHO COM MEL DE ENGENHO OU ORÉGANO', price: 18.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO BOLINHO: QUEIJO, BACALHAU, CAMARÃO OU CHARQUE (10 UNIDADES)', price: 19.0, cat: 'Tábuas & Petiscos' },
	{ name: 'ARRUMADINHO CHARQUE', price: 34.0, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO BATATA FRITA - 300G', price: 19.9, cat: 'Tábuas & Petiscos' },
	{ name: 'ISCA DE FRANGO - 300G', price: 19.9, cat: 'Tábuas & Petiscos' },
	{ name: 'FILÉ COM FRITAS - 300G', price: 55.0, cat: 'Tábuas & Petiscos' },
	{ name: 'CAMARÃO ALHO E ÓLEO - 350G', price: 34.99, cat: 'Tábuas & Petiscos' },
	{ name: 'CAMARÃO CROCANTE - 350G', price: 39.99, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO DE PASTÉIS - 6UN', price: 19.9, cat: 'Tábuas & Petiscos' },
	{ name: 'TÁBUA CARNE DE SOL (M)', price: 45.0, cat: 'Tábuas & Petiscos' },
	{ name: 'CARNE COM FRITAS 200G', price: 24.9, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO DE ANÉIS DE CEBOLA', price: 19.9, cat: 'Tábuas & Petiscos' },
	{ name: 'PORÇÃO DE MACAXEIRA FRITA', price: 10.0, cat: 'Tábuas & Petiscos' },

	// ── Caldos & Sopas (4) ────────────────────────────────────────────────────
	{ name: 'SOPA UN', price: 17.0, cat: 'Caldos & Sopas' },
	{ name: 'CALDINHO DE FEIJÃO', price: 9.9, cat: 'Caldos & Sopas' },
	{ name: 'CALDINHO DE PEIXE', price: 9.9, cat: 'Caldos & Sopas' },
	{ name: 'SOPA COPO 300ML', price: 10.0, cat: 'Caldos & Sopas' }, // mantido R$10 (linha 201); R$9 da linha 190 removido

	// ── Cafés (4) ─────────────────────────────────────────────────────────────
	{ name: 'CAFÉ PEQUENO', price: 3.0, cat: 'Cafés' },
	{ name: 'CAFÉ GRANDE', price: 5.0, cat: 'Cafés' },
	{ name: 'CAFÉ COM LEITE GRANDE', price: 6.0, cat: 'Cafés' },
	{ name: 'CAFÉ COM LEITE PEQUENO', price: 4.0, cat: 'Cafés' },

	// ── Sobremesas (7) ────────────────────────────────────────────────────────
	{ name: 'PUDIM', price: 9.0, cat: 'Sobremesas' },
	{ name: 'MOUSSE DE MARACUJÁ', price: 9.0, cat: 'Sobremesas' }, // mantido linha 172; linha 186 removida
	{ name: 'BOLO DE POTE', price: 9.0, cat: 'Sobremesas' },
	{ name: 'BROWNIE', price: 9.0, cat: 'Sobremesas' },
	{ name: 'MOUSSE DE LIMÃO', price: 9.0, cat: 'Sobremesas' }, // mantido linha 187; linha 188 removida
	{ name: 'MOUSSE DE UVA', price: 9.0, cat: 'Sobremesas' },
	{ name: 'SOBREMESA PEQUENA', price: 5.0, cat: 'Sobremesas' },

	// ── Avulsos (7) ───────────────────────────────────────────────────────────
	{ name: 'PÃO UNIDADE', price: 2.0, cat: 'Avulsos' },
	{ name: 'EMBALAGEM', price: 2.0, cat: 'Avulsos' },
	{ name: 'ADICIONAL PARA HAMBÚRGUERES', price: 7.0, cat: 'Avulsos' },
	{ name: 'ADICIONAL DE CAMARÃO', price: 13.0, cat: 'Avulsos' },
	{ name: 'ADICIONAL COCA COLA 1L', price: 5.0, cat: 'Avulsos' },
	{ name: 'ADICIONAL DE BATATA FRITA HAMBÚRGUER', price: 5.0, cat: 'Avulsos' },
	{ name: 'PÃO UN', price: 1.0, cat: 'Avulsos' }, // preço diferente de PÃO UNIDADE — mantidos ambos
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	console.log('╔══════════════════════════════════════════╗');
	console.log("║  seed3.ts — Cardápio Gonzaga's           ║");
	console.log('╚══════════════════════════════════════════╝\n');

	// 1. Upsert das 12 categorias (idempotente)
	const catMap = new Map<CatName, string>();
	for (const cat of CATEGORIAS) {
		const c = await prisma.category.upsert({
			where: { name: cat.name },
			update: {},
			create: cat,
		});
		catMap.set(cat.name, c.id);
	}
	console.log(`✓ ${CATEGORIAS.length} categorias criadas/verificadas.\n`);

	// 2. Criação dos produtos
	let created = 0;
	let skipped = 0;

	for (const p of PRODUTOS) {
		const categoryId = catMap.get(p.cat)!;
		const result = await prisma.product
			.create({
				data: {
					name: p.name,
					price: p.price,
					available: true,
					categoryId,
				},
			})
			.catch(() => null);

		if (result) {
			created++;
		} else {
			skipped++;
			console.warn(`  ⚠ Ignorado (já existe?): ${p.name}`);
		}
	}

	console.log(`\n✓ ${created} produtos criados.`);
	if (skipped > 0) console.log(`⚠ ${skipped} produto(s) ignorados.`);

	console.log('\n─────────────────────────────────────────');
	console.log('Resumo por categoria:');
	for (const cat of CATEGORIAS) {
		const count = PRODUTOS.filter((p) => p.cat === cat.name).length;
		console.log(`  ${cat.name.padEnd(22)} ${count} produtos`);
	}
	console.log('─────────────────────────────────────────');
	console.log(`  TOTAL                  ${PRODUTOS.length} produtos`);
	console.log('\nSeed3 concluído!');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
