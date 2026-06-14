from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, execute

router = APIRouter()


class SpecItem(BaseModel):
    key: str
    value: str


class CatalogProductCreate(BaseModel):
    name: str
    description: str
    category: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    delivery_days: int = 2
    images: List[str] = []
    specs: List[SpecItem] = []


class CatalogProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    delivery_days: Optional[int] = None
    specs: Optional[List[SpecItem]] = None


@router.get("")
def list_catalog():
    products = query(
        """
        SELECT cp.id, cp.name, cp.description, cp.category, cp.brand,
               cp.unit, cp.delivery_days, cp.created_at,
               (SELECT cpi.image_url FROM catalog_product_images cpi
                WHERE cpi.product_id = cp.id ORDER BY cpi.sort_order LIMIT 1) AS primary_image,
               (SELECT COUNT(*) FROM catalog_product_images cpi WHERE cpi.product_id = cp.id) AS image_count,
               (SELECT COUNT(*) FROM catalog_product_specs cps WHERE cps.product_id = cp.id) AS spec_count
        FROM catalog_products cp
        WHERE cp.is_active = TRUE
        ORDER BY cp.created_at DESC
        """
    )
    return [{**p, "id": str(p["id"])} for p in products]


@router.get("/{product_id}")
def get_catalog_product(product_id: str):
    rows = query(
        """
        SELECT id, name, description, category, brand, unit, delivery_days, created_at
        FROM catalog_products WHERE id = %s AND is_active = TRUE
        """,
        (product_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")
    p = rows[0]

    images = query(
        "SELECT id, image_url, sort_order FROM catalog_product_images WHERE product_id = %s ORDER BY sort_order",
        (product_id,),
    )
    specs = query(
        "SELECT id, spec_key, spec_value, sort_order FROM catalog_product_specs WHERE product_id = %s ORDER BY sort_order",
        (product_id,),
    )
    return {
        **p,
        "id": str(p["id"]),
        "images": [{**i, "id": str(i["id"])} for i in images],
        "specs": [{**s, "id": str(s["id"])} for s in specs],
    }


@router.post("", status_code=201)
def create_catalog_product(body: CatalogProductCreate):
    row = execute(
        """
        INSERT INTO catalog_products (name, description, category, brand, unit, delivery_days)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """,
        (body.name, body.description, body.category or None,
         body.brand or None, body.unit or None, body.delivery_days),
        returning=True,
    )
    product_id = str(row["id"])

    for i, image_url in enumerate(body.images):
        if image_url:
            execute(
                "INSERT INTO catalog_product_images (product_id, image_url, sort_order) VALUES (%s, %s, %s)",
                (product_id, image_url, i),
            )

    for i, spec in enumerate(body.specs):
        if spec.key.strip() and spec.value.strip():
            execute(
                "INSERT INTO catalog_product_specs (product_id, spec_key, spec_value, sort_order) VALUES (%s, %s, %s, %s)",
                (product_id, spec.key.strip(), spec.value.strip(), i),
            )

    return {"id": product_id}


@router.patch("/{product_id}")
def update_catalog_product(product_id: str, body: CatalogProductUpdate):
    # Update core fields if provided
    updates = body.model_dump(exclude_none=True, exclude={"specs"})
    if updates:
        set_clause = ", ".join(f"{k} = %s" for k in updates)
        execute(
            f"UPDATE catalog_products SET {set_clause} WHERE id = %s",
            (*updates.values(), product_id),
        )

    # Replace specs if provided
    if body.specs is not None:
        execute("DELETE FROM catalog_product_specs WHERE product_id = %s", (product_id,))
        for i, spec in enumerate(body.specs):
            if spec.key.strip() and spec.value.strip():
                execute(
                    "INSERT INTO catalog_product_specs (product_id, spec_key, spec_value, sort_order) VALUES (%s, %s, %s, %s)",
                    (product_id, spec.key.strip(), spec.value.strip(), i),
                )

    return {"ok": True}


@router.delete("/{product_id}")
def deactivate_catalog_product(product_id: str):
    execute("UPDATE catalog_products SET is_active = FALSE WHERE id = %s", (product_id,))
    return {"ok": True}
