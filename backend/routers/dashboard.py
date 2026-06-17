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
        "total_orders": scalar(
            """
            SELECT COUNT(*) FROM sales_orders so
            JOIN parties p ON p.id = so.party_id AND p.is_active = TRUE
            WHERE so.order_status IN ('confirmed', 'delivered', 'partial_payment')
            """
        ),
        "total_order_value": scalar(
            """
            SELECT COALESCE(SUM(soi.quantity * COALESCE(soi.sell_rate, 0)), 0)
            FROM sales_order_items soi
            JOIN sales_orders so ON so.id = soi.sales_order_id
            JOIN parties p ON p.id = so.party_id AND p.is_active = TRUE
            WHERE so.order_status IN ('confirmed', 'delivered', 'partial_payment')
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


@router.get("/profit")
def get_profit():
    # Profit = full profit for payment_received orders + proportional profit for partially paid orders
    result = query(
        """
        WITH order_financials AS (
            SELECT
                so.id,
                so.order_status,
                COALESCE(so.cgst_rate, 6)  AS cgst_rate,
                COALESCE(so.sgst_rate, 6)  AS sgst_rate,
                COALESCE(SUM(soi.quantity * COALESCE(soi.sell_rate, 0)), 0)                              AS subtotal,
                COALESCE(SUM(COALESCE(soi.discount, 0)), 0)                                              AS total_discount,
                COALESCE(SUM(soi.quantity * (COALESCE(soi.sell_rate, 0) - COALESCE(soi.buy_rate, 0))), 0) AS gross_profit
            FROM sales_orders so
            JOIN sales_order_items soi ON soi.sales_order_id = so.id
            JOIN parties p ON p.id = so.party_id AND p.is_active = TRUE
            WHERE so.order_status NOT IN ('draft', 'cancelled')
            GROUP BY so.id, so.order_status, so.cgst_rate, so.sgst_rate
        ),
        payment_totals AS (
            SELECT sales_order_id, COALESCE(SUM(amount), 0) AS total_received
            FROM order_payments
            GROUP BY sales_order_id
        )
        SELECT
            COALESCE(SUM(
                CASE
                    WHEN of.order_status = 'payment_received' THEN of.gross_profit
                    WHEN ((of.subtotal - of.total_discount) * (1 + of.cgst_rate/100.0 + of.sgst_rate/100.0)) > 0
                        THEN of.gross_profit * LEAST(
                            COALESCE(pt.total_received, 0) /
                            ((of.subtotal - of.total_discount) * (1 + of.cgst_rate/100.0 + of.sgst_rate/100.0)),
                            1.0
                        )
                    ELSE 0
                END
            ), 0) AS total_profit,
            COUNT(DISTINCT CASE
                WHEN of.order_status = 'payment_received' OR COALESCE(pt.total_received, 0) > 0
                THEN of.id END
            ) AS order_count,
            COALESCE(SUM(COALESCE(pt.total_received, 0)), 0) AS total_collected,
            COALESCE(SUM(GREATEST(
                (of.subtotal - of.total_discount) * (1 + of.cgst_rate/100.0 + of.sgst_rate/100.0)
                - CASE WHEN of.order_status = 'payment_received' THEN
                    (of.subtotal - of.total_discount) * (1 + of.cgst_rate/100.0 + of.sgst_rate/100.0)
                  ELSE COALESCE(pt.total_received, 0)
                  END,
                0
            )), 0) AS total_outstanding
        FROM order_financials of
        LEFT JOIN payment_totals pt ON pt.sales_order_id = of.id
        """
    )
    row = result[0] if result else {}
    return {
        "total_profit":      float(row.get("total_profit", 0) or 0),
        "order_count":       int(row.get("order_count", 0) or 0),
        "total_collected":   float(row.get("total_collected", 0) or 0),
        "total_outstanding": float(row.get("total_outstanding", 0) or 0),
    }


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
