"""Distance + ETA engine. Haversine is always available with zero dependencies;
OSRM is attempted opportunistically for a real road route and never blocks
the request beyond a short timeout."""

import math

import httpx

EARTH_RADIUS_KM = 6371
AVG_URBAN_SPEED_KMPH = 28
OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def estimate_eta_minutes(distance_km: float) -> int:
    road_factor = 1.35
    minutes = (distance_km * road_factor) / AVG_URBAN_SPEED_KMPH * 60
    return max(2, round(minutes))


def quick_estimate(lat1: float, lng1: float, lat2: float, lng2: float) -> tuple[float, int]:
    """Synchronous Haversine-based estimate — used for ranking (fast, always available)."""
    distance_km = round(haversine_distance_km(lat1, lng1, lat2, lng2), 1)
    return distance_km, estimate_eta_minutes(distance_km)


async def get_route(lat1: float, lng1: float, lat2: float, lng2: float, timeout_s: float = 2.5) -> dict:
    """Attempts the free public OSRM demo server for a real road route.
    Falls back to Haversine instantly if OSRM is slow/unreachable/rate-limited."""
    url = f"{OSRM_BASE}/{lng1},{lat1};{lng2},{lat2}?overview=false"
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            route = data["routes"][0]
            return {
                "distance_km": round(route["distance"] / 1000, 1),
                "eta_minutes": max(2, round(route["duration"] / 60)),
                "source": "osrm",
            }
    except Exception:
        distance_km, eta_minutes = quick_estimate(lat1, lng1, lat2, lng2)
        return {"distance_km": distance_km, "eta_minutes": eta_minutes, "source": "haversine"}
