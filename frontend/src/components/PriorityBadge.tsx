import type { Severity } from "../types";
import { SEVERITY_STYLES } from "../utils/format";

export default function PriorityBadge({ severity, score }: { severity: Severity; score?: number }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold font-mono uppercase tracking-wide ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${severity === "CRITICAL" ? "animate-pulse-soft" : ""}`} />
      {severity}
      {typeof score === "number" && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
