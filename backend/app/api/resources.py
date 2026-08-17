from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Resource
from app.schemas.schemas import AvailabilityUpdate, ResourceCreate, ResourceOut
from app.services import coordination as svc
from app.utils.ids import gen_id

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.post("", response_model=ResourceOut, status_code=201)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db)):
    lat, lng, label = svc.resolve_location(db, payload.area_label, payload.latitude, payload.longitude)
    resource = Resource(
        id=gen_id("RES"), provider_id=gen_id("PRV"), provider_name=payload.provider_name,
        type=payload.type, name=payload.name, capacity=payload.capacity, skills=payload.skills,
        latitude=lat, longitude=lng, location_label=label, availability="AVAILABLE", status="IDLE",
        response_history=0,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.get("", response_model=list[ResourceOut])
def list_resources(
    type: str | None = Query(None),
    availability: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Resource)
    if type:
        q = q.filter(Resource.type == type)
    if availability:
        q = q.filter(Resource.availability == availability)
    return q.order_by(Resource.created_at.desc()).all()


@router.get("/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: str, db: Session = Depends(get_db)):
    resource = db.query(Resource).get(resource_id)
    if not resource:
        raise HTTPException(404, "Resource not found")
    return resource


@router.patch("/{resource_id}/availability", response_model=ResourceOut)
def update_availability(resource_id: str, payload: AvailabilityUpdate, db: Session = Depends(get_db)):
    resource, _reopt = svc.set_resource_availability(db, resource_id, payload.availability)
    if not resource:
        raise HTTPException(404, "Resource not found")
    return resource
