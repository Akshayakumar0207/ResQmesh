import { useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import ResourceCard from "../components/ResourceCard";
import MapView from "../components/MapView";
import { RESOURCE_LABELS } from "../algorithms/classification";
import type { ResourceType } from "../types";

export default function ResourcesPage() {
  const { resources, facilities, setResourceAvailability } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<ResourceType | "ALL">("ALL");
  const [availFilter, setAvailFilter] = useState<"ALL" | "AVAILABLE" | "BUSY" | "OFFLINE">("ALL");

  const filtered = useMemo(
    () => resources.filter((r) => (typeFilter === "ALL" || r.type === typeFilter) && (availFilter === "ALL" || r.availability === availFilter)),
    [resources, typeFilter, availFilter],
  );

  return (
    <AppLayout>
      <h1 className="font-display text-xl font-semibold mb-1">Resource Network</h1>
      <p className="text-sm text-ink-dim mb-5">Every registered volunteer, vehicle, skill, and supply currently in the mesh.</p>

      <div className="mb-4">
        <MapView resources={filtered} facilities={facilities} height={340} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input-console !w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ResourceType | "ALL")}>
          <option value="ALL">All types</option>
          {(Object.keys(RESOURCE_LABELS) as ResourceType[]).map((t) => <option key={t} value={t}>{RESOURCE_LABELS[t]}</option>)}
        </select>
        <div className="flex gap-1.5">
          {(["ALL", "AVAILABLE", "BUSY", "OFFLINE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setAvailFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border ${availFilter === s ? "bg-signal/15 border-signal/40 text-signal" : "border-panel-border text-ink-dim"}`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-ink-faint self-center font-mono">{filtered.length} resources</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((r) => (
          <ResourceCard key={r.id} resource={r} onToggle={(status) => setResourceAvailability(r.id, status)} />
        ))}
      </div>
    </AppLayout>
  );
}
