import { MapPin, Users, Clock, HeartHandshake } from "lucide-react";
import type { EmergencyRequest } from "../types";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { CATEGORY_LABELS } from "../algorithms/classification";
import { timeAgo } from "../utils/format";

export default function EmergencyCard({
  request, onClick, selected,
}: {
  request: EmergencyRequest;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left glass-panel p-3.5 transition-all hover:border-signal/40 ${selected ? "border-signal shadow-glow" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-signal">{request.requestCode}</span>
          <PriorityBadge severity={request.severity} />
        </div>
        <StatusBadge status={request.status} />
      </div>
      <p className="mt-2 text-sm text-ink leading-snug line-clamp-2">{request.description}</p>
      {request.vulnerableFlags && request.vulnerableFlags.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-signal">
          <HeartHandshake size={12} />
          <span>{request.vulnerableFlags.length} vulnerability flag{request.vulnerableFlags.length > 1 ? "s" : ""} noted</span>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-dim">
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} /> {request.locationLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users size={12} /> {request.peopleCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {timeAgo(request.createdAt)}
        </span>
        <span className="ml-auto font-mono text-signal/80">{CATEGORY_LABELS[request.category]}</span>
      </div>
    </button>
  );
}
