import AppLayout from "../layouts/AppLayout";
import { useAppStore } from "../store/useAppStore";
import StatsCard from "../components/StatsCard";
import { BarAnalytics, LineAnalytics, PieAnalytics } from "../components/AnalyticsChart";
import { CATEGORY_LABELS } from "../algorithms/classification";

export default function AnalyticsPage() {
  const { getAnalytics } = useAppStore();
  const a = getAnalytics();

  return (
    <AppLayout>
      <h1 className="font-display text-xl font-semibold mb-1">Impact Analytics</h1>
      <p className="text-sm text-ink-dim mb-6">Session-level metrics computed live from the coordination engine.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <StatsCard label="Total Emergencies" value={a.totalEmergencies} />
        <StatsCard label="Resolved" value={a.resolvedEmergencies} accent="low" />
        <StatsCard label="Avg Response" value={`${a.avgResponseTimeMin}m`} />
        <StatsCard label="Critical" value={a.criticalEmergencies} accent="critical" />
        <StatsCard label="Avg Match Score" value={a.avgMatchScore} accent="signal" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-panel p-5">
          <span className="eyebrow">Emergency Categories</span>
          <div className="mt-3">
            <PieAnalytics data={a.categoryBreakdown.map((c) => ({ name: CATEGORY_LABELS[c.category], value: c.count }))} dataKey="value" nameKey="name" />
          </div>
        </div>
        <div className="glass-panel p-5">
          <span className="eyebrow">Resource Utilization by Type</span>
          <div className="mt-3">
            <BarAnalytics data={a.utilizationSeries.map((u) => ({ type: u.type.replace("_", " "), pct: u.utilization }))} xKey="type" yKey="pct" />
          </div>
        </div>
        <div className="glass-panel p-5">
          <span className="eyebrow">Response Times (recent resolved)</span>
          <div className="mt-3">
            {a.responseTimesSeries.length > 0 ? (
              <LineAnalytics data={a.responseTimesSeries} xKey="label" lines={[{ key: "minutes", color: "#17E9C0" }]} />
            ) : (
              <p className="text-sm text-ink-faint py-16 text-center">Resolve a few requests to see response-time trends.</p>
            )}
          </div>
        </div>
        <div className="glass-panel p-5">
          <span className="eyebrow">Created vs Resolved (7-day)</span>
          <div className="mt-3">
            <LineAnalytics data={a.resolutionSeries} xKey="day" lines={[{ key: "created", color: "#FF8A3D" }, { key: "resolved", color: "#17E9C0" }]} />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <StatsCard label="Resource Utilization" value={`${a.resourceUtilizationPct}%`} />
        <StatsCard label="Volunteer Response Rate" value={`${a.volunteerResponseRatePct}%`} accent="low" />
        <StatsCard label="Successful / Failed Matches" value={`${a.successfulMatches} / ${a.failedMatches}`} />
      </div>
    </AppLayout>
  );
}
