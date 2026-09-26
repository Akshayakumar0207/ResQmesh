import type { GeoPoint } from "../types";

// Approximate real-world coordinates for well-known Chennai localities.
// Used only to give SIMULATION DATA a realistic, checkable geography —
// no live or personal location data is collected or represented.
export const CHENNAI_AREAS: Record<string, GeoPoint> = {
  Tambaram: { lat: 12.9249, lng: 80.1000 },
  Chromepet: { lat: 12.9516, lng: 80.1462 },
  Pallavaram: { lat: 12.9675, lng: 80.1491 },
  Velachery: { lat: 12.9791, lng: 80.2212 },
  Guindy: { lat: 13.0067, lng: 80.2206 },
  Adyar: { lat: 13.0012, lng: 80.2565 },
  "T. Nagar": { lat: 13.0418, lng: 80.2341 },
  Perungudi: { lat: 12.9635, lng: 80.2412 },
  "Anna Nagar": { lat: 13.0850, lng: 80.2101 },
  Porur: { lat: 13.0382, lng: 80.1565 },
  Sholinganallur: { lat: 12.9010, lng: 80.2279 },
  Medavakkam: { lat: 12.9166, lng: 80.1892 },
};

export const CHENNAI_CENTER: GeoPoint = { lat: 12.9750, lng: 80.1850 };

/** Small deterministic jitter so demo markers don't overlap exactly. */
export function jitter(point: GeoPoint, seed: number): GeoPoint {
  const dx = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  const dy = (Math.sin(seed * 78.233) * 12543.1234) % 1;
  return {
    lat: point.lat + dx * 0.012,
    lng: point.lng + dy * 0.012,
  };
}
