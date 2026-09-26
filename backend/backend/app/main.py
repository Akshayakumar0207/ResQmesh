from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analytics, assignments, auth, dashboard, demo, emergencies, facilities, health, notifications, resources
from app.config import get_settings
from app.database.session import Base, SessionLocal, engine
from app.services.coordination import ensure_seeded

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates tables if they don't exist yet (SQLite local dev, or a fresh
    # Supabase database on first boot). For Supabase, running
    # supabase/schema.sql once is the recommended production path — this
    # is a convenience fallback so the API never fails to start.
    Base.metadata.create_all(bind=engine)

    if settings.demo_mode:
        db = SessionLocal()
        try:
            ensure_seeded(db)
        finally:
            db.close()

    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Emergency Resource Coordination Network — prototype API for LT HackFest 2026.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(emergencies.router)
app.include_router(resources.router)
app.include_router(assignments.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(demo.router)
app.include_router(facilities.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
        "notice": "Prototype for emergency coordination and community resource allocation. In a real emergency, contact official emergency services.",
    }
