from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Facility, MissionEvent
from app.schemas.schemas import FacilityOut, MissionEventOut

router = APIRouter(prefix="/api", tags=["facilities"])


@router.get("/facilities", response_model=list[FacilityOut])
def list_facilities(db: Session = Depends(get_db)):
    return db.query(Facility).all()


@router.get("/emergencies/{request_id}/events", response_model=list[MissionEventOut])
def get_events(request_id: str, db: Session = Depends(get_db)):
    return (
        db.query(MissionEvent)
        .filter(MissionEvent.request_id == request_id)
        .order_by(MissionEvent.created_at.asc())
        .all()
    )
