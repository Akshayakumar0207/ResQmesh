from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ── Emergencies ─────────────────────────────────────────────────────────

class EmergencyCreate(BaseModel):
    description: str = Field(..., min_length=3, max_length=2000)
    area_label: Optional[str] = Field(None, description="Named area, e.g. 'Tambaram' — resolved via /locations if latitude/longitude aren't given")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    people_count: int = Field(1, ge=1, le=500)
    special_requirements: Optional[str] = Field(None, max_length=1000)
    vulnerable_flags: Optional[list[str]] = Field(
        None, description="e.g. ELDERLY, DISABLED, CHILD_OR_INFANT, PREGNANT, ALONE_NO_CAREGIVER"
    )
    user_id: Optional[str] = None

    @field_validator("description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("description cannot be blank")
        return v.strip()


class EmergencyOut(BaseModel):
    id: str
    request_code: str
    description: str
    category: str
    secondary_category: Optional[str] = None
    severity: str
    priority_score: int
    required_resource: list[str]
    latitude: float
    longitude: float
    location_label: str
    people_count: int
    special_requirements: Optional[str] = None
    vulnerable_flags: Optional[list[str]] = None
    status: str
    assigned_resource_id: Optional[str] = None
    recommended_action: Optional[str] = None
    confidence: Optional[float] = None
    matched_keywords: Optional[list[str]] = None
    classification_breakdown: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClassifyRequest(BaseModel):
    description: str
    people_count: int = 1
    special_requirements: Optional[str] = None
    vulnerable_flags: Optional[list[str]] = None


class MatchReasonOut(BaseModel):
    label: str
    passed: bool


class MatchOut(BaseModel):
    resource_id: str
    resource_name: str
    resource_type: str
    score: int
    breakdown: dict
    distance_km: float
    eta_minutes: int
    reasons: list[MatchReasonOut]
    rank: int


# ── Resources ───────────────────────────────────────────────────────────

class ResourceCreate(BaseModel):
    provider_name: str = Field(..., min_length=1, max_length=200)
    type: str
    name: str = Field(..., min_length=1, max_length=200)
    capacity: Optional[int] = Field(None, ge=0)
    skills: Optional[list[str]] = None
    area_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ResourceOut(BaseModel):
    id: str
    provider_id: str
    provider_name: str
    type: str
    name: str
    capacity: Optional[int] = None
    skills: Optional[list[str]] = None
    latitude: float
    longitude: float
    location_label: str
    availability: str
    status: str
    response_history: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AvailabilityUpdate(BaseModel):
    availability: str = Field(..., pattern="^(AVAILABLE|BUSY|OFFLINE)$")


# ── Assignments ─────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    request_id: str
    resource_id: Optional[str] = Field(None, description="If omitted, the best-scoring available resource is auto-selected")


class AssignmentOut(BaseModel):
    id: str
    request_id: str
    resource_id: str
    match_score: int
    distance_km: float
    eta_minutes: int
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AssignmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ASSIGNED|ACCEPTED|EN_ROUTE|ARRIVED|RESOLVED|CANCELLED)$")


# ── Facilities ──────────────────────────────────────────────────────────

class FacilityOut(BaseModel):
    id: str
    name: str
    type: str
    latitude: float
    longitude: float
    location_label: str
    capacity: int
    availability: str
    contact: Optional[str] = None
    services: Optional[list[str]] = None

    model_config = {"from_attributes": True}


# ── Mission events ──────────────────────────────────────────────────────

class MissionEventOut(BaseModel):
    id: str
    request_id: str
    event_type: str
    message: str
    event_metadata: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Notifications ───────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    title: str
    body: Optional[str] = None
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard / analytics ──────────────────────────────────────────────

class DashboardStats(BaseModel):
    active_emergencies: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    available_resources: int
    active_volunteers: int
    resolved_today: int
    avg_response_time_min: float


class AnalyticsOut(BaseModel):
    total_emergencies: int
    resolved_emergencies: int
    avg_response_time_min: float
    critical_emergencies: int
    resource_utilization_pct: float
    successful_matches: int
    failed_matches: int
    avg_match_score: float
    category_breakdown: list[dict]
    utilization_by_type: list[dict]


class HealthOut(BaseModel):
    status: str
    database: str
    demo_mode: bool
