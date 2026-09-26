import { useState } from "react";
import { PlusCircle, Truck } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import ResourceCard from "../components/ResourceCard";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import { EmptyState } from "../components/LoadingEmptyError";
import { CHENNAI_AREAS } from "../data/locations";
import type { ResourceType } from "../types";
import { RESOURCE_LABELS } from "../algorithms/classification";

const RESOURCE_TYPES = Object.keys(RESOURCE_LABELS) as ResourceType[];

export default function ProviderDashboard() {
  const { resources, emergencies, assignments, setResourceAvailability, addContributedResource, advanceAssignmentStatus } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ providerName: "", name: "", type: "VEHICLE" as ResourceType, capacity: "", area: "Tambaram" });

  const activeMissions = assignments.filter((a) => !["RESOLVED", "CANCELLED"].includes(a.status));
  const completedMissions = assignments.filter((a) => a.status === "RESOLVED");
  const incomingSearching = emergencies.filter((e) => e.status === "SEARCHING").slice(0, 6);

  function submitResource(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.providerName) return;
    addContributedResource({
      providerName: form.providerName, name: form.name, type: form.type,
      capacity: form.capacity ? Number(form.capacity) : undefined, area: form.area,
    });
    setModalOpen(false);
    setForm({ providerName: "", name: "", type: "VEHICLE", capacity: "", area: "Tambaram" });
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold flex items-center gap-2"><Truck size={20} className="text-signal" /> Provider Dashboard</h1>
          <p className="text-sm text-ink-dim mt-1">Register what you can contribute and manage your active missions.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <PlusCircle size={16} /> What Can I Contribute?
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* resource pool */}
        <div className="lg:col-span-1 space-y-3">
          <span className="eyebrow">Resource Pool ({resources.length})</span>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto console-scroll pr-1">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} onToggle={(status) => setResourceAvailability(r.id, status)} />
            ))}
          </div>
        </div>

        {/* missions + incoming */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="eyebrow">Active Missions ({activeMissions.length})</span>
            <div className="mt-3 space-y-2.5">
              {activeMissions.length === 0 && <div className="glass-panel"><EmptyState title="No active missions" description="Assigned requests will appear here." /></div>}
              {activeMissions.map((a) => {
                const req = emergencies.find((e) => e.id === a.requestId);
                const res = resources.find((r) => r.id === a.resourceId);
                if (!req || !res) return null;
                const nextStatus = { ASSIGNED: "ACCEPTED", ACCEPTED: "EN_ROUTE", EN_ROUTE: "ARRIVED", ARRIVED: "RESOLVED" } as const;
                const next = nextStatus[a.status as keyof typeof nextStatus];
                return (
                  <div key={a.id} className="glass-panel p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-signal">{req.requestCode}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-sm mt-1">{res.name} → {req.locationLabel}</p>
                      <p className="text-xs text-ink-faint font-mono mt-0.5">Match {a.matchScore} · ETA {a.etaMinutes}m · {a.distanceKm.toFixed(1)}km</p>
                    </div>
                    {next && (
                      <button onClick={() => advanceAssignmentStatus(req.id, next)} className="btn-secondary text-xs">
                        Mark {next.replace("_", " ")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <span className="eyebrow">Incoming Requests Needing Resources</span>
            <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
              {incomingSearching.length === 0 && <p className="text-sm text-ink-faint">No unmatched requests right now.</p>}
              {incomingSearching.map((r) => (
                <div key={r.id} className="glass-panel p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-signal">{r.requestCode}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-ink-dim mt-1.5 line-clamp-2">{r.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="eyebrow">Response History ({completedMissions.length} completed)</span>
            <div className="mt-3 space-y-2">
              {completedMissions.length === 0 && <p className="text-sm text-ink-faint">No completed missions yet this session.</p>}
              {completedMissions.map((a) => {
                const req = emergencies.find((e) => e.id === a.requestId);
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b border-panel-border py-2">
                    <span className="font-mono text-ink-dim">{req?.requestCode}</span>
                    <span className="text-ink-faint text-xs">Score {a.matchScore} · Resolved</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="What Can I Contribute?">
        <form onSubmit={submitResource} className="space-y-3.5">
          <div>
            <label className="label-console">Your name</label>
            <input className="input-console" value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} required />
          </div>
          <div>
            <label className="label-console">Resource type</label>
            <select className="input-console" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}>
              {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="label-console">Resource name / description</label>
            <input className="input-console" placeholder="e.g. SUV — 6 seats" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-console">Capacity (optional)</label>
              <input type="number" className="input-console" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div>
              <label className="label-console">Location</label>
              <select className="input-console" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {Object.keys(CHENNAI_AREAS).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Add to Resource Pool</button>
        </form>
      </Modal>
    </AppLayout>
  );
}
