import { Link } from "react-router-dom";
import {
  ArrowRight, PlayCircle, Radio, Zap, GitBranch, ShieldCheck, Layers,
  MapPin, Users, Activity, TrendingUp, Building2, Globe2,
} from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import NetworkVisualization from "../components/NetworkVisualization";

const DEMO_NODES = [
  { id: "1", label: "Vehicle #17", kind: "vehicle" as const, highlighted: true, score: 94 },
  { id: "2", label: "Rescue Team B", kind: "medic" as const, score: 81 },
  { id: "3", label: "Tambaram Hospital", kind: "hospital" as const, score: 72 },
  { id: "4", label: "Shelter — Guindy", kind: "shelter" as const, score: 65 },
  { id: "5", label: "Pharmacy Relay", kind: "pharmacy" as const, score: 58 },
];

export default function Landing() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-grid bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/5 px-3 py-1 mb-6 transition-all duration-300 hover:border-aurora/40 hover:bg-aurora/5 hover:shadow-glow-aurora cursor-default">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-soft" />
              <span className="eyebrow">LT HackFest 2026 · Prototype</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
              RESQ<span className="text-aurora-gradient bg-aurora-gradient bg-[length:200%_200%] animate-gradient-pan">MESH</span>
            </h1>
            <p className="mt-5 text-xl text-ink font-display font-medium leading-snug max-w-lg">
              Connecting people, resources and responders when every minute matters.
            </p>
            <p className="mt-4 text-ink-dim max-w-lg leading-relaxed">
              An intelligent emergency coordination network that matches urgent needs with
              available community resources — using real-time classification, transparent
              matching, and automatic re-optimization when the network changes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/command-center" className="btn-primary">
                <Radio size={16} /> Launch Command Center
              </Link>
              <Link to="/demo" className="btn-secondary">
                <PlayCircle size={16} /> Run Interactive Demo <ArrowRight size={14} />
              </Link>
            </div>
            <p className="mt-6 text-xs text-ink-faint font-mono max-w-md">
              Prototype for emergency coordination and community resource allocation.
              In a real emergency, contact official emergency services.
            </p>
          </div>

          <div className="glass-panel p-5 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">Live Mesh Preview</span>
              <span className="text-xs font-mono text-severity-critical flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-severity-critical animate-pulse-soft" /> REQ-1042 · CRITICAL
              </span>
            </div>
            <NetworkVisualization centerLabel="Elderly · Evacuation" severityCritical nodes={DEMO_NODES} />
            <p className="text-center text-xs text-signal font-mono mt-1">Optimal resource identified — Vehicle #17</p>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <Section eyebrow="01 — The Problem" title="Help already exists nearby. It just isn't coordinated.">
        <div className="grid md:grid-cols-3 gap-5">
          <InfoCard
            icon={<Layers size={18} />}
            title="Resources are fragmented"
            body="Volunteers with vehicles, people with first-aid kits, pharmacies, hospitals, and shelters all exist around every emergency — but none of them can see each other."
          />
          <InfoCard
            icon={<Zap size={18} />}
            title="Coordination is the gap, not discovery"
            body="The problem isn't finding a single helper — it's intelligently matching urgency, location, capability, and ETA across many possible helpers, in real time."
          />
          <InfoCard
            icon={<Activity size={18} />}
            title="Static directories can't adapt"
            body="A phone number list or a map pin doesn't re-route itself when the nearest vehicle becomes unavailable mid-mission. Real emergencies need a network that reacts."
          />
        </div>
      </Section>

      {/* SOLUTION */}
      <Section eyebrow="02 — The Solution" dark title="ResQMesh turns fragmented resources into one coordinated network.">
        <p className="text-ink-dim max-w-2xl mb-8 leading-relaxed">
          People in need, volunteers, resource providers, hospitals, shelters, and emergency
          organizations connect to a shared mesh. Every request is classified, scored, and
          matched against the best available resource — transparently, explainably, and
          continuously, not just once.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Users size={16} />, label: "People in Need" },
            { icon: <MapPin size={16} />, label: "Volunteers" },
            { icon: <Building2 size={16} />, label: "Resource Providers" },
            { icon: <ShieldCheck size={16} />, label: "Hospitals & Shelters" },
          ].map((n) => (
            <div key={n.label} className="glass-panel p-4 flex items-center gap-3">
              <span className="text-signal">{n.icon}</span>
              <span className="text-sm font-medium">{n.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section eyebrow="03 — How It Works" title="From free-text request to assigned resource, fully explainable.">
        <ol className="grid md:grid-cols-4 gap-4">
          {[
            ["Emergency Reported", "A requester describes what's happening in plain language, with location and people count."],
            ["AI Classifies It", "The local intelligence engine extracts category, severity, and priority — with a visible score breakdown."],
            ["Network Is Matched", "Every available resource is scored on urgency fit, distance, compatibility, availability, and ETA."],
            ["Best Match Assigned", "The top resource is assigned and tracked through Accepted → En Route → Resolved — or re-matched instantly if it drops out."],
          ].map(([title, body], i) => (
            <li key={title} className="glass-panel p-4">
              <span className="font-mono text-signal text-xs">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-display font-semibold mt-2">{title}</p>
              <p className="text-sm text-ink-dim mt-1.5 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* INNOVATION */}
      <Section eyebrow="04 — Innovation" dark title="Not another SOS button. A living coordination network.">
        <div className="grid md:grid-cols-2 gap-5">
          <InfoCard icon={<GitBranch size={18} />} title="Dynamic re-matching" body="When an assigned resource goes offline mid-mission, ResQMesh recalculates the network automatically and reassigns — no human has to notice and manually redo it." />
          <InfoCard icon={<TrendingUp size={18} />} title="Explainable matching, not a black box" body="Every score is a transparent, weighted formula across urgency, distance, resource fit, availability and ETA — auditable by responders and judges alike." />
        </div>
      </Section>

      {/* TECHNOLOGY */}
      <Section eyebrow="05 — Technology" title="Built entirely on free and open-source infrastructure.">
        <div className="flex flex-wrap gap-2.5">
          {["React + Vite + TypeScript", "Tailwind CSS", "Leaflet + OpenStreetMap", "OSRM routing (w/ Haversine fallback)", "FastAPI", "Supabase PostgreSQL", "scikit-learn / rule-based NLP", "Zero paid APIs"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-mono text-ink-dim transition-all duration-300 hover:border-signal/40 hover:text-signal hover:bg-signal/5 hover:-translate-y-0.5 cursor-default"
            >
              {t}
            </span>
          ))}
        </div>
      </Section>

      {/* IMPACT */}
      <Section eyebrow="06 — Impact" dark title="Coordination, not just discovery.">
        <div className="grid sm:grid-cols-3 gap-5">
          <InfoCard icon={<Activity size={18} />} title="Faster response" body="Ranking every resource by real distance and ETA means the nearest capable helper is found in seconds, not phone calls." />
          <InfoCard icon={<Users size={18} />} title="Community resources activated" body="Anyone can register what they can contribute — a vehicle, a skill, medicine, a spare room — turning idle capacity into emergency capacity." />
          <InfoCard icon={<ShieldCheck size={18} />} title="Resilient by design" body="Local classification, Haversine fallback routing, and offline-safe demo mode mean the system keeps working when networks and APIs don't." />
        </div>
      </Section>

      {/* FUTURE VISION */}
      <Section eyebrow="07 — Future Vision" title="From one city to a national coordination layer.">
        <div className="flex items-center gap-3 text-ink-dim text-sm font-mono flex-wrap">
          <Chip label="1 City" active /> <ArrowRight size={14} /> <Chip label="10 Cities" /> <ArrowRight size={14} /> <Chip label="State" /> <ArrowRight size={14} /> <Chip label="Country" />
        </div>
        <p className="text-ink-dim max-w-2xl mt-6 leading-relaxed">
          Future integrations include government emergency systems, hospital networks, NGO
          resource pools, IoT sensors, weather and traffic feeds — extending the same matching
          engine, not replacing it.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/command-center" className="btn-primary"><Globe2 size={16} /> Explore Command Center</Link>
          <Link to="/about" className="btn-secondary">Read the full pitch</Link>
        </div>
      </Section>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-ink-faint">
        ResQMesh — Prototype for emergency coordination and community resource allocation. Built for LT HackFest 2026.
      </footer>
    </PublicLayout>
  );
}

function Section({ eyebrow, title, children, dark }: { eyebrow: string; title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <section className={`relative py-16 border-b border-white/[0.06] ${dark ? "bg-gradient-to-b from-aurora/[0.04] via-transparent to-transparent" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 relative">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-2 mb-8 max-w-2xl leading-tight">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group glass-panel p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-signal/10 text-signal mb-3 transition-all duration-300 group-hover:bg-aurora/15 group-hover:text-aurora-glow group-hover:scale-110 group-hover:rotate-6">
        {icon}
      </span>
      <p className="font-display font-semibold">{title}</p>
      <p className="text-sm text-ink-dim mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 border transition-all duration-300 ${
        active ? "border-signal text-signal bg-signal/10 shadow-glow" : "border-white/10 text-ink-faint hover:border-white/25 hover:text-ink-dim"
      }`}
    >
      {label}
    </span>
  );
}
