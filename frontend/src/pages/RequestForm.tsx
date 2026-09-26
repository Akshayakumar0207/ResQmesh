import { useState } from "react";
import { LocateFixed, Send, ArrowRight, CheckCircle2, HeartHandshake } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import { CHENNAI_AREAS } from "../data/locations";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";
import MatchCard from "../components/MatchCard";
import Timeline from "../components/Timeline";
import NetworkVisualization from "../components/NetworkVisualization";
import type { RequestStatus, VulnerabilityFlag } from "../types";
import { CATEGORY_LABELS, VULNERABILITY_FLAG_LABELS } from "../algorithms/classification";
import { EmptyState } from "../components/LoadingEmptyError";

const VULNERABILITY_FLAG_OPTIONS = Object.keys(VULNERABILITY_FLAG_LABELS) as VulnerabilityFlag[];

const STATUS_FLOW: RequestStatus[] = ["SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "RESOLVED"];

const KIND_MAP: Record<string, "vehicle" | "medic" | "hospital" | "shelter" | "pharmacy" | "food" | "water" | "other"> = {
  VEHICLE: "vehicle", TRANSPORT: "vehicle", MEDICAL_SKILL: "medic", FIRST_AID_KIT: "medic",
  RESCUE_SKILL: "vehicle", MEDICINE: "pharmacy", FOOD: "food", WATER: "water",
  SHELTER: "shelter", POWER_BANK: "other", BLOOD: "medic", COMMUNICATION_EQUIPMENT: "other", OTHER: "other",
};

export default function RequestForm() {
  const { createRequest, emergencies, lastMatches, assignBestResource, advanceAssignmentStatus, events } = useAppStore();
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<string>("Tambaram");
  const [useGps, setUseGps] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [selfUrgency, setSelfUrgency] = useState("HIGH");
  const [vulnerableFlags, setVulnerableFlags] = useState<VulnerabilityFlag[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  function toggleVulnerabilityFlag(flag: VulnerabilityFlag) {
    setVulnerableFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  }

  const activeRequest = emergencies.find((e) => e.id === activeRequestId);
  const matches = activeRequestId ? (lastMatches[activeRequestId] ?? []) : [];
  const topAvailable = matches.filter((m) => m.resource.availability === "AVAILABLE").slice(0, 5);
  const requestEvents = activeRequestId ? events.filter((e) => e.requestId === activeRequestId) : [];

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setUseGps(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseGps(true);
      },
      () => setUseGps(false),
      { timeout: 4000 },
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    const req = createRequest({
      description,
      area: useGps ? undefined : area,
      location: useGps && gpsCoords ? gpsCoords : undefined,
      peopleCount,
      specialRequirements: specialRequirements ? `${specialRequirements} (requester-noted urgency: ${selfUrgency})` : `requester-noted urgency: ${selfUrgency}`,
      vulnerableFlags,
    });
    setActiveRequestId(req.id);
  }

  function reset() {
    setActiveRequestId(null);
    setDescription("");
    setSpecialRequirements("");
    setPeopleCount(1);
    setVulnerableFlags([]);
  }

  const currentStepIndex = activeRequest ? STATUS_FLOW.indexOf(activeRequest.status) : -1;

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-[420px_1fr] gap-6">
        {/* FORM */}
        <div className="glass-panel p-5 h-fit">
          <h1 className="font-display text-lg font-semibold mb-1">Request Emergency Help</h1>
          <p className="text-sm text-ink-dim mb-5">Describe what's happening — ResQMesh's engine classifies and matches automatically.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-console">Description</label>
              <textarea
                className="input-console min-h-[100px] resize-none"
                placeholder="e.g. My grandmother is trapped in a flooded house and needs evacuation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-console">Location</label>
              <div className="flex gap-2">
                <select className="input-console" value={area} disabled={useGps} onChange={(e) => setArea(e.target.value)}>
                  {Object.keys(CHENNAI_AREAS).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button type="button" onClick={handleGeolocate} className={`btn-secondary shrink-0 !px-3 ${useGps ? "!border-signal !text-signal" : ""}`} title="Use my current location">
                  <LocateFixed size={16} />
                </button>
              </div>
              {useGps && <p className="text-xs text-signal mt-1.5 font-mono">Using current GPS location</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-console">People affected</label>
                <input type="number" min={1} className="input-console" value={peopleCount} onChange={(e) => setPeopleCount(Number(e.target.value))} />
              </div>
              <div>
                <label className="label-console">Self-assessed urgency</label>
                <select className="input-console" value={selfUrgency} onChange={(e) => setSelfUrgency(e.target.value)}>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-console">Special requirements (optional)</label>
              <input className="input-console" placeholder="e.g. wheelchair access, medication needed" value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)} />
            </div>

            <div>
              <label className="label-console flex items-center gap-1.5">
                <HeartHandshake size={14} className="text-signal" /> Anyone needing extra support? (optional)
              </label>
              <p className="text-xs text-ink-dim mb-2">
                Flag it directly — don't rely on it being mentioned in the description. This raises priority and is visible to responders.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {VULNERABILITY_FLAG_OPTIONS.map((flag) => (
                  <label
                    key={flag}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                      vulnerableFlags.includes(flag)
                        ? "border-signal/60 bg-signal/10 text-signal"
                        : "border-panel-border bg-abyss-light text-ink-dim"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-signal"
                      checked={vulnerableFlags.includes(flag)}
                      onChange={() => toggleVulnerabilityFlag(flag)}
                    />
                    {VULNERABILITY_FLAG_LABELS[flag]}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              <Send size={16} /> Submit Emergency Request
            </button>
            {activeRequestId && (
              <button type="button" onClick={reset} className="btn-secondary w-full text-xs">Start a new request</button>
            )}
          </form>
        </div>

        {/* RESULT */}
        <div className="space-y-5">
          {!activeRequest ? (
            <div className="glass-panel">
              <EmptyState title="No active request" description="Submit the form to see AI classification and live resource matching in action." />
            </div>
          ) : (
            <>
              <div className="glass-panel p-5 animate-rise-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="eyebrow">Request Created</span>
                    <p className="font-mono text-2xl font-semibold text-signal mt-1">{activeRequest.requestCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge severity={activeRequest.severity} score={activeRequest.priorityScore} />
                    <StatusBadge status={activeRequest.status} />
                  </div>
                </div>

                {/* status stepper */}
                <div className="mt-5 flex items-center gap-1.5 overflow-x-auto console-scroll pb-1">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className="flex items-center gap-1.5 shrink-0">
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono ${
                        i <= currentStepIndex ? "bg-signal/15 text-signal" : "bg-panel-light text-ink-faint"
                      }`}>
                        {i < currentStepIndex ? <CheckCircle2 size={12} /> : null}
                        {s.replace("_", " ")}
                      </div>
                      {i < STATUS_FLOW.length - 1 && <ArrowRight size={12} className="text-ink-faint shrink-0" />}
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-abyss-light border border-panel-border p-3">
                    <span className="text-xs text-ink-dim block mb-1">Category</span>
                    {CATEGORY_LABELS[activeRequest.category]}{activeRequest.secondaryCategory ? ` + ${CATEGORY_LABELS[activeRequest.secondaryCategory]}` : ""}
                  </div>
                  <div className="rounded-lg bg-abyss-light border border-panel-border p-3">
                    <span className="text-xs text-ink-dim block mb-1">Recommended action</span>
                    <span className="text-xs">{activeRequest.classification?.recommendedAction}</span>
                  </div>
                </div>

                {activeRequest.vulnerableFlags && activeRequest.vulnerableFlags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <HeartHandshake size={13} className="text-signal shrink-0" />
                    {activeRequest.vulnerableFlags.map((f) => (
                      <span key={f} className="rounded-full bg-signal/10 border border-signal/30 text-signal px-2 py-0.5 text-xs">
                        {VULNERABILITY_FLAG_LABELS[f]}
                      </span>
                    ))}
                  </div>
                )}

                {activeRequest.status === "SEARCHING" && (
                  <button onClick={() => assignBestResource(activeRequest.id)} className="btn-primary w-full mt-4">
                    Assign Best Resource
                  </button>
                )}
                {activeRequest.status !== "SEARCHING" && activeRequest.status !== "RESOLVED" && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {STATUS_FLOW.filter((s) => STATUS_FLOW.indexOf(s) === currentStepIndex + 1).map((next) => (
                      <button key={next} onClick={() => advanceAssignmentStatus(activeRequest.id, next)} className="btn-secondary text-xs col-span-2">
                        Mark as {next.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {topAvailable.length > 0 && (
                <div className="glass-panel p-5">
                  <span className="eyebrow">Best Matches Found</span>
                  <div className="mt-4">
                    <NetworkVisualization
                      centerLabel={activeRequest.requestCode}
                      severityCritical={activeRequest.severity === "CRITICAL"}
                      nodes={topAvailable.map((m, i) => ({
                        id: m.resourceId, label: m.resource.name, kind: KIND_MAP[m.resource.type] ?? "other",
                        highlighted: i === 0, score: m.score,
                      }))}
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    {topAvailable.map((m) => <MatchCard key={m.resourceId} match={m} highlight={m.rank === 1} />)}
                  </div>
                </div>
              )}

              <div className="glass-panel p-5">
                <span className="eyebrow">Mission Timeline</span>
                <div className="mt-4">
                  <Timeline events={requestEvents} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
