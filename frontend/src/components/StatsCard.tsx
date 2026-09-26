import type { ReactNode } from "react";

export default function StatsCard({
  label, value, sub, icon, accent = "signal",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: "signal" | "critical" | "pulse" | "low";
}) {
  const accentMap: Record<string, string> = {
    signal: "text-signal",
    critical: "text-severity-critical",
    pulse: "text-pulse",
    low: "text-severity-low",
  };
  const glowMap: Record<string, string> = {
    signal: "group-hover:[text-shadow:0_0_20px_rgba(34,245,211,0.6)]",
    critical: "group-hover:[text-shadow:0_0_20px_rgba(255,59,78,0.6)]",
    pulse: "group-hover:[text-shadow:0_0_20px_rgba(255,176,32,0.6)]",
    low: "group-hover:[text-shadow:0_0_20px_rgba(79,209,197,0.6)]",
  };
  return (
    <div className="group glass-panel p-4 flex flex-col gap-1 animate-rise-in cursor-default">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-ink-dim font-medium">{label}</span>
        {icon && (
          <span className={`${accentMap[accent]} transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6`}>
            {icon}
          </span>
        )}
      </div>
      <div className={`text-2xl font-display font-semibold ${accentMap[accent]} transition-all duration-300 ${glowMap[accent]}`}>
        {value}
      </div>
      {sub && <span className="text-xs text-ink-faint">{sub}</span>}
    </div>
  );
}
