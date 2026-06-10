from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, parties, products, visits, orders, pricing

app = FastAPI(title="MedTrust Healthcare API", version="2.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://medtrust.space",
    "https://www.medtrust.space",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(parties.router, prefix="/api/parties", tags=["parties"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(visits.router, prefix="/api/visits", tags=["visits"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["pricing"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
