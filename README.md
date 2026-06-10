# MedTrust Healthcare Database Groundwork

This project sets up a PostgreSQL foundation for:

- hospitals, agencies, and other medical buyers
- city and route information
- unique surgical and medical items
- visit-wise required items
- actual item orders with quantity and rates
- dashboard-ready reporting views
- a basic clickable HTML dashboard powered directly by PostgreSQL

## Structure

- `app.py`: lightweight Python dashboard server
- `.env.example`: PostgreSQL and app environment settings
- `sql/schema.sql`: tables, constraints, triggers, and dashboard views
- `sql/seed.sql`: initial Bihar / West Champaran / Raxaul-related sample data
- `sql/dashboard_queries.sql`: starter queries for reporting and dashboard wiring
- `sql/data_entry_templates.sql`: reusable SQL examples for adding new visits, products, and orders

## Data Model

The design keeps these business events separate:

- `visits`: what you saw during regular hospital or agency visits
- `visit_required_items`: what that party said they need or what sample items are relevant
- `sales_orders`: actual ordered items with date and status
- `sales_order_items`: quantity, buy rate, and sell rate for each ordered product
- `party_product_pricing`: latest or historical pricing per buyer and product

This separation is important because a product can be requested in a visit but never converted into a real order.

## Local PostgreSQL Setup

If you already have a running PostgreSQL server:

```sql
CREATE DATABASE medtrust_healthcare;
```

Then load:

```bash
psql -d medtrust_healthcare -f sql/schema.sql
psql -d medtrust_healthcare -f sql/seed.sql
psql -d medtrust_healthcare -f sql/dashboard_queries.sql
```

If your local `postgres` server is not currently working, fix that first. In this environment the PostgreSQL binaries could not be started because of a missing ICU library, so database execution could not be fully validated here.

## Run The Dashboard

Set your environment variables first. Example:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=medtrust_healthcare
export PGUSER=postgres
export PGPASSWORD=your_password
export APP_HOST=127.0.0.1
export APP_PORT=8000
```

Then start the app:

```bash
python3 app.py
```

Open:

```text
http://127.0.0.1:8000
```

## Docker Option

If local Homebrew PostgreSQL is broken, you can use the included Docker setup:

```bash
docker compose up -d
PGPASSWORD=postgres psql -h 127.0.0.1 -p 55432 -U postgres -d medtrust_healthcare -f sql/schema.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 55432 -U postgres -d medtrust_healthcare -f sql/seed.sql
set -a && source .env.dashboard && set +a
python3 app.py
```

## Dashboard Pages

- `/`: main summary dashboard with totals, top demand, product leaders, and daily activity
- `/parties`: hospitals and agencies directory
- `/party?id=<uuid>`: party detail page with visits, requested items, orders, and pricing
- `/products`: unique item master with demand and order value
- `/visits`: visit log
- `/orders`: order book with line values
- `/pricing`: latest product-wise rates by party
- `/admin`: browser forms for adding parties, products, visits, requested items, and orders

## Dashboard-Ready Views

- `dashboard_party_directory`: all hospitals/agencies with location and contact information
- `dashboard_daily_activity`: visits, orders, and active parties by date
- `dashboard_product_demand`: visit demand vs real ordered quantity/value per product
- `dashboard_product_leaders`: leading buyer for each product based on confirmed/delivered orders
- `dashboard_current_pricing`: most recent party-wise buy/sell rate snapshot

## Next Step

After this database groundwork, the next practical layer is:

1. edit and delete screens for correcting old entries
2. stronger authentication before putting this on a public or shared network
3. automated backups once this starts holding real business data
