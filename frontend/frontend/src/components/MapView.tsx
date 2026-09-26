import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import type { EmergencyRequest, Facility, Resource } from "../types";
import { CHENNAI_CENTER } from "../data/locations";
import { CATEGORY_LABELS, RESOURCE_LABELS } from "../algorithms/classification";

// ── Tile provider ────────────────────────────────────────────────────────
// CARTO's dark_all basemap now requires a free API key (as of Sep 2026) —
// without one, every tile renders with an "API KEY REQUIRED" watermark
// instead of the actual map. Get a free key in ~1 minute, no approval
// queue, at https://carto.com/basemaps/apikey/ and set it as
// VITE_CARTO_API_KEY (see frontend/.env.example).
//
// If no key is configured, we fall back to the always-free, no-signup
// OpenStreetMap standard tiles and apply a CSS filter (see
// .map-fallback-dark in styles/index.css) to approximate the dark theme
// so the map still fits the rest of the UI without requiring any setup.
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY as string | undefined;
const hasCartoKey = Boolean(CARTO_API_KEY);

const TILE_URL = hasCartoKey
  ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION = hasCartoKey
  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function dotIcon(color: string, pulse = false) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:16px;height:16px;">
      ${pulse ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:0.35;animation:mapPing 1.8s ease-out infinite;"></span>` : ""}
      <span style="position:absolute;inset:0;border-radius:9999px;background:${color};border:2px solid #070B12;box-shadow:0 0 6px ${color};"></span>
    </div>
    <style>@keyframes mapPing{0%{transform:scale(0.6);opacity:0.8}100%{transform:scale(2.2);opacity:0}}</style>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const ICONS = {
  emergency: dotIcon("#FF3B4E", true),
  emergencyCritical: dotIcon("#FF3B4E", true),
  resource: dotIcon("#22C55E"),
  assigned: dotIcon("#FFC93D"),
  hospital: dotIcon("#3B82F6"),
};

export default function MapView({
  emergencies = [], resources = [], facilities = [], height = 420, onSelectEmergency, onSelectResource,
}: {
  emergencies?: EmergencyRequest[];
  resources?: Resource[];
  facilities?: Facility[];
  height?: number;
  onSelectEmergency?: (id: string) => void;
  onSelectResource?: (id: string) => void;
}) {
  return (
    <div style={{ height }} className={`rounded-xl overflow-hidden border border-panel-border relative z-0 ${hasCartoKey ? "" : "map-fallback-dark"}`}>
      <MapContainer center={[CHENNAI_CENTER.lat, CHENNAI_CENTER.lng]} zoom={12} style={{ height: "100%", width: "100%", background: "#0A1019" }}>
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
        />

        {emergencies.map((e) => (
          <Marker
            key={e.id}
            position={[e.location.lat, e.location.lng]}
            icon={e.severity === "CRITICAL" ? ICONS.emergencyCritical : ICONS.emergency}
            eventHandlers={{ click: () => onSelectEmergency?.(e.id) }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold">{e.requestCode}</span>
                </div>
                <p className="text-xs">{e.description.slice(0, 90)}{e.description.length > 90 ? "…" : ""}</p>
                <p className="text-xs text-gray-500">{CATEGORY_LABELS[e.category]} · {e.locationLabel}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {resources.map((r) => (
          <Marker
            key={r.id}
            position={[r.location.lat, r.location.lng]}
            icon={r.availability === "AVAILABLE" ? ICONS.resource : r.availability === "BUSY" ? ICONS.assigned : dotIcon("#4C5A70")}
            eventHandlers={{ click: () => onSelectResource?.(r.id) }}
          >
            <Popup>
              <div className="min-w-[160px] space-y-1">
                <p className="text-xs font-semibold">{r.name}</p>
                <p className="text-xs text-gray-500">{RESOURCE_LABELS[r.type]} · {r.locationLabel}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {facilities.map((f) => (
          <CircleMarker
            key={f.id}
            center={[f.location.lat, f.location.lng]}
            radius={7}
            pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="min-w-[160px] space-y-1">
                <p className="text-xs font-semibold">{f.name}</p>
                <p className="text-xs text-gray-500">{f.type.replace("_", " ")} · cap. {f.capacity || "—"}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
