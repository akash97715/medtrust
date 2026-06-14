from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, execute, scalar
import psycopg2
import psycopg2.extras
import psycopg2.errors
from database import get_conn

router = APIRouter()


class OrderCreate(BaseModel):
    party_id: str
    product_id: str
    order_date: str
    order_status: str = "confirmed"
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    quantity: float
    unit_of_measure: str = "piece"
    buy_rate: Optional[float] = None
    sell_rate: Optional[float] = None
    # Invoice fields
    bill_period_from: Optional[str] = None
    bill_period_to: Optional[str] = None
    hsn_code: Optional[str] = None
    discount: Optional[float] = 0
    cgst_rate: Optional[float] = 6
    sgst_rate: Optional[float] = 6


class OrderUpdate(BaseModel):
    order_date: Optional[str] = None
    order_status: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    bill_period_from: Optional[str] = None
    bill_period_to: Optional[str] = None
    cgst_rate: Optional[float] = None
    sgst_rate: Optional[float] = None


class OrderItemUpdate(BaseModel):
    quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    buy_rate: Optional[float] = None
    sell_rate: Optional[float] = None
    notes: Optional[str] = None
    hsn_code: Optional[str] = None
    discount: Optional[float] = None


@router.get("")
def list_orders():
    rows = query(
        """
        SELECT so.id AS order_id, so.order_date, so.reference_number, so.order_status,
               p.id AS party_id, p.name AS party_name,
               pr.id AS product_id, pr.product_name,
               soi.id AS item_id, soi.quantity, soi.unit_of_measure, soi.buy_rate, soi.sell_rate,
               (soi.quantity * COALESCE(soi.sell_rate, 0)) AS line_value
        FROM sales_orders so
        JOIN parties p ON p.id = so.party_id
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        JOIN products pr ON pr.id = soi.product_id
        ORDER BY so.order_date DESC, so.reference_number, p.name
        """
    )
    total_value = scalar(
        """
        SELECT COALESCE(SUM(soi.quantity * COALESCE(soi.sell_rate, 0)), 0)
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE so.order_status IN ('confirmed', 'delivered')
        """
    )
    return {"rows": rows, "total_confirmed_value": total_value}


@router.get("/{order_id}")
def get_order(order_id: str):
    orders = query(
        """
        SELECT so.id, so.order_date, so.order_status, so.reference_number, so.notes,
               so.bill_period_from, so.bill_period_to,
               COALESCE(so.cgst_rate, 6) AS cgst_rate,
               COALESCE(so.sgst_rate, 6) AS sgst_rate,
               p.id AS party_id, p.name AS party_name
        FROM sales_orders so JOIN parties p ON p.id = so.party_id
        WHERE so.id = %s
        """,
        (order_id,),
    )
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
    o = orders[0]
    items = query(
        """
        SELECT soi.id, pr.id AS product_id, pr.product_name, soi.quantity, soi.unit_of_measure,
               soi.buy_rate, soi.sell_rate, soi.hsn_code,
               COALESCE(soi.discount, 0) AS discount,
               (soi.quantity * COALESCE(soi.sell_rate, 0)) AS line_value, soi.notes
        FROM sales_order_items soi
        JOIN products pr ON pr.id = soi.product_id
        WHERE soi.sales_order_id = %s
        ORDER BY pr.product_name
        """,
        (order_id,),
    )
    return {**o, "items": items}


