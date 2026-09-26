import { Clock } from "lucide-react";

export default function ETAIndicator({ minutes }: { minutes: number }) {
  const urgent = minutes <= 8;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-medium ${urgent ? "bg-signal/15 text-signal" : "bg-panel-light text-ink-dim border border-panel-border"}`}>
      <Clock size={12} /> {minutes} min ETA
    </span>
  );
}
