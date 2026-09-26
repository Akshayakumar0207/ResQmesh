"""
RESOURCE MATCHING ALGORITHM
────────────────────────────
MATCH SCORE = 35% urgency compatibility + 25% distance + 20% resource
compatibility + 10% availability + 10% ETA. Mirrors frontend matching.ts
exactly so both layers produce identical rankings for identical inputs.
"""

from dataclasses import dataclass, field

from app.algorithms.distance import quick_estimate

MAX_RELEVANT_DISTANCE_KM = 15
MAX_RELEVANT_ETA_MIN = 40

MEDICAL_ADJACENT = {"MEDICAL_SKILL", "FIRST_AID_KIT"}
RESCUE_ADJACENT = {"RESCUE_SKILL", "VEHICLE"}


@dataclass
class MatchResult:
    resource_id: str
    resource: dict
    score: int
    breakdown: dict
    distance_km: float
    eta_minutes: int
    reasons: list[dict] = field(default_factory=list)
    rank: int = 0


def _score_urgency_compatibility(required_resource: list[str], resource_type: str) -> int:
    if resource_type in required_resource:
        return 100
    req_set = set(required_resource)
    if req_set & MEDICAL_ADJACENT and resource_type in MEDICAL_ADJACENT:
        return 70
    if req_set & RESCUE_ADJACENT and resource_type in RESCUE_ADJACENT:
        return 65
    return 20


def _score_distance(distance_km: float) -> int:
    clamped = min(distance_km, MAX_RELEVANT_DISTANCE_KM)
    return round(100 - (clamped / MAX_RELEVANT_DISTANCE_KM) * 100)


def _score_resource_compatibility(required_resource: list[str], resource_type: str, capacity, people_count: int) -> int:
    score = 80 if resource_type in required_resource else 40
    if capacity is not None:
        score += 20 if capacity >= people_count else -15
    return max(0, min(100, score))


def _score_availability(availability: str) -> int:
    return {"AVAILABLE": 100, "BUSY": 20, "OFFLINE": 0}.get(availability, 0)


def _score_eta(eta_minutes: int) -> int:
    clamped = min(eta_minutes, MAX_RELEVANT_ETA_MIN)
    return round(100 - (clamped / MAX_RELEVANT_ETA_MIN) * 100)


def _build_reasons(required_resource: list[str], resource: dict, distance_km: float, eta_minutes: int, people_count: int, rank: int) -> list[dict]:
    reasons = []
    suitable = resource["type"] in required_resource
    reasons.append({"label": "Suitable resource type" if suitable else "Related resource type", "passed": suitable})
    reasons.append({"label": "Closest available match" if rank == 1 else f"{distance_km:.1f} km away", "passed": rank == 1})
    reasons.append({"label": "Fast ETA" if eta_minutes <= 10 else f"ETA {eta_minutes} min", "passed": eta_minutes <= 10})
    capacity = resource.get("capacity")
    cap_ok = not capacity or capacity >= people_count
    reasons.append({"label": f"Capacity sufficient ({capacity})" if capacity else "No capacity limit", "passed": cap_ok})
    reasons.append({"label": "Currently available" if resource["availability"] == "AVAILABLE" else "Limited availability", "passed": resource["availability"] == "AVAILABLE"})
    return reasons


def match_resources(request: dict, resources: list[dict]) -> list[MatchResult]:
    """
    Ranks every candidate resource against a single emergency request.
    `request` needs: latitude, longitude, required_resource (list[str]), people_count.
    `resources` items need: id, type, name, capacity, latitude, longitude, availability.
    """
    scored: list[MatchResult] = []

    for resource in resources:
        distance_km, eta_minutes = quick_estimate(
            request["latitude"], request["longitude"], resource["latitude"], resource["longitude"]
        )

        urgency_compat = _score_urgency_compatibility(request["required_resource"], resource["type"])
        distance_score = _score_distance(distance_km)
        resource_compat = _score_resource_compatibility(
            request["required_resource"], resource["type"], resource.get("capacity"), request.get("people_count", 1)
        )
        availability_score = _score_availability(resource["availability"])
        eta_score = _score_eta(eta_minutes)

        score = round(
            urgency_compat * 0.35
            + distance_score * 0.25
            + resource_compat * 0.20
            + availability_score * 0.10
            + eta_score * 0.10
        )

        scored.append(
            MatchResult(
                resource_id=resource["id"],
                resource=resource,
                score=score,
                breakdown={
                    "urgencyCompatibility": urgency_compat,
                    "distanceScore": distance_score,
                    "resourceCompatibility": resource_compat,
                    "availabilityScore": availability_score,
                    "etaScore": eta_score,
                },
                distance_km=distance_km,
                eta_minutes=eta_minutes,
            )
        )

    scored.sort(key=lambda m: m.score, reverse=True)
    for i, m in enumerate(scored):
        m.rank = i + 1
        m.reasons = _build_reasons(request["required_resource"], m.resource, m.distance_km, m.eta_minutes, request.get("people_count", 1), m.rank)

    return scored


def top_matches(request: dict, resources: list[dict], limit: int = 5) -> list[MatchResult]:
    ranked = match_resources(request, resources)
    available = [m for m in ranked if m.resource["availability"] != "OFFLINE"]
    return available[:limit]
