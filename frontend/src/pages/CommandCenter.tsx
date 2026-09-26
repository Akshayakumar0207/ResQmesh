import { useMemo, useState } from "react";
import { Siren, Truck, Users, Clock3, PlayCircle, RotateCcw, Radio } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import StatsCard from "../components/StatsCard";
import MapView from "../components/MapView";
import EmergencyCard from "../components/EmergencyCard";
import MatchCard from "../components/MatchCard";
import Timeline from "../components/Timeline";
import { EmptyState } from "../components/LoadingEmptyError";
import { CATEGORY_LABELS } from "../algorithms/classification";
import type { EmergencyCategory } from "../types";

const FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "MEDICAL", label: "Medical" },
  { key: "FIRE", label: "Fire" },
  { key: "FLOOD", label: "Flood" },
  { key: "EVACUATION", label: "Evacuation" },
  { key: "RESOURCES", label: "Resources" },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function CommandCenter() {
  const store = useAppStore();
  const { emergencies, resources, facilities, events, getStats } = store;
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);

  const stats = getStats();

  const filteredEmergencies = useMemo(() => {
    const active = emergencies.filter((e) => !["RESOLVED", "CANCELLED"].includes(e.status));
    if (filter === "ALL" || filter === "RESOURCES") return active;
    if (filter === "CRITICAL") return active.filter((e) => e.severity === "CRITICAL");
    return active.filter((e) => e.category === (filter as EmergencyCategory));
  }, [emergencies, filter]);

  const showResources = filter === "ALL" || filter === "RESOURCES";
  const selected = emergencies.find((e) => e.id === selectedId);
  const selectedMatches = selectedId ? (store.lastMatches[selectedId] ?? []).slice(0, 3) : [];
  const selectedEvents = selectedId ? events.filter((e) => e.requestId === selectedId) : [];

  async function runSimulation() {
    setSimRunning(true);
    setSimLog([]);
    const log = (msg: string) => setSimLog((l) => [...l, msg]);

    log("🌊 Flood event detected near Chromepet");
    await sleep(900);

    log("📋 Emergency request created");
    const req = store.createRequest({
      description: "Flood water rising fast, child trapped on rooftop, immediate rescue needed.",
      area: "Chromepet", peopleCount: 1, specialRequirements: "Child alone, structure surrounded by water",
    });
    setSelectedId(req.id);
    await sleep(1000);

    log(`🧠 AI classified as ${CATEGORY_LABELS[req.category]} · ${req.severity} (priority ${req.priorityScore})`);
    await sleep(900);

    log(`🔎 ${resources.length} resources scanned across the network`);
    await sleep(900);

    log("🏆 Best matches ranked by score");
    await sleep(900);

    const assignment = store.assignBestResource(req.id);
    if (assignment) log(`✅ ${resources.find((r) => r.id === assignment.resourceId)?.name} assigned`);
    await sleep(1100);

    store.advanceAssignmentStatus(req.id, "ACCEPTED");
    log("🙋 Volunteer accepted the mission");
    await sleep(1000);

    store.advanceAssignmentStatus(req.id, "EN_ROUTE");
    log("🚚 Resource en route to location");
    await sleep(1200);

    if (assignment) {
      log("❌ Assigned resource just went offline");
      await sleep(700);
      store.setResourceAvailability(assignment.resourceId, "OFFLINE");
      log("🧠 Network re-optimized — new resource automatically selected");
    }
    await sleep(600);

    setSimRunning(false);
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold flex items-center gap-2">
            <Radio size={20} className="text-signal" /> RESQMESH EMERGENCY COMMAND CENTER
          </h1>
          <p className="text-sm text-ink-dim mt-1">Live coordination across requests, resources, and facilities. <span className="text-ink-faint font-mono">SIMULATION DATA</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={runSimulation} disabled={simRunning} className="btn-primary">
            <PlayCircle size={16} /> {simRunning ? "Simulation running..." : "Start Emergency Simulation"}
          </button>
          <button onClick={store.resetDemo} className="btn-secondary" title="Reset demo state">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <StatsCard label="Active" value={stats.activeEmergencies} icon={<Siren size={16} />} />
        <StatsCard label="Critical" value={stats.criticalCount} accent="critical" />
        <StatsCard label="High" value={stats.highCount} accent="pulse" />
        <StatsCard label="Med / Low" value={`${stats.mediumCount} / ${stats.lowCount}`} />
        <StatsCard label="Resources" value={stats.availableResources} icon={<Truck size={16} />} accent="low" />
        <StatsCard label="Volunteers" value={stats.activeVolunteers} icon={<Users size={16} />} />
        <StatsCard label="Resolved Today" value={stats.resolvedToday} accent="low" />
        <StatsCard label="Avg Response" value={`${stats.avgResponseTimeMin}m`} icon={<Clock3 size={16} />} />
      </div>

      {simLog.length > 0 && (
        <div className="glass-panel p-4 mb-5 animate-rise-in">
          <span className="eyebrow">Simulation Log</span>
          <div className="mt-2 space-y-1 font-mono text-xs text-ink-dim max-h-28 overflow-y-auto console-scroll">
            {simLog.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-5">
        <div>
          <div className="flex gap-2 mb-3 overflow-x-auto console-scroll pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                  filter === f.key ? "bg-signal/15 border-signal/40 text-signal" : "border-panel-border text-ink-dim hover:border-signal/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <MapView
            emergencies={filteredEmergencies}
            resources={showResources ? resources : []}
            facilities={facilities}
            height={480}
            onSelectEmergency={setSelectedId}
          />
          <div className="flex items-center gap-4 mt-3 text-xs text-ink-dim">
            <Legend color="#FF3B4E" label="Emergency" />
            <Legend color="#22C55E" label="Resource (available)" />
            <Legend color="#FFC93D" label="Resource (assigned)" />
            <Legend color="#3B82F6" label="Hospital / Shelter" />
          </div>
        </div>

        <div className="space-y-3 max-h-[560px] overflow-y-auto console-scroll pr-1">
          <span className="eyebrow">Active Emergencies ({filteredEmergencies.length})</span>
          {filteredEmergencies.length === 0 && <div className="glass-panel"><EmptyState title="No active emergencies match this filter" /></div>}
          {filteredEmergencies
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .map((e) => (
              <EmergencyCard key={e.id} request={e} selected={e.id === selectedId} onClick={() => setSelectedId(e.id)} />
            ))}
        </div>
      </div>

      {selected && (
        <div className="glass-panel p-5 mt-5 animate-rise-in">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">{selected.requestCode} — Detail</span>
            {selected.status === "SEARCHING" && (
              <button onClick={() => store.assignBestResource(selected.id)} className="btn-primary text-sm">Assign Best Resource</button>
            )}
          </div>
          <p className="text-sm text-ink mb-4">{selected.description}</p>
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-ink-dim">Top Matches</span>
              {selectedMatches.length === 0 && <p className="text-sm text-ink-faint">No matches computed.</p>}
              {selectedMatches.map((m) => <MatchCard key={m.resourceId} match={m} highlight={m.rank === 1} />)}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-ink-dim">Mission Timeline</span>
              <div className="mt-3">
                <Timeline events={selectedEvents} />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
