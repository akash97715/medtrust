from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, execute, scalar
import psycopg2
import psycopg2.errors

router = APIRouter()


class LocationInput(BaseModel):
    city: str
    district: Optional[str] = None
    state: str = "Bihar"
    distance_from_base_km: Optional[float] = None
    base_reference: Optional[str] = None


class PartyCreate(BaseModel):
    party_type: str
    name: str
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    address_line: Optional[str] = None
    notes: Optional[str] = None
    city: str
    district: Optional[str] = None
    state: str = "Bihar"
    distance_from_base_km: Optional[float] = None
    base_reference: Optional[str] = None


class PartyUpdate(BaseModel):
    party_type: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    address_line: Optional[str] = None
    notes: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    distance_from_base_km: Optional[float] = None
    base_reference: Optional[str] = None


def upsert_location(city: str, district: Optional[str], state: str,
                    distance_from_base_km: Optional[float], base_reference: Optional[str]) -> str:
    row = execute(
        """
        INSERT INTO locations (city, district, state, distance_from_base_km, base_reference)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (city, district, state, country) DO UPDATE
          SET distance_from_base_km = EXCLUDED.distance_from_base_km,
              base_reference = EXCLUDED.base_reference,
              updated_at = NOW()
        RETURNING id
        """,
        (city, district, state, distance_from_base_km, base_reference),
        returning=True,
    )
    return str(row["id"])


@router.get("")
def list_parties(type: Optional[str] = None):
    if type and type != "all":
        return query(
            """
            SELECT party_id, party_type, party_name, phone, contact_person,
                   city, district, state, distance_from_base_km, notes
            FROM dashboard_party_directory
            WHERE party_type = %s AND is_active = TRUE
            ORDER BY party_type, party_name
            """,
            (type,),
        )
    return query(
        """
        SELECT party_id, party_type, party_name, phone, contact_person,
               city, district, state, distance_from_base_km, notes
        FROM dashboard_party_directory
        WHERE is_active = TRUE
        ORDER BY party_type, party_name
        """
    )


@router.get("/{party_id}")
def get_party(party_id: str):
    rows = query(
        """
        SELECT party_id, party_type, party_name, phone, contact_person, address_line,
               city, district, state, distance_from_base_km, base_reference, notes
        FROM dashboard_party_directory
        WHERE party_id = %s
        """,
        (party_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Party not found")
    party = rows[0]

    visits = query(
        """
        SELECT id, visit_date, visit_purpose, visit_status, location_snapshot,
               distance_snapshot_km, contact_snapshot, notes
        FROM visits
        WHERE party_id = %s
        ORDER BY visit_date DESC, created_at DESC
        """,
        (party_id,),
    )
    requested = query(
        """
        SELECT vri.id, v.id AS visit_id, v.visit_date, p.product_name, vri.requirement_type,
               vri.quantity_estimate, COALESCE(vri.unit_of_measure, p.unit_of_measure) AS unit_of_measure,
               vri.brand_preference, vri.notes
        FROM visit_required_items vri
        JOIN visits v ON v.id = vri.visit_id
        JOIN products p ON p.id = vri.product_id
        WHERE v.party_id = %s
        ORDER BY v.visit_date DESC, p.product_name
        """,
        (party_id,),
    )
    orders = query(
        """
        SELECT so.id AS order_id, so.order_date, so.reference_number, so.order_status,
               pr.product_name, soi.quantity, soi.unit_of_measure, soi.buy_rate, soi.sell_rate
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        JOIN products pr ON pr.id = soi.product_id
        WHERE so.party_id = %s
        ORDER BY so.order_date DESC, so.reference_number, pr.product_name
        """,
        (party_id,),
    )
    pricing = query(
        """
        SELECT product_name, buy_rate, sell_rate, currency_code, effective_from, effective_to
        FROM dashboard_current_pricing
        WHERE party_id = %s
        ORDER BY product_name
        """,
        (party_id,),
    )

    return {**party, "visits": visits, "requested_items": requested, "orders": orders, "pricing": pricing}


@router.post("", status_code=201)
def create_party(body: PartyCreate):
    location_id = upsert_location(body.city, body.district, body.state,
                                   body.distance_from_base_km, body.base_reference)

    # If a soft-deleted party with this exact name exists, reactivate + update it
    inactive = query(
        "SELECT id FROM parties WHERE name = %s AND is_active = FALSE",
        (body.name,),
    )
    if inactive:
        party_id = str(inactive[0]["id"])
        execute(
            """
            UPDATE parties
            SET is_active = TRUE, party_type = %s, name = %s, phone = %s,
                contact_person = %s, location_id = %s, address_line = %s,
                notes = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (body.party_type, body.name, body.phone or None, body.contact_person or None,
             location_id, body.address_line or None, body.notes or None, party_id),
        )
        return {"id": party_id, "reactivated": True}

    # No soft-deleted record — insert fresh
    try:
        row = execute(
            """
            INSERT INTO parties (party_type, name, phone, contact_person, location_id, address_line, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (body.party_type, body.name, body.phone or None, body.contact_person or None,
             location_id, body.address_line or None, body.notes or None),
            returning=True,
        )
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail=f'A party named "{body.name}" already exists. Please use a different name or restore the existing one.',
        )
    except psycopg2.Error as e:
        raise HTTPException(status_code=422, detail=str(e).splitlines()[0])
    return {"id": str(row["id"])}


@router.patch("/{party_id}")
def update_party(party_id: str, body: PartyUpdate):
    existing = query(
        """
        SELECT p.party_type, p.name, p.phone, p.contact_person, p.address_line, p.notes,
               l.city, l.district, l.state, l.distance_from_base_km, l.base_reference
        FROM parties p LEFT JOIN locations l ON l.id = p.location_id
        WHERE p.id = %s
        """,
        (party_id,),
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Party not found")
    e = existing[0]

    city = body.city or e["city"]
    district = body.district if body.district is not None else e["district"]
    state = body.state or e["state"]
    distance = body.distance_from_base_km if body.distance_from_base_km is not None else e["distance_from_base_km"]
    base_ref = body.base_reference if body.base_reference is not None else e["base_reference"]
    location_id = upsert_location(city, district, state, distance, base_ref)

    execute(
        """
        UPDATE parties
        SET party_type = %s, name = %s, phone = %s, contact_person = %s,
            location_id = %s, address_line = %s, notes = %s, updated_at = NOW()
        WHERE id = %s
        """,
        (
            body.party_type or e["party_type"],
            body.name or e["name"],
            body.phone if body.phone is not None else e["phone"],
            body.contact_person if body.contact_person is not None else e["contact_person"],
            location_id,
            body.address_line if body.address_line is not None else e["address_line"],
            body.notes if body.notes is not None else e["notes"],
            party_id,
        ),
    )
    return {"ok": True}


@router.delete("/{party_id}")
def deactivate_party(party_id: str):
    execute("UPDATE parties SET is_active = FALSE, updated_at = NOW() WHERE id = %s", (party_id,))
    return {"ok": True}
