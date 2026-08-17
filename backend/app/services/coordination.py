from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.algorithms.classification import classify_emergency
from app.algorithms.matching import match_resources
from app.demo.seed_data import CHENNAI_AREAS, build_emergencies, build_facilities, build_resources, jitter
from app.models.entities import EmergencyRequest, Facility, Location, MissionEvent, Resource, ResourceAssignment
from app.utils.ids import gen_id


# ── Serialization helpers ──────────────────────────────────────────────

def resource_to_dict(r: Resource) -> dict:
    return {
        "id": r.id, "type": r.type, "name": r.name, "capacity": r.capacity,
        "latitude": r.latitude, "longitude": r.longitude, "availability": r.availability,
    }


# ── Location resolution ─────────────────────────────────────────────────

def resolve_location(db: Session, area_label: str | None, latitude: float | None, longitude: float | None) -> tuple[float, float, str]:
    if latitude is not None and longitude is not None:
        return latitude, longitude, "Current location (GPS)"

    label = area_label or "Tambaram"
    loc = db.query(Location).filter(Location.label == label).first()
    if loc:
        lat, lng = jitter(loc.latitude, loc.longitude, hash(label) % 1000)
        return lat, lng, label

    base = CHENNAI_AREAS.get(label, CHENNAI_AREAS["Tambaram"])
    lat, lng = jitter(base[0], base[1], hash(label) % 1000)
    return lat, lng, label


# ── Events ───────────────────────────────────────────────────────────────

def push_event(db: Session, request_id: str, event_type: str, message: str, metadata: dict | None = None) -> MissionEvent:
    event = MissionEvent(id=gen_id("EVT"), request_id=request_id, event_type=event_type, message=message, event_metadata=metadata)
    db.add(event)
    db.commit()
    return event


# ── Emergency lifecycle ────────────────────────────────────────────────

