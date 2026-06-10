--
-- PostgreSQL database dump
--

\restrict k6wHYv9aCBeb5lTq3HZsAka3qSokIDySdANbDun1ksTQa8K0xYmgERYNbuTD11T

-- Dumped from database version 17.6 (Debian 17.6-1.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Debian 17.6-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: parties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    party_type character varying(30) NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(30),
    contact_person character varying(255),
    location_id uuid,
    address_line text,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT parties_party_type_check CHECK (((party_type)::text = ANY ((ARRAY['hospital'::character varying, 'agency'::character varying, 'clinic'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.parties OWNER TO postgres;

--
-- Name: party_product_pricing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.party_product_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    party_id uuid NOT NULL,
    product_id uuid NOT NULL,
    buy_rate numeric(12,2),
    sell_rate numeric(12,2),
    currency_code character(3) DEFAULT 'INR'::bpchar NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT party_product_pricing_check CHECK (((effective_to IS NULL) OR (effective_to >= effective_from)))
);


ALTER TABLE public.party_product_pricing OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sku character varying(60),
    product_name character varying(255) NOT NULL,
    product_category character varying(120),
    unit_of_measure character varying(50) DEFAULT 'piece'::character varying NOT NULL,
    preferred_brand character varying(120),
    hindi_name character varying(255),
    sample_priority boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: dashboard_current_pricing; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.dashboard_current_pricing AS
 SELECT DISTINCT ON (ppp.party_id, ppp.product_id) ppp.party_id,
    pa.name AS party_name,
    ppp.product_id,
    pr.product_name,
    ppp.buy_rate,
    ppp.sell_rate,
    ppp.currency_code,
    ppp.effective_from,
    ppp.effective_to
   FROM ((public.party_product_pricing ppp
     JOIN public.parties pa ON ((pa.id = ppp.party_id)))
     JOIN public.products pr ON ((pr.id = ppp.product_id)))
  ORDER BY ppp.party_id, ppp.product_id, ppp.effective_from DESC, ppp.created_at DESC;


ALTER VIEW public.dashboard_current_pricing OWNER TO postgres;

--
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    party_id uuid NOT NULL,
    order_date date NOT NULL,
    order_status character varying(40) DEFAULT 'confirmed'::character varying NOT NULL,
    reference_number character varying(80),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sales_orders_order_status_check CHECK (((order_status)::text = ANY ((ARRAY['draft'::character varying, 'confirmed'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.sales_orders OWNER TO postgres;

--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    party_id uuid NOT NULL,
    visit_date date NOT NULL,
    visit_purpose character varying(80) DEFAULT 'regular_visit'::character varying NOT NULL,
    visit_status character varying(40) DEFAULT 'completed'::character varying NOT NULL,
    location_snapshot text,
    distance_snapshot_km numeric(8,2),
    contact_snapshot character varying(30),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: dashboard_daily_activity; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.dashboard_daily_activity AS
 SELECT activity_date,
    count(DISTINCT visit_id) AS visits_count,
    count(DISTINCT order_id) AS orders_count,
    count(DISTINCT party_id) AS active_parties
   FROM ( SELECT v.visit_date AS activity_date,
            v.id AS visit_id,
            NULL::uuid AS order_id,
            v.party_id
           FROM public.visits v
        UNION ALL
         SELECT so.order_date AS activity_date,
            NULL::uuid AS visit_id,
            so.id AS order_id,
            so.party_id
           FROM public.sales_orders so) d
  GROUP BY activity_date
  ORDER BY activity_date DESC;


ALTER VIEW public.dashboard_daily_activity OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    city character varying(120) NOT NULL,
    district character varying(120),
    state character varying(120) DEFAULT 'Bihar'::character varying NOT NULL,
    country character varying(120) DEFAULT 'India'::character varying NOT NULL,
    distance_from_base_km numeric(8,2),
    base_reference character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: dashboard_party_directory; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.dashboard_party_directory AS
 SELECT p.id AS party_id,
    p.party_type,
    p.name AS party_name,
    p.phone,
    p.contact_person,
    p.address_line,
    l.city,
    l.district,
    l.state,
    l.distance_from_base_km,
    l.base_reference,
    p.is_active,
    p.notes
   FROM (public.parties p
     LEFT JOIN public.locations l ON ((l.id = p.location_id)));


ALTER VIEW public.dashboard_party_directory OWNER TO postgres;

--
-- Name: sales_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sales_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit_of_measure character varying(50) DEFAULT 'piece'::character varying NOT NULL,
    buy_rate numeric(12,2),
    sell_rate numeric(12,2),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sales_order_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.sales_order_items OWNER TO postgres;

--
-- Name: visit_required_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_required_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visit_id uuid NOT NULL,
    product_id uuid NOT NULL,
    requirement_type character varying(30) DEFAULT 'required'::character varying NOT NULL,
    quantity_estimate numeric(12,2),
    unit_of_measure character varying(50),
    brand_preference character varying(120),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT visit_required_items_requirement_type_check CHECK (((requirement_type)::text = ANY ((ARRAY['required'::character varying, 'recommended_sample'::character varying, 'mentioned'::character varying])::text[])))
);


ALTER TABLE public.visit_required_items OWNER TO postgres;

--
-- Name: dashboard_product_demand; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.dashboard_product_demand AS
 WITH visit_stats AS (
         SELECT vri.product_id,
            count(DISTINCT vri.visit_id) AS times_requested_in_visits,
            count(DISTINCT v.party_id) AS unique_parties_requesting
           FROM (public.visit_required_items vri
             JOIN public.visits v ON ((v.id = vri.visit_id)))
          GROUP BY vri.product_id
        ), order_stats AS (
         SELECT soi.product_id,
            sum(soi.quantity) AS ordered_quantity,
            sum((soi.quantity * COALESCE(soi.sell_rate, (0)::numeric))) AS ordered_value
           FROM (public.sales_order_items soi
             JOIN public.sales_orders so ON ((so.id = soi.sales_order_id)))
          WHERE ((so.order_status)::text = ANY ((ARRAY['confirmed'::character varying, 'delivered'::character varying])::text[]))
          GROUP BY soi.product_id
        )
 SELECT pr.id AS product_id,
    pr.product_name,
    COALESCE(vs.times_requested_in_visits, (0)::bigint) AS times_requested_in_visits,
    COALESCE(vs.unique_parties_requesting, (0)::bigint) AS unique_parties_requesting,
    COALESCE(os.ordered_quantity, (0)::numeric) AS ordered_quantity,
    COALESCE(os.ordered_value, (0)::numeric) AS ordered_value
   FROM ((public.products pr
     LEFT JOIN visit_stats vs ON ((vs.product_id = pr.id)))
     LEFT JOIN order_stats os ON ((os.product_id = pr.id)));


ALTER VIEW public.dashboard_product_demand OWNER TO postgres;

--
-- Name: dashboard_product_leaders; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.dashboard_product_leaders AS
 WITH product_sales AS (
         SELECT soi.product_id,
            so.party_id,
            sum(soi.quantity) AS total_quantity,
            sum((soi.quantity * COALESCE(soi.sell_rate, (0)::numeric))) AS total_sales_value
           FROM (public.sales_order_items soi
             JOIN public.sales_orders so ON ((so.id = soi.sales_order_id)))
          WHERE ((so.order_status)::text = ANY ((ARRAY['confirmed'::character varying, 'delivered'::character varying])::text[]))
          GROUP BY soi.product_id, so.party_id
        ), ranked AS (
         SELECT product_sales.product_id,
            product_sales.party_id,
            product_sales.total_quantity,
            product_sales.total_sales_value,
            row_number() OVER (PARTITION BY product_sales.product_id ORDER BY product_sales.total_quantity DESC, product_sales.total_sales_value DESC, product_sales.party_id) AS rn
           FROM product_sales
        )
 SELECT pr.id AS product_id,
    pr.product_name,
    pa.name AS leading_buyer_name,
    r.total_quantity,
    r.total_sales_value
   FROM ((public.products pr
     LEFT JOIN ranked r ON (((r.product_id = pr.id) AND (r.rn = 1))))
     LEFT JOIN public.parties pa ON ((pa.id = r.party_id)));


ALTER VIEW public.dashboard_product_leaders OWNER TO postgres;

--
-- Name: product_aliases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_aliases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    alias_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_aliases OWNER TO postgres;

--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, city, district, state, country, distance_from_base_km, base_reference, notes, created_at, updated_at) FROM stdin;
3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	West Champaran	Bihar	India	\N	Bagaha city	Hospital visit cluster	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
87f0e699-5059-474a-b87d-0d6bd0e481e2	Ramnagar	West Champaran	Bihar	India	34.00	Bagaha to Ramnagar	Today visit hospital cluster	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
29f1b04c-026c-486f-9626-4a6fbb8159fb	bangalore	west ban	Karnataka	India	23.00	close to banaglore	this hospital is good for med works	2026-06-08 18:47:39.746695+00	2026-06-08 18:47:39.746695+00
96961729-9ddf-47e5-bd84-9aa354220e6d	Bnagalore	west ban	karnataka	India	23.00	close to banaglore	this is best hospital to target sale of bandage	2026-06-08 18:51:04.935093+00	2026-06-08 18:51:04.935093+00
278dc566-e134-4086-9ac9-bb7f30b6bcc2	Bangalore	west ban	karnataka	India	23.00	close to banaglore	this hospital is good to target glove	2026-06-08 18:54:20.626007+00	2026-06-08 18:54:20.626007+00
ba397e43-abf5-4001-ad39-92e5599e6d67	Raxaul	East Champaran	Bihar	India	\N	\N	\N	2026-06-10 16:56:17.819553+00	2026-06-10 16:56:25.509541+00
63bbd687-4ba0-4340-9993-1baa7e616cd3	Harnatand	West Champaran	Bihar	India	22.00	Bagaha to Harnatand	Visit area	2026-06-08 18:32:01.107676+00	2026-06-10 20:07:59.855566+00
\.


--
-- Data for Name: parties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parties (id, party_type, name, phone, contact_person, location_id, address_line, is_active, notes, created_at, updated_at) FROM stdin;
09f9072e-de6d-4f29-bcce-b88d0984f56a	agency	Suman Medical Hall	9931084446	\N	63bbd687-4ba0-4340-9993-1baa7e616cd3	Bagaha to Harnatand	t	Initial survey entry	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
396c6467-427a-4d47-adf3-5b0587239722	hospital	Krishna Hospital	\N	\N	63bbd687-4ba0-4340-9993-1baa7e616cd3	Harnatand	t	Visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
715ebe17-3cf9-48c4-b334-8ceddcdd4e07	hospital	Patwari Netra Chikitsalaya	\N	\N	63bbd687-4ba0-4340-9993-1baa7e616cd3	Harnatand	t	Visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
b91a7af9-ae1a-4652-92f5-57f613056495	hospital	Sunaina Smriti Sewa Sansthan	\N	\N	63bbd687-4ba0-4340-9993-1baa7e616cd3	Harnatand	t	Visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
4cc53673-121b-40ae-b667-f56e488aae51	hospital	Hope Hospital	9431318866	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
f9c8d413-97fc-4623-963e-2aef8a4ed5de	hospital	Budha Hospital & Maternity Centre	9565688301	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
cbca80f2-aa97-45f9-a3f1-390aadce12d1	hospital	Savitri Health Care	9304380249	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
3231fa95-bae5-444d-9d58-e987c519ce94	hospital	Sanjeevani Hospital	6251226410	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
ba5c9010-fe55-491b-8b0e-a075070f36b3	hospital	Shyam Hospital	\N	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
692a4b4e-5c75-47fa-8f1f-a4f57d3070ad	hospital	Shanti Seva Sadan	\N	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
b2b495a7-049b-4e26-87fe-aa0cf5aa214c	hospital	Bagah City Hospital	\N	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
c69edd2f-74d8-4f78-be6d-8272e6e6e3a9	hospital	Homoeo Cancer Sewa Hospital	9955133355	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
17de701b-997f-4309-bbaf-b860ea520f3c	hospital	APPLO Dental Hospital	9934803480	\N	3fcf55e9-a3ad-47e6-b5c3-61051c6bd3af	Bagaha City	t	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
7cefa633-6c25-4596-99cd-9ac7f7954142	hospital	Dr BN Jha	\N	\N	87f0e699-5059-474a-b87d-0d6bd0e481e2	Ramnagar, Harinagar	t	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
151efe88-dcc1-4f73-acaf-c4c2602320f1	hospital	Aman Hospital	\N	\N	87f0e699-5059-474a-b87d-0d6bd0e481e2	Ramnagar, Harinagar	t	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
ba5eeff5-e047-4829-a993-26ff6b5d1a7f	hospital	Janta Hospital	\N	\N	87f0e699-5059-474a-b87d-0d6bd0e481e2	Ramnagar, Harinagar	t	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
9f5e4ba1-0343-4313-9937-0e207371c23f	hospital	Alfa Emergency Hospital	\N	\N	87f0e699-5059-474a-b87d-0d6bd0e481e2	Ramnagar, Harinagar	t	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
a21d7689-1cb5-4458-8b2a-e5827f26c46e	hospital	Manipal hospital	8789198299	akasj	29f1b04c-026c-486f-9626-4a6fbb8159fb	bgs hospital	t	this hospital is good for med works	2026-06-08 18:47:39.77802+00	2026-06-08 18:47:39.77802+00
92037a79-7a49-496d-9c97-9872b212de3f	hospital	bgs hospital	08789198929	akash	96961729-9ddf-47e5-bd84-9aa354220e6d	bgs kengiri	t	this is best hospital to target sale of bandage	2026-06-08 18:51:04.955103+00	2026-06-08 18:51:04.955103+00
cf9d9abb-305e-445e-b12e-9dc5364a20a5	clinic	Test Clinic API Updated	8888888888	\N	ba397e43-abf5-4001-ad39-92e5599e6d67	\N	f	\N	2026-06-10 16:56:17.836223+00	2026-06-10 16:56:25.651142+00
a8901e92-eecb-417f-a829-a0995958a099	agency	RAI Drug Agency	9934498910		63bbd687-4ba0-4340-9993-1baa7e616cd3	Harnatand	t	Initial survey entry	2026-06-08 18:32:01.107676+00	2026-06-10 20:07:59.887944+00
\.


--
-- Data for Name: party_product_pricing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.party_product_pricing (id, party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, effective_to, notes, created_at) FROM stdin;
d526be52-6a7a-41e3-a3ca-8cef2afe2b3d	09f9072e-de6d-4f29-bcce-b88d0984f56a	9287e948-a331-4fc6-810a-c26eae5c5e64	12.00	16.00	INR	2026-06-08	\N	Initial price capture	2026-06-08 18:32:01.107676+00
1108dbb4-ad8c-4fe3-82b3-022fc6365e57	09f9072e-de6d-4f29-bcce-b88d0984f56a	ac5ba26d-1821-43f6-aab2-84a5042bd759	180.00	220.00	INR	2026-06-08	\N	Initial price capture	2026-06-08 18:32:01.107676+00
26446884-ec85-47a8-8927-576b94a55db3	a8901e92-eecb-417f-a829-a0995958a099	6cdc0d44-e3d5-4c5f-93d6-3aa553643495	18.00	25.00	INR	2026-06-08	\N	Initial price capture	2026-06-08 18:32:01.107676+00
8590eb61-21d3-42cf-a0ae-9e6943c74a4f	a8901e92-eecb-417f-a829-a0995958a099	0db00fce-341d-4e6c-a12d-ad968892f827	55.00	72.00	INR	2026-06-08	\N	Initial price capture	2026-06-08 18:32:01.107676+00
64a532eb-4673-4ec4-b1b9-cc8a3feb1627	4cc53673-121b-40ae-b667-f56e488aae51	54ad5b0a-ca01-48d2-822d-7244bdd310be	210.00	255.00	INR	2026-06-08	\N	Initial price capture	2026-06-08 18:32:01.107676+00
7d74b0ca-675d-4a47-bb8a-07e7f452d5c9	09f9072e-de6d-4f29-bcce-b88d0984f56a	22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	65.00	92.00	INR	2026-06-10	\N	Auto-updated from order edit	2026-06-10 15:56:45.275923+00
44b00e21-061f-41f3-a719-8937492cc9f8	09f9072e-de6d-4f29-bcce-b88d0984f56a	22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	150.00	220.00	INR	2026-06-10	\N	Auto-updated from order edit	2026-06-10 16:56:48.537592+00
1d90ee4c-2500-42c4-ae1c-85dfa6c07ee2	151efe88-dcc1-4f73-acaf-c4c2602320f1	0db00fce-341d-4e6c-a12d-ad968892f827	3.00	3.00	INR	2026-06-13	\N	Auto-saved from order entry	2026-06-10 17:17:16.861865+00
\.


--
-- Data for Name: product_aliases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_aliases (id, product_id, alias_name, created_at) FROM stdin;
bbce5745-a8b5-430c-a728-9c566daf4090	059525bc-f21a-4952-998a-e27f6832ae56	Abdominal bag	2026-06-08 18:32:01.107676+00
3fd8b977-ae31-4a27-9ab5-2a94979d7d20	f5895378-0b23-4bc5-a169-9a1cca8415a5	Foley's	2026-06-08 18:32:01.107676+00
6ef573c0-5fe6-4a44-b977-19e59fabd3bf	6cdc0d44-e3d5-4c5f-93d6-3aa553643495	IV Cannula	2026-06-08 18:32:01.107676+00
b062d0a8-cdae-4875-bfc0-95c5683612ff	e6ff9601-b6b3-46b4-922c-e8bcf7ad94df	Disposal	2026-06-08 18:32:01.107676+00
e263560f-a7d8-40a1-8490-e821ba8515a6	22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	Cotton 400 gm	2026-06-08 18:32:01.107676+00
f8e39153-04df-4990-b56e-9e8ec9d7313c	85444134-a863-497f-9b40-6a2e1534083c	de	2026-06-10 17:14:05.715371+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, sku, product_name, product_category, unit_of_measure, preferred_brand, hindi_name, sample_priority, is_active, notes, created_at, updated_at) FROM stdin;
059525bc-f21a-4952-998a-e27f6832ae56	ABD-BELT	Abdominal Belt	Orthopaedic Support	piece	\N	पेट / एब्डोमिनल सपोर्ट	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
03ceb448-c5ba-42e9-acd7-12db0b89bbf1	KNEE-CAP	Knee Cap	Orthopaedic Support	piece	\N	घुटने का सपोर्ट	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
d46640af-c8e6-4900-a87a-3868be959cc5	CREPE-BANDAGE	Crepe Bandage	Bandage	piece	\N	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
01446a6e-07ef-4939-98ef-ab3937251a69	PAPER-TAPE	Paper Tape	Tape	piece	\N	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
9287e948-a331-4fc6-810a-c26eae5c5e64	IV-SET	IV Set	Infusion	piece	\N	ड्रिप सेट	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
c07516c5-f6e4-41f4-817c-c588d3a23e8a	INFANT-CAP	Infant Cap	Neonatal	piece	\N	नवजात शिशु की टोपी	f	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
f2f6bfec-149c-4f4f-b9b0-530bf628397f	FIXING-TAPE	Fixing Tape	Tape	piece	\N	ड्रेसिंग फिक्स करने वाली टेप	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
f5895378-0b23-4bc5-a169-9a1cca8415a5	FOLEY-CATH	Foley Catheter	Urology	piece	\N	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
9030b28a-398c-41f7-b437-8a8a3bf32a6a	BANDAGE-6IN	Bandage 6 Inch	Bandage	piece	\N	\N	f	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
e6ff9601-b6b3-46b4-922c-e8bcf7ad94df	SYRINGE-DISP	Syringe / Disposal	Injection	piece	\N	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
6cdc0d44-e3d5-4c5f-93d6-3aa553643495	IV-CANNULA	Cannula	Infusion	piece	Romson	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
0db00fce-341d-4e6c-a12d-ad968892f827	URINE-BAG	Urine Bag	Urology	piece	Romson	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
06cfe904-c416-44a1-935c-752d42bff784	URINAL-PIPE	Urinal Pipe	Urology	piece	Romson	\N	f	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
5445d747-09eb-4ae5-81da-3a2c23f42835	RYLES-TUBE	Ryle's Tube	Gastro	piece	Romson	\N	t	t	\N	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
54ad5b0a-ca01-48d2-822d-7244bdd310be	SURGICAL-GLOVES	Surgical Gloves	Gloves	box	\N	\N	t	t	Recommended sample item	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
9771e9dd-6840-4bd1-aba8-afcbcf7a8757	EXAM-GLOVES	Examination Gloves	Gloves	box	\N	\N	t	t	Recommended sample item	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
41619ec5-ce56-45d4-811f-9a519f9fdbab	SYRINGE-2ML	Syringe 2 ml	Injection	piece	\N	\N	t	t	Recommended sample item	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
57da94b5-01e3-4fd8-ab3a-37cce90f336f	SYRINGE-5ML	Syringe 5 ml	Injection	piece	\N	\N	t	t	Recommended sample item	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
c7d311d9-4d85-4dad-8f3e-8ba687ddef21	SYRINGE-10ML	Syringe 10 ml	Injection	piece	\N	\N	t	t	Recommended sample item	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
b94b362a-3e0f-45b9-9037-8b70c53422eb	LS-BELT	LS Belt	Orthopaedic Support	piece	\N	\N	t	t	Recommended sample item	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
ac5ba26d-1821-43f6-aab2-84a5042bd759	GLOVES-POWDER	Hand Gloves (Powder)	Gloves	box	\N	\N	t	f	\N	2026-06-08 18:32:01.107676+00	2026-06-10 15:54:17.1195+00
85444134-a863-497f-9b40-6a2e1534083c	skud	moderna	djbj	piece	ee	ded	f	t	\N	2026-06-10 17:14:05.691117+00	2026-06-10 17:14:05.691117+00
22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	COTTON-400GM	Cotton (Big) 400 gm	Dressing	pack			f	t		2026-06-08 18:32:01.107676+00	2026-06-10 20:02:28.114584+00
\.


--
-- Data for Name: sales_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_order_items (id, sales_order_id, product_id, quantity, unit_of_measure, buy_rate, sell_rate, notes, created_at) FROM stdin;
cc48fa12-8cbc-48d2-b2fb-900e6035eb27	e83cec86-fecc-4abf-95e3-8a1b0eee15d0	9287e948-a331-4fc6-810a-c26eae5c5e64	20.00	piece	12.00	16.00	\N	2026-06-08 18:32:01.107676+00
2e528b43-92a7-42d0-82c3-77b6a5a4eac3	e83cec86-fecc-4abf-95e3-8a1b0eee15d0	ac5ba26d-1821-43f6-aab2-84a5042bd759	10.00	box	180.00	220.00	\N	2026-06-08 18:32:01.107676+00
3c1486a4-2a57-4e14-8d22-6f53061f2969	225460b0-391a-4d17-afcc-b3f621481aa6	6cdc0d44-e3d5-4c5f-93d6-3aa553643495	30.00	piece	18.00	25.00	Romson	2026-06-08 18:32:01.107676+00
1d457c45-2c75-44c0-bacc-310cee0d0c5f	225460b0-391a-4d17-afcc-b3f621481aa6	0db00fce-341d-4e6c-a12d-ad968892f827	12.00	piece	55.00	72.00	Romson	2026-06-08 18:32:01.107676+00
406ef656-7a53-4a4a-a6c7-b723ed8d5c33	225460b0-391a-4d17-afcc-b3f621481aa6	5445d747-09eb-4ae5-81da-3a2c23f42835	8.00	piece	30.00	44.00	Romson	2026-06-08 18:32:01.107676+00
7cfd88d2-569a-4a5b-a6cb-9b97a1644a90	0d0738c2-124a-4f62-837f-c4eae07e2a73	54ad5b0a-ca01-48d2-822d-7244bdd310be	6.00	box	210.00	255.00	\N	2026-06-08 18:32:01.107676+00
76b1d1ca-1ce6-4210-9c64-751dc00ac371	0d0738c2-124a-4f62-837f-c4eae07e2a73	57da94b5-01e3-4fd8-ab3a-37cce90f336f	100.00	piece	3.20	4.80	\N	2026-06-08 18:32:01.107676+00
20d6a0cd-e3aa-4e50-8034-c42e7276fb16	e83cec86-fecc-4abf-95e3-8a1b0eee15d0	22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	12.00	pack	150.00	220.00	-	2026-06-08 18:32:01.107676+00
62ef8ac6-0ad9-464d-a81e-6a77093a7e77	326ab1b2-bda5-4045-8e6f-4c8f16ece766	0db00fce-341d-4e6c-a12d-ad968892f827	34.00	piece	3.00	3.00	\N	2026-06-10 17:17:16.861865+00
\.


--
-- Data for Name: sales_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_orders (id, party_id, order_date, order_status, reference_number, notes, created_at, updated_at) FROM stdin;
e83cec86-fecc-4abf-95e3-8a1b0eee15d0	09f9072e-de6d-4f29-bcce-b88d0984f56a	2026-06-08	confirmed	INIT-ORDER-001	Initial sample order for dashboard testing	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
225460b0-391a-4d17-afcc-b3f621481aa6	a8901e92-eecb-417f-a829-a0995958a099	2026-06-08	confirmed	INIT-ORDER-002	Initial sample order for dashboard testing	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
0d0738c2-124a-4f62-837f-c4eae07e2a73	4cc53673-121b-40ae-b667-f56e488aae51	2026-06-08	confirmed	INIT-ORDER-003	Initial sample order for dashboard testing	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
326ab1b2-bda5-4045-8e6f-4c8f16ece766	151efe88-dcc1-4f73-acaf-c4c2602320f1	2026-06-13	draft	34		2026-06-10 17:17:16.861865+00	2026-06-10 20:09:52.737945+00
\.


--
-- Data for Name: visit_required_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_required_items (id, visit_id, product_id, requirement_type, quantity_estimate, unit_of_measure, brand_preference, notes, created_at) FROM stdin;
1ae62475-8e67-480e-9f96-1076229541ea	6a0b561b-9e0a-48ec-992e-fae104501044	059525bc-f21a-4952-998a-e27f6832ae56	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
2e42d070-ab38-496f-a9d0-e3d5d34e3d1f	6a0b561b-9e0a-48ec-992e-fae104501044	03ceb448-c5ba-42e9-acd7-12db0b89bbf1	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
f9ea7832-ded7-4a03-a873-5d5d9eb0edf0	6a0b561b-9e0a-48ec-992e-fae104501044	d46640af-c8e6-4900-a87a-3868be959cc5	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
d26803ea-d6e6-4e0e-9d6a-dd68046bebc4	6a0b561b-9e0a-48ec-992e-fae104501044	01446a6e-07ef-4939-98ef-ab3937251a69	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
624c8637-0400-4587-a524-cd944227b5de	6a0b561b-9e0a-48ec-992e-fae104501044	9287e948-a331-4fc6-810a-c26eae5c5e64	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
f2680bee-0c34-4c20-a5c6-434f771b644c	6a0b561b-9e0a-48ec-992e-fae104501044	c07516c5-f6e4-41f4-817c-c588d3a23e8a	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
8e68b539-82da-4c74-8548-198d3dc42be0	6a0b561b-9e0a-48ec-992e-fae104501044	f2f6bfec-149c-4f4f-b9b0-530bf628397f	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
d0d3c91a-6631-4df4-98a2-e5a2d91e6bea	6a0b561b-9e0a-48ec-992e-fae104501044	f5895378-0b23-4bc5-a169-9a1cca8415a5	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
bdc4e8e1-e961-4948-a9a1-467c096623d7	6a0b561b-9e0a-48ec-992e-fae104501044	ac5ba26d-1821-43f6-aab2-84a5042bd759	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
00f288ed-3dcb-48ea-a56e-821a0e113738	6a0b561b-9e0a-48ec-992e-fae104501044	22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
0de8e409-0bea-4db7-83d1-0a064194ad93	6a0b561b-9e0a-48ec-992e-fae104501044	9030b28a-398c-41f7-b437-8a8a3bf32a6a	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
09f9ff0b-f82a-48be-bba0-485939ad902c	49fdbefc-4d10-4c06-8ac8-92df24c7837d	22fe68e0-f22c-4155-94ae-c7b65fbe5ef6	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
0e246598-96ac-4b95-8776-f5e7a15d18ad	49fdbefc-4d10-4c06-8ac8-92df24c7837d	e6ff9601-b6b3-46b4-922c-e8bcf7ad94df	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
d7b5c3d4-0c67-4ae8-bf19-896c1c1cc34f	49fdbefc-4d10-4c06-8ac8-92df24c7837d	ac5ba26d-1821-43f6-aab2-84a5042bd759	required	\N	\N	\N	\N	2026-06-08 18:32:01.107676+00
88ee09ba-86ae-4e34-b215-4fe3d35852e3	49fdbefc-4d10-4c06-8ac8-92df24c7837d	6cdc0d44-e3d5-4c5f-93d6-3aa553643495	required	\N	\N	\N	Company Name: Romson	2026-06-08 18:32:01.107676+00
adab4a14-6c68-484e-8015-a5c68668012f	49fdbefc-4d10-4c06-8ac8-92df24c7837d	0db00fce-341d-4e6c-a12d-ad968892f827	required	\N	\N	\N	Company Name: Romson	2026-06-08 18:32:01.107676+00
072929be-15a5-4eaf-a572-c7f085ca7fa8	49fdbefc-4d10-4c06-8ac8-92df24c7837d	06cfe904-c416-44a1-935c-752d42bff784	required	\N	\N	\N	Company Name: Romson	2026-06-08 18:32:01.107676+00
b49d4fa6-91b0-412c-8571-e62c275e0d85	49fdbefc-4d10-4c06-8ac8-92df24c7837d	5445d747-09eb-4ae5-81da-3a2c23f42835	required	\N	\N	\N	Company Name: Romson	2026-06-08 18:32:01.107676+00
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, party_id, visit_date, visit_purpose, visit_status, location_snapshot, distance_snapshot_km, contact_snapshot, notes, created_at, updated_at) FROM stdin;
6a0b561b-9e0a-48ec-992e-fae104501044	09f9072e-de6d-4f29-bcce-b88d0984f56a	2026-06-08	regular_visit	completed	Harnatand	22.00	9931084446	Captured address, phone, and required items	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
49fdbefc-4d10-4c06-8ac8-92df24c7837d	a8901e92-eecb-417f-a829-a0995958a099	2026-06-08	regular_visit	completed	Harnatand	22.00	9934498910	Captured address, phone, and required items	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
bee2513b-0f94-4287-894e-ee8af1e58e13	396c6467-427a-4d47-adf3-5b0587239722	2026-06-08	regular_visit	completed	Harnatand	22.00	\N	Visit hospital list	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
1ef8f246-6aaa-4b52-bd0b-11cff91bee81	715ebe17-3cf9-48c4-b334-8ceddcdd4e07	2026-06-08	regular_visit	completed	Harnatand	22.00	\N	Visit hospital list	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
9aa1f5a5-4f99-4b59-8d09-c904479dacae	b91a7af9-ae1a-4652-92f5-57f613056495	2026-06-08	regular_visit	completed	Harnatand	22.00	\N	Visit hospital list	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
2af546d1-f412-466a-b08a-0d9e6d06631f	4cc53673-121b-40ae-b667-f56e488aae51	2026-06-08	regular_visit	completed	Bagaha City	\N	9431318866	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
2917b5fe-77e5-4ed4-9bc2-1f32f89dbfb4	f9c8d413-97fc-4623-963e-2aef8a4ed5de	2026-06-08	regular_visit	completed	Bagaha City	\N	9565688301	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
b0105880-7f59-4a17-b81e-000b6d900916	cbca80f2-aa97-45f9-a3f1-390aadce12d1	2026-06-08	regular_visit	completed	Bagaha City	\N	9304380249	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
9148c866-5820-417f-b958-c7ad42d22760	3231fa95-bae5-444d-9d58-e987c519ce94	2026-06-08	regular_visit	completed	Bagaha City	\N	6251226410	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
81bb3c27-5fc5-4518-885b-af2cad4522b4	ba5c9010-fe55-491b-8b0e-a075070f36b3	2026-06-08	regular_visit	completed	Bagaha City	\N	\N	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
7bbbb716-f1a3-4d07-abff-4087e58bb808	692a4b4e-5c75-47fa-8f1f-a4f57d3070ad	2026-06-08	regular_visit	completed	Bagaha City	\N	\N	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
10e4f7e6-aef6-489e-b92b-3f322f7f32dc	b2b495a7-049b-4e26-87fe-aa0cf5aa214c	2026-06-08	regular_visit	completed	Bagaha City	\N	\N	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
a44419dc-fc50-4d41-b2d5-f4a19dc41623	c69edd2f-74d8-4f78-be6d-8272e6e6e3a9	2026-06-08	regular_visit	completed	Bagaha City	\N	9955133355	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
6274371b-dd71-433a-ad96-89e5aa002e25	17de701b-997f-4309-bbaf-b860ea520f3c	2026-06-08	regular_visit	completed	Bagaha City	\N	9934803480	Hospital name visit	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
74bced16-c76a-41ab-a222-11200d90ba0e	7cefa633-6c25-4596-99cd-9ac7f7954142	2026-06-08	regular_visit	completed	Ramnagar	34.00	\N	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
746a7f61-f761-42ca-a545-91bb79fc3021	151efe88-dcc1-4f73-acaf-c4c2602320f1	2026-06-08	regular_visit	completed	Ramnagar	34.00	\N	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
42c50cdb-a952-4763-a8b4-d3946bd59469	ba5eeff5-e047-4829-a993-26ff6b5d1a7f	2026-06-08	regular_visit	completed	Ramnagar	34.00	\N	Today visit hospital	2026-06-08 18:32:01.107676+00	2026-06-08 18:32:01.107676+00
0e632357-1908-4b29-b680-dada569a19b3	9f5e4ba1-0343-4313-9937-0e207371c23f	2026-06-08	regular_visit	cancelled	Ramnagar	34.00		Updated via API test	2026-06-08 18:32:01.107676+00	2026-06-10 20:01:52.21254+00
\.


--
-- Name: locations locations_city_district_state_country_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_city_district_state_country_key UNIQUE (city, district, state, country);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_pkey PRIMARY KEY (id);


--
-- Name: party_product_pricing party_product_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.party_product_pricing
    ADD CONSTRAINT party_product_pricing_pkey PRIMARY KEY (id);


--
-- Name: product_aliases product_aliases_alias_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_aliases
    ADD CONSTRAINT product_aliases_alias_name_key UNIQUE (alias_name);


--
-- Name: product_aliases product_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_aliases
    ADD CONSTRAINT product_aliases_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_name_key UNIQUE (product_name);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: sales_order_items sales_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_pkey PRIMARY KEY (id);


--
-- Name: sales_order_items sales_order_items_sales_order_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_sales_order_id_product_id_key UNIQUE (sales_order_id, product_id);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: visit_required_items visit_required_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_required_items
    ADD CONSTRAINT visit_required_items_pkey PRIMARY KEY (id);


--
-- Name: visit_required_items visit_required_items_visit_id_product_id_requirement_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_required_items
    ADD CONSTRAINT visit_required_items_visit_id_product_id_requirement_type_key UNIQUE (visit_id, product_id, requirement_type);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: ux_parties_type_name_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_parties_type_name_phone ON public.parties USING btree (party_type, name, COALESCE(phone, ''::character varying));


--
-- Name: ux_sales_orders_party_date_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_sales_orders_party_date_reference ON public.sales_orders USING btree (party_id, order_date, COALESCE(reference_number, ''::character varying));


--
-- Name: locations trg_locations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: parties trg_parties_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_parties_updated_at BEFORE UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products trg_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sales_orders trg_sales_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: visits trg_visits_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: parties parties_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: party_product_pricing party_product_pricing_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.party_product_pricing
    ADD CONSTRAINT party_product_pricing_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- Name: party_product_pricing party_product_pricing_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.party_product_pricing
    ADD CONSTRAINT party_product_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_aliases product_aliases_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_aliases
    ADD CONSTRAINT product_aliases_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: sales_order_items sales_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sales_order_items sales_order_items_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE;


--
-- Name: sales_orders sales_orders_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id);


--
-- Name: visit_required_items visit_required_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_required_items
    ADD CONSTRAINT visit_required_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: visit_required_items visit_required_items_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_required_items
    ADD CONSTRAINT visit_required_items_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- Name: visits visits_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict k6wHYv9aCBeb5lTq3HZsAka3qSokIDySdANbDun1ksTQa8K0xYmgERYNbuTD11T

