from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.session import get_db
from app.schemas.schemas import HealthOut

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthOut)
def health(db: Session = Depends(get_db)):
    settings = get_settings()
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    return HealthOut(
        status="ok",
        database=f"{'sqlite' if settings.is_sqlite else 'postgres'} · {db_status}",
        demo_mode=settings.demo_mode,
    )
