import { UnitOfMeasure, PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Estrutura de dados organizada por Categoria -> Itens
const inventoryData = [
    {
        name: 'VERDURAS E FRUTAS',
        color: '#4CAF50', // Verde
        items: [
            { name: 'Alface verde', uom: UnitOfMeasure.UN },
            { name: 'Alface roxo', uom: UnitOfMeasure.UN },
            { name: 'Alface americana', uom: UnitOfMeasure.UN },
            { name: 'Tomate', uom: UnitOfMeasure.KG },
            { name: 'Tomate verde', uom: UnitOfMeasure.KG },
            { name: 'Cebola branca', uom: UnitOfMeasure.KG },
            { name: 'Cebola roxa', uom: UnitOfMeasure.KG },
            { name: 'Banana', uom: UnitOfMeasure.KG },
            { name: 'Cenoura', uom: UnitOfMeasure.KG },
            { name: 'Batata inglesa', uom: UnitOfMeasure.KG },
            { name: 'Couve-flor', uom: UnitOfMeasure.UN },
            { name: 'Couve-folha', uom: UnitOfMeasure.UN }, // Corrigido para UN
            { name: 'Mamão', uom: UnitOfMeasure.KG },
            { name: 'Pimenta verde', uom: UnitOfMeasure.KG },
            { name: 'Berinjela', uom: UnitOfMeasure.KG },
            { name: 'Laranja', uom: UnitOfMeasure.KG },
            { name: 'Rúcula', uom: UnitOfMeasure.UN },
            { name: 'Limão', uom: UnitOfMeasure.KG },
            { name: 'Acelga', uom: UnitOfMeasure.UN },
            { name: 'Pimenta amarela', uom: UnitOfMeasure.KG },
            { name: 'Pimenta vermelha', uom: UnitOfMeasure.KG },
            { name: 'Cebolinha', uom: UnitOfMeasure.UN },
            { name: 'Salsinha', uom: UnitOfMeasure.UN },
            { name: 'Chuchu', uom: UnitOfMeasure.KG },
            { name: 'Beterraba', uom: UnitOfMeasure.KG },
            { name: 'Manga', uom: UnitOfMeasure.KG },
            { name: 'Jerimum', uom: UnitOfMeasure.KG },
            { name: 'Alho', uom: UnitOfMeasure.KG },
            { name: 'Quiabo', uom: UnitOfMeasure.KG },
            { name: 'Maxixe', uom: UnitOfMeasure.KG },
            { name: 'Vagem', uom: UnitOfMeasure.KG },
            { name: 'Pepino', uom: UnitOfMeasure.KG },
            { name: 'Abacaxi', uom: UnitOfMeasure.UN },
            { name: 'Melancia', uom: UnitOfMeasure.KG },
            { name: 'Brócolis', uom: UnitOfMeasure.UN },
            { name: 'Coentro', uom: UnitOfMeasure.UN },
            { name: 'Uvas passas', uom: UnitOfMeasure.KG },
            { name: 'Macaxeira', uom: UnitOfMeasure.KG },
            { name: 'Batata doce', uom: UnitOfMeasure.KG },
            { name: 'Polpa (acerola, caju, goiaba, maracujá)', uom: UnitOfMeasure.PCT },
            { name: 'Sálvia', uom: UnitOfMeasure.UN },
            { name: 'Alecrim', uom: UnitOfMeasure.UN },
            { name: 'Ovos', uom: UnitOfMeasure.DZ },
        ]
    },
    {
        name: 'COZINHA DE BAIXO — ESTOQUE SECO',
        color: '#FF9800', // Laranja
        items: [
            { name: 'Feijão macassar', uom: UnitOfMeasure.KG },
            { name: 'Feijão carioca', uom: UnitOfMeasure.KG },
            { name: 'Feijão preto', uom: UnitOfMeasure.KG },
            { name: 'Feijão branco', uom: UnitOfMeasure.KG },
            { name: 'Fava', uom: UnitOfMeasure.KG },
            { name: 'Arroz branco', uom: UnitOfMeasure.KG },
            { name: 'Arroz integral', uom: UnitOfMeasure.KG },
            { name: 'Açúcar', uom: UnitOfMeasure.KG },
            { name: 'Sal grosso', uom: UnitOfMeasure.KG },
            { name: 'Sal', uom: UnitOfMeasure.KG },
            { name: 'Milho manguzá', uom: UnitOfMeasure.PCT },
            { name: 'Lasanha', uom: UnitOfMeasure.PCT },
            { name: 'Massa de lasanha', uom: UnitOfMeasure.PCT },
            { name: 'Fettuccine', uom: UnitOfMeasure.PCT },
            { name: 'Spaghetti', uom: UnitOfMeasure.PCT },
            { name: 'Macarrão parafuso', uom: UnitOfMeasure.PCT },
            { name: 'Macarrão penne', uom: UnitOfMeasure.PCT },
            { name: 'Flocão / fubá', uom: UnitOfMeasure.PCT },
            { name: 'Coloral 500g', uom: UnitOfMeasure.UN },
            { name: 'Farinha de mandioca', uom: UnitOfMeasure.KG },
            { name: 'Farinha de empanar', uom: UnitOfMeasure.KG },
            { name: 'Farinha Panko', uom: UnitOfMeasure.KG },
            { name: 'Farinha de trigo', uom: UnitOfMeasure.KG },
            { name: 'Chocolate em pó', uom: UnitOfMeasure.KG },
            { name: 'Leite condensado', uom: UnitOfMeasure.CX },
            { name: 'Leite em pó', uom: UnitOfMeasure.PCT },
            { name: 'Creme de leite 1kg', uom: UnitOfMeasure.CX },
            { name: 'Leite de coco 500ml', uom: UnitOfMeasure.UN },
            { name: 'Óleo 500ml', uom: UnitOfMeasure.UN },
            { name: 'Óleo 900ml', uom: UnitOfMeasure.UN },
            { name: 'Azeite de oliva', uom: UnitOfMeasure.UN },
            { name: 'Azeite balde', uom: UnitOfMeasure.UN },
            { name: 'Vinagre maçã', uom: UnitOfMeasure.UN },
            { name: 'Vinagre', uom: UnitOfMeasure.UN },
            { name: 'Mel', uom: UnitOfMeasure.L },
            { name: 'Mel de engenho', uom: UnitOfMeasure.L },
            { name: 'Molho inglês', uom: UnitOfMeasure.L },
            { name: 'Molho de pimenta', uom: UnitOfMeasure.L },
            { name: 'Molho de tomate 1,7kg', uom: UnitOfMeasure.UN },
            { name: 'Molho branco 1kg', uom: UnitOfMeasure.UN },
            { name: 'Molho rosé', uom: UnitOfMeasure.L },
            { name: 'Molho italiano', uom: UnitOfMeasure.L },
            { name: 'Molho ervas finas', uom: UnitOfMeasure.L },
            { name: 'Molho Caesar', uom: UnitOfMeasure.L },
            { name: 'Molho de queijo', uom: UnitOfMeasure.L },
            { name: 'Molho limão', uom: UnitOfMeasure.L },
            { name: 'Molho shoyu', uom: UnitOfMeasure.L },
            { name: 'Molho de alho', uom: UnitOfMeasure.L },
            { name: 'Ketchup', uom: UnitOfMeasure.UN },
            { name: 'Mostarda', uom: UnitOfMeasure.UN },
            { name: 'Barbecue', uom: UnitOfMeasure.UN },
            { name: 'Maionese 1kg', uom: UnitOfMeasure.UN },
            { name: 'Purê de batata 1kg', uom: UnitOfMeasure.UN },
            { name: 'Batata palha 800g', uom: UnitOfMeasure.PCT },
            { name: 'Ervilha e milho (lata)', uom: UnitOfMeasure.UN },
            { name: 'Café', uom: UnitOfMeasure.PCT },
            { name: 'Leite 750g', uom: UnitOfMeasure.UN },
            { name: 'Caldo de carne', uom: UnitOfMeasure.PCT },
            { name: 'Pimenta biquinho balde', uom: UnitOfMeasure.UN },
            { name: 'Amaciante de carne', uom: UnitOfMeasure.PCT },
            { name: 'Tempero Nordeste', uom: UnitOfMeasure.PCT },
        ]
    },
    {
        name: 'FREEZER PEIXES E PESCADOS — BAMBINI',
        color: '#03A9F4', // Azul claro
        items: [
            { name: 'Atum', uom: UnitOfMeasure.KG },
            { name: 'Camarão (pequeno)', uom: UnitOfMeasure.KG },
            { name: 'Camarão (grande)', uom: UnitOfMeasure.KG },
            { name: 'Filé de tilápia', uom: UnitOfMeasure.KG },
            { name: 'Pão de hambúrguer', uom: UnitOfMeasure.PCT },
        ]
    },
    {
        name: 'FREEZER GRANDE HORIZONTAL — BAMBINI',
        color: '#2196F3', // Azul
        items: [
            { name: 'Macaxeira', uom: UnitOfMeasure.KG },
            { name: 'Ervilha', uom: UnitOfMeasure.KG },
            { name: 'Queijo mussarela', uom: UnitOfMeasure.KG },
            { name: 'Calabresa', uom: UnitOfMeasure.KG },
            { name: 'Calabresa fatiada', uom: UnitOfMeasure.KG },
            { name: 'Bacon em cubos', uom: UnitOfMeasure.KG },
            { name: 'Presunto', uom: UnitOfMeasure.KG },
            { name: 'Batata (fritas)', uom: UnitOfMeasure.PCT },
            { name: 'Anel de cebola', uom: UnitOfMeasure.PCT },
            { name: 'Carne para chapa', uom: UnitOfMeasure.KG },
            { name: 'Carne de hambúrguer', uom: UnitOfMeasure.UN },
        ]
    },
    {
        name: 'FREEZER DAS CARNES — BAMBINI',
        color: '#F44336', // Vermelho
        items: [
            { name: 'Carne moída', uom: UnitOfMeasure.KG },
            { name: 'Contra filé', uom: UnitOfMeasure.KG },
            { name: 'Carne de hambúrguer', uom: UnitOfMeasure.UN },
            { name: 'Cupim', uom: UnitOfMeasure.KG },
            { name: 'Carne para chapa Gonzagas', uom: UnitOfMeasure.KG },
            { name: 'Carne para chapa Bambini', uom: UnitOfMeasure.KG },
            { name: 'Carne em cubos', uom: UnitOfMeasure.KG },
            { name: 'Bisteca de porco', uom: UnitOfMeasure.KG },
            { name: 'Lombinho temperado', uom: UnitOfMeasure.KG },
            { name: 'Linguiça Toscana', uom: UnitOfMeasure.KG },
            { name: 'Isca de carne', uom: UnitOfMeasure.KG },
            { name: 'Bife', uom: UnitOfMeasure.KG },
            { name: 'Carne de sol', uom: UnitOfMeasure.KG },
            { name: 'Rabada', uom: UnitOfMeasure.KG },
            { name: 'Costela', uom: UnitOfMeasure.KG },
            { name: 'Fígado', uom: UnitOfMeasure.KG },
            { name: 'Bacon fatiado', uom: UnitOfMeasure.KG },
        ]
    },
    {
        name: 'FREEZER FRANGO — BAMBINI',
        color: '#FFC107', // Amarelo
        items: [
            { name: 'Steak de frango', uom: UnitOfMeasure.UN },
            { name: 'Bife de frango', uom: UnitOfMeasure.KG },
            { name: 'Isca de frango', uom: UnitOfMeasure.KG },
            { name: 'Estrogonoff de frango', uom: UnitOfMeasure.KG },
            { name: 'Coxa temperada', uom: UnitOfMeasure.KG },
            { name: 'Coxinhas', uom: UnitOfMeasure.KG },
            { name: 'Filé de peito', uom: UnitOfMeasure.KG },
            { name: 'Frango no forno assado', uom: UnitOfMeasure.UN },
            { name: 'Frango desfiado', uom: UnitOfMeasure.KG },
            { name: 'Sobrecoxa temperada', uom: UnitOfMeasure.KG },
            { name: 'Frango em cubos', uom: UnitOfMeasure.KG },
            { name: 'Anel de cebola', uom: UnitOfMeasure.PCT },
            { name: 'Ampara de frango', uom: UnitOfMeasure.KG },
            { name: 'Carne para chapa', uom: UnitOfMeasure.KG },
        ]
    },
    {
        name: 'ESTOQUE CONGELADO — PISOL L2',
        color: '#00BCD4', // Ciano
        items: [
            { name: 'Atum', uom: UnitOfMeasure.KG },
            { name: 'Filé de Surubim', uom: UnitOfMeasure.KG },
            { name: 'Camarão', uom: UnitOfMeasure.KG },
            { name: 'Filé de tilápia', uom: UnitOfMeasure.KG },
            { name: 'Coxão mole', uom: UnitOfMeasure.KG },
            { name: 'Cupim', uom: UnitOfMeasure.KG },
            { name: 'Costela janelão', uom: UnitOfMeasure.KG },
            { name: 'Pernil', uom: UnitOfMeasure.KG },
            { name: 'Picanha', uom: UnitOfMeasure.KG },
            { name: 'Patinho', uom: UnitOfMeasure.KG },
            { name: 'Contra filé', uom: UnitOfMeasure.KG },
            { name: 'Paleta', uom: UnitOfMeasure.KG },
            { name: 'Carne moída', uom: UnitOfMeasure.KG },
            { name: 'Bacon fatiado', uom: UnitOfMeasure.KG },
            { name: 'Linguiça de frango', uom: UnitOfMeasure.KG },
            { name: 'Linguiça mista', uom: UnitOfMeasure.KG },
            { name: 'Calabresa', uom: UnitOfMeasure.KG },
            { name: 'Calabresa fina', uom: UnitOfMeasure.KG },
            { name: 'Sobrecoxa', uom: UnitOfMeasure.KG },
            { name: 'Filé de peito de frango', uom: UnitOfMeasure.KG },
            { name: 'Batata (fritas)', uom: UnitOfMeasure.PCT },
            { name: 'Anéis de cebola', uom: UnitOfMeasure.PCT },
            { name: 'Brócolis (congelado)', uom: UnitOfMeasure.PCT },
            { name: 'Macaxeira (congelada)', uom: UnitOfMeasure.PCT },
        ]
    },
    {
        name: 'DESCARTÁVEIS',
        color: '#9E9E9E', // Cinza
        items: [
            { name: 'Copo 50ml', uom: UnitOfMeasure.CX },
            { name: 'Copo 150ml', uom: UnitOfMeasure.CX },
            { name: 'Copo 300ml', uom: UnitOfMeasure.CX },
            { name: 'Copo 500ml', uom: UnitOfMeasure.CX },
            { name: 'Prato descartável', uom: UnitOfMeasure.PCT },
            { name: 'Marmita almoço', uom: UnitOfMeasure.PCT },
            { name: 'Marmita lanche', uom: UnitOfMeasure.PCT },
            { name: 'Pote de sobremesa', uom: UnitOfMeasure.PCT },
            { name: 'Guardanapo', uom: UnitOfMeasure.PCT },
            { name: 'Papel toalha', uom: UnitOfMeasure.PCT },
            { name: 'Papel alumínio', uom: UnitOfMeasure.UN },
            { name: 'Papel manteiga', uom: UnitOfMeasure.UN },
            { name: 'Papel filme', uom: UnitOfMeasure.UN },
            { name: 'Canudo', uom: UnitOfMeasure.PCT },
            { name: 'Palito', uom: UnitOfMeasure.PCT },
            { name: 'Sacola', uom: UnitOfMeasure.PCT },
            { name: 'Luva', uom: UnitOfMeasure.CX },
            { name: 'Touca', uom: UnitOfMeasure.PCT },
            { name: 'Garfo', uom: UnitOfMeasure.PCT },
            { name: 'Faca', uom: UnitOfMeasure.PCT },
            { name: 'Colher', uom: UnitOfMeasure.PCT },
            { name: 'Saco talher', uom: UnitOfMeasure.PCT },
            { name: 'Saco fechamento', uom: UnitOfMeasure.PCT },
            { name: 'Bubina maquineta', uom: UnitOfMeasure.UN },
            { name: 'Bubina impressora', uom: UnitOfMeasure.UN },
            { name: 'Bubina 1kg', uom: UnitOfMeasure.UN },
            { name: 'Bubina 3kg', uom: UnitOfMeasure.UN },
            { name: 'Bubina 10kg', uom: UnitOfMeasure.UN },
            { name: 'Açúcar (sachê/cx)', uom: UnitOfMeasure.CX },
            { name: 'Sal (cx)', uom: UnitOfMeasure.CX },
            { name: 'Adoçante', uom: UnitOfMeasure.UN },
            { name: 'Sabonete líquido', uom: UnitOfMeasure.L },
            { name: 'Gel higiênico', uom: UnitOfMeasure.L },
            { name: 'Álcool 70%', uom: UnitOfMeasure.L },
            { name: 'Detergente', uom: UnitOfMeasure.L },
            { name: 'Desinfetante', uom: UnitOfMeasure.L },
            { name: 'Veja', uom: UnitOfMeasure.UN },
        ]
    },
    {
        name: 'BEBIDAS',
        color: '#673AB7', // Roxo
        items: [
            { name: 'Coca lata', uom: UnitOfMeasure.UN },
            { name: 'Coca lata zero', uom: UnitOfMeasure.UN },
            { name: 'Coca 500ml', uom: UnitOfMeasure.UN },
            { name: 'Coca zero 500ml', uom: UnitOfMeasure.UN },
            { name: 'Coca 1l', uom: UnitOfMeasure.UN },
            { name: 'Coca zero 1l', uom: UnitOfMeasure.UN },
            { name: 'Fanta laranja', uom: UnitOfMeasure.UN },
            { name: 'Fanta uva', uom: UnitOfMeasure.UN },
            { name: 'Sprite lata', uom: UnitOfMeasure.UN },
            { name: 'Sprite lata zero', uom: UnitOfMeasure.UN },
            { name: 'Sprite vodka lata', uom: UnitOfMeasure.UN },
            { name: 'Guaraná 200ml', uom: UnitOfMeasure.UN },
            { name: 'Guaraná 220ml', uom: UnitOfMeasure.UN },
            { name: 'Guaraná 1l', uom: UnitOfMeasure.UN },
            { name: 'Guaraná lata zero', uom: UnitOfMeasure.UN },
            { name: 'Schweppes citrus', uom: UnitOfMeasure.UN },
            { name: 'Schweppes citrus zero', uom: UnitOfMeasure.UN },
            { name: 'Schweppes tônica', uom: UnitOfMeasure.UN },
            { name: 'Citrus lata zero', uom: UnitOfMeasure.UN },
            { name: 'Monster', uom: UnitOfMeasure.UN },
            { name: 'H2OH 500ml', uom: UnitOfMeasure.UN },
            { name: 'Del Valle', uom: UnitOfMeasure.UN },
            { name: 'Água de coco', uom: UnitOfMeasure.UN },
            { name: 'Água sem gás', uom: UnitOfMeasure.UN },
            { name: 'Água com gás', uom: UnitOfMeasure.UN },
            { name: 'Petra 330ml', uom: UnitOfMeasure.UN },
            { name: 'Eisenbahn', uom: UnitOfMeasure.UN },
            { name: 'Johnnie Walker Red 1l', uom: UnitOfMeasure.UN },
            { name: 'Old Parr 1l', uom: UnitOfMeasure.UN },
            { name: 'Black & White 1l', uom: UnitOfMeasure.UN },
            { name: 'Campari 1l', uom: UnitOfMeasure.UN },
            { name: 'Cachaça Matuta', uom: UnitOfMeasure.UN },
            { name: 'Vinho tinto', uom: UnitOfMeasure.UN },
            { name: 'Vinho branco', uom: UnitOfMeasure.UN },
        ]
    },
    {
        name: 'COZINHA DE CIMA — ÁREA DE PRODUÇÃO',
        color: '#E91E63', // Rosa
        items: [
            { name: 'Páprica', uom: UnitOfMeasure.G },
            { name: 'Edu Guedes', uom: UnitOfMeasure.G },
            { name: 'Amido de milho', uom: UnitOfMeasure.KG },
            { name: 'Leite', uom: UnitOfMeasure.L },
            { name: 'Trigo', uom: UnitOfMeasure.KG },
            { name: 'Caldo de galinha', uom: UnitOfMeasure.PCT },
            { name: 'Caldo de frutos do mar', uom: UnitOfMeasure.PCT },
            { name: 'Caldo de legumes', uom: UnitOfMeasure.PCT },
            { name: 'Caldo de carne', uom: UnitOfMeasure.PCT },
            { name: 'Lemon Pepper', uom: UnitOfMeasure.G },
            { name: 'Coloral', uom: UnitOfMeasure.KG },
            { name: 'Sal', uom: UnitOfMeasure.KG },
            { name: 'Açúcar', uom: UnitOfMeasure.KG },
            { name: 'Pimenta', uom: UnitOfMeasure.G },
            { name: 'Chimichurri', uom: UnitOfMeasure.G },
            { name: 'Louro', uom: UnitOfMeasure.PCT },
            { name: 'Molho escuro', uom: UnitOfMeasure.L },
            { name: 'Farinha de empanar', uom: UnitOfMeasure.KG },
            { name: 'Farinha Panko', uom: UnitOfMeasure.KG },
            { name: 'Farinha de mandioca', uom: UnitOfMeasure.KG },
            { name: 'Purê', uom: UnitOfMeasure.KG },
            { name: 'Creme de cebola', uom: UnitOfMeasure.PCT },
            { name: 'Amaciante', uom: UnitOfMeasure.PCT },
            { name: 'Orégano', uom: UnitOfMeasure.PCT },
            { name: 'Curry', uom: UnitOfMeasure.G },
            { name: 'Azeite composto', uom: UnitOfMeasure.L },
            { name: 'Queijo mussarela', uom: UnitOfMeasure.KG },
            { name: 'Queijo coalho', uom: UnitOfMeasure.KG },
            { name: 'Fatias de cheddar', uom: UnitOfMeasure.PCT },
            { name: 'Bisnaga de cheddar', uom: UnitOfMeasure.UN },
            { name: 'Manteiga', uom: UnitOfMeasure.KG },
            { name: 'Ketchup', uom: UnitOfMeasure.UN },
            { name: 'Mostarda', uom: UnitOfMeasure.UN },
            { name: 'Barbecue', uom: UnitOfMeasure.UN },
            { name: 'Pão de hambúrguer', uom: UnitOfMeasure.PCT },
            { name: 'Óleo composto', uom: UnitOfMeasure.L },
            { name: 'Ovos de codorna', uom: UnitOfMeasure.PCT },
            { name: 'Ervilha', uom: UnitOfMeasure.KG },
            { name: 'Cream cheese', uom: UnitOfMeasure.KG },
            { name: 'Azeitona', uom: UnitOfMeasure.KG },
            { name: 'Lata de milho', uom: UnitOfMeasure.UN },
            { name: 'Requeijão', uom: UnitOfMeasure.KG },
        ]
    }
];

async function main() {
    console.log('🌱 Iniciando o seed de estoque base...');

    for (const categoryData of inventoryData) {
        const category = await prisma.inventoryCategory.upsert({
            where: { name: categoryData.name },
            update: {},
            create: {
                name: categoryData.name,
                color: categoryData.color,
            },
        });

        console.log(`\n📁 Categoria: ${category.name}`);

        let itemsAdded = 0;

        for (const item of categoryData.items) {
            const existingItem = await prisma.inventoryItem.findFirst({
                where: {
                    name: item.name,
                    categoryId: category.id,
                },
            });

            if (!existingItem) {
                await prisma.inventoryItem.create({
                    data: {
                        name: item.name,
                        unitOfMeasure: item.uom,
                        categoryId: category.id,
                    },
                });
                itemsAdded++;
            }
        }

        console.log(`  └─ ${itemsAdded} novos itens adicionados de um total de ${categoryData.items.length}.`);
    }

    console.log('\n✅ Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao rodar o seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });