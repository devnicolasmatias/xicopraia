--
-- PostgreSQL database dump
--

\restrict xzkhFZ21WXhpaIiPoozg73RFzD0qvLfN2h2dQCwswId05moOjXn4okFAKihJ9Z1

-- Dumped from database version 14.20 (Debian 14.20-1.pgdg13+1)
-- Dumped by pg_dump version 14.20 (Debian 14.20-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CashbackType; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."CashbackType" AS ENUM (
    'EARNED',
    'REDEEMED',
    'MANUAL'
);


ALTER TYPE public."CashbackType" OWNER TO xicopraia_user;

--
-- Name: MessageDirection; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."MessageDirection" AS ENUM (
    'INBOUND',
    'OUTBOUND'
);


ALTER TYPE public."MessageDirection" OWNER TO xicopraia_user;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'AUDIO',
    'IMAGE',
    'FILE'
);


ALTER TYPE public."MessageType" OWNER TO xicopraia_user;

--
-- Name: OrderItemStatus; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."OrderItemStatus" AS ENUM (
    'PENDENTE',
    'PREPARANDO',
    'PRONTO',
    'ENTREGUE',
    'CANCELADO'
);


ALTER TYPE public."OrderItemStatus" OWNER TO xicopraia_user;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'ABERTO',
    'ENVIADO',
    'FECHADO',
    'PAGO',
    'CANCELADO'
);


ALTER TYPE public."OrderStatus" OWNER TO xicopraia_user;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'DINHEIRO',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'PIX'
);


ALTER TYPE public."PaymentMethod" OWNER TO xicopraia_user;

--
-- Name: PrintJobStatus; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."PrintJobStatus" AS ENUM (
    'PENDING',
    'CLAIMED',
    'DONE',
    'FAILED'
);


ALTER TYPE public."PrintJobStatus" OWNER TO xicopraia_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'GARCOM',
    'COZINHA',
    'CAIXA'
);


ALTER TYPE public."Role" OWNER TO xicopraia_user;

--
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."TableStatus" AS ENUM (
    'LIVRE',
    'OCUPADA',
    'PEDIU_CONTA',
    'RESERVADA',
    'AGUARDANDO_LIMPEZA'
);


ALTER TYPE public."TableStatus" OWNER TO xicopraia_user;

--
-- Name: UnitOfMeasure; Type: TYPE; Schema: public; Owner: xicopraia_user
--

CREATE TYPE public."UnitOfMeasure" AS ENUM (
    'KG',
    'G',
    'L',
    'ML',
    'UN',
    'CX',
    'PCT',
    'DZ'
);


