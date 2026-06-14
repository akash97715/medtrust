from fastapi import APIRouter
from pydantic import BaseModel
from database import scalar

router = APIRouter()


class VerifyRequest(BaseModel):
    code: str


@router.post("/verify")
def verify_code(body: VerifyRequest):
    code = body.code.strip()
    if len(code) != 5 or not code.isdigit():
        return {"valid": False}
    exists = scalar(
        "SELECT COUNT(*) FROM access_codes WHERE code = %s AND is_active = TRUE",
        (code,),
    )
    return {"valid": bool(exists)}
