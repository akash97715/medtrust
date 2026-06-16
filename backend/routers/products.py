from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, execute, get_conn
import psycopg2
import psycopg2.extras
import psycopg2.errors

router = APIRouter()


class ProductCreate(BaseModel):
    product_name: str
    sku: Optional[str] = None
    product_category: Optional[str] = None
    unit_of_measure: str = "piece"
    preferred_brand: Optional[str] = None
    hindi_name: Optional[str] = None
    sample_priority: bool = False
    notes: Optional[str] = None
    alias_name: Optional[str] = None


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    sku: Optional[str] = None
    product_category: Optional[str] = None
    unit_of_measure: Optional[str] = None
    preferred_brand: Optional[str] = None
    hindi_name: Optional[str] = None
    sample_priority: Optional[bool] = None
    notes: Optional[str] = None


class AliasCreate(BaseModel):
    alias_name: str


@router.get("")
def list_products():
    products = query(
        """
        SELECT p.id AS product_id, p.sku, p.product_name, p.product_category,
               p.unit_of_measure, p.preferred_brand, p.hindi_name, p.sample_priority, p.notes,
               dpd.times_requested_in_visits, dpd.unique_parties_requesting,
               dpd.ordered_quantity, dpd.ordered_value
        FROM products p
        LEFT JOIN dashboard_product_demand dpd ON dpd.product_id = p.id
        WHERE p.is_active = TRUE
        ORDER BY dpd.ordered_value DESC NULLS LAST, dpd.times_requested_in_visits DESC NULLS LAST, p.product_name
        """
    )
    aliases = query(
        """
        SELECT p.id AS product_id, pa.id AS alias_id, pa.alias_name
        FROM products p
        JOIN product_aliases pa ON pa.product_id = p.id
        ORDER BY pa.alias_name
        """
    )
    alias_map: dict = {}
    for a in aliases:
        pid = str(a["product_id"])
        alias_map.setdefault(pid, []).append({"id": str(a["alias_id"]), "alias_name": a["alias_name"]})

    return [
        {**{k: str(v) if k == "product_id" else v for k, v in p.items()},
         "aliases": alias_map.get(str(p["product_id"]), [])}
        for p in products
    ]


@router.get("/{product_id}")
def get_product(product_id: str):
    rows = query(
        "SELECT id, sku, product_name, product_category, unit_of_measure, preferred_brand, hindi_name, sample_priority, notes FROM products WHERE id = %s",
        (product_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")
    p = rows[0]
    aliases = query(
        "SELECT id, alias_name FROM product_aliases WHERE product_id = %s ORDER BY alias_name",
        (product_id,),
    )
    return {**p, "aliases": aliases}


@router.post("", status_code=201)
def create_product(body: ProductCreate):
    try:
        with get_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO products (sku, product_name, product_category, unit_of_measure, preferred_brand, hindi_name, sample_priority, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (body.sku or None, body.product_name, body.product_category or None,
                     body.unit_of_measure, body.preferred_brand or None, body.hindi_name or None,
                     body.sample_priority, body.notes or None),
                )
                product_id = str(dict(cur.fetchone())["id"])
                if body.alias_name:
                    cur.execute(
                        "INSERT INTO product_aliases (product_id, alias_name) VALUES (%s, %s) ON CONFLICT (alias_name) DO NOTHING",
                        (product_id, body.alias_name),
                    )
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail=f'A product named "{body.product_name}" already exists. Use a different name or edit the existing one.',
        )
    except psycopg2.Error as e:
        raise HTTPException(status_code=422, detail=str(e).splitlines()[0])
    return {"id": product_id}


@router.patch("/{product_id}")
def update_product(product_id: str, body: ProductUpdate):
    rows = query("SELECT * FROM products WHERE id = %s", (product_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")
    e = rows[0]
    execute(
        """
        UPDATE products
        SET sku = %s, product_name = %s, product_category = %s, unit_of_measure = %s,
            preferred_brand = %s, hindi_name = %s, sample_priority = %s, notes = %s, updated_at = NOW()
        WHERE id = %s
        """,
        (
            body.sku if body.sku is not None else e["sku"],
            body.product_name or e["product_name"],
            body.product_category if body.product_category is not None else e["product_category"],
            body.unit_of_measure or e["unit_of_measure"],
            body.preferred_brand if body.preferred_brand is not None else e["preferred_brand"],
            body.hindi_name if body.hindi_name is not None else e["hindi_name"],
            body.sample_priority if body.sample_priority is not None else e["sample_priority"],
            body.notes if body.notes is not None else e["notes"],
            product_id,
        ),
    )
    return {"ok": True}


@router.delete("/{product_id}")
def deactivate_product(product_id: str):
    execute("UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = %s", (product_id,))
    return {"ok": True}


@router.post("/{product_id}/aliases", status_code=201)
def add_alias(product_id: str, body: AliasCreate):
    execute(
        "INSERT INTO product_aliases (product_id, alias_name) VALUES (%s, %s) ON CONFLICT (alias_name) DO NOTHING",
        (product_id, body.alias_name),
    )
    return {"ok": True}


@router.delete("/{product_id}/aliases/{alias_id}")
def delete_alias(product_id: str, alias_id: str):
    execute("DELETE FROM product_aliases WHERE id = %s AND product_id = %s", (alias_id, product_id))
    return {"ok": True}
