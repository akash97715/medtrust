from fastapi import APIRouter
from database import query

router = APIRouter()


def _orders_sql(where_extra: str = "", params: tuple = ()) -> list:
    """Revenue (grand total with GST), COGS, collected — grouped by month.

    Uses a CTE to aggregate per-order first, avoiding double-counting
    payments when an order has multiple line items.
    """
    return query(
        f"""
        WITH payments_per_order AS (
            SELECT sales_order_id, COALESCE(SUM(amount), 0) AS paid
            FROM order_payments
            GROUP BY sales_order_id
        ),
        per_order AS (
            SELECT
                o.id                                                                AS order_id,
                to_char(o.order_date, 'YYYY-MM')                                   AS month,
                SUM(
                    (soi.quantity * COALESCE(soi.sell_rate, 0) - COALESCE(soi.discount, 0))
                    * (1 + COALESCE(o.cgst_rate, 6)/100.0 + COALESCE(o.sgst_rate, 6)/100.0)
                )                                                                   AS revenue,
                SUM(soi.quantity * COALESCE(soi.buy_rate, 0))                      AS cogs,
                COALESCE(ppo.paid, 0)                                              AS collected
            FROM sales_orders o
            JOIN sales_order_items soi ON soi.sales_order_id = o.id
            LEFT JOIN payments_per_order ppo ON ppo.sales_order_id = o.id
            WHERE o.order_status NOT IN ('draft', 'cancelled')
            {where_extra}
            GROUP BY o.id, o.order_date, o.cgst_rate, o.sgst_rate, ppo.paid
        )
        SELECT
            month,
            COALESCE(SUM(revenue), 0)::float    AS revenue,
            COALESCE(SUM(cogs), 0)::float        AS cogs,
            COALESCE(SUM(collected), 0)::float   AS collected,
            COUNT(*)::int                         AS order_count
        FROM per_order
        GROUP BY month
        ORDER BY month DESC
        """,
        params,
    )


def _expenses_sql(where_extra: str = "", params: tuple = ()) -> list:
    return query(
        f"""
        SELECT
            to_char(expense_date, 'YYYY-MM') AS month,
            COALESCE(SUM(amount), 0)::float  AS expenses
        FROM expenses
        {where_extra}
        GROUP BY to_char(expense_date, 'YYYY-MM')
        """,
        params,
    )


def _merge(order_rows: list, expense_rows: list) -> list:
    exp_map = {r["month"]: r["expenses"] for r in expense_rows}
    ord_map = {r["month"]: r for r in order_rows}
    all_months = sorted(set(ord_map) | set(exp_map), reverse=True)

    result = []
    for m in all_months:
        od = ord_map.get(m, {})
        revenue    = od.get("revenue", 0.0) or 0.0
        cogs       = od.get("cogs", 0.0)    or 0.0
        collected  = od.get("collected", 0.0) or 0.0
        expenses   = exp_map.get(m, 0.0)    or 0.0
        net        = revenue - expenses
        outstanding = revenue - collected
        result.append({
            "month":        m,
            "revenue":      round(revenue, 2),
            "expenses":     round(expenses, 2),
            "net_profit":   round(net, 2),
            "collected":    round(collected, 2),
            "outstanding":  round(outstanding, 2),
            "order_count":  od.get("order_count", 0),
        })
    return result


@router.get("/monthly")
def monthly_pnl():
    return _merge(_orders_sql(), _expenses_sql())


@router.get("/overall")
def overall_pnl():
    rows = query(
        """
        WITH payments_per_order AS (
            SELECT sales_order_id, COALESCE(SUM(amount), 0) AS paid
            FROM order_payments
            GROUP BY sales_order_id
        ),
        per_order AS (
            SELECT
                SUM(
                    (soi.quantity * COALESCE(soi.sell_rate, 0) - COALESCE(soi.discount, 0))
                    * (1 + COALESCE(o.cgst_rate, 6)/100.0 + COALESCE(o.sgst_rate, 6)/100.0)
                )                        AS revenue,
                SUM(soi.quantity * COALESCE(soi.buy_rate, 0)) AS cogs,
                COALESCE(ppo.paid, 0)   AS collected,
                o.id
            FROM sales_orders o
            JOIN sales_order_items soi ON soi.sales_order_id = o.id
            LEFT JOIN payments_per_order ppo ON ppo.sales_order_id = o.id
            WHERE o.order_status NOT IN ('draft', 'cancelled')
            GROUP BY o.id, o.cgst_rate, o.sgst_rate, ppo.paid
        )
        SELECT
            COALESCE(SUM(revenue), 0)::float    AS revenue,
            COALESCE(SUM(collected), 0)::float  AS collected,
            COUNT(*)::int                         AS total_orders
        FROM per_order
        """
    )
    exp_rows = query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM expenses")

    od = rows[0] if rows else {}
    revenue   = float(od.get("revenue", 0.0)   or 0.0)
    collected = float(od.get("collected", 0.0) or 0.0)
    expenses  = float((exp_rows[0].get("total") if exp_rows else None) or 0.0)
    net       = revenue - expenses

    return {
        "revenue":      round(revenue, 2),
        "expenses":     round(expenses, 2),
        "net_profit":   round(net, 2),
        "collected":    round(collected, 2),
        "outstanding":  round(revenue - collected, 2),
        "total_orders": od.get("total_orders", 0),
    }
