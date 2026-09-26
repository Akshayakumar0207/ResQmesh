import { MapPin, Users } from "lucide-react";
import type { Resource } from "../types";
import AvailabilityBadge from "./AvailabilityBadge";
import { RESOURCE_LABELS } from "../algorithms/classification";

export default function ResourceCard({
  resource, onToggle,
}: {
  resource: Resource;
  onToggle?: (status: Resource["availability"]) => void;
}) {
  return (
    <div className="glass-panel p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{resource.name}</p>
          <p className="text-xs text-ink-dim">{resource.providerName} · {RESOURCE_LABELS[resource.type]}</p>
        </div>
        <AvailabilityBadge status={resource.availability} />
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-xs text-ink-dim">
        <span className="inline-flex items-center gap-1"><MapPin size={12} /> {resource.locationLabel}</span>
        {resource.capacity && <span className="inline-flex items-center gap-1"><Users size={12} /> cap. {resource.capacity}</span>}
        <span className="ml-auto font-mono text-ink-faint">{resource.responseHistory} missions</span>
      </div>
      {onToggle && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["AVAILABLE", "BUSY", "OFFLINE"] as const).map((st) => (
            <button
              key={st}
              onClick={() => onToggle(st)}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                resource.availability === st
                  ? "bg-signal text-abyss"
                  : "bg-abyss-light border border-panel-border text-ink-dim hover:border-signal/40"
              }`}
            >
              {st === "AVAILABLE" ? "Available" : st === "BUSY" ? "Busy" : "Offline"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