ALTER TYPE public."UnitOfMeasure" OWNER TO xicopraia_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cashback_config; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.cashback_config (
    id text NOT NULL,
    percentage numeric(5,2) NOT NULL,
    "expiryDays" integer DEFAULT 30 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cashback_config OWNER TO xicopraia_user;

--
-- Name: cashback_transactions; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.cashback_transactions (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "orderId" text,
    type public."CashbackType" NOT NULL,
    amount numeric(10,2) NOT NULL,
    "purchaseAmount" numeric(10,2),
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cashback_transactions OWNER TO xicopraia_user;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO xicopraia_user;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    cpf text,
    "cashbackBalance" numeric(10,2) DEFAULT 0 NOT NULL,
    "cashbackExpiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO xicopraia_user;

--
-- Name: daily_stock_items; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.daily_stock_items (
    id text NOT NULL,
    "dailyStockId" text NOT NULL,
    "itemId" text NOT NULL,
    "itemName" text NOT NULL,
    "categoryName" text NOT NULL,
    "unitOfMeasure" public."UnitOfMeasure" NOT NULL,
    quantity numeric(10,3) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.daily_stock_items OWNER TO xicopraia_user;

--
-- Name: daily_stocks; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.daily_stocks (
    id text NOT NULL,
    date date NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.daily_stocks OWNER TO xicopraia_user;

--
-- Name: fiscal_config; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.fiscal_config (
    id text NOT NULL,
    cnpj text NOT NULL,
    "razaoSocial" text NOT NULL,
    "nomeFantasia" text,
    ie text NOT NULL,
    crt integer DEFAULT 1 NOT NULL,
    logradouro text NOT NULL,
    numero text NOT NULL,
    complemento text,
    bairro text NOT NULL,
    municipio text NOT NULL,
    "cMunicipio" text NOT NULL,
    uf text NOT NULL,
    cep text NOT NULL,
    telefone text,
    serie integer DEFAULT 1 NOT NULL,
    "proximoNNF" integer DEFAULT 1 NOT NULL,
    "tpAmb" integer DEFAULT 2 NOT NULL,
    cfop text DEFAULT '5102'::text NOT NULL,
    csosn text DEFAULT '400'::text NOT NULL,
    "cIdToken" text DEFAULT ''::text NOT NULL,
    csc text DEFAULT ''::text NOT NULL,
    "urlAutorizacao" text,
    "urlQrCode" text,
    "tpEmis" integer DEFAULT 1 NOT NULL,
    "dhContingencia" timestamp(3) without time zone,
    "xJustContingencia" text,
    "tlsVersion" text DEFAULT 'TLSv1.2'::text NOT NULL,
    "certBase64" text,
    "certSenha" text,
    "certValidade" timestamp(3) without time zone,
    "certCn" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fiscal_config OWNER TO xicopraia_user;

--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.ingredients (
    id text NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    "currentStock" numeric(10,3) DEFAULT 0 NOT NULL,
    "minimumStock" numeric(10,3) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ingredients OWNER TO xicopraia_user;

--
-- Name: inventory_categories; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.inventory_categories (
    id text NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.inventory_categories OWNER TO xicopraia_user;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.inventory_items (
    id text NOT NULL,
    name text NOT NULL,
    "unitOfMeasure" public."UnitOfMeasure" NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.inventory_items OWNER TO xicopraia_user;

--
-- Name: nfce_documents; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.nfce_documents (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    chave character varying(44) NOT NULL,
    "nNF" integer NOT NULL,
    serie integer NOT NULL,
    "tpAmb" integer NOT NULL,
    status text DEFAULT 'PENDENTE'::text NOT NULL,
    "protNFe" text,
    "dhRecbto" text,
    "cStat" integer,
    "xMotivo" text,
    "xmlNFe" text,
    "xmlProcNFe" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.nfce_documents OWNER TO xicopraia_user;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    notes text,
    status public."OrderItemStatus" DEFAULT 'PENDENTE'::public."OrderItemStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_items OWNER TO xicopraia_user;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "tableId" text NOT NULL,
    "customerId" text,
    status public."OrderStatus" DEFAULT 'ABERTO'::public."OrderStatus" NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO xicopraia_user;

--
-- Name: print_jobs; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.print_jobs (
    id text NOT NULL,
    content text NOT NULL,
    descricao text,
    status public."PrintJobStatus" DEFAULT 'PENDING'::public."PrintJobStatus" NOT NULL,
    "claimedBy" text,
    "claimedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.print_jobs OWNER TO xicopraia_user;

--
-- Name: product_ingredients; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.product_ingredients (
    id text NOT NULL,
    "productId" text NOT NULL,
    "ingredientId" text NOT NULL,
    quantity numeric(10,3) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_ingredients OWNER TO xicopraia_user;

--
-- Name: products; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "costPrice" numeric(10,2),
    "imageUrl" text,
    ncm text DEFAULT '21069090'::text,
    available boolean DEFAULT true NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO xicopraia_user;

--
-- Name: tables; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.tables (
    id text NOT NULL,
    number integer NOT NULL,
    status public."TableStatus" DEFAULT 'LIVRE'::public."TableStatus" NOT NULL,
    capacity integer DEFAULT 4 NOT NULL,
    "customerName" text,
    "currentOrderId" text,
    "openedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tables OWNER TO xicopraia_user;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "serviceFee" numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    "cashbackDiscount" numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    "splitCount" integer DEFAULT 1 NOT NULL,
    "paidAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.transactions OWNER TO xicopraia_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'GARCOM'::public."Role" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO xicopraia_user;

--
-- Name: whatsapp_messages; Type: TABLE; Schema: public; Owner: xicopraia_user
--

CREATE TABLE public.whatsapp_messages (
    id text NOT NULL,
    phone text NOT NULL,
    direction public."MessageDirection" NOT NULL,
    type public."MessageType" DEFAULT 'TEXT'::public."MessageType" NOT NULL,
    content text,
    "mediaUrl" text,
    "mediaName" text,
    "messageId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.whatsapp_messages OWNER TO xicopraia_user;

--
-- Data for Name: cashback_config; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.cashback_config (id, percentage, "expiryDays", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cashback_transactions; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.cashback_transactions (id, "customerId", "orderId", type, amount, "purchaseAmount", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.categories (id, name, color, active, "createdAt", "updatedAt") FROM stdin;
cmqb9jsfh000001s25onbb6lu	Self-service	#ea580c	t	2026-06-12 18:31:58.637	2026-06-12 18:31:58.637
67df6dd6-f476-45fe-96ba-4c5cd6017aa4	Cuscuz Recheado	#f97316	t	2026-06-12 15:54:00.014	2026-06-12 15:54:00.014
f2b510e4-938f-46aa-a919-9dc7a81cc63f	Tigelinha Recheada	#f59e0b	t	2026-06-12 15:54:00.017	2026-06-12 15:54:00.017
e4fe861b-21ed-44b5-99d2-4ca70ded2118	Espetos e Cortes	#ef4444	t	2026-06-12 15:54:00.019	2026-06-12 15:54:00.019
d048dd75-245e-498d-893c-bfb99ee23b18	Churrasco no Pão	#92400e	t	2026-06-12 15:54:00.02	2026-06-12 15:54:00.02
353a8c2e-01a8-4d56-b351-8e4dacf47d31	Pão de Alho Recheado	#eab308	t	2026-06-12 15:54:00.022	2026-06-12 15:54:00.022
99a497ab-7257-491d-93f8-918fa90ee6fc	Pizza na Brasa	#dc2626	t	2026-06-12 15:54:00.024	2026-06-12 15:54:00.024
1c97eff9-af2c-4f0f-8232-e519a6d1ec41	Bolinhos	#fb923c	t	2026-06-12 15:54:00.028	2026-06-12 15:54:00.028
3687445b-df92-48aa-8b17-28acbee465b7	Purê de Macaxeira	#a16207	t	2026-06-12 15:54:00.029	2026-06-12 15:54:00.029
c03db7e7-1b85-47e5-8083-06c8c6b21296	Sopas e Caldos	#78716c	t	2026-06-12 15:54:00.03	2026-06-12 15:54:00.03
fb5260fc-0f92-4518-9943-71054600ca29	Petiscos	#84cc16	t	2026-06-12 15:54:00.031	2026-06-12 15:54:00.031
1e3d5ed5-2404-4dbf-9d65-2e581259fcaa	Chapa Mista	#7f1d1d	t	2026-06-12 15:54:00.032	2026-06-12 15:54:00.032
9a73cd36-75a9-4d87-b617-aaf781b79efe	Refeições	#22c55e	t	2026-06-12 15:54:00.033	2026-06-12 15:54:00.033
852860be-a795-46d6-8a3a-24302fd436f8	Drinks	#a855f7	t	2026-06-12 15:54:00.034	2026-06-12 15:54:00.034
634c6819-6bbc-4dca-9cbd-12ef8a1f841b	Whisky	#b45309	t	2026-06-12 15:54:00.035	2026-06-12 15:54:00.035
8f53aa0f-2875-451e-b357-a93f94f2f32c	Destilados	#3b82f6	t	2026-06-12 15:54:00.036	2026-06-12 15:54:00.036
eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	Cervejas	#ca8a04	t	2026-06-12 15:54:00.036	2026-06-12 15:54:00.036
19230eb2-7770-42d0-a065-47d59a312d9b	Sucos	#16a34a	t	2026-06-12 15:54:00.037	2026-06-12 15:54:00.037
ff000a97-815d-47e8-8a0e-0a33ae92ca08	Refrigerantes	#0ea5e9	t	2026-06-12 15:54:00.038	2026-06-12 15:54:00.038
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.customers (id, name, phone, cpf, "cashbackBalance", "cashbackExpiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: daily_stock_items; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.daily_stock_items (id, "dailyStockId", "itemId", "itemName", "categoryName", "unitOfMeasure", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: daily_stocks; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.daily_stocks (id, date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fiscal_config; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.fiscal_config (id, cnpj, "razaoSocial", "nomeFantasia", ie, crt, logradouro, numero, complemento, bairro, municipio, "cMunicipio", uf, cep, telefone, serie, "proximoNNF", "tpAmb", cfop, csosn, "cIdToken", csc, "urlAutorizacao", "urlQrCode", "tpEmis", "dhContingencia", "xJustContingencia", "tlsVersion", "certBase64", "certSenha", "certValidade", "certCn", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.ingredients (id, name, unit, "currentStock", "minimumStock", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inventory_categories; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.inventory_categories (id, name, color, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.inventory_items (id, name, "unitOfMeasure", "categoryId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: nfce_documents; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.nfce_documents (id, "transactionId", chave, "nNF", serie, "tpAmb", status, "protNFe", "dhRecbto", "cStat", "xMotivo", "xmlNFe", "xmlProcNFe", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.order_items (id, "orderId", "productId", quantity, "unitPrice", notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.orders (id, "tableId", "customerId", status, total, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: print_jobs; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.print_jobs (id, content, descricao, status, "claimedBy", "claimedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: product_ingredients; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.product_ingredients (id, "productId", "ingredientId", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.products (id, name, description, price, "costPrice", "imageUrl", ncm, available, "categoryId", "createdAt", "updatedAt") FROM stdin;
3d7a3aa2-8207-4033-8131-e266dc66f785	Coxao mole	Bovino	17.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.038	2026-06-12 15:54:00.038
b5b22497-c433-4f7f-9ded-8ec1dda494e1	Capa filé	Bovino	17.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.041	2026-06-12 15:54:00.041
c422abe2-7751-4420-b539-c0b58581473c	Alcatra	Bovino	19.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.042	2026-06-12 15:54:00.042
eae6725b-e1be-45f2-80b2-c148c61958ef	Maminha	Bovino	23.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.043	2026-06-12 15:54:00.043
f4f878e7-e015-4da9-841c-a09f3485c864	Cupim	Bovino	23.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.043	2026-06-12 15:54:00.043
fd054c53-6cca-427b-b27c-d098c64ce735	Carne de sol c/ queijo e nata	Bovino	35.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.047	2026-06-12 15:54:00.047
ca43bca5-b4f9-4331-95fd-4d7f03b67374	Picanha	Bovino	35.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.051	2026-06-12 15:54:00.051
d9c2d858-9989-4ea4-bab9-9b5560418866	Avalanche de queijo	Bovino	40.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.052	2026-06-12 15:54:00.052
51e228dd-0621-4863-8270-7e990759572c	Calabresa	Suíno	15.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.053	2026-06-12 15:54:00.053
17aeccc1-173b-4564-b6bd-cf0d087a033e	Lombo	Suíno	15.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.054	2026-06-12 15:54:00.054
d84b1f3d-8641-4d81-91fb-03001a4d0b52	Pernil	Suíno	14.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.055	2026-06-12 15:54:00.055
be121dd9-0e24-418b-a9b0-a7ac09d17ce5	Avalanche de queijo	Suíno	30.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.058	2026-06-12 15:54:00.058
40332732-8372-4027-936d-b4bd4b44fcb6	Ovos	Aves	10.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.059	2026-06-12 15:54:00.059
f503ab38-435f-4c83-931d-9473b76152b4	Frango	Aves	15.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.064	2026-06-12 15:54:00.064
36994944-2bd1-4c14-a6d1-09a3ad04b50c	Frango com bacon	Aves	17.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.065	2026-06-12 15:54:00.065
91b7871b-a395-46ad-82ab-767e54a487a6	Coração	Aves	17.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.066	2026-06-12 15:54:00.066
a13f8160-bbeb-45f3-bdbb-1e04ea1233c5	Coração duplo	Aves	27.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.069	2026-06-12 15:54:00.069
10ffef86-1d17-4184-b9ed-33503e49786f	Avalanche de queijo	Aves	35.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.07	2026-06-12 15:54:00.07
09667a41-f947-454d-ae46-ae6d3c1cae33	Peixe	Frutos do Mar	20.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.071	2026-06-12 15:54:00.071
8a331810-0f2c-49b1-b8ea-5d45bf32d6b5	Camarão	Frutos do Mar	35.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.072	2026-06-12 15:54:00.072
5439b1dc-8a36-4f33-99f9-bea49656287d	Caldeirada	Frutos do Mar	30.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.073	2026-06-12 15:54:00.073
f6bf64d7-099f-4932-898c-21f477321d1c	Avalanche de queijo	Frutos do Mar	45.00	\N	\N	21069090	t	67df6dd6-f476-45fe-96ba-4c5cd6017aa4	2026-06-12 15:54:00.074	2026-06-12 15:54:00.074
f54ed723-7c8d-4952-851f-ff462ac4da5c	Alho	Bovino	7.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.074	2026-06-12 15:54:00.074
a53a952d-f5ee-431d-a875-6ac44b0786ca	Coxao mole	Bovino	17.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.075	2026-06-12 15:54:00.075
cda17665-57b9-4301-9b2f-41afed2b73e1	Capa filé	Bovino	17.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.076	2026-06-12 15:54:00.076
3fa927ee-bd5a-42d5-b6bd-d119634ac8f4	Alcatra	Bovino	19.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.077	2026-06-12 15:54:00.077
df62737c-651a-4292-991c-0fc55f9697e4	Maminha	Bovino	23.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.077	2026-06-12 15:54:00.077
7a0ea510-ec96-4d7c-af2d-b7d87cfc74e9	Cupim	Bovino	23.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.078	2026-06-12 15:54:00.078
639047c5-66fc-4d9b-809a-02afd53e8a34	Carne de sol c/ queijo e nata	Bovino	35.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.079	2026-06-12 15:54:00.079
9a8e7e22-524a-4f9f-9393-5286ced8d875	Picanha	Bovino	35.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.08	2026-06-12 15:54:00.08
e0c8ad6a-204b-4fd2-8f06-7a9e4cc7738e	Avalanche de queijo	Bovino	40.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.081	2026-06-12 15:54:00.081
43be5537-6e1b-47da-ab4e-3ac4043e8e0d	Calabresa	Suíno	15.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.082	2026-06-12 15:54:00.082
14e4da86-b82b-40c9-9145-e22bd710d717	Lombo	Suíno	15.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.083	2026-06-12 15:54:00.083
8938b781-94f8-425c-8c3a-92f6176879a6	Pernil	Suíno	14.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.083	2026-06-12 15:54:00.083
1a36b5f3-c58a-4dc8-b0a8-545bd29be52e	Avalanche de queijo	Suíno	30.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.084	2026-06-12 15:54:00.084
99be8721-4f73-4be0-8f19-64311d7597e3	Frango	Aves	15.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.085	2026-06-12 15:54:00.085
75ace759-4673-4112-a202-210ced0aa458	Frango com bacon	Aves	17.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.089	2026-06-12 15:54:00.089
166c61da-0c23-4f8b-b4ff-eff56d2bc745	Coração	Aves	17.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.09	2026-06-12 15:54:00.09
41f8fcb3-5854-4530-a989-19537f7b80e0	Coração duplo	Aves	27.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.091	2026-06-12 15:54:00.091
828f7080-1492-41da-9479-28880fb7ea4c	Avalanche de queijo	Aves	35.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.091	2026-06-12 15:54:00.091
e130920b-abd4-4995-b53b-f7e12fcec8d3	Peixe	Frutos do Mar	20.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.092	2026-06-12 15:54:00.092
6f2176fc-9508-405f-aa94-98dc21cff2b4	Camarão	Frutos do Mar	35.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.093	2026-06-12 15:54:00.093
b1be0124-dc45-4738-9092-ce9fdeb1f344	Caldeirada	Frutos do Mar	30.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.094	2026-06-12 15:54:00.094
43aa3b93-47a8-4ba9-a41c-b289e3f7fdeb	Avalanche de queijo	Frutos do Mar	45.00	\N	\N	21069090	t	f2b510e4-938f-46aa-a919-9dc7a81cc63f	2026-06-12 15:54:00.094	2026-06-12 15:54:00.094
90255d4c-5103-4ad5-8ddb-eb5340f6a217	Carne	Bovino	8.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.095	2026-06-12 15:54:00.095
a2be422d-4bf3-41d7-a924-815a15e0d648	Cupim	Bovino	9.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.096	2026-06-12 15:54:00.096
14e4085c-eb17-4755-a38f-f16742b51596	Capa de filé	Bovino	9.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.096	2026-06-12 15:54:00.096
533404d3-f6ab-44a0-a00c-5a42187f6c3d	Cupim na mostarda	Bovino	9.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.098	2026-06-12 15:54:00.098
570bbb0f-da3f-4117-97fc-fcdb02123dc0	Coxão mole	Bovino	10.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.102	2026-06-12 15:54:00.102
d79bfa66-2f4f-4c2b-9a98-910ebcab2e88	Bananinha	Bovino	13.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.104	2026-06-12 15:54:00.104
4bab6c45-224d-4be4-a17c-0a7a57d28398	Alcatra	Bovino	11.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.104	2026-06-12 15:54:00.104
64068080-806a-4616-a071-a2dbe581c360	Maminha	Bovino	13.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.106	2026-06-12 15:54:00.106
88c273ef-34c4-43a4-b8ef-fd29ecf6ccdc	Maminha c/ cebola	Bovino	14.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.108	2026-06-12 15:54:00.108
9bf7b0ba-afbb-4ac7-87bd-c5645942723b	Picanha	Bovino	16.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.109	2026-06-12 15:54:00.109
f954c59a-6d65-445f-a5e4-311b33bf5355	Picanha argentina	Bovino	25.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.11	2026-06-12 15:54:00.11
86e81d27-e01c-42e2-b2d5-0384e1233e98	Carne de sol	Bovino	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.111	2026-06-12 15:54:00.111
e3bda8f3-040b-4ad4-98d8-08157b3314a8	Carne de sol c/queijo	Bovino	14.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.112	2026-06-12 15:54:00.112
6e708d1a-06cb-44cf-b1ad-e9647cbe2bb6	Costelinha	Bovino	15.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.112	2026-06-12 15:54:00.112
733b6818-3247-4e1d-b2d3-311eed2b03f9	Cupim no bafo	Bovino	13.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.114	2026-06-12 15:54:00.114
28c17a57-85d9-4498-8054-dc0d8610bc85	Carne c/ bacon	Bovino	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.115	2026-06-12 15:54:00.115
e659b46d-5007-4975-bc1a-def568890d1c	Kafta	Bovino	8.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.116	2026-06-12 15:54:00.116
8ddba0f7-2a08-47d4-8bbc-f40212ea0d6c	Frango	Aves	9.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.117	2026-06-12 15:54:00.117
bffc49b0-cc96-4282-90c0-099495ce807e	Frango c/bacon	Aves	11.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.117	2026-06-12 15:54:00.117
3e07530a-f686-4442-8c73-e51dcdaf3423	Frango c/queijo coalho	Aves	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.118	2026-06-12 15:54:00.118
f5a45fe7-76a7-457d-ad76-f34ef8e10c93	Asinha	Aves	8.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.119	2026-06-12 15:54:00.119
6c2ccab9-e480-4f4d-a950-723de7c42bb0	Coxinha	Aves	8.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.12	2026-06-12 15:54:00.12
ea5a5e5c-e9ec-4145-b9e6-b1e4bc68eea3	Sobrecoxa	Aves	5.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.12	2026-06-12 15:54:00.12
7eaff703-fac2-4004-b596-8292f20ae246	Coração	Aves	9.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.121	2026-06-12 15:54:00.121
c2a1e70c-8d7a-4ad8-a07b-941f1e7955ab	Pernil	Suíno	7.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.122	2026-06-12 15:54:00.122
530683b0-416b-4464-bf1d-1dd174ad14d8	Lombo	Suíno	8.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.123	2026-06-12 15:54:00.123
ea107c8e-0ce5-491e-913d-70588efc73d7	Lombo barbecue	Suíno	9.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.124	2026-06-12 15:54:00.124
de722336-7ff1-4ba5-ab7d-266eaf9d8f88	Picanha suína	Suíno	10.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.125	2026-06-12 15:54:00.125
578739f9-2340-4bfc-84cd-1b0928e71304	Panceta	Suíno	8.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.125	2026-06-12 15:54:00.125
aacc315e-d59c-42f1-939e-4112563f8870	Costelinha	Suíno	7.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.126	2026-06-12 15:54:00.126
f1c6d559-2657-45d7-9e06-a4cd6246057e	Calabresa	Suíno	7.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.127	2026-06-12 15:54:00.127
f464fa36-175c-4d9d-85f7-52e294edf9e7	Pernil	Carneiro	20.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.128	2026-06-12 15:54:00.128
aa120297-457d-4185-9965-c7b96c446276	Picanha	Carneiro	25.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.128	2026-06-12 15:54:00.128
53b34bfa-0ae6-41da-b7bc-e0f32922da12	Queijo coalho	Queijos e Doces	10.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.13	2026-06-12 15:54:00.13
f271d72c-4894-4da2-9943-c5d42ecf0d18	Coalho c/ melaço	Queijos e Doces	11.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.13	2026-06-12 15:54:00.13
d27da432-2432-4fea-83dc-91cb1475aa3b	Coalho c/ mel	Queijos e Doces	13.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.131	2026-06-12 15:54:00.131
168819e0-4615-4052-8a07-43d92e265b9e	Coalho c/ orégano	Queijos e Doces	11.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.132	2026-06-12 15:54:00.132
7b1bfb35-d9a0-4407-add5-bb19d7bc25ea	Coalho c/ chocolate	Queijos e Doces	12.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.133	2026-06-12 15:54:00.133
2ba0f217-3f5e-40e3-b8f7-13eb09352aa4	Coalho c/ doce de leite	Queijos e Doces	15.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.134	2026-06-12 15:54:00.134
ae7ac86f-6249-4e0c-9e42-26f3581de6a4	Cartola	Queijos e Doces	15.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.135	2026-06-12 15:54:00.135
de835085-29f3-4601-b38e-d8dc258c8d16	Coalho c/ leite condensado	Queijos e Doces	12.90	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.136	2026-06-12 15:54:00.136
9125aaf5-605c-4304-afca-2b87670b7371	Romeu e Julieta	Queijos e Doces	14.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.136	2026-06-12 15:54:00.136
6da94b45-5b3f-407d-b9de-b5fe19fd8033	Picanha	No Molho Alho	17.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.137	2026-06-12 15:54:00.137
36ddf473-d4ec-4f38-bcf1-970573098d01	Carneiro	No Molho Alho	18.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.138	2026-06-12 15:54:00.138
74abcb4f-92cd-4496-9221-c48c025d5ee0	Coração	No Molho Alho	10.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.14	2026-06-12 15:54:00.14
56272c38-8c3b-4dac-a54b-81747f67a8e3	Coxão mole	No Molho Alho	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.141	2026-06-12 15:54:00.141
543eafbf-37dc-4668-ac95-d39e014aa0f4	Frango	No Molho Mostarda	11.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.144	2026-06-12 15:54:00.144
352260d5-59a3-40b2-8dbe-28ff487971ae	Frango c/ bacon	No Molho Mostarda	13.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.145	2026-06-12 15:54:00.145
e8c9ae1c-3199-4455-b7b5-3bc779750b44	Lombo suíno	No Molho Mostarda	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.146	2026-06-12 15:54:00.146
1d0dd26a-2c14-4784-ad90-018c5985c755	Cupim	No Molho Mostarda	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.147	2026-06-12 15:54:00.147
5de47360-3450-4be9-a578-513aab49c185	Coração	No Molho Mostarda	10.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.15	2026-06-12 15:54:00.15
a1450edb-f849-47a7-9dd7-f00407400a7a	Coxão mole	No Molho Mostarda	11.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.15	2026-06-12 15:54:00.15
0cec3da5-e405-4a00-8e44-049f9565cbc8	Peixe	No Molho Mostarda	11.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.155	2026-06-12 15:54:00.155
780be63e-47db-44c2-a9df-f681dc2692c6	Asinha	No Molho Mostarda	10.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.157	2026-06-12 15:54:00.157
d31978d3-1d2a-4314-89ad-908352565f05	Coxinha	No Molho Mostarda	10.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.158	2026-06-12 15:54:00.158
d9fc6991-0708-440b-82e8-35c31b47515f	Grego (carne, frango e suíno)	Novidades	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.158	2026-06-12 15:54:00.158
f0e95100-b67a-41fe-a6bf-ff3d99d6e335	Camarão	Novidades	15.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.159	2026-06-12 15:54:00.159
c11bc7a8-8e8b-4027-8e52-24f649571526	Peixe	Novidades	12.00	\N	\N	21069090	t	e4fe861b-21ed-44b5-99d2-4ca70ded2118	2026-06-12 15:54:00.16	2026-06-12 15:54:00.16
2c860a83-ac80-41a0-8df4-e949bd889421	Carne	Bovino	17.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.161	2026-06-12 15:54:00.161
97716a12-efe4-4fc7-a7db-ef6c24457ea0	Coxão mole	Bovino	20.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.162	2026-06-12 15:54:00.162
12c93da2-f19f-420a-87ed-085a8db1288e	Choripán	Bovino	18.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.162	2026-06-12 15:54:00.162
8748ce40-61a7-4f9d-9824-b9cdb5344a62	Alcatra	Bovino	22.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.163	2026-06-12 15:54:00.163
59c1d50b-be40-4268-918f-5e3adcb279aa	Carne de sol	Bovino	22.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.164	2026-06-12 15:54:00.164
e3c9600b-e38f-47f7-a179-1f03dadb87b0	Maminha	Bovino	23.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.164	2026-06-12 15:54:00.164
2df77998-1fb1-44a7-8977-a49bd4b46615	Cupim	Bovino	23.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.165	2026-06-12 15:54:00.165
e82fbaef-753b-4fec-82c7-00043c5749ef	Carne de sol com queijo	Bovino	28.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.166	2026-06-12 15:54:00.166
e591bb36-6274-459c-bdd0-5dd2ffff88bb	Picanha	Bovino	35.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.178	2026-06-12 15:54:00.178
3c0cda58-1157-42a3-8a60-67e920effae6	Pão com queijo	Bovino	14.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.181	2026-06-12 15:54:00.181
c7f053e5-f4e9-4df6-b075-6ba98cf9a93c	Cachorro-quente	Bovino	15.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.182	2026-06-12 15:54:00.182
599e8f39-eb65-4141-87a4-21cdb3f4f251	Hambúrguer artesanal 160g	Bovino	25.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.183	2026-06-12 15:54:00.183
74808111-9d6a-400b-adf0-d0777cc51f3e	Hambúrguer artesanal 90g	Bovino	20.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.185	2026-06-12 15:54:00.185
b1bc4ccf-707a-4c9e-a9e2-1d86894fe241	Misto	Bovino	15.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.185	2026-06-12 15:54:00.185
a674cb8a-f873-4d68-a14f-2c559208eb50	Frango	Aves	16.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.186	2026-06-12 15:54:00.186
a7dd493c-7d5f-4948-a31e-8e2ad385384f	Frango c/ bacon	Aves	18.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.187	2026-06-12 15:54:00.187
f0135b5d-a903-4fe0-bcb2-4e5f244f3f06	Coração	Aves	20.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.188	2026-06-12 15:54:00.188
ab6a93f3-744c-4989-9bd8-737e963ece7c	Coração duplo	Aves	27.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.189	2026-06-12 15:54:00.189
938397c3-12c5-45f4-9747-7f4c228fa41c	Calabresa	Suíno	14.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.189	2026-06-12 15:54:00.189
50bd34f7-42cc-4ea8-95be-2a2be0e68fd8	Lombo	Suíno	16.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.19	2026-06-12 15:54:00.19
ce30b926-e1ca-4698-994c-342e59538749	Pernil	Suíno	15.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.191	2026-06-12 15:54:00.191
be45a56e-fcf8-4fad-a996-96ce410c7010	Pernil	Cordeiro e Carneiro	25.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.192	2026-06-12 15:54:00.192
054c00ac-fedf-4cf6-8824-78c582220188	Picanha	Cordeiro e Carneiro	30.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.193	2026-06-12 15:54:00.193
60dfc1f8-dbc1-4a81-a27c-a247409b536e	Cheddar	Adicionais	3.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.194	2026-06-12 15:54:00.194
76705be9-69bd-4c84-bfd5-d72ea27a7397	Barbecue	Adicionais	3.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.195	2026-06-12 15:54:00.195
a809a942-11b7-47c3-8547-1fec9599f06b	Alho	Adicionais	3.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.197	2026-06-12 15:54:00.197
6fc3d46d-8681-48a3-a239-c90bf36f1b09	Salchicha	Adicionais	4.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.198	2026-06-12 15:54:00.198
3cf576ff-b9da-48b6-9a94-0d406610d865	Ovos	Adicionais	4.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.199	2026-06-12 15:54:00.199
766acb9c-e5e0-48a1-a844-f578de55f189	Presunto	Adicionais	4.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.199	2026-06-12 15:54:00.199
400cf7e4-2181-4fe0-8d89-3a2da9b6e37f	Parmesão	Adicionais	4.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.2	2026-06-12 15:54:00.2
66937b6a-1592-458d-9fe7-dde7f9de4a98	Mel com mostarda	Adicionais	4.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.201	2026-06-12 15:54:00.201
6ab53d57-bdea-477e-b9d1-b2feaee776a6	Maionese com bacon	Adicionais	4.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.202	2026-06-12 15:54:00.202
470fdd02-30c3-4273-a013-300094ec4fbe	Bacon	Adicionais	5.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.203	2026-06-12 15:54:00.203
3c73bd59-ffdd-4883-bdaa-77993ffa38d1	Cream cheese	Adicionais	5.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.208	2026-06-12 15:54:00.208
febe2396-85e7-44ea-8ecf-d2ea9bf5b474	Queijo	Adicionais	6.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.208	2026-06-12 15:54:00.208
72d19b2e-f34f-4e1b-851f-e83767bae5eb	Linguiça	Adicionais	8.00	\N	\N	21069090	t	d048dd75-245e-498d-893c-bfb99ee23b18	2026-06-12 15:54:00.209	2026-06-12 15:54:00.209
40306fcc-3fa9-453a-8955-0662d098e5d6	Alho	Bovino	7.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.21	2026-06-12 15:54:00.21
0c689fd8-cbb6-42f7-96a2-904b1da43349	Coxao mole	Bovino	17.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.211	2026-06-12 15:54:00.211
7ff848b9-878c-4362-9266-0fced10c0870	Capa filé	Bovino	17.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.211	2026-06-12 15:54:00.211
bb3cfb73-0203-465a-9055-3798a850514d	Alcatra	Bovino	19.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.212	2026-06-12 15:54:00.212
b5cd78cc-3f5b-45c1-b208-6e473df56d9a	Maminha	Bovino	23.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.213	2026-06-12 15:54:00.213
3f672949-a7cf-44d2-b134-d59918122a9d	Cupim	Bovino	23.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.214	2026-06-12 15:54:00.214
439fd913-a737-48c0-9f7c-d3fe4111fd6e	Carne de sol c/ queijo e nata	Bovino	35.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.215	2026-06-12 15:54:00.215
fda9225c-305f-4736-8e16-d2de77d03ca6	Picanha	Bovino	35.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.215	2026-06-12 15:54:00.215
ba9a371f-8f6f-4836-8184-0211c6d7d8d1	Avalanche de queijo	Bovino	40.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.217	2026-06-12 15:54:00.217
3674a920-14e1-4847-8cfc-9f7ce56b1dc7	Calabresa	Suíno	15.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.217	2026-06-12 15:54:00.217
e1a2e9d6-0d46-4a86-9a69-3f4eaae265a1	Lombo	Suíno	15.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.219	2026-06-12 15:54:00.219
5c82d170-d0d2-4484-880a-c7b2bd87bacb	Pernil	Suíno	14.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.22	2026-06-12 15:54:00.22
14d70014-c853-4b70-ae57-9c5fef4722b8	Avalanche de queijo	Suíno	30.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.221	2026-06-12 15:54:00.221
153af375-6b21-4f40-854e-5d7769efa425	Frango	Aves	15.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.247	2026-06-12 15:54:00.247
c019776c-e20c-43d9-9edb-da40d26ed7fb	Frango com bacon	Aves	17.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.248	2026-06-12 15:54:00.248
9ac92fec-8913-417b-9098-515563217f56	Coração	Aves	17.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.249	2026-06-12 15:54:00.249
674d28ba-60b9-4084-bde1-d91c2e499a6e	Coração duplo	Aves	27.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.25	2026-06-12 15:54:00.25
799ec636-4135-4aab-ba8b-8710da2b9034	Avalanche de queijo	Aves	35.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.252	2026-06-12 15:54:00.252
5b03b786-3afb-41a6-8644-674ba0c5caa1	Peixe	Frutos do Mar	20.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.254	2026-06-12 15:54:00.254
925816b3-28bb-467d-910a-4b0cecdc9887	Camarão	Frutos do Mar	35.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.255	2026-06-12 15:54:00.255
33d86125-f197-4493-9b32-155136b85b34	Caldeirada	Frutos do Mar	30.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.256	2026-06-12 15:54:00.256
f2c63059-c9e7-4db6-9ce9-e6387703a3c8	Avalanche de queijo	Frutos do Mar	45.00	\N	\N	21069090	t	353a8c2e-01a8-4d56-b351-8e4dacf47d31	2026-06-12 15:54:00.257	2026-06-12 15:54:00.257
66ca27d2-e3af-4ad5-95d2-114df1be7683	Mussarela	\N	10.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.258	2026-06-12 15:54:00.258
d0b7f261-eade-4697-9ebc-87d168582c91	Portuguesa	\N	15.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.26	2026-06-12 15:54:00.26
428b0dc3-7164-40cc-bc78-0686f2405720	Carne de sol	\N	13.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.261	2026-06-12 15:54:00.261
f086dfbb-01b5-465d-95b8-4e305e57bd7e	Carne de sol c/ catupiry	\N	14.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.261	2026-06-12 15:54:00.261
09593591-85bd-49f7-9239-ed9ab21a7335	Frango com bacon	\N	12.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.263	2026-06-12 15:54:00.263
6be37b4a-d7de-4762-89ee-7c335ff18fb4	Frango com catupiry	\N	12.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.263	2026-06-12 15:54:00.263
1fc5d20a-1466-4122-b620-46b32606e537	Frango caipira	\N	13.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.264	2026-06-12 15:54:00.264
d1ae4355-fb11-4001-95ea-fae181436309	Calabresa	\N	12.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.265	2026-06-12 15:54:00.265
33249af4-a757-4783-b6ce-9240647ff1e8	Coração	\N	12.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.265	2026-06-12 15:54:00.265
f500381d-7628-411a-aa8d-44615bd9825c	Camarão	\N	18.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.266	2026-06-12 15:54:00.266
91f3ba75-7fe6-42a6-aefc-9229c20b74ad	Ninho	\N	15.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.267	2026-06-12 15:54:00.267
b906a744-67c7-4bc8-a27f-3282599e4ba8	Nutella	\N	17.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.273	2026-06-12 15:54:00.273
2eb3324b-0e1f-4801-91d0-923e6352087e	Romeu e Julieta	\N	12.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.275	2026-06-12 15:54:00.275
7cafc197-38e3-4474-82f4-e0ae49138fc8	Banana com canela	\N	12.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.277	2026-06-12 15:54:00.277
5ed9c86b-7c26-4c8f-bbd8-48a40454d367	Dois amores	\N	13.00	\N	\N	21069090	t	99a497ab-7257-491d-93f8-918fa90ee6fc	2026-06-12 15:54:00.278	2026-06-12 15:54:00.278
94160cd8-c8ee-4979-a0bc-6d333a26f15e	Coxinha	\N	15.00	\N	\N	21069090	t	1c97eff9-af2c-4f0f-8232-e519a6d1ec41	2026-06-12 15:54:00.281	2026-06-12 15:54:00.281
a83998ff-d492-4df9-a723-bde7c4c25338	Queijo	\N	20.00	\N	\N	21069090	t	1c97eff9-af2c-4f0f-8232-e519a6d1ec41	2026-06-12 15:54:00.281	2026-06-12 15:54:00.281
58c57b7c-5946-4be7-b5e3-792acfba99a7	Carne	\N	18.00	\N	\N	21069090	t	1c97eff9-af2c-4f0f-8232-e519a6d1ec41	2026-06-12 15:54:00.283	2026-06-12 15:54:00.283
585970ec-e7c9-46de-9fa2-0946e9258961	Carne com bacon	\N	18.00	\N	\N	21069090	t	1c97eff9-af2c-4f0f-8232-e519a6d1ec41	2026-06-12 15:54:00.284	2026-06-12 15:54:00.284
310eb7d0-bd73-4fca-be8c-ac12d97ec071	Coxao	\N	10.00	\N	\N	21069090	t	1c97eff9-af2c-4f0f-8232-e519a6d1ec41	2026-06-12 15:54:00.285	2026-06-12 15:54:00.285
2c501e57-7798-45c1-b4d2-9a903ca21170	Coxão com catupiry	\N	15.00	\N	\N	21069090	t	1c97eff9-af2c-4f0f-8232-e519a6d1ec41	2026-06-12 15:54:00.287	2026-06-12 15:54:00.287
7a1d83a0-e6f2-4083-9bd0-801a677bfb9d	Carne	\N	17.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.289	2026-06-12 15:54:00.289
c5af8e43-8455-4b50-b328-21e7af2fe935	Carne com bacon	\N	18.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.289	2026-06-12 15:54:00.289
38beccb0-1315-4f19-a90b-4cf35c08e5d1	Frango	\N	15.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.29	2026-06-12 15:54:00.29
5a4e37f0-8497-4ab0-8a6a-227fc62b1d6a	Frango com bacon	\N	18.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.291	2026-06-12 15:54:00.291
0eee69d3-fa0b-4ac4-8def-464d58c81e5a	Coração	\N	17.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.292	2026-06-12 15:54:00.292
840261ec-f29a-4388-8b21-5e131bec4f70	Coração duplo	\N	27.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.294	2026-06-12 15:54:00.294
2237f54c-4853-491d-8850-1e6e555a4a6b	Frango e carne	\N	19.00	\N	\N	21069090	t	3687445b-df92-48aa-8b17-28acbee465b7	2026-06-12 15:54:00.297	2026-06-12 15:54:00.297
f3fa49a0-6b3b-4f4d-a5d4-c9f47fc1d32c	Carne	\N	13.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.297	2026-06-12 15:54:00.297
a1266e34-8bba-4adb-b90e-bad4ead9e9d9	Cabeça de galo	\N	13.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.298	2026-06-12 15:54:00.298
2efb0162-b932-4a9a-9374-cc65fa156db7	Caldo de quenga	\N	10.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.299	2026-06-12 15:54:00.299
b546a681-3cf5-4c97-93ec-8c868b74ece3	Caldo verde	\N	10.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.3	2026-06-12 15:54:00.3
dbc4a9b0-f8ff-4ceb-b019-deecdbfa9d97	Canja de galinha	\N	10.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.301	2026-06-12 15:54:00.301
0ec24e65-8e1c-4984-8f29-34dd34837aa6	Feijão	\N	10.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.302	2026-06-12 15:54:00.302
7c3373f6-dfac-40ac-806b-5a0cbf9d3a5b	Cebola	\N	10.00	\N	\N	21069090	t	c03db7e7-1b85-47e5-8083-06c8c6b21296	2026-06-12 15:54:00.303	2026-06-12 15:54:00.303
0e68552e-7c34-4401-83a7-b41b629126f1	Almôndegas	Diversos	15.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.304	2026-06-12 15:54:00.304
1aa45218-3b0e-46f1-9f4c-10f6a1f0c7a9	Anéis de Cebola	Diversos	15.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.305	2026-06-12 15:54:00.305
9ea27452-683f-4785-9fdf-74decb852f29	Batata Frita	Diversos	20.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.306	2026-06-12 15:54:00.306
222c3536-0db8-4c8a-9bfc-45f07a7a0355	Batata com Bacon	Diversos	23.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.307	2026-06-12 15:54:00.307
81eb63b1-7b36-4625-86b4-f506e248226d	Calabresa com Fritas	Diversos	28.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.309	2026-06-12 15:54:00.309
e294ee7e-b9d7-4e68-9e20-d72d72496546	Arrumadinho	Carnes	25.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.309	2026-06-12 15:54:00.309
a4b18d0b-1749-4596-a5ea-8a208aee569f	Parmegiana de Carne	Carnes	30.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.31	2026-06-12 15:54:00.31
9c1ca856-b5b0-48b9-919a-dc32eb102732	Filé com Fritas	Carnes	35.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.311	2026-06-12 15:54:00.311
ba4bf8d8-d733-4331-8425-2ec7e11ee2c1	Carne de Sol com Fritas	Carnes	35.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.312	2026-06-12 15:54:00.312
5e37163e-4564-465a-beb7-941f983b67e4	Frango a Passarinho	Aves	25.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.313	2026-06-12 15:54:00.313
b40a5774-0fd6-4db4-a32b-94d3e62f1c03	Isca de Frango	Aves	25.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.314	2026-06-12 15:54:00.314
9f58ec29-fe62-4680-8f02-734c7bb6d83b	Parmegiana de Frango	Aves	25.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.315	2026-06-12 15:54:00.315
10beb5e3-50d6-481a-9737-d7b519c1f836	Frango Empanado com Fritas	Aves	30.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.315	2026-06-12 15:54:00.315
5508dd84-dad0-44e6-b4f6-4748d19cb92d	Caranguejo no Coco	Frutos do Mar	9.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.316	2026-06-12 15:54:00.316
d6d75642-3662-47a7-8c8e-116faeddf28f	Camarão Alho e Óleo	Frutos do Mar	30.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.317	2026-06-12 15:54:00.317
60e8a5bc-e407-4275-854a-74c2abfbace6	Empanado de Camarão	Frutos do Mar	30.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.318	2026-06-12 15:54:00.318
a8d9b107-1160-4299-a72a-fe191b3e6c59	Isca de Peixe	Frutos do Mar	30.00	\N	\N	21069090	t	fb5260fc-0f92-4518-9943-71054600ca29	2026-06-12 15:54:00.319	2026-06-12 15:54:00.319
e0c231a0-7fab-4c89-82a9-299e89ca7325	Chapa 400g picanha + fritas + mandioca	Chapa Mista do Xico	160.00	\N	\N	21069090	t	1e3d5ed5-2404-4dbf-9d65-2e581259fcaa	2026-06-12 15:54:00.32	2026-06-12 15:54:00.32
6c1561d7-bc6c-49a3-9bae-3c73bc4ef5f1	Chapa 600g picanha + fritas + mandioca	Chapa Mista do Xico	200.00	\N	\N	21069090	t	1e3d5ed5-2404-4dbf-9d65-2e581259fcaa	2026-06-12 15:54:00.322	2026-06-12 15:54:00.322
6eb16f36-e058-4415-93f6-45da01c1c0b3	Chapa 800g picanha + fritas + mandioca	Chapa Mista do Xico	260.00	\N	\N	21069090	t	1e3d5ed5-2404-4dbf-9d65-2e581259fcaa	2026-06-12 15:54:00.324	2026-06-12 15:54:00.324
b8a2b1c4-6e54-4e56-bb80-c4ca6d48f6a1	Chapa 1kg picanha + fritas + mandioca	Chapa Mista do Xico	300.00	\N	\N	21069090	t	1e3d5ed5-2404-4dbf-9d65-2e581259fcaa	2026-06-12 15:54:00.325	2026-06-12 15:54:00.325
0d764529-5380-44b0-b48b-091baf893402	Picanha argentina (com acompanhamentos)	\N	160.00	\N	\N	21069090	t	9a73cd36-75a9-4d87-b617-aaf781b79efe	2026-06-12 15:54:00.326	2026-06-12 15:54:00.326
e88c0443-6db6-4fcd-a95c-0967668797b7	Pratinho - 1 proteína (até 600g)	\N	20.00	\N	\N	21069090	t	9a73cd36-75a9-4d87-b617-aaf781b79efe	2026-06-12 15:54:00.327	2026-06-12 15:54:00.327
e32c1a2e-2761-4c0a-bcc0-b0c3ddcb442f	Pratinho - 2 proteínas (até 600g)	\N	25.00	\N	\N	21069090	t	9a73cd36-75a9-4d87-b617-aaf781b79efe	2026-06-12 15:54:00.328	2026-06-12 15:54:00.328
dbefc038-f9c3-479f-b44d-277e7fe527bf	Caipifruta Tropical	\N	19.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.329	2026-06-12 15:54:00.329
8196a9e2-70dd-4f51-96e7-8145854d4b55	Caipifruta	\N	15.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.33	2026-06-12 15:54:00.33
55bd993e-ea7e-4244-8f61-c8a310e6a6aa	Caipirosca	\N	10.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.331	2026-06-12 15:54:00.331
494cf096-7958-463a-982a-5d24f76c7621	Caipirosca Absolut	\N	18.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.331	2026-06-12 15:54:00.331
74896439-aef6-4941-89ae-b679b7059da8	Caipirinha	\N	10.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.335	2026-06-12 15:54:00.335
2b3747e5-82ff-492f-9b40-9fe859509ea9	Coquetel De Frutas	\N	17.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.336	2026-06-12 15:54:00.336
da5d78b7-28c3-4824-9d1b-fe18731456a7	Margarita	\N	16.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.337	2026-06-12 15:54:00.337
3c9e372b-bc1c-432b-9c99-99dc00cacffb	Mojito	\N	16.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.337	2026-06-12 15:54:00.337
deec76be-7627-45d4-8139-c7712672cc00	Lagoa Azul	\N	17.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.338	2026-06-12 15:54:00.338
72cc585f-f05d-4489-bf93-86c3c0cc506e	Laguna	\N	20.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.339	2026-06-12 15:54:00.339
60c0c6e5-983f-4ff9-ac1d-49d5dfa65bd0	Gin Tanqueray Tonic	\N	21.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.34	2026-06-12 15:54:00.34
90310dd2-6fa6-4743-9887-87a7a551fec8	Gin Tonic	\N	13.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.341	2026-06-12 15:54:00.341
7d3838ad-041e-4bd0-8c02-fc4de92e650d	Sunset	\N	17.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.343	2026-06-12 15:54:00.343
f6deaff2-3976-47b4-80ea-29b7fdb19219	Moscow Mule	\N	16.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.344	2026-06-12 15:54:00.344
7b39ad25-8f48-4f89-81e5-77bf29a619b7	Melancita	\N	18.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.344	2026-06-12 15:54:00.344
98b66bc2-f6ce-4a09-a5a4-2260981d5f52	Soda Italiana	\N	18.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.347	2026-06-12 15:54:00.347
e557b792-023c-4799-8d54-e533ec632b66	Sex On The Beach	\N	19.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.348	2026-06-12 15:54:00.348
b7fab026-badf-4fce-aad8-1f650d4a19d6	Pina Colada	\N	12.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.35	2026-06-12 15:54:00.35
e55a4594-9642-467f-a249-863e19ba65c3	Tropical Gin	\N	18.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.351	2026-06-12 15:54:00.351
4bc3802c-b271-42ec-80d9-141b658b3a3f	Strawberry Gin	\N	18.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.352	2026-06-12 15:54:00.352
d64b9682-1d46-4cb8-badc-40276d8b2b36	Sangria	\N	16.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.353	2026-06-12 15:54:00.353
f26499c5-9869-43d2-83b9-b9c10c914718	Aperol Citrus Spritz	\N	25.00	\N	\N	21069090	t	852860be-a795-46d6-8a3a-24302fd436f8	2026-06-12 15:54:00.353	2026-06-12 15:54:00.353
9e70f07c-746e-46be-9fc3-763fc13978fa	Johnnie Walker Red	\N	14.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.355	2026-06-12 15:54:00.355
9302f9af-cf4b-4823-84c0-98c4b63c51df	Johnnie Walker Black	\N	21.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.356	2026-06-12 15:54:00.356
ad62bf30-0bbb-48b4-bf5e-1b55d45a7ac7	Old Parr	\N	15.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.356	2026-06-12 15:54:00.356
668ca0da-41b6-4dfa-812d-f6844e66762f	Black & White	\N	9.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.358	2026-06-12 15:54:00.358
b718a671-2f24-4a6c-aa0c-c1b4f534bae4	Teacher's	\N	7.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.359	2026-06-12 15:54:00.359
14875eb0-8919-45b9-b425-c7b912dfe650	White Horse	\N	9.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.36	2026-06-12 15:54:00.36
ed6dade7-cdd5-420e-abce-540554db1a52	Old Eight	\N	7.00	\N	\N	21069090	t	634c6819-6bbc-4dca-9cbd-12ef8a1f841b	2026-06-12 15:54:00.361	2026-06-12 15:54:00.361
b2e947e5-66d7-46d4-8585-2be8758e5aa0	Tequila	\N	10.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.364	2026-06-12 15:54:00.364
93a02030-0228-4b90-aa5a-93f4d57d8999	Tequila José Cuervo	\N	20.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.365	2026-06-12 15:54:00.365
c4821c98-1571-4599-a61d-eceaeb1c07fc	Gin Tanqueray	\N	18.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.366	2026-06-12 15:54:00.366
ccf23298-a75f-4a3e-afb8-2b72597e3e1c	Gin	\N	7.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.367	2026-06-12 15:54:00.367
368c65cf-61d2-4657-a2ec-3938d5c8f5cf	Rum Montilla Cristal	\N	6.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.368	2026-06-12 15:54:00.368
ca9622ac-d156-4f2f-b40c-e21a42b57750	Rum Carta Branca	\N	5.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.369	2026-06-12 15:54:00.369
f121787d-bbe9-42cb-af51-469ca3fbd00f	Campari	\N	9.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.37	2026-06-12 15:54:00.37
6ee430c2-9557-46c4-b9ba-e2018de4baac	Domécq	\N	8.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.371	2026-06-12 15:54:00.371
2f1164d1-d786-40a0-bce0-9b76854751f0	Vodka Sky	\N	7.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.371	2026-06-12 15:54:00.371
2f51b990-703c-4831-9505-51f7077341ac	Vodka Intencion	\N	6.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.372	2026-06-12 15:54:00.372
4a8a5892-f2fd-4004-a893-56fba9f19592	Vodka Smirnoff	\N	8.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.373	2026-06-12 15:54:00.373
0e59774a-6df8-4b80-bd32-3dc432c7a636	Vodka Absolut	\N	13.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.374	2026-06-12 15:54:00.374
d3da6561-8732-4d51-b50d-c2b4e9442549	Amarula	\N	15.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.375	2026-06-12 15:54:00.375
3e0d5f9d-2dec-45e4-997c-b5172bb8c761	Licor 43	\N	20.00	\N	\N	21069090	t	8f53aa0f-2875-451e-b357-a93f94f2f32c	2026-06-12 15:54:00.375	2026-06-12 15:54:00.375
7f6d6f55-506a-4bcd-a67e-065183eec843	Heineken	Long Neck	9.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.376	2026-06-12 15:54:00.376
7c50b084-49fe-4f6e-8f59-79fe9bd23ddf	Budweiser	Long Neck	8.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.378	2026-06-12 15:54:00.378
b90379d9-6c30-4314-8072-ce828ee7531b	Corona	Long Neck	9.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.379	2026-06-12 15:54:00.379
e3fd912f-da08-4752-bb6d-f8d9fddcfc43	Coronita	Long Neck	7.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.38	2026-06-12 15:54:00.38
06e90d43-6319-437b-821b-83bb4729441a	Stella Artois	Long Neck	9.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.381	2026-06-12 15:54:00.381
fdbd810e-f3f6-4c21-a40e-6968cd1b2ed8	Skol	Long Neck	5.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.382	2026-06-12 15:54:00.382
77d3c902-0422-4763-bcef-ec2ca6a64810	Spaten	Long Neck	8.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.383	2026-06-12 15:54:00.383
cbc18b84-db8d-4b31-9759-148fb85f2550	Eisenbahn	Long Neck	7.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.384	2026-06-12 15:54:00.384
b50937d1-20c4-4784-b674-15ee64e8f62d	Heineken	600ml	17.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.385	2026-06-12 15:54:00.385
b6f230f8-833a-45eb-8f6e-ea7d9b52d2c3	Brahma	600ml	12.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.385	2026-06-12 15:54:00.385
0ae2570a-1ab2-4fbf-a945-875b7eb263b9	Skol	600ml	10.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.386	2026-06-12 15:54:00.386
2c81f786-94b0-4ba9-98a5-3d01a0ac261c	Spaten	600ml	15.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.388	2026-06-12 15:54:00.388
3d06b861-4dae-442b-8fc3-9297441e9154	Amstel	600ml	12.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.389	2026-06-12 15:54:00.389
4684ba09-41a6-4268-8e0f-71afe11eb659	Original	600ml	14.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.39	2026-06-12 15:54:00.39
57897e36-986c-479c-b44b-b8f3fcf0a89f	Devassa	600ml	12.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.391	2026-06-12 15:54:00.391
79033926-1959-4ecb-adee-4e037d276937	Budweiser	600ml	12.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.393	2026-06-12 15:54:00.393
ea6b8281-1b28-4a84-8fbf-10b335034df3	Stella Artois	600ml	16.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.394	2026-06-12 15:54:00.394
17027be3-75a2-4dc4-a9f7-d468a6b75c37	Eisenbahn	600ml	14.00	\N	\N	21069090	t	eba09bb4-0d40-4c6e-8141-89b6e81c3ee5	2026-06-12 15:54:00.396	2026-06-12 15:54:00.396
b56e7e07-fdfb-4403-88d5-109fd81d95db	Acerola	Polpa	8.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.397	2026-06-12 15:54:00.397
8335d753-240a-4c1f-88a7-6bd7961a5b5d	Morango	Polpa	10.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.4	2026-06-12 15:54:00.4
6becb55a-5ff7-4f22-9235-644d39df4da1	Maracujá	Polpa	8.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.401	2026-06-12 15:54:00.401
c86c76a3-0e25-4c62-b9e8-fc7c0e8b6dca	Cajá	Polpa	8.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.403	2026-06-12 15:54:00.403
2c997027-85d3-4eb3-ad36-cb55dca51054	Graviola	Polpa	8.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.405	2026-06-12 15:54:00.405
ff14f7f2-c250-4b8b-a300-1dec472e4563	Uva com leite	Polpa	10.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.406	2026-06-12 15:54:00.406
03238f09-176f-4970-93a7-9bfa643b04d9	Ameixa com leite	Polpa	10.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.407	2026-06-12 15:54:00.407
bc4660e3-bdeb-424b-9593-2be0ed790104	Abacaxi com hortelã	Polpa	10.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.408	2026-06-12 15:54:00.408
f169822c-5baa-4b22-b69e-6fbeba434fad	Laranja	Da Fruta	11.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.409	2026-06-12 15:54:00.409
4cbb8769-979c-4a69-86a3-f1cc9369127d	Jarra de laranja	Da Fruta	20.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.41	2026-06-12 15:54:00.41
5ec0a4fd-cd7e-4134-a440-8afd069d93ef	Limão	Da Fruta	11.00	\N	\N	21069090	t	19230eb2-7770-42d0-a065-47d59a312d9b	2026-06-12 15:54:00.411	2026-06-12 15:54:00.411
c4dbfb2c-b94d-4483-8f05-ef7e202d525f	Coca-Cola 1,0L	Lata	15.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.412	2026-06-12 15:54:00.412
7a51ce18-b413-4a4a-8dbf-def0ec403dfa	Coca-Cola 1,5L	Lata	19.90	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.413	2026-06-12 15:54:00.413
4559c570-57fc-42ae-ab83-6031896e6c19	Guaraná 1,0L	Lata	13.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.414	2026-06-12 15:54:00.414
94359d27-96d5-4d31-a2cb-f3b6301670ff	Guaraná 2,0L	Lata	18.90	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.415	2026-06-12 15:54:00.415
1055948f-4b6d-4717-a37d-2c2e14dfe52e	LS 1L	Lata	14.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.417	2026-06-12 15:54:00.417
ab5ad744-4d01-4bcb-8218-40fb71e093e6	GB	Lata	5.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.418	2026-06-12 15:54:00.418
db95ad82-9618-425a-878d-724c15790a86	KS 290ml	Lata	8.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.419	2026-06-12 15:54:00.419
bd8b0e3c-66d4-4188-96eb-c571f0bc4735	Coca-Cola 250ml	250ml / 310ml	4.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.42	2026-06-12 15:54:00.42
b9976e70-c10d-4c64-9201-80d2f20416df	Coca-Cola Zero 250ml	250ml / 310ml	5.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.42	2026-06-12 15:54:00.42
b72d86a0-26a9-43d5-b20d-5868d7b31af8	Pepsi 250ml	250ml / 310ml	3.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.421	2026-06-12 15:54:00.421
f304f237-9cb2-43da-a67e-54eb6caf8196	Pepsi Zero 250ml	250ml / 310ml	4.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.422	2026-06-12 15:54:00.422
b2472acc-0f0e-4b56-8265-ce14efb6ab64	Guaraná 250ml	250ml / 310ml	4.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.422	2026-06-12 15:54:00.422
24b988fd-8f30-4f6d-be22-f569ffb9a491	Guaraná Zero 250ml	250ml / 310ml	5.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.424	2026-06-12 15:54:00.424
f1c6147e-bf62-4840-b811-1584017898ba	Sukita 250ml	250ml / 310ml	3.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.425	2026-06-12 15:54:00.425
be75f768-90a4-4487-bcf3-27cb2638da77	Guaraná 600ml	250ml / 310ml	8.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.425	2026-06-12 15:54:00.425
aaf86961-dbd4-4ba9-94aa-d394fbcd1085	Sprite Lemon Fresh 310ml	250ml / 310ml	5.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.426	2026-06-12 15:54:00.426
ba7e85b8-6705-4264-b3e4-01f715664c9c	H2o	250ml / 310ml	10.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.427	2026-06-12 15:54:00.427
4287f2c2-3741-4398-869a-514955343016	Coca-Cola	Diversos	7.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.428	2026-06-12 15:54:00.428
fb36bbf2-4b25-4b81-a38f-56f322b94009	Coca-Cola Zero	Diversos	8.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.429	2026-06-12 15:54:00.429
d03223b4-c0ca-44bc-a115-bc9fb5a35a15	Guaraná	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.43	2026-06-12 15:54:00.43
c2a9472b-1123-4280-8df8-dea70706560b	Guaraná Zero	Diversos	7.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.431	2026-06-12 15:54:00.431
26e29489-53f7-4c83-9666-f0a2d778f481	Pepsi	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.433	2026-06-12 15:54:00.433
e6c52cbe-49cd-414a-852a-403b1646dc5c	Pepsi Zero	Diversos	7.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.434	2026-06-12 15:54:00.434
b02bbf6a-dc74-4ef6-b33c-3e07b14b82fe	Sprite	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.435	2026-06-12 15:54:00.435
a48126a7-71d8-437b-85a1-4f0368966499	Sprite Zero	Diversos	7.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.438	2026-06-12 15:54:00.438
3e948a6a-4acb-445f-8604-85f7b72b8b78	Kuat	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.44	2026-06-12 15:54:00.44
cedd5724-658c-4523-a1fb-604ca1b98748	Fanta Uva	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.441	2026-06-12 15:54:00.441
6b6c8fdc-7a64-4221-9c17-aa003d165e7b	Fanta Uva Zero	Diversos	7.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.442	2026-06-12 15:54:00.442
0f1bfcd5-380e-4b55-b0b6-89630cc804f7	Fanta Laranja	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.442	2026-06-12 15:54:00.442
8c673af9-3e9d-4bb8-a072-c6f354848176	Fanta Laranja Zero	Diversos	7.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.443	2026-06-12 15:54:00.443
3c73dcca-9425-4b5c-b81a-693d5b0ac797	Sukita Uva	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.444	2026-06-12 15:54:00.444
312f7f7a-3ed7-4f9c-8339-fae21d2ddda7	Sukita Laranja	Diversos	6.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.445	2026-06-12 15:54:00.445
43b7c97d-5a37-44cb-a327-7f61bf36394a	Fys Limão Siciliano	Diversos	4.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.446	2026-06-12 15:54:00.446
c69e18b1-7535-44ec-8706-bc068f75154c	Fys Laranja Pera	Diversos	4.00	\N	\N	21069090	t	ff000a97-815d-47e8-8a0e-0a33ae92ca08	2026-06-12 15:54:00.446	2026-06-12 15:54:00.446
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.tables (id, number, status, capacity, "customerName", "currentOrderId", "openedAt", "createdAt", "updatedAt") FROM stdin;
cmqb9jshz000201s2gl424l3w	99	LIVRE	1	Balcão / PDV	\N	\N	2026-06-12 18:31:58.727	2026-06-12 18:31:58.727
9ba19a88-4f25-4eb4-978a-2927be2356f7	1	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
e495daa7-b066-41ea-80d4-469f9f3a6ba1	2	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
e41f981c-3349-447d-ab3a-9eff8505c875	3	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
26eb01fb-828b-4674-8830-09058b668cdc	4	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
4b3f13e0-23f5-463c-b0e8-cd46b3dc35fe	5	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
8896e74a-b88a-4328-99ed-a1cd7b48ced1	6	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
c22294d4-9899-43c9-a61a-bda906a422df	7	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
763d67f5-f8bd-42e5-806a-cea9ea643f04	8	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
004b748b-2719-447f-a918-a53db90a4d20	9	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
2cc1c4f0-cd49-4276-938e-739ac27f53b7	10	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
6e3e5412-a8fd-4f0b-a010-a96bb836c3d9	11	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
877c3194-8c2d-4a01-bfb8-8a4e8450125f	12	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
52af71f1-6c68-4f03-a2cf-195614893061	13	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
47e29a6e-39e3-4824-aba2-06ea923f47cc	14	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
8bd0b998-e04d-4f19-85ff-a6ddf88e931f	15	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
66d03d36-798b-45e1-a8f6-533a09695a23	17	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
18d48884-e6a3-45ba-8817-ca05e8dfc605	18	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
986da715-b8c7-4fb5-8d92-525bc97c5325	19	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
ff3c3856-32ca-4b4f-8445-e3c29558902c	20	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
68884b1e-40e8-4a96-a0e9-5a5bf77626b5	21	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
632016f0-2f3c-4869-a830-1d0694ef1fc6	22	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
b9700146-de72-49a0-98cc-ace4f389b3ac	23	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
222052ee-2e9a-466e-a6bc-fcc6fb06d701	24	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
bba330a0-c7a8-4566-9fbb-7b4e2d0de00b	25	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
37c0e495-4b1c-41da-abbc-e3f75753278a	26	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
8f4d7dc0-9343-450c-b396-f17881c89cfc	27	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
d5fdcdce-8a1a-45e2-994e-2e549cbfc0a6	28	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
b94f30b7-6154-4209-8f27-574dfce0371d	29	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
01f3c9e7-47f9-408b-a985-9fc1f70d9f0c	30	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
714165b4-af57-4f8d-93b4-a00656140df4	31	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
65a574ab-0927-48c4-b5c7-209f7499abd9	32	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
6b9d040a-ac50-4b97-95bd-ac1feb545519	33	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
630555e7-62d4-4ce9-8131-6009422f4162	34	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
d5f8e0a0-9e1f-4e15-b365-7b2633db64c8	35	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
32191835-40d5-442b-95e0-84ce56df5f1f	36	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
8f94c665-e1d1-4111-b729-501db5d6b9d7	37	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
2213250e-8bb5-4a9a-8570-d316f3afa0bf	38	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
0b41f0c7-cf90-4863-a5eb-2708e21e2018	39	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
07f59767-bce3-4d5a-846d-80d9222bc3e6	40	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
996635fc-6f59-4577-96a7-52f3657acb80	41	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
1cdb172b-a64d-4ecc-b035-6c2514442410	42	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
dc6280e8-d5b9-4b3a-b997-82a60d6c9be8	43	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
52d181f5-84c2-4fd6-9336-54239dd1048b	44	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
6d2d47bb-0727-4567-b058-4d086323d6d9	45	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
02d130b6-f7b7-402f-8ec1-7495e5167b54	46	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
512575b2-2ab2-4834-8ff7-b4aa749b772b	47	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
3f12b448-fa4f-405f-ab8c-6375ca26d600	48	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
692c653f-c390-4938-97f7-1499fd47a2a5	49	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
4faaa8a5-82ad-47fc-8f95-dcf1c0acc8ef	50	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
a252ab55-288f-4f61-9d06-133212ebd422	51	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
6522a011-eed0-4708-84f0-1762f3f1f9b7	52	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
85c4b5ae-0965-41b8-bb2d-a81efc5310ad	53	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
01fdd7d1-4b33-4f87-9203-aacb83e3062c	54	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
a64b5161-bf8b-4b47-b0fe-ea32ebba7c35	55	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
9aa2bd4e-c7c8-4304-8dd6-4016dca9c9df	56	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
7a96958c-0df2-4c58-b1d7-06ce0c25d387	57	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
80c48698-0157-4549-a234-b3aa93c96b01	58	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
55ba436d-96bb-4105-adf3-caae6e196278	59	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
98b0af57-36af-465f-bf9e-53f993e56f0d	60	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
dc21e4b6-3f8b-49c8-a685-840793285cb9	61	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
d469c6e6-0e6d-41f0-8a7a-94c5a14e8e22	62	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
b010de4f-8121-41e8-b458-8d3c7f67bd94	63	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
6cd492ad-3029-4a18-b3ad-6f7b0820eb48	64	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
723fd3d7-9b61-4af5-a402-4db53149eb63	65	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
b0f25712-a1db-4a73-ab85-c43f15741388	66	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
6cfdca59-5980-498d-b1b1-ba06b865b235	67	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
5dda2db7-a8d5-4ed9-afc0-e5ef55ac4652	68	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
da4ef590-16a7-49f4-b1ef-25e380f7c665	69	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
14b1e0ca-6e47-413e-bf26-50ea6d4ab54a	70	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 15:38:26.325
8534cc36-3740-4625-99e5-bd26086478ae	16	LIVRE	4	\N	\N	\N	2026-06-12 15:38:26.325	2026-06-12 20:00:08.138
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.transactions (id, "orderId", "paymentMethod", subtotal, "serviceFee", discount, "cashbackDiscount", total, "splitCount", "paidAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.users (id, name, email, password, role, active, "createdAt", "updatedAt") FROM stdin;
6507cd49-8eea-4531-b1ed-1181103c4655	Nicolas	devnicolasmatias@gmail.com	$2b$12$Gzii2lQiPzn2f9rcIUSWAentylmS5/tvq9NnO7c5A8wbPrGM99j7S	ADMIN	t	2026-06-12 15:31:03.832	2026-06-12 15:31:03.832
\.


--
-- Data for Name: whatsapp_messages; Type: TABLE DATA; Schema: public; Owner: xicopraia_user
--

COPY public.whatsapp_messages (id, phone, direction, type, content, "mediaUrl", "mediaName", "messageId", "createdAt") FROM stdin;
\.


--
-- Name: cashback_config cashback_config_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.cashback_config
    ADD CONSTRAINT cashback_config_pkey PRIMARY KEY (id);


--
-- Name: cashback_transactions cashback_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.cashback_transactions
    ADD CONSTRAINT cashback_transactions_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_stock_items daily_stock_items_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.daily_stock_items
    ADD CONSTRAINT daily_stock_items_pkey PRIMARY KEY (id);


--
-- Name: daily_stocks daily_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.daily_stocks
    ADD CONSTRAINT daily_stocks_pkey PRIMARY KEY (id);


--
-- Name: fiscal_config fiscal_config_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.fiscal_config
    ADD CONSTRAINT fiscal_config_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: inventory_categories inventory_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT inventory_categories_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: nfce_documents nfce_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.nfce_documents
    ADD CONSTRAINT nfce_documents_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: print_jobs print_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT print_jobs_pkey PRIMARY KEY (id);


--
-- Name: product_ingredients product_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_messages whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: customers_cpf_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX customers_cpf_key ON public.customers USING btree (cpf);


--
-- Name: customers_phone_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX customers_phone_key ON public.customers USING btree (phone);


--
-- Name: daily_stocks_date_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX daily_stocks_date_key ON public.daily_stocks USING btree (date);


--
-- Name: ingredients_name_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX ingredients_name_key ON public.ingredients USING btree (name);


--
-- Name: inventory_categories_name_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX inventory_categories_name_key ON public.inventory_categories USING btree (name);


--
-- Name: nfce_documents_chave_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX nfce_documents_chave_key ON public.nfce_documents USING btree (chave);


--
-- Name: nfce_documents_transactionId_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX "nfce_documents_transactionId_key" ON public.nfce_documents USING btree ("transactionId");


--
-- Name: print_jobs_status_createdAt_idx; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE INDEX "print_jobs_status_createdAt_idx" ON public.print_jobs USING btree (status, "createdAt");


--
-- Name: product_ingredients_productId_ingredientId_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX "product_ingredients_productId_ingredientId_key" ON public.product_ingredients USING btree ("productId", "ingredientId");


--
-- Name: tables_number_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX tables_number_key ON public.tables USING btree (number);


--
-- Name: transactions_orderId_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX "transactions_orderId_key" ON public.transactions USING btree ("orderId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: whatsapp_messages_messageId_key; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE UNIQUE INDEX "whatsapp_messages_messageId_key" ON public.whatsapp_messages USING btree ("messageId");


--
-- Name: whatsapp_messages_phone_idx; Type: INDEX; Schema: public; Owner: xicopraia_user
--

CREATE INDEX whatsapp_messages_phone_idx ON public.whatsapp_messages USING btree (phone);


--
-- Name: cashback_transactions cashback_transactions_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.cashback_transactions
    ADD CONSTRAINT "cashback_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: daily_stock_items daily_stock_items_dailyStockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.daily_stock_items
    ADD CONSTRAINT "daily_stock_items_dailyStockId_fkey" FOREIGN KEY ("dailyStockId") REFERENCES public.daily_stocks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: daily_stock_items daily_stock_items_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.daily_stock_items
    ADD CONSTRAINT "daily_stock_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_items inventory_items_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.inventory_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: nfce_documents nfce_documents_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.nfce_documents
    ADD CONSTRAINT "nfce_documents_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public.tables(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_ingredients product_ingredients_ingredientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT "product_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES public.ingredients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_ingredients product_ingredients_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT "product_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: transactions transactions_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: xicopraia_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict xzkhFZ21WXhpaIiPoozg73RFzD0qvLfN2h2dQCwswId05moOjXn4okFAKihJ9Z1

