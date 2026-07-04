from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, get_conn
import psycopg2.extras

router = APIRouter()


class StockUpdate(BaseModel):
    quantity: float
    notes: Optional[str] = None


@router.get("")
def list_stock():
    return query(
        """
        SELECT
            p.id::text AS product_id,
            p.product_name,
            p.hindi_name,
            p.product_category,
            p.unit_of_measure,
            COALESCE(p.stock_quantity, 0) AS stock_quantity,
            sa.adjustment_type AS last_update_type,
            sa.qty_change      AS last_qty_change,
            sa.party_name      AS last_party_name,
            sa.notes           AS last_notes,
            sa.created_at      AS last_updated_at
        FROM products p
        LEFT JOIN LATERAL (
            SELECT adjustment_type, qty_change, party_name, notes, created_at
            FROM stock_adjustments
            WHERE product_id = p.id
            ORDER BY created_at DESC
            LIMIT 1
        ) sa ON true
        WHERE p.is_active = TRUE
        ORDER BY COALESCE(p.stock_quantity, 0) ASC, p.product_name
        """
    )


@router.get("/history")
def get_stock_history():
    return query(
        """
        SELECT
            sa.id::text,
            p.product_name,
            p.hindi_name,
            p.unit_of_measure,
            sa.adjustment_type,
            sa.qty_before,
            sa.qty_change,
            sa.qty_after,
            sa.party_name,
            sa.notes,
            sa.created_at
        FROM stock_adjustments sa
        JOIN products p ON p.id = sa.product_id
        ORDER BY sa.created_at DESC
        LIMIT 100
        """
    )


@router.patch("/{product_id}")
def update_stock(product_id: str, body: StockUpdate):
    if body.quantity < 0:
        raise HTTPException(status_code=422, detail="Stock quantity cannot be negative")

    rows = query(
        "SELECT id, product_name, COALESCE(stock_quantity, 0) AS stock_quantity FROM products WHERE id = %s AND is_active = TRUE",
        (product_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")

    qty_before = float(rows[0]["stock_quantity"])
    qty_after = float(body.quantity)
    qty_change = qty_after - qty_before

    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "UPDATE products SET stock_quantity = %s, updated_at = NOW() WHERE id = %s",
                (qty_after, product_id),
            )
            cur.execute(
                """INSERT INTO stock_adjustments
                       (product_id, adjustment_type, qty_before, qty_change, qty_after, notes)
                   VALUES (%s, 'manual_set', %s, %s, %s, %s)""",
                (product_id, qty_before, qty_change, qty_after, body.notes or None),
            )
    return {"ok": True}
