from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.algorithms.classification import classify_emergency
from app.database.session import get_db
from app.models.entities import EmergencyRequest
from app.schemas.schemas import ClassifyRequest, EmergencyCreate, EmergencyOut, MatchOut, MatchReasonOut
from app.services import coordination as svc
from app.services.broadcast import manager
from app.api.notifications import persist_broadcast_notification

router = APIRouter(prefix="/api/emergencies", tags=["emergencies"])


@router.post("", response_model=EmergencyOut, status_code=201)
async def create_emergency(payload: EmergencyCreate, db: Session = Depends(get_db)):
    req = svc.create_emergency(
        db, payload.description, payload.area_label, payload.latitude, payload.longitude,
        payload.people_count, payload.special_requirements, payload.user_id,
    )

    # Social-feed broadcast: every connected user is pushed this the moment
    # it's posted, the same way a social app pushes a new post to a feed.
    title = f"{req.severity} · {req.category.title()} emergency reported"
    body = f"{req.request_code} — {req.description[:120]}"
    persist_broadcast_notification(db, title, body, request_id=req.id)
    await manager.broadcast({
        "type": "new_emergency",
        "id": req.id,
        "request_code": req.request_code,
        "category": req.category,
        "severity": req.severity,
        "priority_score": req.priority_score,
        "location_label": req.location_label,
        "description": req.description[:200],
    })

    return req


@router.get("", response_model=list[EmergencyOut])
def list_emergencies(
    status: str | None = Query(None),
    severity: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(EmergencyRequest)
    if status:
        q = q.filter(EmergencyRequest.status == status)
    if severity:
        q = q.filter(EmergencyRequest.severity == severity)
    if category:
        q = q.filter(EmergencyRequest.category == category)
    return q.order_by(EmergencyRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=EmergencyOut)
def get_emergency(request_id: str, db: Session = Depends(get_db)):
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        raise HTTPException(404, "Emergency request not found")
    return req


@router.post("/{request_id}/classify", response_model=EmergencyOut)
def reclassify_emergency(request_id: str, payload: ClassifyRequest, db: Session = Depends(get_db)):
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        raise HTTPException(404, "Emergency request not found")

    classification = classify_emergency(payload.description, payload.people_count, payload.special_requirements or "")
    req.description = payload.description
    req.category = classification.category
    req.secondary_category = classification.secondary_category
    req.severity = classification.severity
    req.priority_score = classification.priority_score
    req.required_resource = classification.required_resource
    req.recommended_action = classification.recommended_action
    req.confidence = classification.confidence
    req.matched_keywords = classification.matched_keywords
    req.classification_breakdown = classification.score_breakdown
    db.commit()
    db.refresh(req)
    svc.push_event(db, req.id, "AI_CLASSIFIED", f"Re-classified as {classification.category} ({classification.severity})")
    return req


def _match_to_out(m) -> MatchOut:
    return MatchOut(
        resource_id=m.resource_id,
        resource_name=m.resource["name"],
        resource_type=m.resource["type"],
        score=m.score,
        breakdown=m.breakdown,
        distance_km=m.distance_km,
        eta_minutes=m.eta_minutes,
        reasons=[MatchReasonOut(**r) for r in m.reasons],
        rank=m.rank,
    )


@router.post("/{request_id}/match", response_model=list[MatchOut])
def compute_matches(request_id: str, db: Session = Depends(get_db)):
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        raise HTTPException(404, "Emergency request not found")
    ranked = svc.compute_matches(db, request_id, log=True)
    return [_match_to_out(m) for m in ranked]


@router.get("/{request_id}/matches", response_model=list[MatchOut])
def get_matches(request_id: str, limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        raise HTTPException(404, "Emergency request not found")
    ranked = svc.compute_matches(db, request_id, log=False)
    return [_match_to_out(m) for m in ranked[:limit]]
