import type { MissionEvent } from "../types";
import { timeAgo } from "../utils/format";

const EVENT_ICON: Record<MissionEvent["eventType"], string> = {
  REQUEST_CREATED: "●", AI_CLASSIFIED: "◆", MATCHING_STARTED: "◇", RESOURCE_MATCHED: "★",
  ASSIGNED: "▶", ACCEPTED: "✓", EN_ROUTE: "→", ARRIVED: "◉", RESOLVED: "✔",
  RESOURCE_UNAVAILABLE: "✕", NETWORK_REOPTIMIZED: "⟲", CANCELLED: "✕",
};

export default function Timeline({ events }: { events: MissionEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-faint py-6 text-center">No mission events yet.</p>;
  }
  return (
    <ol className="relative border-l border-panel-border ml-2">
      {events.map((e) => {
        const isReoptimize = e.eventType === "NETWORK_REOPTIMIZED";
        const isWarning = e.eventType === "RESOURCE_UNAVAILABLE";
        return (
          <li key={e.id} className="mb-4 ml-4 animate-rise-in">
            <span
              className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                isReoptimize ? "bg-signal text-abyss" : isWarning ? "bg-severity-critical text-white" : "bg-panel-border text-ink-dim"
              }`}
            >
              {EVENT_ICON[e.eventType]}
            </span>
            <p className={`text-sm ${isReoptimize ? "text-signal font-medium" : isWarning ? "text-severity-critical" : "text-ink"}`}>{e.message}</p>
            <span className="text-xs text-ink-faint font-mono">{timeAgo(e.timestamp)}</span>
          </li>
        );
      })}
    </ol>
  );
}
