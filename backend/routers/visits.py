from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import query, execute

router = APIRouter()


class VisitCreate(BaseModel):
    party_id: str
    visit_date: str
    visit_purpose: str = "regular_visit"
    visit_status: str = "completed"
    location_snapshot: Optional[str] = None
    distance_snapshot_km: Optional[float] = None
    contact_snapshot: Optional[str] = None
    notes: Optional[str] = None


class VisitUpdate(BaseModel):
    visit_date: Optional[str] = None
    visit_purpose: Optional[str] = None
    visit_status: Optional[str] = None
    location_snapshot: Optional[str] = None
    distance_snapshot_km: Optional[float] = None
    contact_snapshot: Optional[str] = None
    notes: Optional[str] = None


class VisitItemCreate(BaseModel):
    product_id: str
    requirement_type: str = "required"
    quantity_estimate: Optional[float] = None
    unit_of_measure: Optional[str] = None
    brand_preference: Optional[str] = None
    notes: Optional[str] = None


class VisitItemUpdate(BaseModel):
    requirement_type: Optional[str] = None
    quantity_estimate: Optional[float] = None
    unit_of_measure: Optional[str] = None
    brand_preference: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_visits():
    return query(
        """
        SELECT v.id, v.visit_date, p.id AS party_id, p.name AS party_name, p.party_type,
               v.visit_purpose, v.visit_status, v.location_snapshot,
               v.distance_snapshot_km, v.contact_snapshot, v.notes
        FROM visits v
        JOIN parties p ON p.id = v.party_id
        ORDER BY v.visit_date DESC, p.name
        """
    )


@router.get("/{visit_id}")
def get_visit(visit_id: str):
    rows = query(
        """
        SELECT v.id, v.party_id, p.name AS party_name, v.visit_date, v.visit_purpose,
               v.visit_status, v.location_snapshot, v.distance_snapshot_km, v.contact_snapshot, v.notes
        FROM visits v JOIN parties p ON p.id = v.party_id
        WHERE v.id = %s
        """,
        (visit_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit = rows[0]
    items = query(
        """
        SELECT vri.id, pr.id AS product_id, pr.product_name, vri.requirement_type,
               vri.quantity_estimate, COALESCE(vri.unit_of_measure, pr.unit_of_measure) AS unit_of_measure,
               vri.brand_preference, vri.notes
        FROM visit_required_items vri
        JOIN products pr ON pr.id = vri.product_id
        WHERE vri.visit_id = %s
        ORDER BY pr.product_name
        """,
        (visit_id,),
    )
    return {**visit, "items": items}


@router.post("", status_code=201)
def create_visit(body: VisitCreate):
    row = execute(
        """
        INSERT INTO visits (party_id, visit_date, visit_purpose, visit_status,
                            location_snapshot, distance_snapshot_km, contact_snapshot, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, party_id
        """,
        (body.party_id, body.visit_date, body.visit_purpose, body.visit_status,
         body.location_snapshot or None, body.distance_snapshot_km,
         body.contact_snapshot or None, body.notes or None),
        returning=True,
    )
    return {"id": str(row["id"]), "party_id": str(row["party_id"])}


@router.patch("/{visit_id}")
def update_visit(visit_id: str, body: VisitUpdate):
    rows = query("SELECT * FROM visits WHERE id = %s", (visit_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Visit not found")
    e = rows[0]
    execute(
        """
        UPDATE visits
        SET visit_date = %s, visit_purpose = %s, visit_status = %s,
            location_snapshot = %s, distance_snapshot_km = %s,
            contact_snapshot = %s, notes = %s, updated_at = NOW()
        WHERE id = %s
        """,
        (
            body.visit_date or str(e["visit_date"]),
            body.visit_purpose or e["visit_purpose"],
            body.visit_status or e["visit_status"],
            body.location_snapshot if body.location_snapshot is not None else e["location_snapshot"],
            body.distance_snapshot_km if body.distance_snapshot_km is not None else e["distance_snapshot_km"],
            body.contact_snapshot if body.contact_snapshot is not None else e["contact_snapshot"],
            body.notes if body.notes is not None else e["notes"],
            visit_id,
        ),
    )
    return {"ok": True}


@router.delete("/{visit_id}")
def delete_visit(visit_id: str):
    execute("DELETE FROM visits WHERE id = %s", (visit_id,))
    return {"ok": True}


@router.post("/{visit_id}/items", status_code=201)
def add_visit_item(visit_id: str, body: VisitItemCreate):
    row = execute(
        """
        WITH inserted AS (
            INSERT INTO visit_required_items
                (visit_id, product_id, requirement_type, quantity_estimate, unit_of_measure, brand_preference, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        )
        SELECT id FROM inserted
        """,
        (visit_id, body.product_id, body.requirement_type, body.quantity_estimate,
         body.unit_of_measure or None, body.brand_preference or None, body.notes or None),
        returning=True,
    )
    return {"id": str(row["id"])}


@router.patch("/items/{item_id}")
def update_visit_item(item_id: str, body: VisitItemUpdate):
    rows = query("SELECT * FROM visit_required_items WHERE id = %s", (item_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Visit item not found")
    e = rows[0]
    execute(
        """
        UPDATE visit_required_items
        SET requirement_type = %s, quantity_estimate = %s, unit_of_measure = %s,
            brand_preference = %s, notes = %s
        WHERE id = %s
        """,
        (
            body.requirement_type or e["requirement_type"],
            body.quantity_estimate if body.quantity_estimate is not None else e["quantity_estimate"],
            body.unit_of_measure if body.unit_of_measure is not None else e["unit_of_measure"],
            body.brand_preference if body.brand_preference is not None else e["brand_preference"],
            body.notes if body.notes is not None else e["notes"],
            item_id,
        ),
    )
    return {"ok": True}


@router.delete("/items/{item_id}")
def delete_visit_item(item_id: str):
    execute("DELETE FROM visit_required_items WHERE id = %s", (item_id,))
    return {"ok": True}
