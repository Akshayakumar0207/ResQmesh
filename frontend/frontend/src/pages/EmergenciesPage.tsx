import { useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import EmergencyCard from "../components/EmergencyCard";
import Modal from "../components/Modal";
import MatchCard from "../components/MatchCard";
import Timeline from "../components/Timeline";
import { EmptyState } from "../components/LoadingEmptyError";
import type { RequestStatus, Severity } from "../types";

export default function EmergenciesPage() {
  const { emergencies, lastMatches, events } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      emergencies
        .filter((e) => statusFilter === "ALL" || e.status === statusFilter)
        .filter((e) => severityFilter === "ALL" || e.severity === severityFilter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [emergencies, statusFilter, severityFilter],
  );

  const detail = emergencies.find((e) => e.id === detailId);
  const detailMatches = detailId ? (lastMatches[detailId] ?? []).slice(0, 3) : [];
  const detailEvents = detailId ? events.filter((e) => e.requestId === detailId) : [];

  return (
    <AppLayout>
      <h1 className="font-display text-xl font-semibold mb-1">All Emergencies</h1>
      <p className="text-sm text-ink-dim mb-5">Full request log for this session, newest first.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input-console !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "ALL")}>
          <option value="ALL">All statuses</option>
          {["SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "RESOLVED", "CANCELLED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select className="input-console !w-auto" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as Severity | "ALL")}>
          <option value="ALL">All severities</option>
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-auto text-xs text-ink-faint self-center font-mono">{filtered.length} requests</span>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel"><EmptyState title="No emergencies match these filters" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((e) => (
            <EmergencyCard key={e.id} request={e} onClick={() => setDetailId(e.id)} />
          ))}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetailId(null)} title={detail?.requestCode ?? ""} wide>
        {detail && (
          <div className="space-y-5">
            <p className="text-sm text-ink">{detail.description}</p>
            <div>
              <span className="text-xs uppercase tracking-wider text-ink-dim">Top Matches</span>
              <div className="mt-2 space-y-2.5">
                {detailMatches.length === 0 && <p className="text-sm text-ink-faint">No matches computed.</p>}
                {detailMatches.map((m) => <MatchCard key={m.resourceId} match={m} highlight={m.rank === 1} />)}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-ink-dim">Mission Timeline</span>
              <div className="mt-2"><Timeline events={detailEvents} /></div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
