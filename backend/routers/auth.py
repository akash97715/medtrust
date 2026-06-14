from fastapi import APIRouter
from pydantic import BaseModel
from database import query

router = APIRouter()


class VerifyRequest(BaseModel):
    code: str


@router.post("/verify")
def verify_code(body: VerifyRequest):
    code = body.code.strip()
    if len(code) != 5 or not code.isdigit():
        return {"valid": False, "role": None}
    rows = query(
        "SELECT role FROM access_codes WHERE code = %s AND is_active = TRUE",
        (code,),
    )
    if rows:
        return {"valid": True, "role": rows[0]["role"]}
    return {"valid": False, "role": None}
