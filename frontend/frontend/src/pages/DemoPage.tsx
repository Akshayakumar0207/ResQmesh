import { useState } from "react";
import { PlayCircle, RotateCcw } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import { DEMO_SCENARIOS, SCENARIO_STEP_LABELS, type ScenarioStep } from "../data/scenarios";
import PriorityBadge from "../components/PriorityBadge";
import MatchCard from "../components/MatchCard";
import NetworkVisualization from "../components/NetworkVisualization";
import { CATEGORY_LABELS } from "../algorithms/classification";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const KIND_MAP: Record<string, "vehicle" | "medic" | "hospital" | "shelter" | "pharmacy" | "food" | "water" | "other"> = {
  VEHICLE: "vehicle", TRANSPORT: "vehicle", MEDICAL_SKILL: "medic", FIRST_AID_KIT: "medic",
  RESCUE_SKILL: "vehicle", MEDICINE: "pharmacy", FOOD: "food", WATER: "water",
  SHELTER: "shelter", POWER_BANK: "other", BLOOD: "medic", COMMUNICATION_EQUIPMENT: "other", OTHER: "other",
};

const STEP_ORDER: ScenarioStep[] = ["CREATED", "CLASSIFIED", "MATCHING", "MATCHED", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "RESOLVED"];

export default function DemoPage() {
  const store = useAppStore();
  const [runningId, setRunningId] = useState<string | null>(null);
  const [step, setStep] = useState<ScenarioStep | null>(null);
  const [reqId, setReqId] = useState<string | null>(null);

  const activeRequest = reqId ? store.emergencies.find((e) => e.id === reqId) : null;
  const matches = reqId ? (store.lastMatches[reqId] ?? []).slice(0, 5) : [];
  const events = reqId ? store.events.filter((e) => e.requestId === reqId) : [];

  async function runScenario(scenarioId: string) {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    setRunningId(scenarioId);
    setReqId(null);
    setStep("CREATED");

    const req = store.createRequest(scenario.request);
    setReqId(req.id);
    await sleep(1100);

    setStep("CLASSIFIED");
    await sleep(1100);

    setStep("MATCHING");
    await sleep(1000);

    setStep("MATCHED");
    await sleep(1000);

    const assignment = store.assignBestResource(req.id);
    setStep("ASSIGNED");
    await sleep(1100);

    store.advanceAssignmentStatus(req.id, "ACCEPTED");
    setStep("ACCEPTED");
    await sleep(1000);

    store.advanceAssignmentStatus(req.id, "EN_ROUTE");
    setStep("EN_ROUTE");
    await sleep(1100);

    if (scenario.forceResourceUnavailable && assignment) {
      setStep("UNAVAILABLE");
      await sleep(900);
      store.setResourceAvailability(assignment.resourceId, "OFFLINE");
      setStep("REOPTIMIZED");
      await sleep(1300);
    }

    store.advanceAssignmentStatus(req.id, "RESOLVED");
    setStep("RESOLVED");
    setRunningId(null);
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <h1 className="font-display text-xl font-semibold">Demo Mode</h1>
          <p className="text-sm text-ink-dim mt-1">Three scripted scenarios, run entirely on local data — no external APIs required.</p>
        </div>
        <button onClick={store.resetDemo} className="btn-secondary text-xs"><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-5">
        {DEMO_SCENARIOS.map((s) => (
          <div key={s.id} className="glass-panel p-4 flex flex-col">
            <span className="eyebrow">{s.title}</span>
            <p className="text-sm text-ink-dim mt-2 mb-4 flex-1">{s.tagline}</p>
            <ol className="text-xs text-ink-faint space-y-1 mb-4 font-mono">
              {s.narrative.map((n, i) => <li key={i}>{i + 1}. {n}</li>)}
            </ol>
            <button
              onClick={() => runScenario(s.id)}
              disabled={runningId !== null}
              className="btn-primary w-full text-sm"
            >
              <PlayCircle size={15} /> {runningId === s.id ? "Running..." : "Run Demo"}
            </button>
          </div>
        ))}
      </div>

      {activeRequest && (
        <div className="glass-panel p-5 mt-6 animate-rise-in">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-signal">{activeRequest.requestCode}</span>
              <PriorityBadge severity={activeRequest.severity} score={activeRequest.priorityScore} />
              <span className="text-xs text-ink-dim">{CATEGORY_LABELS[activeRequest.category]}</span>
            </div>
          </div>

          {/* step progress */}
          <div className="flex items-center gap-1.5 overflow-x-auto console-scroll pb-2 mb-5">
            {STEP_ORDER.map((s) => {
              const passed = step && STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(s);
              return (
                <span key={s} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-mono ${passed ? "bg-signal/15 text-signal" : "bg-panel-light text-ink-faint"}`}>
                  {SCENARIO_STEP_LABELS[s]}
                </span>
              );
            })}
            {(step === "UNAVAILABLE" || step === "REOPTIMIZED") && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-mono ${step === "REOPTIMIZED" ? "bg-severity-critical/15 text-severity-critical animate-pulse-soft" : "bg-severity-critical/15 text-severity-critical"}`}>
                {SCENARIO_STEP_LABELS[step]}
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div>
              <NetworkVisualization
                centerLabel={activeRequest.requestCode}
                severityCritical={activeRequest.severity === "CRITICAL"}
                nodes={matches.map((m, i) => ({ id: m.resourceId, label: m.resource.name, kind: KIND_MAP[m.resource.type] ?? "other", highlighted: i === 0, score: m.score }))}
              />
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto console-scroll">
              {matches.slice(0, 3).map((m) => <MatchCard key={m.resourceId} match={m} highlight={m.rank === 1} />)}
            </div>
          </div>

          <div className="mt-4 space-y-1 font-mono text-xs text-ink-dim">
            {events.slice(0, 6).reverse().map((e) => <p key={e.id}>→ {e.message}</p>)}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