@router.post("", status_code=201)
def create_order(body: OrderCreate):
    if body.quantity <= 0:
        raise HTTPException(status_code=422, detail="Quantity must be greater than zero")
    try:
        with get_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO sales_orders (party_id, order_date, order_status, reference_number, notes, bill_period_from, bill_period_to, cgst_rate, sgst_rate)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, party_id
                    """,
                    (body.party_id, body.order_date, body.order_status,
                     body.reference_number or None, body.notes or None,
                     body.bill_period_from or None, body.bill_period_to or None,
                     body.cgst_rate if body.cgst_rate is not None else 6,
                     body.sgst_rate if body.sgst_rate is not None else 6),
                )
                order = dict(cur.fetchone())
                cur.execute(
                    """
                    INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_of_measure, buy_rate, sell_rate, hsn_code, discount)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (order["id"], body.product_id, body.quantity, body.unit_of_measure,
                     body.buy_rate, body.sell_rate, body.hsn_code or None, body.discount or 0),
                )
                cur.execute(
                    """
                    INSERT INTO party_product_pricing (party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, notes)
                    VALUES (%s, %s, %s, %s, 'INR', %s, 'Auto-saved from order entry')
                    """,
                    (body.party_id, body.product_id, body.buy_rate, body.sell_rate, body.order_date),
                )
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="An order for this party on this date already exists. Add a Reference Number to distinguish multiple orders on the same date.",
        )
    except psycopg2.Error as e:
        raise HTTPException(status_code=422, detail=str(e).splitlines()[0])
    return {"id": str(order["id"]), "party_id": str(order["party_id"])}


@router.patch("/{order_id}")
def update_order(order_id: str, body: OrderUpdate):
    rows = query("SELECT * FROM sales_orders WHERE id = %s", (order_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Order not found")
    e = rows[0]
    execute(
        """
        UPDATE sales_orders
        SET order_date = %s, order_status = %s, reference_number = %s, notes = %s,
            bill_period_from = %s, bill_period_to = %s,
            cgst_rate = %s, sgst_rate = %s, updated_at = NOW()
        WHERE id = %s
        """,
        (
            body.order_date or str(e["order_date"]),
            body.order_status or e["order_status"],
            body.reference_number if body.reference_number is not None else e["reference_number"],
            body.notes if body.notes is not None else e["notes"],
            body.bill_period_from if body.bill_period_from is not None else e.get("bill_period_from"),
            body.bill_period_to if body.bill_period_to is not None else e.get("bill_period_to"),
            body.cgst_rate if body.cgst_rate is not None else float(e.get("cgst_rate") or 6),
            body.sgst_rate if body.sgst_rate is not None else float(e.get("sgst_rate") or 6),
            order_id,
        ),
    )
    return {"ok": True}


@router.delete("/{order_id}")
def delete_order(order_id: str):
    execute("DELETE FROM sales_orders WHERE id = %s", (order_id,))
    return {"ok": True}


@router.patch("/items/{item_id}")
def update_order_item(item_id: str, body: OrderItemUpdate):
    rows = query(
        "SELECT soi.*, so.party_id FROM sales_order_items soi JOIN sales_orders so ON so.id = soi.sales_order_id WHERE soi.id = %s",
        (item_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Order item not found")
    e = rows[0]
    quantity = body.quantity if body.quantity is not None else float(e["quantity"])
    if quantity <= 0:
        raise HTTPException(status_code=422, detail="Quantity must be greater than zero")
    buy_rate = body.buy_rate if body.buy_rate is not None else (float(e["buy_rate"]) if e["buy_rate"] else None)
    sell_rate = body.sell_rate if body.sell_rate is not None else (float(e["sell_rate"]) if e["sell_rate"] else None)

    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE sales_order_items
                SET quantity = %s, unit_of_measure = %s, buy_rate = %s, sell_rate = %s, notes = %s,
                    hsn_code = %s, discount = %s
                WHERE id = %s
                RETURNING product_id
                """,
                (
                    quantity,
                    body.unit_of_measure or e["unit_of_measure"],
                    buy_rate,
                    sell_rate,
                    body.notes if body.notes is not None else e["notes"],
                    body.hsn_code if body.hsn_code is not None else e.get("hsn_code"),
                    body.discount if body.discount is not None else float(e.get("discount") or 0),
                    item_id,
                ),
            )
            row = dict(cur.fetchone())
            cur.execute(
                """
                INSERT INTO party_product_pricing (party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, notes)
                VALUES (%s, %s, %s, %s, 'INR', CURRENT_DATE, 'Auto-updated from order edit')
                """,
                (e["party_id"], row["product_id"], buy_rate, sell_rate),
            )
    return {"ok": True}


@router.delete("/items/{item_id}")
def delete_order_item(item_id: str):
    execute("DELETE FROM sales_order_items WHERE id = %s", (item_id,))
    return {"ok": True}
