from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.demo.seed_data import DEMO_SCENARIOS
from app.services import coordination as svc

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/start")
def start_demo(db: Session = Depends(get_db)):
    from app.models.entities import EmergencyRequest, Facility, Resource

    svc.ensure_seeded(db)
    return {
        "status": "ready",
        "scenarios": DEMO_SCENARIOS,
        "counts": {
            "resources": db.query(Resource).count(),
            "facilities": db.query(Facility).count(),
            "emergencies": db.query(EmergencyRequest).count(),
        },
    }


@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    counts = svc.reset_database(db)
    return {"status": "reset", "counts": counts}


@router.get("/scenarios")
def list_scenarios():
    return DEMO_SCENARIOS
