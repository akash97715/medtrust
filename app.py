import os
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from html import escape
from typing import Any, List, Optional, Tuple
from urllib.parse import parse_qs, urlencode
from wsgiref.simple_server import make_server

import psycopg2
import psycopg2.extras


APP_TITLE = "MedTrust Healthcare"


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=os.getenv("PGPORT", "5432"),
        dbname=os.getenv("PGDATABASE", "medtrust_healthcare"),
        user=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", ""),
    )


def run_query(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return [dict(row) for row in cur.fetchall()]


def run_write(query: str, params: tuple[Any, ...] = (), fetchone: bool = False):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            if fetchone:
                row = cur.fetchone()
                return dict(row) if row else None
    return None


def scalar(query: str, params: tuple[Any, ...] = ()) -> Any:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return row[0] if row else None


def to_text(value: Any) -> str:
    if value is None:
        return "-"
    if isinstance(value, Decimal):
        return f"{value:,.2f}"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def money(value: Any) -> str:
    if value is None:
        return "-"
    amount = value if isinstance(value, Decimal) else Decimal(str(value))
    return f"Rs {amount:,.2f}"


def get_request_method(environ) -> str:
    return environ.get("REQUEST_METHOD", "GET").upper()


def read_post_data(environ) -> dict[str, list[str]]:
    try:
        size = int(environ.get("CONTENT_LENGTH") or "0")
    except ValueError:
        size = 0
    body = environ["wsgi.input"].read(size).decode("utf-8")
    return parse_qs(body, keep_blank_values=True)


def first_value(data: dict[str, list[str]], key: str, default: str = "") -> str:
    return data.get(key, [default])[0].strip()


def optional_decimal(value: str, field_label: str) -> Optional[Decimal]:
    value = value.strip()
    if not value:
        return None
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{field_label} must be a valid number.") from exc


def required_text(value: str, field_label: str) -> str:
    clean = value.strip()
    if not clean:
        raise ValueError(f"{field_label} is required.")
    return clean


def html_response(body: bytes, status: str = "200 OK", headers: Optional[List[Tuple[str, str]]] = None):
    final_headers = [
        ("Content-Type", "text/html; charset=utf-8"),
        ("Content-Length", str(len(body))),
    ]
    if headers:
        final_headers.extend(headers)
    return status, final_headers, [body]


def redirect_response(location: str):
    body = b""
    headers = [("Location", location), ("Content-Length", "0")]
    return "303 See Other", headers, [body]


def build_redirect(path: str, notice: str = "", error: str = "") -> str:
    params = {}
    if notice:
        params["notice"] = notice
    if error:
        params["error"] = error
    if not params:
        return path
    separator = "&" if "?" in path else "?"
    return f"{path}{separator}{urlencode(params)}"


def nav_link(path: str, label: str, current: str) -> str:
    cls = "nav-link active" if current == path else "nav-link"
    return f'<a class="{cls}" href="{path}">{escape(label)}</a>'


def card(label: str, value: str, tone: str = "") -> str:
    tone_class = f" card-{tone}" if tone else ""
    return (
        f'<section class="metric-card{tone_class}">'
        f'<div class="metric-label">{escape(label)}</div>'
        f'<div class="metric-value">{escape(value)}</div>'
        "</section>"
    )


def render_table(rows: list[dict[str, Any]], columns: list[tuple[str, str]], empty_text: str) -> str:
    if not rows:
        return f'<div class="empty-state">{escape(empty_text)}</div>'

    header = "".join(f"<th>{escape(label)}</th>" for _, label in columns)
    body_parts = []
    for row in rows:
        cells = "".join(f"<td>{row.get(key, '-')}</td>" for key, _ in columns)
        body_parts.append(f"<tr>{cells}</tr>")
    body = "".join(body_parts)
    return f'<div class="table-wrap"><table><thead><tr>{header}</tr></thead><tbody>{body}</tbody></table></div>'


def render_select_options(rows: list[dict[str, Any]], value_key: str, label_key: str, selected: str = "") -> str:
    options = []
    for row in rows:
        value = str(row[value_key])
        is_selected = " selected" if value == selected else ""
        options.append(f'<option value="{escape(value)}"{is_selected}>{escape(str(row[label_key]))}</option>')
    return "".join(options)


def flash_markup(query_params: dict[str, list[str]]) -> str:
    chunks = []
    if first_value(query_params, "notice"):
        chunks.append(f'<div class="notice-box">{escape(first_value(query_params, "notice"))}</div>')
    if first_value(query_params, "error"):
        chunks.append(f'<div class="error-box">{escape(first_value(query_params, "error"))}</div>')
    return "".join(chunks)


def shell(title: str, current_path: str, body: str) -> bytes:
    nav = "".join(
        [
            nav_link("/", "Dashboard", current_path),
            nav_link("/parties", "Hospitals & Agencies", current_path),
            nav_link("/products", "Products", current_path),
            nav_link("/visits", "Visits", current_path),
            nav_link("/orders", "Orders", current_path),
            nav_link("/pricing", "Pricing", current_path),
            nav_link("/admin", "Data Entry", current_path),
        ]
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)} | {APP_TITLE}</title>
  <style>
    :root {{
      --bg: #f4efe4;
      --paper: #fffdf8;
      --panel: #f9f3e7;
      --ink: #1c1a17;
      --muted: #6a6257;
      --line: #d9cdb7;
      --accent: #0c6b58;
      --accent-soft: #d8efe7;
      --warm: #c46f2d;
      --warm-soft: #fae7d6;
      --danger: #8f2d2d;
      --danger-soft: #fff2f0;
      --notice: #245d4e;
      --notice-soft: #e5f5ef;
      --shadow: 0 18px 50px rgba(71, 52, 25, 0.08);
      --radius: 18px;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      background:
        radial-gradient(circle at top left, rgba(196, 111, 45, 0.14), transparent 30%),
        radial-gradient(circle at top right, rgba(12, 107, 88, 0.16), transparent 26%),
        var(--bg);
      color: var(--ink);
    }}
    a {{ color: inherit; }}
    .layout {{
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 100vh;
    }}
    .sidebar {{
      background: rgba(255, 253, 248, 0.88);
      border-right: 1px solid var(--line);
      padding: 28px 20px;
      position: sticky;
      top: 0;
      height: 100vh;
      backdrop-filter: blur(12px);
    }}
    .brand {{
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }}
    .brand h1 {{
      margin: 0;
      font-size: 1.65rem;
      letter-spacing: 0.02em;
    }}
    .brand p {{
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 0.96rem;
    }}
    .nav {{
      display: grid;
      gap: 10px;
    }}
    .nav-link {{
      text-decoration: none;
      padding: 12px 14px;
      border-radius: 14px;
      color: var(--muted);
      background: transparent;
      border: 1px solid transparent;
    }}
    .nav-link:hover, .nav-link.active {{
      color: var(--ink);
      background: var(--panel);
      border-color: var(--line);
    }}
    .sidebar-note {{
      margin-top: 22px;
      padding: 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, var(--accent-soft), #edf7f3);
      color: #11463b;
      font-size: 0.95rem;
      line-height: 1.5;
    }}
    main {{ padding: 30px; }}
    .hero {{
      background: linear-gradient(135deg, rgba(12, 107, 88, 0.94), rgba(28, 26, 23, 0.92));
      color: #fffdf8;
      padding: 28px;
      border-radius: 26px;
      box-shadow: var(--shadow);
    }}
    .hero h2 {{
      margin: 0;
      font-size: 2rem;
      max-width: 16ch;
    }}
    .hero p {{
      margin: 12px 0 0;
      max-width: 70ch;
      line-height: 1.55;
      color: rgba(255, 253, 248, 0.84);
    }}
    .grid {{
      display: grid;
      gap: 18px;
      margin-top: 22px;
    }}
    .metrics {{ grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }}
    .split {{ grid-template-columns: 1.2fr 0.8fr; align-items: start; }}
    .two-col {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
    .triple {{ grid-template-columns: repeat(3, minmax(0, 1fr)); }}
    .panel, .metric-card {{
      background: var(--paper);
      border: 1px solid rgba(217, 205, 183, 0.75);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }}
    .panel {{ padding: 20px; }}
    .metric-card {{
      padding: 18px;
      min-height: 128px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}
    .card-accent {{ background: linear-gradient(180deg, #f5fbf8, #fffdf8); }}
    .card-warm {{ background: linear-gradient(180deg, #fff5ea, #fffdf8); }}
    .metric-label {{ color: var(--muted); font-size: 0.92rem; line-height: 1.35; }}
    .metric-value {{ font-size: 2rem; line-height: 1; }}
    .section-head {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      margin-bottom: 14px;
    }}
    .section-head h3 {{ margin: 0; font-size: 1.2rem; }}
    .section-head p {{ margin: 0; color: var(--muted); font-size: 0.94rem; }}
    .tag-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }}
    .tag {{
      padding: 9px 12px;
      border-radius: 999px;
      background: var(--panel);
      border: 1px solid var(--line);
      color: var(--muted);
      text-decoration: none;
      font-size: 0.92rem;
    }}
    .tag:hover {{ color: var(--ink); background: #fff8ef; }}
    .table-wrap {{
      overflow: auto;
      border-radius: 14px;
      border: 1px solid var(--line);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--paper);
    }}
    th, td {{
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid rgba(217, 205, 183, 0.65);
      vertical-align: top;
    }}
    th {{
      background: #f9f2e4;
      font-size: 0.9rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    tbody tr:hover {{ background: #fffcf6; }}
    .stat-list, .detail-list {{ display: grid; gap: 12px; }}
    .stat-item {{
      padding: 14px 16px;
      border-radius: 16px;
      background: var(--panel);
      border: 1px solid var(--line);
    }}
    .stat-item strong {{ display: block; font-size: 1rem; margin-bottom: 6px; }}
    .stat-item span {{ color: var(--muted); font-size: 0.93rem; }}
    .detail-item {{
      padding: 14px 16px;
      border-radius: 14px;
      background: var(--panel);
    }}
    .detail-item small {{
      display: block;
      color: var(--muted);
      margin-bottom: 5px;
    }}
    .empty-state {{
      padding: 20px;
      background: var(--paper);
      border: 1px dashed var(--line);
      border-radius: 16px;
      color: var(--muted);
    }}
    .error-box, .notice-box {{
      padding: 18px;
      border-radius: 16px;
      box-shadow: var(--shadow);
      margin-top: 18px;
    }}
    .error-box {{
      background: var(--danger-soft);
      border: 1px solid #efc0ba;
      color: var(--danger);
    }}
    .notice-box {{
      background: var(--notice-soft);
      border: 1px solid #b8e3d4;
      color: var(--notice);
    }}
    form {{
      display: grid;
      gap: 14px;
    }}
    .field-grid {{
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }}
    .field-grid-3 {{
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }}
    label {{
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 0.92rem;
    }}
    input, select, textarea, button {{
      font: inherit;
    }}
    input, select, textarea {{
      width: 100%;
      padding: 11px 12px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: #fffefa;
      color: var(--ink);
    }}
    textarea {{
      min-height: 92px;
      resize: vertical;
    }}
    button {{
      border: 0;
      border-radius: 12px;
      background: var(--accent);
      color: #fffdf8;
      padding: 12px 16px;
      cursor: pointer;
      box-shadow: var(--shadow);
    }}
    button:hover {{ filter: brightness(1.05); }}
    .btn-danger {{ background: #c0392b; }}
    .btn-small {{ padding: 4px 10px; font-size: 0.82rem; border-radius: 8px; }}
    .alias-row {{ display: flex; align-items: center; gap: 0.75rem; padding: 4px 0; }}
    .form-note, .footer-note {{
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.45;
    }}
    .hint {{
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.8rem;
      font-weight: bold;
      cursor: help;
      margin-left: 6px;
      vertical-align: middle;
      border: 1px solid #b8e3d4;
    }}
    .hint::after {{
      content: attr(data-tip);
      position: absolute;
      left: 50%;
      bottom: calc(100% + 10px);
      transform: translateX(-50%);
      min-width: 220px;
      max-width: 280px;
      padding: 10px 12px;
      border-radius: 12px;
      background: #1f3c35;
      color: #fffdf8;
      font-size: 0.85rem;
      font-weight: normal;
      line-height: 1.4;
      box-shadow: var(--shadow);
      opacity: 0;
      pointer-events: none;
      transition: opacity 120ms ease;
      z-index: 20;
      white-space: normal;
    }}
    .hint:hover::after {{
      opacity: 1;
    }}
    .section-tip {{
      margin: -4px 0 14px;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.5;
    }}
    @media (max-width: 980px) {{
      .layout {{ grid-template-columns: 1fr; }}
      .sidebar {{
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }}
      .split, .two-col, .triple, .field-grid, .field-grid-3 {{ grid-template-columns: 1fr; }}
      main {{ padding: 18px; }}
      .hero h2 {{ max-width: none; }}
    }}
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <h1>{APP_TITLE}</h1>
        <p>Hospital visit tracking, product demand, pricing, and order follow-up for surgical supply business operations.</p>
      </div>
      <nav class="nav">{nav}</nav>
      <div class="sidebar-note">
        Recommended flow:<br>
        1. Add party and location<br>
        2. Record visit demand<br>
        3. Record real order<br>
        4. Review leaders and pricing
      </div>
    </aside>
    <main>{body}</main>
  </div>
</body>
</html>"""
    return html.encode("utf-8")


def admin_lookups() -> dict[str, list[dict[str, Any]]]:
    return {
        "parties": run_query(
            """
            SELECT id, name || ' (' || party_type || ')' AS label
            FROM parties
            ORDER BY party_type, name
            """
        ),
        "products": run_query(
            """
            SELECT id, product_name AS label
            FROM products
            ORDER BY product_name
            """
        ),
        "visits": run_query(
            """
            SELECT v.id, p.name || ' • ' || TO_CHAR(v.visit_date, 'YYYY-MM-DD') AS label
            FROM visits v
            JOIN parties p ON p.id = v.party_id
            ORDER BY v.visit_date DESC, p.name
            LIMIT 100
            """
        ),
        "locations": run_query(
            """
            SELECT id, city || COALESCE(' • ' || district, '') AS label
            FROM locations
            ORDER BY city, district
            """
        ),
    }


def hint(text: str) -> str:
    return f'<span class="hint" data-tip="{escape(text)}">?</span>'


def dashboard_page(query_params: dict[str, list[str]]) -> str:
    metrics = {
        "total_parties": scalar("SELECT COUNT(*) FROM parties"),
        "total_hospitals": scalar("SELECT COUNT(*) FROM parties WHERE party_type = 'hospital'"),
        "total_agencies": scalar("SELECT COUNT(*) FROM parties WHERE party_type = 'agency'"),
        "total_products": scalar("SELECT COUNT(*) FROM products"),
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
    top_products = run_query(
        """
        SELECT product_name, times_requested_in_visits, unique_parties_requesting, ordered_quantity, ordered_value
        FROM dashboard_product_demand
        ORDER BY ordered_value DESC, times_requested_in_visits DESC, product_name
        LIMIT 8
        """
    )
    leaders = run_query(
        """
        SELECT product_name, leading_buyer_name, total_quantity, total_sales_value
        FROM dashboard_product_leaders
        WHERE leading_buyer_name IS NOT NULL
        ORDER BY total_sales_value DESC, total_quantity DESC
        LIMIT 8
        """
    )
    daily = run_query(
        """
        SELECT activity_date, visits_count, orders_count, active_parties
        FROM dashboard_daily_activity
        ORDER BY activity_date DESC
        LIMIT 10
        """
    )
    locations = run_query(
        """
        SELECT city, district, state, COUNT(*) AS party_count
        FROM dashboard_party_directory
        GROUP BY city, district, state
        ORDER BY party_count DESC, city
        """
    )

    top_product_rows = [
        {
            "product_name": f'<a href="/products">{escape(row["product_name"])}</a>',
            "times_requested_in_visits": escape(to_text(row["times_requested_in_visits"])),
            "unique_parties_requesting": escape(to_text(row["unique_parties_requesting"])),
            "ordered_quantity": escape(to_text(row["ordered_quantity"])),
            "ordered_value": escape(money(row["ordered_value"])),
        }
        for row in top_products
    ]
    leader_rows = [
        {
            "product_name": escape(row["product_name"]),
            "leading_buyer_name": f'<a href="/parties">{escape(row["leading_buyer_name"])}</a>',
            "total_quantity": escape(to_text(row["total_quantity"])),
            "total_sales_value": escape(money(row["total_sales_value"])),
        }
        for row in leaders
    ]
    daily_rows = [
        {
            "activity_date": escape(to_text(row["activity_date"])),
            "visits_count": escape(to_text(row["visits_count"])),
            "orders_count": escape(to_text(row["orders_count"])),
            "active_parties": escape(to_text(row["active_parties"])),
        }
        for row in daily
    ]
    location_list = "".join(
        f'<div class="stat-item"><strong>{escape(row["city"])}</strong><span>{escape(to_text(row["district"]))}, {escape(to_text(row["state"]))} • {escape(to_text(row["party_count"]))} parties</span></div>'
        for row in locations
    )

    return f"""
    <section class="hero">
      <h2>Operational dashboard for medical supply visits and orders.</h2>
      <p>This view combines hospitals, agencies, unique items, field demand, and actual confirmed order value so you can see where visits are turning into business.</p>
      <div class="tag-row">
        <a class="tag" href="/parties">View party directory</a>
        <a class="tag" href="/products">Track item demand</a>
        <a class="tag" href="/orders">Review sales orders</a>
        <a class="tag" href="/admin">Add fresh data</a>
      </div>
    </section>
    {flash_markup(query_params)}
    <div class="grid metrics">
      {card("Total parties", to_text(metrics["total_parties"]), "accent")}
      {card("Hospitals", to_text(metrics["total_hospitals"]))}
      {card("Agencies", to_text(metrics["total_agencies"]))}
      {card("Unique products", to_text(metrics["total_products"]))}
      {card("Visits logged", to_text(metrics["total_visits"]))}
      {card("Confirmed orders", to_text(metrics["total_orders"]))}
      {card("Confirmed order value", money(metrics["total_order_value"]), "warm")}
    </div>
    <div class="grid split">
      <section class="panel">
        <div class="section-head">
          <h3>Top product demand</h3>
          <p>Visit requests vs actual order value</p>
        </div>
        {render_table(top_product_rows, [
            ("product_name", "Product"),
            ("times_requested_in_visits", "Visit Requests"),
            ("unique_parties_requesting", "Parties Asking"),
            ("ordered_quantity", "Ordered Qty"),
            ("ordered_value", "Order Value"),
        ], "No product demand found.")}
      </section>
      <section class="panel">
        <div class="section-head">
          <h3>Coverage by location</h3>
          <p>How many parties are mapped in each city</p>
        </div>
        <div class="stat-list">{location_list or '<div class="empty-state">No locations available.</div>'}</div>
      </section>
    </div>
    <div class="grid split">
      <section class="panel">
        <div class="section-head">
          <h3>Product leaders</h3>
          <p>Best buyer for each item based on real orders</p>
        </div>
        {render_table(leader_rows, [
            ("product_name", "Product"),
            ("leading_buyer_name", "Leading Buyer"),
            ("total_quantity", "Qty"),
            ("total_sales_value", "Sales Value"),
        ], "No order leaders found.")}
      </section>
      <section class="panel">
        <div class="section-head">
          <h3>Recent daily activity</h3>
          <p>Visits, orders, and active parties by day</p>
        </div>
        {render_table(daily_rows, [
            ("activity_date", "Date"),
            ("visits_count", "Visits"),
            ("orders_count", "Orders"),
            ("active_parties", "Active Parties"),
        ], "No daily activity found.")}
      </section>
    </div>
    """


def parties_page(query_params: dict[str, list[str]]) -> str:
    selected_type = query_params.get("type", ["all"])[0]
    if selected_type == "all":
        rows = run_query(
            """
            SELECT party_id, party_type, party_name, phone, city, district, distance_from_base_km, notes
            FROM dashboard_party_directory
            ORDER BY party_type, party_name
            """
        )
    else:
        rows = run_query(
            """
            SELECT party_id, party_type, party_name, phone, city, district, distance_from_base_km, notes
            FROM dashboard_party_directory
            WHERE party_type = %s
            ORDER BY party_name
            """,
            (selected_type,),
        )
    data = [
        {
            "party_name": f'<a href="/party?id={escape(str(row["party_id"]))}">{escape(row["party_name"])}</a>',
            "party_type": escape(to_text(row["party_type"])),
            "phone": escape(to_text(row["phone"])),
            "city": escape(to_text(row["city"])),
            "district": escape(to_text(row["district"])),
            "distance_from_base_km": escape(to_text(row["distance_from_base_km"])),
            "notes": escape(to_text(row["notes"])),
        }
        for row in rows
    ]
    return f"""
    <section class="hero">
      <h2>Hospitals and agencies directory.</h2>
      <p>Browse every mapped buyer, open a detailed page for visit history and orders, and filter hospitals separately from agencies.</p>
      <div class="tag-row">
        <a class="tag" href="/parties?type=all">All</a>
        <a class="tag" href="/parties?type=hospital">Hospitals</a>
        <a class="tag" href="/parties?type=agency">Agencies</a>
        <a class="tag" href="/admin">Add new party</a>
      </div>
    </section>
    {flash_markup(query_params)}
    <div class="grid">
      <section class="panel">
        <div class="section-head">
          <h3>Party directory</h3>
          <p>Filter: {escape(selected_type)}</p>
        </div>
        {render_table(data, [
            ("party_name", "Name"),
            ("party_type", "Type"),
            ("phone", "Phone"),
            ("city", "City"),
            ("district", "District"),
            ("distance_from_base_km", "Distance Km"),
            ("notes", "Notes"),
        ], "No parties found for this filter.")}
      </section>
    </div>
    """


def party_detail_page(query_params: dict[str, list[str]]) -> str:
    party_id = query_params.get("id", [""])[0]
    if not party_id:
        return '<div class="error-box">Missing party id. Open this page from the party directory.</div>'
    party_rows = run_query(
        """
        SELECT party_id, party_type, party_name, phone, address_line, city, district, state, distance_from_base_km, base_reference, notes
        FROM dashboard_party_directory
        WHERE party_id = %s
        """,
        (party_id,),
    )
    if not party_rows:
        return '<div class="error-box">Party not found.</div>'
    party = party_rows[0]
    visits = run_query(
        """
        SELECT visit_date, visit_purpose, visit_status, location_snapshot, distance_snapshot_km, contact_snapshot, notes
        FROM visits
        WHERE party_id = %s
        ORDER BY visit_date DESC, created_at DESC
        """,
        (party_id,),
    )
    requested = run_query(
        """
        SELECT v.visit_date, p.product_name, vri.requirement_type, vri.quantity_estimate, COALESCE(vri.unit_of_measure, p.unit_of_measure) AS unit_of_measure, vri.brand_preference, vri.notes
        FROM visit_required_items vri
        JOIN visits v ON v.id = vri.visit_id
        JOIN products p ON p.id = vri.product_id
        WHERE v.party_id = %s
        ORDER BY v.visit_date DESC, p.product_name
        """,
        (party_id,),
    )
    orders = run_query(
        """
        SELECT so.order_date, so.reference_number, so.order_status, pr.product_name, soi.quantity, soi.unit_of_measure, soi.buy_rate, soi.sell_rate
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        JOIN products pr ON pr.id = soi.product_id
        WHERE so.party_id = %s
        ORDER BY so.order_date DESC, so.reference_number, pr.product_name
        """,
        (party_id,),
    )
    pricing = run_query(
        """
        SELECT product_name, buy_rate, sell_rate, currency_code, effective_from, effective_to
        FROM dashboard_current_pricing
        WHERE party_id = %s
        ORDER BY product_name
        """,
        (party_id,),
    )
    visit_rows = [
        {
            "visit_date": escape(to_text(row["visit_date"])),
            "visit_purpose": escape(to_text(row["visit_purpose"])),
            "visit_status": escape(to_text(row["visit_status"])),
            "location_snapshot": escape(to_text(row["location_snapshot"])),
            "distance_snapshot_km": escape(to_text(row["distance_snapshot_km"])),
            "contact_snapshot": escape(to_text(row["contact_snapshot"])),
            "notes": escape(to_text(row["notes"])),
        }
        for row in visits
    ]
    request_rows = [
        {
            "visit_date": escape(to_text(row["visit_date"])),
            "product_name": escape(to_text(row["product_name"])),
            "requirement_type": escape(to_text(row["requirement_type"])),
            "quantity_estimate": escape(to_text(row["quantity_estimate"])),
            "unit_of_measure": escape(to_text(row["unit_of_measure"])),
            "brand_preference": escape(to_text(row["brand_preference"])),
            "notes": escape(to_text(row["notes"])),
        }
        for row in requested
    ]
    order_rows = [
        {
            "order_date": escape(to_text(row["order_date"])),
            "reference_number": escape(to_text(row["reference_number"])),
            "order_status": escape(to_text(row["order_status"])),
            "product_name": escape(to_text(row["product_name"])),
            "quantity": escape(to_text(row["quantity"])),
            "unit_of_measure": escape(to_text(row["unit_of_measure"])),
            "buy_rate": escape(money(row["buy_rate"])),
            "sell_rate": escape(money(row["sell_rate"])),
        }
        for row in orders
    ]
    pricing_rows = [
        {
            "product_name": escape(to_text(row["product_name"])),
            "buy_rate": escape(money(row["buy_rate"])),
            "sell_rate": escape(money(row["sell_rate"])),
            "currency_code": escape(to_text(row["currency_code"])),
            "effective_from": escape(to_text(row["effective_from"])),
            "effective_to": escape(to_text(row["effective_to"])),
        }
        for row in pricing
    ]
    return f"""
    <section class="hero">
      <h2>{escape(party["party_name"])}</h2>
      <p>{escape(to_text(party["party_type"]))} in {escape(to_text(party["city"]))}, {escape(to_text(party["district"]))}. This page combines visit records, requested items, actual orders, and current pricing.</p>
      <div class="tag-row">
        <a class="tag" href="/parties">Back to directory</a>
        <a class="tag" href="/admin">Add more data</a>
        <a class="tag" href="/edit-party?id={escape(str(party["party_id"]))}">Edit party</a>
        <span class="tag">Phone: {escape(to_text(party["phone"]))}</span>
        <span class="tag">Distance: {escape(to_text(party["distance_from_base_km"]))} km</span>
      </div>
    </section>
    {flash_markup(query_params)}
    <div class="grid two-col">
      <section class="panel">
        <div class="section-head"><h3>Profile</h3><p>Contact and route details</p></div>
        <div class="detail-list">
          <div class="detail-item"><small>Address</small>{escape(to_text(party["address_line"]))}</div>
          <div class="detail-item"><small>Base reference</small>{escape(to_text(party["base_reference"]))}</div>
          <div class="detail-item"><small>Notes</small>{escape(to_text(party["notes"]))}</div>
        </div>
      </section>
      <section class="panel">
        <div class="section-head"><h3>Current pricing</h3><p>Latest product-wise rates</p></div>
        {render_table(pricing_rows, [
            ("product_name", "Product"),
            ("buy_rate", "Buy Rate"),
            ("sell_rate", "Sell Rate"),
            ("currency_code", "Currency"),
            ("effective_from", "From"),
            ("effective_to", "To"),
        ], "No current pricing saved for this party.")}
      </section>
    </div>
    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Visit history</h3><p>All recorded visits</p></div>
        {render_table(visit_rows, [
            ("visit_date", "Date"),
            ("visit_purpose", "Purpose"),
            ("visit_status", "Status"),
            ("location_snapshot", "Location"),
            ("distance_snapshot_km", "Distance Km"),
            ("contact_snapshot", "Contact"),
            ("notes", "Notes"),
        ], "No visits recorded.")}
      </section>
      <section class="panel">
        <div class="section-head"><h3>Requested items</h3><p>Demand observed during visits</p></div>
        {render_table(request_rows, [
            ("visit_date", "Visit Date"),
            ("product_name", "Product"),
            ("requirement_type", "Type"),
            ("quantity_estimate", "Qty Estimate"),
            ("unit_of_measure", "Unit"),
            ("brand_preference", "Brand"),
            ("notes", "Notes"),
        ], "No requested items recorded.")}
      </section>
      <section class="panel">
        <div class="section-head"><h3>Actual orders</h3><p>Real business conversion</p></div>
        {render_table(order_rows, [
            ("order_date", "Order Date"),
            ("reference_number", "Reference"),
            ("order_status", "Status"),
            ("product_name", "Product"),
            ("quantity", "Qty"),
            ("unit_of_measure", "Unit"),
            ("buy_rate", "Buy Rate"),
            ("sell_rate", "Sell Rate"),
        ], "No orders recorded.")}
      </section>
    </div>
    """


def edit_party_page(query_params: dict[str, list[str]]) -> str:
    party_id = query_params.get("id", [""])[0]
    if not party_id:
        return '<div class="error-box">Missing party id.</div>'
    rows = run_query(
        """
        SELECT p.id, p.party_type, p.name, p.phone, p.contact_person, p.address_line, p.notes,
               l.city, l.district, l.state, l.distance_from_base_km, l.base_reference
        FROM parties p
        LEFT JOIN locations l ON l.id = p.location_id
        WHERE p.id = %s
        """,
        (party_id,),
    )
    if not rows:
        return '<div class="error-box">Party not found.</div>'
    p = rows[0]
    return f"""
    <section class="hero">
      <h2>Edit party: {escape(to_text(p["name"]))}</h2>
      <p>Update any field and save. Location fields will update or create a matching location record.</p>
      <div class="tag-row">
        <a class="tag" href="/party?id={escape(party_id)}">Cancel</a>
      </div>
    </section>
    <div class="grid">
      <section class="panel">
        <form method="post" action="/edit-party">
          <input type="hidden" name="party_id" value="{escape(party_id)}">
          <div class="field-grid">
            <label>Party type
              <select name="party_type" required>
                <option value="hospital" {"selected" if p["party_type"] == "hospital" else ""}>Hospital</option>
                <option value="agency" {"selected" if p["party_type"] == "agency" else ""}>Agency</option>
                <option value="clinic" {"selected" if p["party_type"] == "clinic" else ""}>Clinic</option>
                <option value="other" {"selected" if p["party_type"] == "other" else ""}>Other</option>
              </select>
            </label>
            <label>Name
              <input type="text" name="name" value="{escape(to_text(p["name"]))}" required>
            </label>
            <label>Phone
              <input type="text" name="phone" value="{escape(to_text(p["phone"]))}">
            </label>
            <label>Contact person
              <input type="text" name="contact_person" value="{escape(to_text(p["contact_person"]))}">
            </label>
            <label>City
              <input type="text" name="city" value="{escape(to_text(p["city"]))}" required>
            </label>
            <label>District
              <input type="text" name="district" value="{escape(to_text(p["district"]))}">
            </label>
            <label>State
              <input type="text" name="state" value="{escape(to_text(p["state"]) or "Bihar")}">
            </label>
            <label>Distance from base (km)
              <input type="number" step="0.01" name="distance_from_base_km" value="{escape(to_text(p["distance_from_base_km"]))}">
            </label>
            <label>Base reference
              <input type="text" name="base_reference" value="{escape(to_text(p["base_reference"]))}">
            </label>
            <label>Address line
              <input type="text" name="address_line" value="{escape(to_text(p["address_line"]))}">
            </label>
          </div>
          <label>Notes
            <textarea name="notes">{escape(to_text(p["notes"]))}</textarea>
          </label>
          <button type="submit">Save changes</button>
        </form>
      </section>
      <section class="panel">
        <div class="section-head"><h3>Deactivate party</h3><p>Hides from directory without deleting history</p></div>
        <p class="section-tip">This will mark the party as inactive. All visits, orders, and pricing history are preserved. You can still view the party directly by URL.</p>
        <form method="post" action="/delete-party" onsubmit="return confirm('Deactivate this party? History is preserved.');">
          <input type="hidden" name="party_id" value="{escape(party_id)}">
          <button type="submit" class="btn-danger">Deactivate party</button>
        </form>
      </section>
    </div>
    """


def products_page(query_params: dict[str, list[str]]) -> str:
    demand = run_query(
        """
        SELECT p.id AS product_id, p.sku, p.product_name, dpd.times_requested_in_visits, dpd.unique_parties_requesting, dpd.ordered_quantity, dpd.ordered_value
        FROM products p
        LEFT JOIN dashboard_product_demand dpd ON dpd.product_id = p.id
        ORDER BY ordered_value DESC, times_requested_in_visits DESC, product_name
        """
    )
    aliases = run_query(
        """
        SELECT p.product_name, STRING_AGG(pa.alias_name, ', ' ORDER BY pa.alias_name) AS aliases
        FROM products p
        LEFT JOIN product_aliases pa ON pa.product_id = p.id
        GROUP BY p.product_name
        ORDER BY p.product_name
        """
    )
    alias_map = {row["product_name"]: row["aliases"] for row in aliases}
    rows = [
        {
            "sku": escape(to_text(row["sku"])),
            "product_name": escape(row["product_name"]),
            "aliases": escape(to_text(alias_map.get(row["product_name"]))),
            "times_requested_in_visits": escape(to_text(row["times_requested_in_visits"])),
            "unique_parties_requesting": escape(to_text(row["unique_parties_requesting"])),
            "ordered_quantity": escape(to_text(row["ordered_quantity"])),
            "ordered_value": escape(money(row["ordered_value"])),
            "actions": f'<a href="/edit-product?id={escape(str(row["product_id"]))}">Edit</a>',
        }
        for row in demand
    ]
    return f"""
    <section class="hero">
      <h2>Unique product master and demand view.</h2>
      <p>This page merges the master item list with request frequency and order value so you can see which products deserve more focus during hospital visits.</p>
      <div class="tag-row"><a class="tag" href="/admin">Add product or demand</a></div>
    </section>
    {flash_markup(query_params)}
    <div class="grid">
      <section class="panel">
        <div class="section-head">
          <h3>Product demand matrix</h3>
          <p>Visit demand, number of asking parties, and ordered value</p>
        </div>
        {render_table(rows, [
            ("sku", "SKU"),
            ("product_name", "Product"),
            ("aliases", "Aliases"),
            ("times_requested_in_visits", "Visit Requests"),
            ("unique_parties_requesting", "Parties Asking"),
            ("ordered_quantity", "Ordered Qty"),
            ("ordered_value", "Ordered Value"),
            ("actions", ""),
        ], "No products found.")}
      </section>
    </div>
    """


def edit_product_page(query_params: dict[str, list[str]]) -> str:
    product_id = query_params.get("id", [""])[0]
    if not product_id:
        return '<div class="error-box">Missing product id.</div>'
    rows = run_query(
        "SELECT id, sku, product_name, product_category, unit_of_measure, preferred_brand, hindi_name, sample_priority, notes FROM products WHERE id = %s",
        (product_id,),
    )
    if not rows:
        return '<div class="error-box">Product not found.</div>'
    p = rows[0]
    aliases = run_query(
        "SELECT id, alias_name FROM product_aliases WHERE product_id = %s ORDER BY alias_name",
        (product_id,),
    )
    alias_rows_html = "".join(
        f'<div class="alias-row"><span>{escape(a["alias_name"])}</span>'
        f'<form method="post" action="/delete-product-alias" style="display:inline">'
        f'<input type="hidden" name="alias_id" value="{escape(str(a["id"]))}">'
        f'<input type="hidden" name="product_id" value="{escape(product_id)}">'
        f'<button type="submit" class="btn-danger btn-small">Remove</button></form></div>'
        for a in aliases
    )
    checked = "checked" if p["sample_priority"] else ""
    return f"""
    <section class="hero">
      <h2>Edit product: {escape(to_text(p["product_name"]))}</h2>
      <p>Update product details or add/remove aliases. Deactivate to hide from new orders without losing history.</p>
      <div class="tag-row"><a class="tag" href="/products">Cancel</a></div>
    </section>
    <div class="grid two-col">
      <section class="panel">
        <div class="section-head"><h3>Product details</h3></div>
        <form method="post" action="/edit-product">
          <input type="hidden" name="product_id" value="{escape(product_id)}">
          <div class="field-grid">
            <label>SKU <input type="text" name="sku" value="{escape(to_text(p["sku"]))}"></label>
            <label>Product name <input type="text" name="product_name" value="{escape(to_text(p["product_name"]))}" required></label>
            <label>Category <input type="text" name="product_category" value="{escape(to_text(p["product_category"]))}"></label>
            <label>Unit of measure <input type="text" name="unit_of_measure" value="{escape(to_text(p["unit_of_measure"]) or "piece")}"></label>
            <label>Preferred brand <input type="text" name="preferred_brand" value="{escape(to_text(p["preferred_brand"]))}"></label>
            <label>Hindi name <input type="text" name="hindi_name" value="{escape(to_text(p["hindi_name"]))}"></label>
            <label style="grid-column:1/-1">
              <input type="checkbox" name="sample_priority" value="true" {checked}> Sample priority
            </label>
          </div>
          <label>Notes <textarea name="notes">{escape(to_text(p["notes"]))}</textarea></label>
          <button type="submit">Save changes</button>
        </form>
      </section>
      <section class="panel">
        <div class="section-head"><h3>Aliases</h3><p>Alternative names for this product</p></div>
        {alias_rows_html if alias_rows_html else "<p>No aliases.</p>"}
        <form method="post" action="/add-product-alias" style="margin-top:1rem">
          <input type="hidden" name="product_id" value="{escape(product_id)}">
          <label>New alias <input type="text" name="alias_name" required></label>
          <button type="submit">Add alias</button>
        </form>
        <hr style="margin:1.5rem 0">
        <div class="section-head"><h3>Deactivate product</h3><p>Hides from new orders, history preserved</p></div>
        <form method="post" action="/delete-product" onsubmit="return confirm('Deactivate this product?');">
          <input type="hidden" name="product_id" value="{escape(product_id)}">
          <button type="submit" class="btn-danger">Deactivate product</button>
        </form>
      </section>
    </div>
    """


def visits_page(query_params: dict[str, list[str]]) -> str:
    rows = run_query(
        """
        SELECT v.id AS visit_id, v.visit_date, p.id AS party_id, p.name AS party_name, p.party_type, v.visit_purpose, v.visit_status, v.location_snapshot, v.distance_snapshot_km, v.notes
        FROM visits v
        JOIN parties p ON p.id = v.party_id
        ORDER BY v.visit_date DESC, p.name
        """
    )
    data = [
        {
            "visit_date": escape(to_text(row["visit_date"])),
            "party_name": f'<a href="/party?id={escape(str(row["party_id"]))}">{escape(to_text(row["party_name"]))}</a>',
            "party_type": escape(to_text(row["party_type"])),
            "visit_purpose": escape(to_text(row["visit_purpose"])),
            "visit_status": escape(to_text(row["visit_status"])),
            "location_snapshot": escape(to_text(row["location_snapshot"])),
            "distance_snapshot_km": escape(to_text(row["distance_snapshot_km"])),
            "notes": escape(to_text(row["notes"])),
            "actions": f'<a href="/edit-visit?id={escape(str(row["visit_id"]))}">Edit</a>',
        }
        for row in rows
    ]
    return f"""
    <section class="hero">
      <h2>Visit log across hospitals and agencies.</h2>
      <p>Every visit captured here can later feed demand mapping, conversion tracking, and city-wise market coverage.</p>
      <div class="tag-row"><a class="tag" href="/admin">Log new visit</a></div>
    </section>
    {flash_markup(query_params)}
    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Visit records</h3><p>Ordered by most recent date</p></div>
        {render_table(data, [
            ("visit_date", "Date"),
            ("party_name", "Party"),
            ("party_type", "Type"),
            ("visit_purpose", "Purpose"),
            ("visit_status", "Status"),
            ("location_snapshot", "Location"),
            ("distance_snapshot_km", "Distance Km"),
            ("notes", "Notes"),
            ("actions", ""),
        ], "No visits found.")}
      </section>
    </div>
    """


def edit_visit_page(query_params: dict[str, list[str]]) -> str:
    visit_id = query_params.get("id", [""])[0]
    if not visit_id:
        return '<div class="error-box">Missing visit id.</div>'
    rows = run_query(
        """
        SELECT v.id, v.party_id, p.name AS party_name, v.visit_date, v.visit_purpose,
               v.visit_status, v.location_snapshot, v.distance_snapshot_km, v.contact_snapshot, v.notes
        FROM visits v
        JOIN parties p ON p.id = v.party_id
        WHERE v.id = %s
        """,
        (visit_id,),
    )
    if not rows:
        return '<div class="error-box">Visit not found.</div>'
    v = rows[0]

    def sel(field, value):
        return "selected" if v[field] == value else ""

    return f"""
    <section class="hero">
      <h2>Edit visit: {escape(to_text(v["party_name"]))} on {escape(to_text(v["visit_date"]))}</h2>
      <p>Correct visit details. Party cannot be changed — log a new visit if the party is wrong.</p>
      <div class="tag-row">
        <a class="tag" href="/visits">Back to visits</a>
        <a class="tag" href="/party?id={escape(str(v["party_id"]))}">View party</a>
      </div>
    </section>
    <div class="grid two-col">
      <section class="panel">
        <div class="section-head"><h3>Visit details</h3></div>
        <form method="post" action="/edit-visit">
          <input type="hidden" name="visit_id" value="{escape(visit_id)}">
          <div class="field-grid">
            <label>Visit date
              <input type="date" name="visit_date" value="{escape(to_text(v["visit_date"]))}" required>
            </label>
            <label>Purpose
              <select name="visit_purpose">
                <option value="regular_visit" {sel("visit_purpose", "regular_visit")}>Regular visit</option>
                <option value="follow_up" {sel("visit_purpose", "follow_up")}>Follow-up</option>
                <option value="sample_drop" {sel("visit_purpose", "sample_drop")}>Sample drop</option>
                <option value="order_collection" {sel("visit_purpose", "order_collection")}>Order collection</option>
                <option value="complaint" {sel("visit_purpose", "complaint")}>Complaint</option>
                <option value="other" {sel("visit_purpose", "other")}>Other</option>
              </select>
            </label>
            <label>Status
              <select name="visit_status">
                <option value="completed" {sel("visit_status", "completed")}>Completed</option>
                <option value="planned" {sel("visit_status", "planned")}>Planned</option>
                <option value="cancelled" {sel("visit_status", "cancelled")}>Cancelled</option>
                <option value="no_contact" {sel("visit_status", "no_contact")}>No contact</option>
              </select>
            </label>
            <label>Location snapshot
              <input type="text" name="location_snapshot" value="{escape(to_text(v["location_snapshot"]))}">
            </label>
            <label>Distance snapshot (km)
              <input type="number" step="0.01" name="distance_snapshot_km" value="{escape(to_text(v["distance_snapshot_km"]))}">
            </label>
            <label>Contact snapshot
              <input type="text" name="contact_snapshot" value="{escape(to_text(v["contact_snapshot"]))}">
            </label>
          </div>
          <label>Notes <textarea name="notes">{escape(to_text(v["notes"]))}</textarea></label>
          <button type="submit">Save changes</button>
        </form>
      </section>
      <section class="panel">
        <div class="section-head"><h3>Delete visit</h3><p>Permanently removes visit and all its requested items</p></div>
        <p class="section-tip">This cannot be undone. All visit items linked to this visit will also be deleted.</p>
        <form method="post" action="/delete-visit" onsubmit="return confirm('Delete this visit and all its items? This cannot be undone.');">
          <input type="hidden" name="visit_id" value="{escape(visit_id)}">
          <input type="hidden" name="party_id" value="{escape(str(v["party_id"]))}">
          <button type="submit" class="btn-danger">Delete visit</button>
        </form>
      </section>
    </div>
    {_visit_items_section(visit_id)}
    """


def _visit_items_section(visit_id: str) -> str:
    items = run_query(
        """
        SELECT vri.id, p.product_name, vri.requirement_type, vri.quantity_estimate,
               COALESCE(vri.unit_of_measure, p.unit_of_measure) AS unit_of_measure,
               vri.brand_preference, vri.notes
        FROM visit_required_items vri
        JOIN products p ON p.id = vri.product_id
        WHERE vri.visit_id = %s
        ORDER BY p.product_name
        """,
        (visit_id,),
    )
    if not items:
        item_rows_html = "<p>No requested items for this visit.</p>"
    else:
        item_rows_html = render_table(
            [
                {
                    "product_name": escape(to_text(row["product_name"])),
                    "requirement_type": escape(to_text(row["requirement_type"])),
                    "quantity_estimate": escape(to_text(row["quantity_estimate"])),
                    "unit_of_measure": escape(to_text(row["unit_of_measure"])),
                    "brand_preference": escape(to_text(row["brand_preference"])),
                    "notes": escape(to_text(row["notes"])),
                    "actions": (
                        f'<a href="/edit-visit-item?id={escape(str(row["id"]))}&visit_id={escape(visit_id)}">Edit</a> &nbsp;'
                        f'<form method="post" action="/delete-visit-item" style="display:inline" onsubmit="return confirm(\'Remove this item?\');">'
                        f'<input type="hidden" name="item_id" value="{escape(str(row["id"]))}">'
                        f'<input type="hidden" name="visit_id" value="{escape(visit_id)}">'
                        f'<button type="submit" class="btn-danger btn-small">Remove</button></form>'
                    ),
                }
                for row in items
            ],
            [
                ("product_name", "Product"),
                ("requirement_type", "Type"),
                ("quantity_estimate", "Qty Estimate"),
                ("unit_of_measure", "Unit"),
                ("brand_preference", "Brand"),
                ("notes", "Notes"),
                ("actions", ""),
            ],
            "No items.",
        )
    return f"""
    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Requested items for this visit</h3><p>Edit or remove individual items</p></div>
        {item_rows_html}
      </section>
    </div>
    """


def edit_visit_item_page(query_params: dict[str, list[str]]) -> str:
    item_id = query_params.get("id", [""])[0]
    visit_id = query_params.get("visit_id", [""])[0]
    if not item_id:
        return '<div class="error-box">Missing item id.</div>'
    rows = run_query(
        """
        SELECT vri.id, vri.visit_id, p.product_name, vri.requirement_type,
               vri.quantity_estimate, vri.unit_of_measure, vri.brand_preference, vri.notes
        FROM visit_required_items vri
        JOIN products p ON p.id = vri.product_id
        WHERE vri.id = %s
        """,
        (item_id,),
    )
    if not rows:
        return '<div class="error-box">Visit item not found.</div>'
    item = rows[0]
    vid = visit_id or str(item["visit_id"])

    def sel(field, value):
        return "selected" if item[field] == value else ""

    return f"""
    <section class="hero">
      <h2>Edit visit item: {escape(to_text(item["product_name"]))}</h2>
      <p>Update requirement type, quantity, brand preference, or notes. Product cannot be changed — remove and add a new item if needed.</p>
      <div class="tag-row"><a class="tag" href="/edit-visit?id={escape(vid)}">Back to visit</a></div>
    </section>
    <div class="grid">
      <section class="panel">
        <form method="post" action="/edit-visit-item">
          <input type="hidden" name="item_id" value="{escape(item_id)}">
          <input type="hidden" name="visit_id" value="{escape(vid)}">
          <div class="field-grid">
            <label>Requirement type
              <select name="requirement_type">
                <option value="required" {sel("requirement_type", "required")}>Required</option>
                <option value="recommended_sample" {sel("requirement_type", "recommended_sample")}>Recommended sample</option>
                <option value="mentioned" {sel("requirement_type", "mentioned")}>Mentioned</option>
              </select>
            </label>
            <label>Quantity estimate
              <input type="number" step="0.01" name="quantity_estimate" value="{escape(to_text(item["quantity_estimate"]))}">
            </label>
            <label>Unit of measure
              <input type="text" name="unit_of_measure" value="{escape(to_text(item["unit_of_measure"]))}">
            </label>
            <label>Brand preference
              <input type="text" name="brand_preference" value="{escape(to_text(item["brand_preference"]))}">
            </label>
          </div>
          <label>Notes <textarea name="notes">{escape(to_text(item["notes"]))}</textarea></label>
          <button type="submit">Save changes</button>
        </form>
      </section>
    </div>
    """


def edit_order_page(query_params: dict[str, list[str]]) -> str:
    order_id = query_params.get("id", [""])[0]
    if not order_id:
        return '<div class="error-box">Missing order id.</div>'
    orders = run_query(
        """
        SELECT so.id, so.order_date, so.order_status, so.reference_number, so.notes,
               p.id AS party_id, p.name AS party_name
        FROM sales_orders so
        JOIN parties p ON p.id = so.party_id
        WHERE so.id = %s
        """,
        (order_id,),
    )
    if not orders:
        return '<div class="error-box">Order not found.</div>'
    o = orders[0]
    items = run_query(
        """
        SELECT soi.id, pr.product_name, soi.quantity, soi.unit_of_measure, soi.buy_rate, soi.sell_rate,
               (soi.quantity * COALESCE(soi.sell_rate, 0)) AS line_value, soi.notes
        FROM sales_order_items soi
        JOIN products pr ON pr.id = soi.product_id
        WHERE soi.sales_order_id = %s
        ORDER BY pr.product_name
        """,
        (order_id,),
    )

    def sel(value):
        return "selected" if o["order_status"] == value else ""

    if not items:
        items_html = "<p>No line items on this order.</p>"
    else:
        items_html = render_table(
            [
                {
                    "product_name": escape(to_text(row["product_name"])),
                    "quantity": escape(to_text(row["quantity"])),
                    "unit_of_measure": escape(to_text(row["unit_of_measure"])),
                    "buy_rate": escape(money(row["buy_rate"])),
                    "sell_rate": escape(money(row["sell_rate"])),
                    "line_value": escape(money(row["line_value"])),
                    "notes": escape(to_text(row["notes"])),
                    "actions": (
                        f'<a href="/edit-order-item?id={escape(str(row["id"]))}&order_id={escape(order_id)}">Edit</a> &nbsp;'
                        f'<form method="post" action="/delete-order-item" style="display:inline" onsubmit="return confirm(\'Remove this line item?\');">'
                        f'<input type="hidden" name="item_id" value="{escape(str(row["id"]))}">'
                        f'<input type="hidden" name="order_id" value="{escape(order_id)}">'
                        f'<button type="submit" class="btn-danger btn-small">Remove</button></form>'
                    ),
                }
                for row in items
            ],
            [
                ("product_name", "Product"),
                ("quantity", "Qty"),
                ("unit_of_measure", "Unit"),
                ("buy_rate", "Buy Rate"),
                ("sell_rate", "Sell Rate"),
                ("line_value", "Line Value"),
                ("notes", "Notes"),
                ("actions", ""),
            ],
            "No items.",
        )

    return f"""
    <section class="hero">
      <h2>Edit order: {escape(to_text(o["party_name"]))} — {escape(to_text(o["order_date"]))}</h2>
      <p>Update order header or manage line items. Party cannot be changed.</p>
      <div class="tag-row">
        <a class="tag" href="/orders">Back to orders</a>
        <a class="tag" href="/party?id={escape(str(o["party_id"]))}">View party</a>
      </div>
    </section>
    <div class="grid two-col">
      <section class="panel">
        <div class="section-head"><h3>Order header</h3></div>
        <form method="post" action="/edit-order">
          <input type="hidden" name="order_id" value="{escape(order_id)}">
          <div class="field-grid">
            <label>Order date
              <input type="date" name="order_date" value="{escape(to_text(o["order_date"]))}" required>
            </label>
            <label>Status
              <select name="order_status">
                <option value="draft" {sel("draft")}>Draft</option>
                <option value="confirmed" {sel("confirmed")}>Confirmed</option>
                <option value="delivered" {sel("delivered")}>Delivered</option>
                <option value="cancelled" {sel("cancelled")}>Cancelled</option>
              </select>
            </label>
            <label>Reference number
              <input type="text" name="reference_number" value="{escape(to_text(o["reference_number"]))}">
            </label>
          </div>
          <label>Notes <textarea name="notes">{escape(to_text(o["notes"]))}</textarea></label>
          <button type="submit">Save changes</button>
        </form>
      </section>
      <section class="panel">
        <div class="section-head"><h3>Delete order</h3><p>Permanently removes order and all its line items</p></div>
        <p class="section-tip">To cancel without losing history, set status to Cancelled instead. Hard delete removes all line items and cannot be undone.</p>
        <form method="post" action="/delete-order" onsubmit="return confirm('Permanently delete this order and all its line items? This cannot be undone.');">
          <input type="hidden" name="order_id" value="{escape(order_id)}">
          <input type="hidden" name="party_id" value="{escape(str(o["party_id"]))}">
          <button type="submit" class="btn-danger">Delete order</button>
        </form>
      </section>
    </div>
    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Line items</h3><p>Edit quantities and rates, or remove individual lines</p></div>
        {items_html}
      </section>
    </div>
    """


def edit_order_item_page(query_params: dict[str, list[str]]) -> str:
    item_id = query_params.get("id", [""])[0]
    order_id = query_params.get("order_id", [""])[0]
    if not item_id:
        return '<div class="error-box">Missing item id.</div>'
    rows = run_query(
        """
        SELECT soi.id, soi.sales_order_id, pr.product_name, soi.quantity,
               soi.unit_of_measure, soi.buy_rate, soi.sell_rate, soi.notes
        FROM sales_order_items soi
        JOIN products pr ON pr.id = soi.product_id
        WHERE soi.id = %s
        """,
        (item_id,),
    )
    if not rows:
        return '<div class="error-box">Order item not found.</div>'
    item = rows[0]
    oid = order_id or str(item["sales_order_id"])
    return f"""
    <section class="hero">
      <h2>Edit order item: {escape(to_text(item["product_name"]))}</h2>
      <p>Update quantity, unit, or rates. Saving will also update the pricing record for this party and product.</p>
      <div class="tag-row"><a class="tag" href="/edit-order?id={escape(oid)}">Back to order</a></div>
    </section>
    <div class="grid">
      <section class="panel">
        <form method="post" action="/edit-order-item">
          <input type="hidden" name="item_id" value="{escape(item_id)}">
          <input type="hidden" name="order_id" value="{escape(oid)}">
          <div class="field-grid">
            <label>Quantity
              <input type="number" step="0.01" name="quantity" value="{escape(to_text(item["quantity"]))}" required>
            </label>
            <label>Unit of measure
              <input type="text" name="unit_of_measure" value="{escape(to_text(item["unit_of_measure"]) or "piece")}">
            </label>
            <label>Buy rate
              <input type="number" step="0.01" name="buy_rate" value="{escape(to_text(item["buy_rate"]))}">
            </label>
            <label>Sell rate
              <input type="number" step="0.01" name="sell_rate" value="{escape(to_text(item["sell_rate"]))}">
            </label>
          </div>
          <label>Notes <textarea name="notes">{escape(to_text(item["notes"]))}</textarea></label>
          <button type="submit">Save changes</button>
        </form>
      </section>
    </div>
    """


def orders_page(query_params: dict[str, list[str]]) -> str:
    rows = run_query(
        """
        SELECT so.id AS order_id, so.order_date, so.reference_number, so.order_status, p.name AS party_name, pr.product_name, soi.quantity, soi.unit_of_measure, soi.buy_rate, soi.sell_rate,
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
    data = [
        {
            "order_date": escape(to_text(row["order_date"])),
            "reference_number": escape(to_text(row["reference_number"])),
            "order_status": escape(to_text(row["order_status"])),
            "party_name": escape(to_text(row["party_name"])),
            "product_name": escape(to_text(row["product_name"])),
            "quantity": escape(to_text(row["quantity"])),
            "unit_of_measure": escape(to_text(row["unit_of_measure"])),
            "buy_rate": escape(money(row["buy_rate"])),
            "sell_rate": escape(money(row["sell_rate"])),
            "line_value": escape(money(row["line_value"])),
            "actions": f'<a href="/edit-order?id={escape(str(row["order_id"]))}">Edit</a>',
        }
        for row in rows
    ]
    return f"""
    <section class="hero">
      <h2>Order book and sales conversion.</h2>
      <p>Line-level order details make it easier to verify quantity, pricing, and which buyers are driving real revenue.</p>
      <div class="tag-row">
        <span class="tag">Confirmed sales value: {escape(money(total_value))}</span>
        <a class="tag" href="/admin">Add new order</a>
      </div>
    </section>
    {flash_markup(query_params)}
    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Order lines</h3><p>Each ordered item with buy and sell rate</p></div>
        {render_table(data, [
            ("order_date", "Order Date"),
            ("reference_number", "Reference"),
            ("order_status", "Status"),
            ("party_name", "Party"),
            ("product_name", "Product"),
            ("quantity", "Qty"),
            ("unit_of_measure", "Unit"),
            ("buy_rate", "Buy Rate"),
            ("sell_rate", "Sell Rate"),
            ("line_value", "Line Value"),
            ("actions", ""),
        ], "No orders found.")}
      </section>
    </div>
    """


def pricing_page(query_params: dict[str, list[str]]) -> str:
    rows = run_query(
        """
        SELECT party_name, product_name, buy_rate, sell_rate, currency_code, effective_from, effective_to
        FROM dashboard_current_pricing
        ORDER BY party_name, product_name
        """
    )
    data = [
        {
            "party_name": escape(to_text(row["party_name"])),
            "product_name": escape(to_text(row["product_name"])),
            "buy_rate": escape(money(row["buy_rate"])),
            "sell_rate": escape(money(row["sell_rate"])),
            "currency_code": escape(to_text(row["currency_code"])),
            "effective_from": escape(to_text(row["effective_from"])),
            "effective_to": escape(to_text(row["effective_to"])),
        }
        for row in rows
    ]
    return f"""
    <section class="hero">
      <h2>Current pricing by buyer and product.</h2>
      <p>This page gives a clean rate snapshot so you can compare what you buy and what you sell across hospitals and agencies.</p>
      <div class="tag-row"><a class="tag" href="/admin">Update pricing through order entry</a></div>
    </section>
    {flash_markup(query_params)}
    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Latest saved rates</h3><p>Most recent party-product pricing rows</p></div>
        {render_table(data, [
            ("party_name", "Party"),
            ("product_name", "Product"),
            ("buy_rate", "Buy Rate"),
            ("sell_rate", "Sell Rate"),
            ("currency_code", "Currency"),
            ("effective_from", "From"),
            ("effective_to", "To"),
        ], "No pricing data found.")}
      </section>
    </div>
    """


def admin_page(query_params: dict[str, list[str]]) -> str:
    lookups = admin_lookups()
    today = date.today().isoformat()
    return f"""
    <section class="hero">
      <h2>Browser-based data entry.</h2>
      <p>Add hospitals or agencies, create products, log visits, attach requested items to visits, and capture confirmed orders with pricing. This page is the operational input layer for the dashboard.</p>
    </section>
    {flash_markup(query_params)}
    <div class="grid two-col">
      <section class="panel">
        <div class="section-head"><h3>Add Party</h3><p>Creates location if needed, then party</p></div>
        <p class="section-tip">Use this for hospitals, agencies, clinics, or any buyer you visit. City, district, and distance help your route planning and dashboard grouping.</p>
        <form method="post" action="/admin">
          <input type="hidden" name="action" value="add_party">
          <div class="field-grid">
            <label>Party type {hint("Choose hospital, agency, clinic, or other based on the buyer type. / खरीदार के प्रकार के अनुसार hospital, agency, clinic या other चुनें।")}
              <select name="party_type" required>
                <option value="hospital">Hospital</option>
                <option value="agency">Agency</option>
                <option value="clinic">Clinic</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Name {hint("Use the real market or hospital name so search and reports stay clean. / असली market या hospital का नाम लिखें ताकि search और reports साफ रहें।")}
              <input type="text" name="name" required>
            </label>
            <label>Phone {hint("Primary number for calling or WhatsApp follow-up. / calling या WhatsApp follow-up के लिए मुख्य नंबर लिखें।")}
              <input type="text" name="phone">
            </label>
            <label>Contact person {hint("Optional doctor, owner, purchase contact, or store person. / doctor, owner, purchase contact या store person का नाम लिख सकते हैं।")}
              <input type="text" name="contact_person">
            </label>
            <label>City {hint("Used for dashboard grouping and future route planning. / dashboard grouping और आगे की route planning के लिए उपयोग होता है।")}
              <input type="text" name="city" required>
            </label>
            <label>District {hint("For Bihar entries, keep district names consistent for cleaner reports. / Bihar entries में district नाम एक जैसे रखें ताकि reports साफ रहें।")}
              <input type="text" name="district" value="West Champaran">
            </label>
            <label>State {hint("Usually Bihar for your current operating area. / आपके current operating area के लिए सामान्यतः Bihar रहेगा।")}
              <input type="text" name="state" value="Bihar">
            </label>
            <label>Distance from base (km) {hint("Approximate travel distance from your operating base like Raxaul or Bagaha. / Raxaul या Bagaha जैसे base से लगभग दूरी लिखें।")}
              <input type="number" step="0.01" name="distance_from_base_km">
            </label>
            <label>Base reference {hint("Example: Raxaul to Bagaha, Bagaha to Harnatand. / उदाहरण: Raxaul to Bagaha, Bagaha to Harnatand।")}
              <input type="text" name="base_reference" placeholder="Raxaul to Bagaha">
            </label>
            <label>Address line {hint("Street, road, market, or landmark detail. / street, road, market या landmark की detail लिखें।")}
              <input type="text" name="address_line">
            </label>
          </div>
          <label>Notes {hint("Any useful business note: demand, competition, doctor preference, or follow-up context. / demand, competition, doctor preference या follow-up context जैसी useful notes लिखें।")}
            <textarea name="notes" placeholder="Any route, doctor, or market notes"></textarea>
          </label>
          <button type="submit">Save party</button>
        </form>
      </section>

      <section class="panel">
        <div class="section-head"><h3>Add Product</h3><p>Stores unique master product</p></div>
        <p class="section-tip">Add each product once in the master list. Later you can reuse it in visits, requested items, and orders without duplicate naming.</p>
        <form method="post" action="/admin">
          <input type="hidden" name="action" value="add_product">
          <div class="field-grid">
            <label>SKU {hint("Your internal short code for quick identification, for example IV-SET or COTTON-400GM. / quick पहचान के लिए अपना short code लिखें, जैसे IV-SET या COTTON-400GM।")}
              <input type="text" name="sku">
            </label>
            <label>Product name {hint("Use one clean standard name so all demand and orders map to the same product. / एक standard नाम रखें ताकि सारी demand और orders उसी product पर map हों।")}
              <input type="text" name="product_name" required>
            </label>
            <label>Category {hint("Examples: Gloves, Urology, Infusion, Dressing, Tape. / उदाहरण: Gloves, Urology, Infusion, Dressing, Tape।")}
              <input type="text" name="product_category">
            </label>
            <label>Unit {hint("Examples: piece, box, pack, bottle. / उदाहरण: piece, box, pack, bottle।")}
              <input type="text" name="unit_of_measure" value="piece">
            </label>
            <label>Preferred brand {hint("Brand usually preferred for this product, such as Romson. / इस product के लिए preferred brand, जैसे Romson, लिखें।")}
              <input type="text" name="preferred_brand">
            </label>
            <label>Hindi name {hint("Optional Hindi or local-language item name for easier field use. / field use आसान करने के लिए Hindi या local-language item name लिख सकते हैं।")}
              <input type="text" name="hindi_name">
            </label>
            <label>Alias {hint("Alternate or market name used by buyers for the same product. / उसी product का alternate या market name लिखें जो buyers बोलते हैं।")}
              <input type="text" name="alias_name" placeholder="Optional alternate name">
            </label>
            <label>Sample priority {hint("Mark Yes if this is a product you often carry for sample visits. / अगर यह product आप sample visits में अक्सर ले जाते हैं तो Yes चुनें।")}
              <select name="sample_priority">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>
          <label>Notes {hint("Any quality, specification, packaging, or market note for this item. / इस item की quality, specification, packaging या market note लिखें।")}
            <textarea name="notes"></textarea>
          </label>
          <button type="submit">Save product</button>
        </form>
      </section>
    </div>

    <div class="grid two-col">
      <section class="panel">
        <div class="section-head"><h3>Log Visit</h3><p>Visit entry before product demand</p></div>
        <p class="section-tip">First create the visit, then use the requested-item form to record what the hospital or agency asked for during that visit.</p>
        <form method="post" action="/admin">
          <input type="hidden" name="action" value="add_visit">
          <div class="field-grid">
            <label>Party {hint("Select the hospital or agency you visited. / जिस hospital या agency पर गए थे उसे चुनें।")}
              <select name="party_id" required>
                <option value="">Select party</option>
                {render_select_options(lookups["parties"], "id", "label")}
              </select>
            </label>
            <label>Visit date {hint("Use the actual date of your market or hospital visit. / market या hospital visit की असली तारीख लिखें।")}
              <input type="date" name="visit_date" value="{today}" required>
            </label>
            <label>Visit purpose {hint("Examples: regular_visit, follow_up, sample_drop, collection. / उदाहरण: regular_visit, follow_up, sample_drop, collection।")}
              <input type="text" name="visit_purpose" value="regular_visit">
            </label>
            <label>Visit status {hint("Completed for finished visits, planned for future visits, follow_up for repeat action. / पूरी हुई visit के लिए completed, future के लिए planned, दोबारा action के लिए follow_up चुनें।")}
              <select name="visit_status">
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </label>
            <label>Location snapshot {hint("Useful if the visit location wording is different from the saved city or route. / अगर उस दिन की location wording saved city या route से अलग है तो यह useful है।")}
              <input type="text" name="location_snapshot">
            </label>
            <label>Distance snapshot km {hint("Travel distance noted on that day, if relevant. / उस दिन की noted travel distance लिखें, अगर जरूरी हो।")}
              <input type="number" step="0.01" name="distance_snapshot_km">
            </label>
            <label>Contact snapshot {hint("Number used on the day of visit, if different from saved party phone. / अगर visit वाले दिन का नंबर saved phone से अलग था तो यहाँ लिखें।")}
              <input type="text" name="contact_snapshot">
            </label>
          </div>
          <label>Notes {hint("Discussion summary, next step, sample given, or doctor/staff feedback. / discussion summary, next step, sample given या doctor/staff feedback लिखें।")}
            <textarea name="notes"></textarea>
          </label>
          <button type="submit">Save visit</button>
        </form>
      </section>

      <section class="panel">
        <div class="section-head"><h3>Add Requested Item</h3><p>Attach product demand to an existing visit</p></div>
        <p class="section-tip">This records market demand from a visit. It is separate from confirmed sales orders so your dashboard can compare interest versus actual business.</p>
        <form method="post" action="/admin">
          <input type="hidden" name="action" value="add_visit_item">
          <div class="field-grid">
            <label>Visit {hint("Choose the visit you already created above. / ऊपर जो visit बनाई है उसे चुनें।")}
              <select name="visit_id" required>
                <option value="">Select visit</option>
                {render_select_options(lookups["visits"], "id", "label")}
              </select>
            </label>
            <label>Product {hint("Choose one product from the master list. / master list से एक product चुनें।")}
              <select name="product_id" required>
                <option value="">Select product</option>
                {render_select_options(lookups["products"], "id", "label")}
              </select>
            </label>
            <label>Requirement type {hint("Required means actual demand, recommended sample means item to show, mentioned means discussed only. / Required का मतलब असली demand, recommended sample का मतलब दिखाने वाला item, mentioned का मतलब सिर्फ चर्चा।")}
              <select name="requirement_type">
                <option value="required">Required</option>
                <option value="recommended_sample">Recommended Sample</option>
                <option value="mentioned">Mentioned</option>
              </select>
            </label>
            <label>Quantity estimate {hint("Optional expected quantity from the conversation. / बातचीत के अनुसार expected quantity लिख सकते हैं।")}
              <input type="number" step="0.01" name="quantity_estimate">
            </label>
            <label>Unit {hint("Examples: piece, box, pack. Leave blank if standard unit already fits. / उदाहरण: piece, box, pack। अगर standard unit ठीक है तो खाली छोड़ सकते हैं।")}
              <input type="text" name="unit_of_measure">
            </label>
            <label>Brand preference {hint("Record if buyer asked for a specific brand like Romson. / अगर buyer ने Romson जैसी specific brand मांगी हो तो यहाँ लिखें।")}
              <input type="text" name="brand_preference">
            </label>
          </div>
          <label>Notes {hint("Any field note about usage, urgency, or brand requirement. / usage, urgency या brand requirement से जुड़ी field notes लिखें।")}
            <textarea name="notes"></textarea>
          </label>
          <button type="submit">Save requested item</button>
        </form>
      </section>
    </div>

    <div class="grid">
      <section class="panel">
        <div class="section-head"><h3>Add Order</h3><p>Creates order, line item, and current pricing entry</p></div>
        <p class="section-tip">Use this only for actual confirmed business. Saving an order also updates the current party-wise product pricing used elsewhere in the dashboard.</p>
        <form method="post" action="/admin">
          <input type="hidden" name="action" value="add_order">
          <div class="field-grid-3">
            <label>Party {hint("The buyer placing the order. / जो buyer order दे रहा है उसे चुनें।")}
              <select name="party_id" required>
                <option value="">Select party</option>
                {render_select_options(lookups["parties"], "id", "label")}
              </select>
            </label>
            <label>Product {hint("Currently this quick form adds one line item at a time. / यह quick form अभी एक बार में एक ही line item जोड़ता है।")}
              <select name="product_id" required>
                <option value="">Select product</option>
                {render_select_options(lookups["products"], "id", "label")}
              </select>
            </label>
            <label>Order date {hint("Date on which the buyer confirmed the order. / जिस तारीख को buyer ने order confirm किया वह तारीख लिखें।")}
              <input type="date" name="order_date" value="{today}" required>
            </label>
            <label>Reference number {hint("Your internal order number or buyer reference. / अपना internal order number या buyer reference लिखें।")}
              <input type="text" name="reference_number" placeholder="ORD-1001">
            </label>
            <label>Status {hint("Use confirmed or delivered for real business tracking. / असली business tracking के लिए confirmed या delivered चुनें।")}
              <select name="order_status">
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>Quantity {hint("Ordered quantity for this product line. / इस product line की ordered quantity लिखें।")}
              <input type="number" step="0.01" name="quantity" required>
            </label>
            <label>Unit {hint("Examples: piece, box, pack. / उदाहरण: piece, box, pack।")}
              <input type="text" name="unit_of_measure" value="piece">
            </label>
            <label>Buy rate {hint("Your purchase or inward rate for this item. / इस item का आपका purchase या inward rate लिखें।")}
              <input type="number" step="0.01" name="buy_rate">
            </label>
            <label>Sell rate {hint("Rate at which you sold or quoted this item. / जिस rate पर item बेचा या quote किया वह लिखें।")}
              <input type="number" step="0.01" name="sell_rate">
            </label>
          </div>
          <label>Notes {hint("Any order-specific note, margin issue, or delivery instruction. / order-specific note, margin issue या delivery instruction लिखें।")}
            <textarea name="notes" placeholder="Order note or product-specific note"></textarea>
          </label>
          <button type="submit">Save order</button>
        </form>
        <p class="form-note">This order form writes to `sales_orders`, `sales_order_items`, and `party_product_pricing` together so the dashboard and rate pages stay in sync.</p>
      </section>
    </div>
    """


def insert_or_get_location(city: str, district: str, state: str, distance_from_base_km: Optional[Decimal], base_reference: str, notes: str):
    return run_write(
        """
        INSERT INTO locations (city, district, state, country, distance_from_base_km, base_reference, notes)
        VALUES (%s, %s, %s, 'India', %s, NULLIF(%s, ''), NULLIF(%s, ''))
        ON CONFLICT (city, district, state, country)
        DO UPDATE SET
            distance_from_base_km = COALESCE(EXCLUDED.distance_from_base_km, locations.distance_from_base_km),
            base_reference = COALESCE(EXCLUDED.base_reference, locations.base_reference),
            notes = COALESCE(EXCLUDED.notes, locations.notes)
        RETURNING id
        """,
        (city, district or None, state, distance_from_base_km, base_reference, notes),
        fetchone=True,
    )


def handle_add_party(form: dict[str, list[str]]) -> str:
    party_type = required_text(first_value(form, "party_type"), "Party type")
    name = required_text(first_value(form, "name"), "Name")
    city = required_text(first_value(form, "city"), "City")
    district = first_value(form, "district")
    state = first_value(form, "state") or "Bihar"
    distance_from_base_km = optional_decimal(first_value(form, "distance_from_base_km"), "Distance from base")
    location = insert_or_get_location(
        city=city,
        district=district,
        state=state,
        distance_from_base_km=distance_from_base_km,
        base_reference=first_value(form, "base_reference"),
        notes=first_value(form, "notes"),
    )
    party = run_write(
        """
        INSERT INTO parties (party_type, name, phone, contact_person, location_id, address_line, notes)
        VALUES (%s, %s, NULLIF(%s, ''), NULLIF(%s, ''), %s, NULLIF(%s, ''), NULLIF(%s, ''))
        RETURNING id
        """,
        (
            party_type,
            name,
            first_value(form, "phone"),
            first_value(form, "contact_person"),
            location["id"],
            first_value(form, "address_line"),
            first_value(form, "notes"),
        ),
        fetchone=True,
    )
    return build_redirect(f"/party?id={party['id']}", notice=f"Saved party: {name}")


def handle_edit_party(form: dict[str, list[str]]) -> str:
    party_id = required_text(first_value(form, "party_id"), "Party id")
    party_type = required_text(first_value(form, "party_type"), "Party type")
    name = required_text(first_value(form, "name"), "Name")
    city = required_text(first_value(form, "city"), "City")
    district = first_value(form, "district")
    state = first_value(form, "state") or "Bihar"
    distance_from_base_km = optional_decimal(first_value(form, "distance_from_base_km"), "Distance from base")
    location = insert_or_get_location(
        city=city,
        district=district,
        state=state,
        distance_from_base_km=distance_from_base_km,
        base_reference=first_value(form, "base_reference"),
        notes="",
    )
    run_write(
        """
        UPDATE parties
        SET party_type = %s, name = %s, phone = NULLIF(%s, ''), contact_person = NULLIF(%s, ''),
            location_id = %s, address_line = NULLIF(%s, ''), notes = NULLIF(%s, ''),
            updated_at = NOW()
        WHERE id = %s
        """,
        (
            party_type,
            name,
            first_value(form, "phone"),
            first_value(form, "contact_person"),
            location["id"],
            first_value(form, "address_line"),
            first_value(form, "notes"),
            party_id,
        ),
    )
    return build_redirect(f"/party?id={party_id}", notice=f"Updated party: {name}")


def handle_delete_party(form: dict[str, list[str]]) -> str:
    party_id = required_text(first_value(form, "party_id"), "Party id")
    run_write(
        "UPDATE parties SET is_active = FALSE, updated_at = NOW() WHERE id = %s",
        (party_id,),
    )
    return build_redirect("/parties", notice="Party deactivated. History is preserved.")


def handle_add_product(form: dict[str, list[str]]) -> str:
    product_name = required_text(first_value(form, "product_name"), "Product name")
    product = run_write(
        """
        INSERT INTO products (sku, product_name, product_category, unit_of_measure, preferred_brand, hindi_name, sample_priority, notes)
        VALUES (NULLIF(%s, ''), %s, NULLIF(%s, ''), NULLIF(%s, ''), NULLIF(%s, ''), NULLIF(%s, ''), %s, NULLIF(%s, ''))
        RETURNING id
        """,
        (
            first_value(form, "sku"),
            product_name,
            first_value(form, "product_category"),
            first_value(form, "unit_of_measure") or "piece",
            first_value(form, "preferred_brand"),
            first_value(form, "hindi_name"),
            first_value(form, "sample_priority", "true").lower() == "true",
            first_value(form, "notes"),
        ),
        fetchone=True,
    )
    alias_name = first_value(form, "alias_name")
    if alias_name:
        run_write(
            """
            INSERT INTO product_aliases (product_id, alias_name)
            VALUES (%s, %s)
            ON CONFLICT (alias_name) DO NOTHING
            """,
            (product["id"], alias_name),
        )
    return build_redirect("/products", notice=f"Saved product: {product_name}")


def handle_edit_product(form: dict[str, list[str]]) -> str:
    product_id = required_text(first_value(form, "product_id"), "Product id")
    product_name = required_text(first_value(form, "product_name"), "Product name")
    run_write(
        """
        UPDATE products
        SET sku = NULLIF(%s, ''), product_name = %s, product_category = NULLIF(%s, ''),
            unit_of_measure = %s, preferred_brand = NULLIF(%s, ''), hindi_name = NULLIF(%s, ''),
            sample_priority = %s, notes = NULLIF(%s, ''), updated_at = NOW()
        WHERE id = %s
        """,
        (
            first_value(form, "sku"),
            product_name,
            first_value(form, "product_category"),
            first_value(form, "unit_of_measure") or "piece",
            first_value(form, "preferred_brand"),
            first_value(form, "hindi_name"),
            first_value(form, "sample_priority", "false").lower() == "true",
            first_value(form, "notes"),
            product_id,
        ),
    )
    return build_redirect(f"/edit-product?id={product_id}", notice=f"Updated product: {product_name}")


def handle_delete_product(form: dict[str, list[str]]) -> str:
    product_id = required_text(first_value(form, "product_id"), "Product id")
    run_write(
        "UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = %s",
        (product_id,),
    )
    return build_redirect("/products", notice="Product deactivated. History is preserved.")


def handle_add_product_alias(form: dict[str, list[str]]) -> str:
    product_id = required_text(first_value(form, "product_id"), "Product id")
    alias_name = required_text(first_value(form, "alias_name"), "Alias name")
    run_write(
        "INSERT INTO product_aliases (product_id, alias_name) VALUES (%s, %s) ON CONFLICT (alias_name) DO NOTHING",
        (product_id, alias_name),
    )
    return build_redirect(f"/edit-product?id={product_id}", notice=f"Alias added: {alias_name}")


def handle_delete_product_alias(form: dict[str, list[str]]) -> str:
    alias_id = required_text(first_value(form, "alias_id"), "Alias id")
    product_id = required_text(first_value(form, "product_id"), "Product id")
    run_write("DELETE FROM product_aliases WHERE id = %s", (alias_id,))
    return build_redirect(f"/edit-product?id={product_id}", notice="Alias removed.")


def handle_add_visit(form: dict[str, list[str]]) -> str:
    party_id = required_text(first_value(form, "party_id"), "Party")
    visit = run_write(
        """
        INSERT INTO visits (party_id, visit_date, visit_purpose, visit_status, location_snapshot, distance_snapshot_km, contact_snapshot, notes)
        VALUES (%s, %s, NULLIF(%s, ''), NULLIF(%s, ''), NULLIF(%s, ''), %s, NULLIF(%s, ''), NULLIF(%s, ''))
        RETURNING party_id
        """,
        (
            party_id,
            required_text(first_value(form, "visit_date"), "Visit date"),
            first_value(form, "visit_purpose") or "regular_visit",
            first_value(form, "visit_status") or "completed",
            first_value(form, "location_snapshot"),
            optional_decimal(first_value(form, "distance_snapshot_km"), "Distance snapshot"),
            first_value(form, "contact_snapshot"),
            first_value(form, "notes"),
        ),
        fetchone=True,
    )
    return build_redirect(f"/party?id={visit['party_id']}", notice="Visit saved successfully.")


def handle_edit_visit(form: dict[str, list[str]]) -> str:
    visit_id = required_text(first_value(form, "visit_id"), "Visit id")
    run_write(
        """
        UPDATE visits
        SET visit_date = %s, visit_purpose = %s, visit_status = %s,
            location_snapshot = NULLIF(%s, ''), distance_snapshot_km = %s,
            contact_snapshot = NULLIF(%s, ''), notes = NULLIF(%s, ''),
            updated_at = NOW()
        WHERE id = %s
        """,
        (
            required_text(first_value(form, "visit_date"), "Visit date"),
            first_value(form, "visit_purpose") or "regular_visit",
            first_value(form, "visit_status") or "completed",
            first_value(form, "location_snapshot"),
            optional_decimal(first_value(form, "distance_snapshot_km"), "Distance snapshot"),
            first_value(form, "contact_snapshot"),
            first_value(form, "notes"),
            visit_id,
        ),
    )
    return build_redirect(f"/edit-visit?id={visit_id}", notice="Visit updated successfully.")


def handle_delete_visit(form: dict[str, list[str]]) -> str:
    visit_id = required_text(first_value(form, "visit_id"), "Visit id")
    party_id = first_value(form, "party_id")
    run_write("DELETE FROM visits WHERE id = %s", (visit_id,))
    return build_redirect(f"/party?id={party_id}" if party_id else "/visits", notice="Visit deleted.")


def handle_add_visit_item(form: dict[str, list[str]]) -> str:
    visit_id = required_text(first_value(form, "visit_id"), "Visit")
    product_id = required_text(first_value(form, "product_id"), "Product")
    result = run_write(
        """
        WITH inserted AS (
            INSERT INTO visit_required_items (
                visit_id, product_id, requirement_type, quantity_estimate, unit_of_measure, brand_preference, notes
            )
            VALUES (%s, %s, %s, %s, NULLIF(%s, ''), NULLIF(%s, ''), NULLIF(%s, ''))
            RETURNING visit_id
        )
        SELECT v.party_id
        FROM inserted i
        JOIN visits v ON v.id = i.visit_id
        """,
        (
            visit_id,
            product_id,
            first_value(form, "requirement_type") or "required",
            optional_decimal(first_value(form, "quantity_estimate"), "Quantity estimate"),
            first_value(form, "unit_of_measure"),
            first_value(form, "brand_preference"),
            first_value(form, "notes"),
        ),
        fetchone=True,
    )
    return build_redirect(f"/party?id={result['party_id']}", notice="Requested item saved successfully.")


def handle_edit_visit_item(form: dict[str, list[str]]) -> str:
    item_id = required_text(first_value(form, "item_id"), "Item id")
    visit_id = required_text(first_value(form, "visit_id"), "Visit id")
    run_write(
        """
        UPDATE visit_required_items
        SET requirement_type = %s, quantity_estimate = %s,
            unit_of_measure = NULLIF(%s, ''), brand_preference = NULLIF(%s, ''), notes = NULLIF(%s, '')
        WHERE id = %s
        """,
        (
            first_value(form, "requirement_type") or "required",
            optional_decimal(first_value(form, "quantity_estimate"), "Quantity estimate"),
            first_value(form, "unit_of_measure"),
            first_value(form, "brand_preference"),
            first_value(form, "notes"),
            item_id,
        ),
    )
    return build_redirect(f"/edit-visit?id={visit_id}", notice="Visit item updated.")


def handle_delete_visit_item(form: dict[str, list[str]]) -> str:
    item_id = required_text(first_value(form, "item_id"), "Item id")
    visit_id = required_text(first_value(form, "visit_id"), "Visit id")
    run_write("DELETE FROM visit_required_items WHERE id = %s", (item_id,))
    return build_redirect(f"/edit-visit?id={visit_id}", notice="Visit item removed.")


def handle_add_order(form: dict[str, list[str]]) -> str:
    party_id = required_text(first_value(form, "party_id"), "Party")
    product_id = required_text(first_value(form, "product_id"), "Product")
    quantity = optional_decimal(required_text(first_value(form, "quantity"), "Quantity"), "Quantity")
    if quantity is None or quantity <= 0:
        raise ValueError("Quantity must be greater than zero.")
    buy_rate = optional_decimal(first_value(form, "buy_rate"), "Buy rate")
    sell_rate = optional_decimal(first_value(form, "sell_rate"), "Sell rate")

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO sales_orders (party_id, order_date, order_status, reference_number, notes)
                VALUES (%s, %s, %s, NULLIF(%s, ''), NULLIF(%s, ''))
                RETURNING id, party_id
                """,
                (
                    party_id,
                    required_text(first_value(form, "order_date"), "Order date"),
                    first_value(form, "order_status") or "confirmed",
                    first_value(form, "reference_number"),
                    first_value(form, "notes"),
                ),
            )
            order = dict(cur.fetchone())
            cur.execute(
                """
                INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_of_measure, buy_rate, sell_rate, notes)
                VALUES (%s, %s, %s, NULLIF(%s, ''), %s, %s, NULLIF(%s, ''))
                """,
                (
                    order["id"],
                    product_id,
                    quantity,
                    first_value(form, "unit_of_measure") or "piece",
                    buy_rate,
                    sell_rate,
                    first_value(form, "notes"),
                ),
            )
            cur.execute(
                """
                INSERT INTO party_product_pricing (party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, notes)
                VALUES (%s, %s, %s, %s, 'INR', %s, 'Auto-saved from order entry')
                """,
                (
                    party_id,
                    product_id,
                    buy_rate,
                    sell_rate,
                    required_text(first_value(form, "order_date"), "Order date"),
                ),
            )
    return build_redirect(f"/party?id={party_id}", notice="Order saved successfully.")


def handle_edit_order(form: dict[str, list[str]]) -> str:
    order_id = required_text(first_value(form, "order_id"), "Order id")
    run_write(
        """
        UPDATE sales_orders
        SET order_date = %s, order_status = %s, reference_number = NULLIF(%s, ''),
            notes = NULLIF(%s, ''), updated_at = NOW()
        WHERE id = %s
        """,
        (
            required_text(first_value(form, "order_date"), "Order date"),
            first_value(form, "order_status") or "confirmed",
            first_value(form, "reference_number"),
            first_value(form, "notes"),
            order_id,
        ),
    )
    return build_redirect(f"/edit-order?id={order_id}", notice="Order updated.")


def handle_delete_order(form: dict[str, list[str]]) -> str:
    order_id = required_text(first_value(form, "order_id"), "Order id")
    party_id = first_value(form, "party_id")
    run_write("DELETE FROM sales_orders WHERE id = %s", (order_id,))
    return build_redirect(f"/party?id={party_id}" if party_id else "/orders", notice="Order deleted.")


def handle_edit_order_item(form: dict[str, list[str]]) -> str:
    item_id = required_text(first_value(form, "item_id"), "Item id")
    order_id = required_text(first_value(form, "order_id"), "Order id")
    quantity = optional_decimal(required_text(first_value(form, "quantity"), "Quantity"), "Quantity")
    if quantity is None or quantity <= 0:
        raise ValueError("Quantity must be greater than zero.")
    buy_rate = optional_decimal(first_value(form, "buy_rate"), "Buy rate")
    sell_rate = optional_decimal(first_value(form, "sell_rate"), "Sell rate")

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE sales_order_items
                SET quantity = %s, unit_of_measure = %s, buy_rate = %s, sell_rate = %s, notes = NULLIF(%s, '')
                WHERE id = %s
                RETURNING sales_order_id, product_id
                """,
                (
                    quantity,
                    first_value(form, "unit_of_measure") or "piece",
                    buy_rate,
                    sell_rate,
                    first_value(form, "notes"),
                    item_id,
                ),
            )
            row = dict(cur.fetchone())
            cur.execute(
                """
                SELECT party_id FROM sales_orders WHERE id = %s
                """,
                (row["sales_order_id"],),
            )
            party_row = dict(cur.fetchone())
            cur.execute(
                """
                INSERT INTO party_product_pricing (party_id, product_id, buy_rate, sell_rate, currency_code, effective_from, notes)
                VALUES (%s, %s, %s, %s, 'INR', CURRENT_DATE, 'Auto-updated from order edit')
                """,
                (party_row["party_id"], row["product_id"], buy_rate, sell_rate),
            )
    return build_redirect(f"/edit-order?id={order_id}", notice="Order item updated and pricing refreshed.")


def handle_delete_order_item(form: dict[str, list[str]]) -> str:
    item_id = required_text(first_value(form, "item_id"), "Item id")
    order_id = required_text(first_value(form, "order_id"), "Order id")
    run_write("DELETE FROM sales_order_items WHERE id = %s", (item_id,))
    return build_redirect(f"/edit-order?id={order_id}", notice="Order item removed.")


def handle_admin_post(form: dict[str, list[str]]) -> str:
    action = first_value(form, "action")
    if action == "add_party":
        return handle_add_party(form)
    if action == "add_product":
        return handle_add_product(form)
    if action == "add_visit":
        return handle_add_visit(form)
    if action == "add_visit_item":
        return handle_add_visit_item(form)
    if action == "add_order":
        return handle_add_order(form)
    raise ValueError("Unknown form action.")


def not_found_page() -> str:
    return """
    <section class="hero">
      <h2>Page not found.</h2>
      <p>The route you opened does not exist in this dashboard.</p>
      <div class="tag-row"><a class="tag" href="/">Back to dashboard</a></div>
    </section>
    """


def app(environ, start_response):
    path = environ.get("PATH_INFO", "/")
    method = get_request_method(environ)
    query_params = parse_qs(environ.get("QUERY_STRING", ""))

    try:
        if method == "POST" and path == "/admin":
            form = read_post_data(environ)
            redirect_to = handle_admin_post(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/edit-party":
            form = read_post_data(environ)
            redirect_to = handle_edit_party(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-party":
            form = read_post_data(environ)
            redirect_to = handle_delete_party(form)
            status, headers, body = redirect_response(redirect_to)
        elif path == "/edit-party":
            status, headers, body = html_response(shell("Edit Party", "/parties", edit_party_page(query_params)))
        elif method == "POST" and path == "/edit-product":
            form = read_post_data(environ)
            redirect_to = handle_edit_product(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-product":
            form = read_post_data(environ)
            redirect_to = handle_delete_product(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/add-product-alias":
            form = read_post_data(environ)
            redirect_to = handle_add_product_alias(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-product-alias":
            form = read_post_data(environ)
            redirect_to = handle_delete_product_alias(form)
            status, headers, body = redirect_response(redirect_to)
        elif path == "/edit-product":
            status, headers, body = html_response(shell("Edit Product", "/products", edit_product_page(query_params)))
        elif method == "POST" and path == "/edit-visit":
            form = read_post_data(environ)
            redirect_to = handle_edit_visit(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-visit":
            form = read_post_data(environ)
            redirect_to = handle_delete_visit(form)
            status, headers, body = redirect_response(redirect_to)
        elif path == "/edit-visit":
            status, headers, body = html_response(shell("Edit Visit", "/visits", edit_visit_page(query_params)))
        elif method == "POST" and path == "/edit-visit-item":
            form = read_post_data(environ)
            redirect_to = handle_edit_visit_item(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-visit-item":
            form = read_post_data(environ)
            redirect_to = handle_delete_visit_item(form)
            status, headers, body = redirect_response(redirect_to)
        elif path == "/edit-visit-item":
            status, headers, body = html_response(shell("Edit Visit Item", "/visits", edit_visit_item_page(query_params)))
        elif method == "POST" and path == "/edit-order":
            form = read_post_data(environ)
            redirect_to = handle_edit_order(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-order":
            form = read_post_data(environ)
            redirect_to = handle_delete_order(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/edit-order-item":
            form = read_post_data(environ)
            redirect_to = handle_edit_order_item(form)
            status, headers, body = redirect_response(redirect_to)
        elif method == "POST" and path == "/delete-order-item":
            form = read_post_data(environ)
            redirect_to = handle_delete_order_item(form)
            status, headers, body = redirect_response(redirect_to)
        elif path == "/edit-order":
            status, headers, body = html_response(shell("Edit Order", "/orders", edit_order_page(query_params)))
        elif path == "/edit-order-item":
            status, headers, body = html_response(shell("Edit Order Item", "/orders", edit_order_item_page(query_params)))
        elif path == "/":
            status, headers, body = html_response(shell("Dashboard", "/", dashboard_page(query_params)))
        elif path == "/parties":
            status, headers, body = html_response(shell("Parties", "/parties", parties_page(query_params)))
        elif path == "/party":
            status, headers, body = html_response(shell("Party Detail", "/parties", party_detail_page(query_params)))
        elif path == "/products":
            status, headers, body = html_response(shell("Products", "/products", products_page(query_params)))
        elif path == "/visits":
            status, headers, body = html_response(shell("Visits", "/visits", visits_page(query_params)))
        elif path == "/orders":
            status, headers, body = html_response(shell("Orders", "/orders", orders_page(query_params)))
        elif path == "/pricing":
            status, headers, body = html_response(shell("Pricing", "/pricing", pricing_page(query_params)))
        elif path == "/admin":
            status, headers, body = html_response(shell("Data Entry", "/admin", admin_page(query_params)))
        else:
            status, headers, body = html_response(shell("Not Found", "", not_found_page()), status="404 Not Found")
    except ValueError as exc:
        status, headers, body = redirect_response(build_redirect("/admin", error=str(exc)))
    except psycopg2.Error as exc:
        error_html = f"""
        <section class="hero">
          <h2>Database connection problem.</h2>
          <p>The HTML dashboard is ready, but PostgreSQL is not reachable with the current environment settings.</p>
        </section>
        <div class="grid">
          <div class="error-box">
            <strong>Database error:</strong><br>
            {escape(str(exc))}
          </div>
          <div class="panel">
            <div class="section-head"><h3>Expected environment</h3><p>Set these before running the app</p></div>
            <div class="detail-list">
              <div class="detail-item"><small>PGHOST</small>Database host, usually `localhost`</div>
              <div class="detail-item"><small>PGPORT</small>Database port, usually `5432`</div>
              <div class="detail-item"><small>PGDATABASE</small>Default is `medtrust_healthcare`</div>
              <div class="detail-item"><small>PGUSER</small>Database user, often `postgres`</div>
              <div class="detail-item"><small>PGPASSWORD</small>Password for the database user</div>
            </div>
          </div>
        </div>
        """
        status, headers, body = html_response(shell("Database Error", "", error_html), status="500 Internal Server Error")

    start_response(status, headers)
    return body


if __name__ == "__main__":
    host = os.getenv("APP_HOST", "127.0.0.1")
    port = int(os.getenv("APP_PORT", "8000"))
    with make_server(host, port, app) as httpd:
        print(f"Serving {APP_TITLE} dashboard on http://{host}:{port}")
        httpd.serve_forever()
