from typing import Optional
from datetime import date as date_type
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, execute

router = APIRouter()

VALID_TYPES = {
    "salary", "transportation", "purchase",
    "logistics", "rent", "utilities", "miscellaneous",
}


class ExpenseCreate(BaseModel):
    expense_type: str
    amount: float
    incentive_amount: Optional[float] = 0
    expense_date: Optional[date_type] = None
    paid_to: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_expenses(month: Optional[str] = None):
    if month:
        return query(
            """
            SELECT id::text, expense_type, amount::float,
                   COALESCE(incentive_amount, 0)::float AS incentive_amount,
                   expense_date::text, paid_to, notes, created_at
            FROM expenses
            WHERE to_char(expense_date, 'YYYY-MM') = %s
            ORDER BY expense_date DESC, created_at DESC
            """,
            (month,),
        )
    return query(
        """
        SELECT id::text, expense_type, amount::float,
               COALESCE(incentive_amount, 0)::float AS incentive_amount,
               expense_date::text, paid_to, notes, created_at
        FROM expenses
        ORDER BY expense_date DESC, created_at DESC
        LIMIT 500
        """
    )


@router.post("")
def create_expense(body: ExpenseCreate):
    if body.expense_type not in VALID_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid expense type. Allowed: {', '.join(sorted(VALID_TYPES))}",
        )
    incentive = body.incentive_amount or 0.0
    if incentive < 0:
        raise HTTPException(status_code=422, detail="Incentive amount cannot be negative")
    exp_date = body.expense_date or date_type.today()
    rows = query(
        """
        INSERT INTO expenses (expense_type, amount, incentive_amount, expense_date, paid_to, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id::text, expense_type, amount::float,
                  COALESCE(incentive_amount, 0)::float AS incentive_amount,
                  expense_date::text, paid_to, notes, created_at
        """,
        (body.expense_type, body.amount, incentive, exp_date,
         body.paid_to or None, body.notes or None),
    )
    return rows[0]


@router.delete("/{expense_id}")
def delete_expense(expense_id: str):
    execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
    return {"ok": True}
