import PublicLayout from "../layouts/PublicLayout";
import { ShieldAlert, Building2, TrendingUp, Lock, Users2 } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-14 space-y-14">
        <div>
          <span className="eyebrow">About ResQMesh</span>
          <h1 className="font-display text-3xl font-semibold mt-2">A coordination layer, not a replacement for emergency services.</h1>
          <p className="text-ink-dim mt-3 leading-relaxed">
            ResQMesh is a hackathon prototype built for LT HackFest 2026. It demonstrates how
            fragmented community resources — vehicles, medical skills, supplies, shelters — can
            be coordinated into a single intelligent network. It is not connected to any
            official emergency dispatch system.
          </p>
        </div>

        <div className="glass-panel border-severity-critical/30 p-5 flex gap-3">
          <ShieldAlert size={20} className="text-severity-critical shrink-0 mt-0.5" />
          <p className="text-sm text-ink-dim">
            <span className="text-ink font-medium">In a real emergency, contact official emergency services first.</span>{" "}
            ResQMesh is a prototype for demonstrating community resource coordination and uses simulation data throughout.
          </p>
        </div>

        <Section icon={<Lock size={18} />} title="Trust & Safety">
          <p>This prototype simplifies authentication for demo purposes (three demo roles). A production version would require:</p>
          <ul>
            <li>Verified volunteer identity checks before resources can be listed</li>
            <li>Role-based access control across requester / volunteer / provider / admin</li>
            <li>Audit logs for every assignment and status change</li>
            <li>Abuse-prevention (rate limiting, report/flag flow, moderation queue)</li>
            <li>Location data minimized and never shown beyond what a task requires</li>
            <li>Encryption in transit and at rest, with integration pathways for verified emergency authorities</li>
          </ul>
        </Section>

        <Section icon={<Users2 size={18} />} title="Privacy">
          <p>
            Requests are shown to responders as anonymous codes (e.g. <span className="font-mono text-signal">REQ-1042</span>),
            never full names or contact details. Resource providers only see what's necessary to complete their task.
          </p>
        </Section>

        <Section icon={<Building2 size={18} />} title="Business Model">
          <p>Affected users are never charged. The sustainable path is B2B/B2G:</p>
          <ul>
            <li>Government and municipal disaster-response coordination dashboards</li>
            <li>NGOs and hospital networks needing resource visibility</li>
            <li>Corporate disaster-response teams, large campuses, and event organizers</li>
            <li>API integrations for incident reporting and volunteer management</li>
          </ul>
        </Section>

        <Section icon={<TrendingUp size={18} />} title="Scalability">
          <p>The architecture is designed to grow: 1 city → 10 cities → state → country, with future integration points for:</p>
          <ul>
            <li>Government emergency systems and verified hospital networks</li>
            <li>NGO resource pools and volunteer directories</li>
            <li>IoT sensors, weather alerts, and traffic data feeds</li>
          </ul>
        </Section>

        <p className="text-xs text-ink-faint font-mono pt-4 border-t border-panel-border">
          Built for LT HackFest 2026 · React + FastAPI + Supabase (free tier) · Open-source, local intelligence engine
        </p>
      </div>
    </PublicLayout>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-signal mb-3">
        {icon}
        <h2 className="font-display font-semibold text-lg text-ink">{title}</h2>
      </div>
      <div className="text-sm text-ink-dim leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mt-2">
        {children}
      </div>
    </div>
  );
}
