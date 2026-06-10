CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(120) NOT NULL,
    district VARCHAR(120),
    state VARCHAR(120) NOT NULL DEFAULT 'Bihar',
    country VARCHAR(120) NOT NULL DEFAULT 'India',
    distance_from_base_km NUMERIC(8,2),
    base_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (city, district, state, country)
);

CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_type VARCHAR(30) NOT NULL CHECK (party_type IN ('hospital', 'agency', 'clinic', 'other')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    contact_person VARCHAR(255),
    location_id UUID REFERENCES locations(id),
    address_line TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(60) UNIQUE,
    product_name VARCHAR(255) NOT NULL UNIQUE,
    product_category VARCHAR(120),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'piece',
    preferred_brand VARCHAR(120),
    hindi_name VARCHAR(255),
    sample_priority BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_purpose VARCHAR(80) NOT NULL DEFAULT 'regular_visit',
    visit_status VARCHAR(40) NOT NULL DEFAULT 'completed',
    location_snapshot TEXT,
    distance_snapshot_km NUMERIC(8,2),
    contact_snapshot VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visit_required_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    requirement_type VARCHAR(30) NOT NULL DEFAULT 'required' CHECK (requirement_type IN ('required', 'recommended_sample', 'mentioned')),
    quantity_estimate NUMERIC(12,2),
    unit_of_measure VARCHAR(50),
    brand_preference VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (visit_id, product_id, requirement_type)
);

CREATE TABLE party_product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buy_rate NUMERIC(12,2),
    sell_rate NUMERIC(12,2),
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES parties(id),
    order_date DATE NOT NULL,
    order_status VARCHAR(40) NOT NULL DEFAULT 'confirmed' CHECK (order_status IN ('draft', 'confirmed', 'delivered', 'cancelled')),
    reference_number VARCHAR(80),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'piece',
    buy_rate NUMERIC(12,2),
    sell_rate NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sales_order_id, product_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_parties_updated_at
BEFORE UPDATE ON parties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_visits_updated_at
BEFORE UPDATE ON visits
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sales_orders_updated_at
BEFORE UPDATE ON sales_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX ux_parties_type_name_phone
ON parties (party_type, name, COALESCE(phone, ''));

CREATE UNIQUE INDEX ux_sales_orders_party_date_reference
ON sales_orders (party_id, order_date, COALESCE(reference_number, ''));

CREATE VIEW dashboard_party_directory AS
SELECT
    p.id AS party_id,
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
FROM parties p
LEFT JOIN locations l ON l.id = p.location_id;

CREATE VIEW dashboard_product_leaders AS
WITH product_sales AS (
    SELECT
        soi.product_id,
        so.party_id,
        SUM(soi.quantity) AS total_quantity,
        SUM(soi.quantity * COALESCE(soi.sell_rate, 0)) AS total_sales_value
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE so.order_status IN ('confirmed', 'delivered')
    GROUP BY soi.product_id, so.party_id
),
ranked AS (
    SELECT
        product_id,
        party_id,
        total_quantity,
        total_sales_value,
        ROW_NUMBER() OVER (
            PARTITION BY product_id
            ORDER BY total_quantity DESC, total_sales_value DESC, party_id
        ) AS rn
    FROM product_sales
)
SELECT
    pr.id AS product_id,
    pr.product_name,
    pa.name AS leading_buyer_name,
    r.total_quantity,
    r.total_sales_value
FROM products pr
LEFT JOIN ranked r ON r.product_id = pr.id AND r.rn = 1
LEFT JOIN parties pa ON pa.id = r.party_id;

CREATE VIEW dashboard_current_pricing AS
SELECT DISTINCT ON (ppp.party_id, ppp.product_id)
    ppp.party_id,
    pa.name AS party_name,
    ppp.product_id,
    pr.product_name,
    ppp.buy_rate,
    ppp.sell_rate,
    ppp.currency_code,
    ppp.effective_from,
    ppp.effective_to
FROM party_product_pricing ppp
JOIN parties pa ON pa.id = ppp.party_id
JOIN products pr ON pr.id = ppp.product_id
ORDER BY ppp.party_id, ppp.product_id, ppp.effective_from DESC, ppp.created_at DESC;

CREATE VIEW dashboard_product_demand AS
WITH visit_stats AS (
    SELECT
        vri.product_id,
        COUNT(DISTINCT vri.visit_id) AS times_requested_in_visits,
        COUNT(DISTINCT v.party_id) AS unique_parties_requesting
    FROM visit_required_items vri
    JOIN visits v ON v.id = vri.visit_id
    GROUP BY vri.product_id
),
order_stats AS (
    SELECT
        soi.product_id,
        SUM(soi.quantity) AS ordered_quantity,
        SUM(soi.quantity * COALESCE(soi.sell_rate, 0)) AS ordered_value
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE so.order_status IN ('confirmed', 'delivered')
    GROUP BY soi.product_id
)
SELECT
    pr.id AS product_id,
    pr.product_name,
    COALESCE(vs.times_requested_in_visits, 0) AS times_requested_in_visits,
    COALESCE(vs.unique_parties_requesting, 0) AS unique_parties_requesting,
    COALESCE(os.ordered_quantity, 0) AS ordered_quantity,
    COALESCE(os.ordered_value, 0) AS ordered_value
FROM products pr
LEFT JOIN visit_stats vs ON vs.product_id = pr.id
LEFT JOIN order_stats os ON os.product_id = pr.id;

CREATE VIEW dashboard_daily_activity AS
SELECT
    d.activity_date,
    COUNT(DISTINCT d.visit_id) AS visits_count,
    COUNT(DISTINCT d.order_id) AS orders_count,
    COUNT(DISTINCT d.party_id) AS active_parties
FROM (
    SELECT
        v.visit_date AS activity_date,
        v.id AS visit_id,
        NULL::UUID AS order_id,
        v.party_id
    FROM visits v
    UNION ALL
    SELECT
        so.order_date AS activity_date,
        NULL::UUID AS visit_id,
        so.id AS order_id,
        so.party_id
    FROM sales_orders so
) d
GROUP BY d.activity_date
ORDER BY d.activity_date DESC;