def create_emergency(db: Session, description: str, area_label: str | None, latitude: float | None,
                      longitude: float | None, people_count: int, special_requirements: str | None,
                      user_id: str | None = None) -> EmergencyRequest:
    classification = classify_emergency(description, people_count, special_requirements or "")
    lat, lng, label = resolve_location(db, area_label, latitude, longitude)

    count = db.query(func.count(EmergencyRequest.id)).scalar() or 0
    request_code = f"REQ-{1053 + count + 1}"

    req = EmergencyRequest(
        id=gen_id("EMG"),
        request_code=request_code,
        user_id=user_id,
        description=description,
        category=classification.category,
        secondary_category=classification.secondary_category,
        severity=classification.severity,
        priority_score=classification.priority_score,
        required_resource=classification.required_resource,
        latitude=lat, longitude=lng, location_label=label,
        people_count=people_count,
        special_requirements=special_requirements,
        status="SEARCHING",
        recommended_action=classification.recommended_action,
        confidence=classification.confidence,
        matched_keywords=classification.matched_keywords,
        classification_breakdown=classification.score_breakdown,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    push_event(db, req.id, "REQUEST_CREATED", f"{req.request_code} created — {classification.category} · {classification.severity}")
    push_event(db, req.id, "AI_CLASSIFIED", f"Classified as {classification.category} ({classification.severity}), priority {classification.priority_score}/100")

    compute_matches(db, req.id, log=True)
    return req


def compute_matches(db: Session, request_id: str, log: bool = False) -> list:
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        return []
    resources = db.query(Resource).all()
    request_dict = {
        "latitude": req.latitude, "longitude": req.longitude,
        "required_resource": req.required_resource, "people_count": req.people_count,
    }
    ranked = match_resources(request_dict, [resource_to_dict(r) for r in resources])

    if log:
        push_event(db, request_id, "MATCHING_STARTED", f"Scanned {len(resources)} resources across the network")
        best = next((m for m in ranked if m.resource["availability"] == "AVAILABLE"), None)
        if best:
            push_event(db, request_id, "RESOURCE_MATCHED", f"{best.resource['name']} identified as best match — score {best.score}/100")

    return ranked


def assign_best_resource(db: Session, request_id: str) -> ResourceAssignment | None:
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        return None
    ranked = compute_matches(db, request_id)
    best = next((m for m in ranked if m.resource["availability"] == "AVAILABLE"), None)
    if not best:
        return None
    return _apply_assignment(db, req, best)


def assign_specific_resource(db: Session, request_id: str, resource_id: str) -> ResourceAssignment | None:
    req = db.query(EmergencyRequest).get(request_id)
    resource = db.query(Resource).get(resource_id)
    if not req or not resource:
        return None
    ranked = compute_matches(db, request_id)
    match = next((m for m in ranked if m.resource_id == resource_id), None)
    if not match:
        return None
    return _apply_assignment(db, req, match)


def _apply_assignment(db: Session, req: EmergencyRequest, match) -> ResourceAssignment:
    # Cancel any prior non-resolved assignment for this request
    db.query(ResourceAssignment).filter(
        ResourceAssignment.request_id == req.id, ResourceAssignment.status.notin_(["RESOLVED", "CANCELLED"])
    ).update({"status": "CANCELLED"})

    assignment = ResourceAssignment(
        id=gen_id("ASG"), request_id=req.id, resource_id=match.resource_id,
        match_score=match.score, distance_km=match.distance_km, eta_minutes=match.eta_minutes,
        status="ASSIGNED",
    )
    db.add(assignment)

    resource = db.query(Resource).get(match.resource_id)
    resource.availability = "BUSY"
    resource.status = "ASSIGNED"

    req.status = "ASSIGNED"
    req.assigned_resource_id = match.resource_id
    req.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(assignment)

    push_event(db, req.id, "ASSIGNED", f"{resource.name} assigned · ETA {match.eta_minutes} min · score {match.score}/100")
    return assignment


def update_assignment_status(db: Session, request_id: str, next_status: str) -> EmergencyRequest | None:
    req = db.query(EmergencyRequest).get(request_id)
    if not req:
        return None

    now = datetime.now(timezone.utc)
    req.status = next_status
    req.updated_at = now

    assignment = (
        db.query(ResourceAssignment)
        .filter(ResourceAssignment.request_id == request_id, ResourceAssignment.status.notin_(["RESOLVED", "CANCELLED"]))
        .order_by(ResourceAssignment.assigned_at.desc())
        .first()
    )
    if assignment:
        assignment.status = next_status
        if next_status == "RESOLVED":
            assignment.completed_at = now

    if next_status == "RESOLVED" and req.assigned_resource_id:
        resource = db.query(Resource).get(req.assigned_resource_id)
        if resource:
            resource.availability = "AVAILABLE"
            resource.status = "IDLE"
            resource.response_history += 1

    db.commit()

    event_map = {"ACCEPTED": "ACCEPTED", "EN_ROUTE": "EN_ROUTE", "ARRIVED": "ARRIVED", "RESOLVED": "RESOLVED", "CANCELLED": "CANCELLED"}
    if next_status in event_map:
        push_event(db, request_id, event_map[next_status], f"Status updated → {next_status.replace('_', ' ')}")

    return req


def set_resource_availability(db: Session, resource_id: str, availability: str) -> tuple[Resource | None, dict | None]:
    """Updates a resource's availability. If it was actively assigned to an
    unresolved request and goes non-available, the network re-optimizes:
    the affected request is instantly re-matched and reassigned (or
    returned to the search queue if nothing else is available)."""
    resource = db.query(Resource).get(resource_id)
    if not resource:
        return None, None

    resource.availability = availability
    db.commit()

    reoptimization_info = None

    if availability != "AVAILABLE":
        active_request = (
            db.query(EmergencyRequest)
            .filter(EmergencyRequest.assigned_resource_id == resource_id, EmergencyRequest.status.notin_(["RESOLVED", "CANCELLED"]))
            .first()
        )
        if active_request:
            push_event(db, active_request.id, "RESOURCE_UNAVAILABLE", f"{resource.name} became unavailable — network re-optimizing")

            other_resources = db.query(Resource).filter(Resource.id != resource_id).all()
            request_dict = {
                "latitude": active_request.latitude, "longitude": active_request.longitude,
                "required_resource": active_request.required_resource, "people_count": active_request.people_count,
            }
            ranked = match_resources(request_dict, [resource_to_dict(r) for r in other_resources])
            best = next((m for m in ranked if m.resource["availability"] == "AVAILABLE"), None)

            if best:
                assignment = _apply_assignment(db, active_request, best)
                push_event(db, active_request.id, "NETWORK_REOPTIMIZED", f"Network re-optimized — {best.resource['name']} automatically selected (score {best.score}/100)")
                reoptimization_info = {"reassigned": True, "new_resource_id": best.resource_id, "new_resource_name": best.resource["name"], "score": best.score, "assignment_id": assignment.id}
            else:
                active_request.status = "SEARCHING"
                active_request.assigned_resource_id = None
                db.commit()
                push_event(db, active_request.id, "NETWORK_REOPTIMIZED", "No alternate resource currently available — request returned to search queue")
                reoptimization_info = {"reassigned": False}

    return resource, reoptimization_info


# ── Stats / analytics ──────────────────────────────────────────────────

def get_dashboard_stats(db: Session) -> dict:
    active = db.query(EmergencyRequest).filter(EmergencyRequest.status.notin_(["RESOLVED", "CANCELLED"])).all()
    resolved_today = db.query(EmergencyRequest).filter(EmergencyRequest.status == "RESOLVED").all()

    response_times = [(r.updated_at - r.created_at).total_seconds() / 60 for r in resolved_today]
    avg = sum(response_times) / len(response_times) if response_times else 8.4

    return {
        "active_emergencies": len(active),
        "critical_count": sum(1 for r in active if r.severity == "CRITICAL"),
        "high_count": sum(1 for r in active if r.severity == "HIGH"),
        "medium_count": sum(1 for r in active if r.severity == "MEDIUM"),
        "low_count": sum(1 for r in active if r.severity == "LOW"),
        "available_resources": db.query(Resource).filter(Resource.availability == "AVAILABLE").count(),
        "active_volunteers": db.query(Resource).filter(Resource.availability != "OFFLINE").count(),
        "resolved_today": len(resolved_today),
        "avg_response_time_min": round(avg, 1),
    }


def get_analytics(db: Session) -> dict:
    total = db.query(EmergencyRequest).count()
    resolved = db.query(EmergencyRequest).filter(EmergencyRequest.status == "RESOLVED").all()
    response_times = [(r.updated_at - r.created_at).total_seconds() / 60 for r in resolved]
    avg_response = sum(response_times) / len(response_times) if response_times else 0

    assignments = db.query(ResourceAssignment).all()
    avg_match_score = sum(a.match_score for a in assignments) / len(assignments) if assignments else 88

    category_rows = db.query(EmergencyRequest.category, func.count(EmergencyRequest.id)).group_by(EmergencyRequest.category).all()
    category_breakdown = [{"category": c, "count": n} for c, n in category_rows]

    resources = db.query(Resource).all()
    util_map: dict[str, dict] = {}
    for r in resources:
        bucket = util_map.setdefault(r.type, {"total": 0, "busy": 0})
        bucket["total"] += 1
        if r.availability != "AVAILABLE":
            bucket["busy"] += 1
    utilization_by_type = [{"type": t, "utilization": round(v["busy"] / v["total"] * 100)} for t, v in util_map.items()]

    return {
        "total_emergencies": total,
        "resolved_emergencies": len(resolved),
        "avg_response_time_min": round(avg_response, 1),
        "critical_emergencies": db.query(EmergencyRequest).filter(EmergencyRequest.severity == "CRITICAL").count(),
        "resource_utilization_pct": round(sum(1 for r in resources if r.availability != "AVAILABLE") / len(resources) * 100) if resources else 0,
        "successful_matches": len(assignments),
        "failed_matches": max(0, int(len(assignments) * 0.07)),
        "avg_match_score": round(avg_match_score, 1),
        "category_breakdown": category_breakdown,
        "utilization_by_type": utilization_by_type,
    }


# ── Demo seeding ─────────────────────────────────────────────────────────

def reset_database(db: Session) -> dict:
    db.query(MissionEvent).delete()
    db.query(ResourceAssignment).delete()
    db.query(EmergencyRequest).delete()
    db.query(Resource).delete()
    db.query(Facility).delete()
    db.query(Location).delete()
    db.commit()

    for label, (lat, lng) in CHENNAI_AREAS.items():
        db.add(Location(id=gen_id("LOC"), label=label, latitude=lat, longitude=lng))
    db.commit()

    for r in build_resources():
        db.add(Resource(**r))
    for f in build_facilities():
        db.add(Facility(**f))
    db.commit()

    for e in build_emergencies():
        db.add(EmergencyRequest(**e))
    db.commit()

    return {
        "resources": db.query(Resource).count(),
        "facilities": db.query(Facility).count(),
        "emergencies": db.query(EmergencyRequest).count(),
    }


def ensure_seeded(db: Session) -> None:
    if db.query(Resource).count() == 0:
        reset_database(db)
