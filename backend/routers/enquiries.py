from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from database import query, execute

router = APIRouter()


class EnquiryCreate(BaseModel):
    product_id: str
    product_name: str
    visitor_phone: Optional[str] = None


@router.post("", status_code=201)
def create_enquiry(body: EnquiryCreate):
    execute(
        """
        INSERT INTO product_enquiries (product_id, product_name, visitor_phone)
        VALUES (%s, %s, %s)
        """,
        (body.product_id, body.product_name, body.visitor_phone or None),
    )
    return {"ok": True}


@router.get("")
def list_enquiries():
    rows = query(
        """
        SELECT id, product_id, product_name, visitor_phone, created_at
        FROM product_enquiries
        ORDER BY created_at DESC
        """
    )
    return [{**r, "id": str(r["id"]), "product_id": str(r["product_id"])} for r in rows]
