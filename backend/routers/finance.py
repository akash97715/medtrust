from fastapi import APIRouter
from database import query

router = APIRouter()


def _orders_sql(where_extra: str = "", params: tuple = ()) -> list:
    """Revenue, COGS, collected — grouped by month."""
    return query(
        f"""
        SELECT
            to_char(o.order_date, 'YYYY-MM')                                       AS month,
            COALESCE(SUM(
                soi.quantity * COALESCE(soi.sell_rate, 0)
                - COALESCE(soi.discount, 0)
            ), 0)::float                                                            AS revenue,
            COALESCE(SUM(
                soi.quantity * COALESCE(soi.buy_rate, 0)
            ), 0)::float                                                            AS cogs,
            COALESCE(SUM(COALESCE(py.paid, 0)), 0)::float                          AS collected,
            COUNT(DISTINCT o.id)::int                                               AS order_count
        FROM sales_orders o
        JOIN sales_order_items soi ON soi.sales_order_id = o.id
        LEFT JOIN (
            SELECT sales_order_id, SUM(amount) AS paid
            FROM order_payments
            GROUP BY sales_order_id
        ) py ON py.sales_order_id = o.id
        WHERE o.order_status NOT IN ('draft', 'cancelled')
        {where_extra}
        GROUP BY to_char(o.order_date, 'YYYY-MM')
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
        gross      = revenue - cogs
        net        = gross - expenses
        outstanding = revenue - collected
        result.append({
            "month":        m,
            "revenue":      round(revenue, 2),
            "cogs":         round(cogs, 2),
            "gross_profit": round(gross, 2),
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
    od_rows = query(
        """
        SELECT
            COALESCE(SUM(
                soi.quantity * COALESCE(soi.sell_rate, 0) - COALESCE(soi.discount, 0)
            ), 0)::float AS revenue,
            COALESCE(SUM(
                soi.quantity * COALESCE(soi.buy_rate, 0)
            ), 0)::float AS cogs,
            COALESCE(SUM(COALESCE(py.paid, 0)), 0)::float AS collected,
            COUNT(DISTINCT o.id)::int AS total_orders
        FROM sales_orders o
        JOIN sales_order_items soi ON soi.sales_order_id = o.id
        LEFT JOIN (
            SELECT sales_order_id, SUM(amount) AS paid
            FROM order_payments
            GROUP BY sales_order_id
        ) py ON py.sales_order_id = o.id
        WHERE o.order_status NOT IN ('draft', 'cancelled')
        """
    )
    exp_rows = query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM expenses")

    od = od_rows[0] if od_rows else {}
    revenue   = od.get("revenue", 0.0)   or 0.0
    cogs      = od.get("cogs", 0.0)      or 0.0
    collected = od.get("collected", 0.0) or 0.0
    expenses  = (exp_rows[0].get("total") if exp_rows else None) or 0.0
    gross     = revenue - cogs
    net       = gross - expenses

    return {
        "revenue":      round(revenue, 2),
        "cogs":         round(cogs, 2),
        "gross_profit": round(gross, 2),
        "expenses":     round(expenses, 2),
        "net_profit":   round(net, 2),
        "collected":    round(collected, 2),
        "outstanding":  round(revenue - collected, 2),
        "total_orders": od.get("total_orders", 0),
    }
