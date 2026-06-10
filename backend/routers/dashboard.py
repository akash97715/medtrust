from fastapi import APIRouter
from database import query, scalar

router = APIRouter()


@router.get("/summary")
def get_summary():
    return {
        "total_parties": scalar("SELECT COUNT(*) FROM parties WHERE is_active = TRUE"),
        "total_hospitals": scalar("SELECT COUNT(*) FROM parties WHERE party_type = 'hospital' AND is_active = TRUE"),
        "total_agencies": scalar("SELECT COUNT(*) FROM parties WHERE party_type = 'agency' AND is_active = TRUE"),
        "total_products": scalar("SELECT COUNT(*) FROM products WHERE is_active = TRUE"),
        "total_visits": scalar("SELECT COUNT(*) FROM visits"),
        "total_orders": scalar("SELECT COUNT(*) FROM sales_orders WHERE order_status IN ('confirmed', 'delivered')"),
        "total_order_value": scalar(
            """
            SELECT COALESCE(SUM(soi.quantity * COALESCE(soi.sell_rate, 0)), 0)
            FROM sales_order_items soi
            JOIN sales_orders so ON so.id = soi.sales_order_id
            WHERE so.order_status IN ('confirmed', 'delivered')
            """
        ),
    }


@router.get("/top-products")
def get_top_products():
    return query(
        """
        SELECT product_name, times_requested_in_visits, unique_parties_requesting,
               ordered_quantity, ordered_value
        FROM dashboard_product_demand
        ORDER BY ordered_value DESC, times_requested_in_visits DESC, product_name
        LIMIT 8
        """
    )


@router.get("/product-leaders")
def get_product_leaders():
    return query(
        """
        SELECT product_name, leading_buyer_name, total_quantity, total_sales_value
        FROM dashboard_product_leaders
        WHERE leading_buyer_name IS NOT NULL
        ORDER BY total_sales_value DESC, total_quantity DESC
        LIMIT 8
        """
    )


@router.get("/daily-activity")
def get_daily_activity():
    return query(
        """
        SELECT activity_date, visits_count, orders_count, active_parties
        FROM dashboard_daily_activity
        ORDER BY activity_date DESC
        LIMIT 30
        """
    )


@router.get("/locations")
def get_locations():
    return query(
        """
        SELECT city, district, state, COUNT(*) AS party_count
        FROM dashboard_party_directory
        GROUP BY city, district, state
        ORDER BY party_count DESC, city
        """
    )
