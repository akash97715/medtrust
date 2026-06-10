from fastapi import APIRouter
from database import query

router = APIRouter()


@router.get("")
def list_pricing():
    return query(
        """
        SELECT party_id, party_name, product_name, buy_rate, sell_rate,
               currency_code, effective_from, effective_to
        FROM dashboard_current_pricing
        ORDER BY party_name, product_name
        """
    )
