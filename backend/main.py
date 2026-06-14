import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, parties, products, visits, orders, pricing, auth
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
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(parties.router, prefix="/api/parties", tags=["parties"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(visits.router, prefix="/api/visits", tags=["visits"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["pricing"])


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
        "INSERT INTO access_codes (code) VALUES ('97715') ON CONFLICT (code) DO NOTHING",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bill_period_from DATE",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bill_period_to DATE",
        "ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20)",
        "ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5,2) DEFAULT 6",
        "ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5,2) DEFAULT 6",
    ]
    for sql in migrations:
        execute(sql)


@app.get("/api/health")
def health():
    return {"status": "ok"}
