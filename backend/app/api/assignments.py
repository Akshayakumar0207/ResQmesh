from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import ResourceAssignment
from app.schemas.schemas import AssignmentCreate, AssignmentOut, AssignmentStatusUpdate
from app.services import coordination as svc

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentOut, status_code=201)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db)):
    if payload.resource_id:
        assignment = svc.assign_specific_resource(db, payload.request_id, payload.resource_id)
    else:
        assignment = svc.assign_best_resource(db, payload.request_id)

    if not assignment:
        raise HTTPException(409, "No available resource could be matched for this request right now")
    return assignment


@router.get("", response_model=list[AssignmentOut])
def list_assignments(db: Session = Depends(get_db)):
    return db.query(ResourceAssignment).order_by(ResourceAssignment.assigned_at.desc()).all()


@router.patch("/{request_id}/status", response_model=AssignmentOut)
def update_status(request_id: str, payload: AssignmentStatusUpdate, db: Session = Depends(get_db)):
    """Advances the assignment/request status for the given request.
    Path uses request_id (not assignment id) since the frontend and
    dispatchers reason about requests, and a request has one active
    assignment at a time."""
    req = svc.update_assignment_status(db, request_id, payload.status)
    if not req:
        raise HTTPException(404, "Request not found")
    assignment = (
        db.query(ResourceAssignment)
        .filter(ResourceAssignment.request_id == request_id)
        .order_by(ResourceAssignment.assigned_at.desc())
        .first()
    )
    if not assignment:
        raise HTTPException(404, "No assignment found for this request")
    return assignment
