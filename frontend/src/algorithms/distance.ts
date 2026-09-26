import type { GeoPoint } from "../types";

const EARTH_RADIUS_KM = 6371;
const AVG_URBAN_SPEED_KMPH = 28; // conservative city-traffic average used for the fallback ETA

/** Great-circle distance between two points, in kilometers. Always available, zero dependencies. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Fallback ETA estimate from straight-line distance and an assumed urban speed, with a road-winding factor. */
export function estimateEtaMinutes(distanceKm: number): number {
  const roadFactor = 1.35; // real roads are rarely straight lines
  const minutes = ((distanceKm * roadFactor) / AVG_URBAN_SPEED_KMPH) * 60;
  return Math.max(2, Math.round(minutes));
}

export interface RouteResult {
  distanceKm: number;
  etaMinutes: number;
  source: "osrm" | "haversine";
  path?: GeoPoint[];
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/**
 * Attempts to use the free public OSRM demo server for a real road route.
 * Falls back to Haversine + assumed speed instantly if OSRM is slow,
 * rate-limited, or unreachable — the app must never block on this.
 */
export async function getRoute(from: GeoPoint, to: GeoPoint, timeoutMs = 2500): Promise<RouteResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("OSRM unavailable");
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error("No route found");
    const path: GeoPoint[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      etaMinutes: Math.max(2, Math.round(route.duration / 60)),
      source: "osrm",
      path,
    };
  } catch {
    const distanceKm = Math.round(haversineDistanceKm(from, to) * 10) / 10;
    return {
      distanceKm,
      etaMinutes: estimateEtaMinutes(distanceKm),
      source: "haversine",
    };
  }
}

/** Synchronous fallback-only version, used where an instant estimate is needed (e.g. ranking lists before routes resolve). */
export function quickEstimate(from: GeoPoint, to: GeoPoint): { distanceKm: number; etaMinutes: number } {
  const distanceKm = Math.round(haversineDistanceKm(from, to) * 10) / 10;
  return { distanceKm, etaMinutes: estimateEtaMinutes(distanceKm) };
}
