from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON, Text,
)
from sqlalchemy.orm import relationship

from app.database.session import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Location(Base):
    """Named reference locations (e.g. Chennai localities) used to resolve
    an area label to coordinates when a precise GPS point isn't supplied."""
    __tablename__ = "locations"

    id = Column(String, primary_key=True)
    label = Column(String, unique=True, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=True)  # null for Google-only accounts
    google_sub = Column(String, unique=True, nullable=True, index=True)
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # REQUESTER | VOLUNTEER | PROVIDER | ADMIN
    created_at = Column(DateTime(timezone=True), default=now_utc)


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True)
    provider_id = Column(String, nullable=False)
    provider_name = Column(String, nullable=False)  # display name only — no PII
    type = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=True)
    skills = Column(JSON, nullable=True)  # list[str]
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_label = Column(String, nullable=False)
    availability = Column(String, nullable=False, default="AVAILABLE", index=True)  # AVAILABLE | BUSY | OFFLINE
    status = Column(String, nullable=False, default="IDLE")  # IDLE | ASSIGNED | EN_ROUTE | ON_MISSION
    response_history = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    assignments = relationship("ResourceAssignment", back_populates="resource")


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(String, primary_key=True)
    request_code = Column(String, unique=True, nullable=False, index=True)  # REQ-1042
    user_id = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)
    secondary_category = Column(String, nullable=True)
    severity = Column(String, nullable=False, index=True)  # CRITICAL | HIGH | MEDIUM | LOW
    priority_score = Column(Integer, nullable=False)
    required_resource = Column(JSON, nullable=False)  # list[str]
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_label = Column(String, nullable=False)
    people_count = Column(Integer, default=1)
    special_requirements = Column(Text, nullable=True)
    vulnerable_flags = Column(JSON, nullable=True)  # list[str], e.g. ["ELDERLY", "DISABLED"]
    status = Column(String, nullable=False, default="SEARCHING", index=True)
    assigned_resource_id = Column(String, ForeignKey("resources.id"), nullable=True)
    classification_breakdown = Column(JSON, nullable=True)  # explainable score components
    matched_keywords = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    assignments = relationship("ResourceAssignment", back_populates="request")
    events = relationship("MissionEvent", back_populates="request")


class ResourceAssignment(Base):
    __tablename__ = "resource_assignments"

    id = Column(String, primary_key=True)
    request_id = Column(String, ForeignKey("emergency_requests.id"), nullable=False, index=True)
    resource_id = Column(String, ForeignKey("resources.id"), nullable=False, index=True)
    match_score = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    eta_minutes = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="ASSIGNED")
    assigned_at = Column(DateTime(timezone=True), default=now_utc)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    request = relationship("EmergencyRequest", back_populates="assignments")
    resource = relationship("Resource", back_populates="assignments")


class Facility(Base):
    """Hospitals, shelters, pharmacies, food/water centers — demo/reference data."""
    __tablename__ = "facilities"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, index=True)  # HOSPITAL | SHELTER | PHARMACY | FOOD_CENTER | WATER_CENTER
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_label = Column(String, nullable=False)
    capacity = Column(Integer, default=0)
    availability = Column(String, default="AVAILABLE")  # AVAILABLE | LIMITED | FULL
    contact = Column(String, nullable=True)
    services = Column(JSON, nullable=True)  # list[str]


class MissionEvent(Base):
    __tablename__ = "mission_events"

    id = Column(String, primary_key=True)
    request_id = Column(String, ForeignKey("emergency_requests.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    event_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    request = relationship("EmergencyRequest", back_populates="events")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    request_id = Column(String, ForeignKey("emergency_requests.id"), nullable=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class AnalyticsSnapshot(Base):
    """Optional periodic rollup table — the /api/analytics endpoint computes live by default,
    this table exists for future scheduled snapshots at scale."""
    __tablename__ = "analytics"

    id = Column(String, primary_key=True)
    snapshot_date = Column(DateTime(timezone=True), default=now_utc)
    total_emergencies = Column(Integer, default=0)
    resolved_emergencies = Column(Integer, default=0)
    avg_response_time_min = Column(Float, default=0)
    successful_matches = Column(Integer, default=0)
    failed_matches = Column(Integer, default=0)
    avg_match_score = Column(Float, default=0)
