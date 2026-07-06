import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, parties, products, visits, orders, pricing, auth, catalog, enquiries, stock, expenses
from database import execute

app = FastAPI(title="MedTrust Healthcare API", version="2.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://medtrust.space",
    "https://www.medtrust.space",
]

# Add any extra origins from env (e.g. Vercel preview URLs)
# Set ALLOWED_ORIGINS_EXTRA=https://yourapp.vercel.app,https://other.com in Railway
_extra = os.getenv("ALLOWED_ORIGINS_EXTRA", "")
if _extra:
    ALLOWED_ORIGINS += [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(enquiries.router, prefix="/api/enquiries", tags=["enquiries"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(parties.router, prefix="/api/parties", tags=["parties"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(visits.router, prefix="/api/visits", tags=["visits"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["pricing"])
app.include_router(stock.router, prefix="/api/stock", tags=["stock"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])


@app.on_event("startup")
def run_migrations():
    """Add new invoice-related columns if they don't exist yet."""
    migrations = [
        """
        CREATE TABLE IF NOT EXISTS access_codes (
            id SERIAL PRIMARY KEY,
            code CHAR(5) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT access_codes_code_unique UNIQUE (code),
            CONSTRAINT access_codes_digits CHECK (code ~ '^[0-9]{5}$')
        )
        """,
        "ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS role VARCHAR(10) DEFAULT 'admin'",
        "UPDATE access_codes SET role = 'admin' WHERE role IS NULL OR role = 'owner'",
        "INSERT INTO access_codes (code, role) VALUES ('97715', 'admin') ON CONFLICT (code) DO UPDATE SET role = 'admin'",
        "INSERT INTO access_codes (code, role) VALUES ('78787', 'staff') ON CONFLICT (code) DO UPDATE SET role = 'staff'",
        """
        CREATE TABLE IF NOT EXISTS catalog_products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT,
            brand TEXT,
            unit TEXT,
            delivery_days INTEGER DEFAULT 2,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS catalog_product_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS catalog_product_specs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
            spec_key TEXT NOT NULL,
            spec_value TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS product_enquiries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID,
            product_name TEXT NOT NULL,
            visitor_phone VARCHAR(20),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bill_period_from DATE",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bill_period_to DATE",
        "ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20)",
        "ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5,2) DEFAULT 6",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5,2) DEFAULT 6",
        # Fix order_status constraint to include payment_received + partial_payment
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'sales_orders_order_status_v3'
                AND conrelid = 'sales_orders'::regclass
            ) THEN
                ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_order_status_check;
                ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_order_status_v2;
                ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_order_status_v3
                CHECK (order_status IN ('draft', 'confirmed', 'delivered', 'partial_payment', 'payment_received', 'cancelled'));
            END IF;
        END $$
        """,
        # Partial cash payment tracking
        """
        CREATE TABLE IF NOT EXISTS order_payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
            amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
            payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(sales_order_id)",
        # Stock tracking
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity FLOAT DEFAULT 0",
        """
        CREATE TABLE IF NOT EXISTS stock_adjustments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            adjustment_type VARCHAR(30) NOT NULL,
            qty_before FLOAT NOT NULL DEFAULT 0,
            qty_change FLOAT NOT NULL DEFAULT 0,
            qty_after FLOAT NOT NULL DEFAULT 0,
            reference_order_id UUID,
            party_name TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_stock_adj_product ON stock_adjustments(product_id, created_at DESC)",
        # Allow multiple orders per party per date — try the most common auto-generated constraint names
        "ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_party_id_order_date_key",
        "ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS uq_sales_orders_party_date",
        "ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_party_date_unique",
        # Expense tracking
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_type VARCHAR(50) NOT NULL,
            amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
            expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
            paid_to TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC)",
        "CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type)",
    ]
    for sql in migrations:
        execute(sql)


@app.get("/api/health")
def health():
    return {"status": "ok"}
