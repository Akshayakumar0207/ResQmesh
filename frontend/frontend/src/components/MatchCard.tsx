import { Check, X, Navigation, Clock } from "lucide-react";
import type { MatchResult } from "../types";
import { scoreColor } from "../utils/format";
import MatchScoreRing from "./MatchScoreRing";

export default function MatchCard({ match, highlight }: { match: MatchResult; highlight?: boolean }) {
  return (
    <div className={`glass-panel p-4 ${highlight ? "border-signal shadow-glow" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MatchScoreRing score={match.score} size={44} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink-faint">#{match.rank}</span>
              <p className="text-sm font-semibold text-ink">{match.resource.name}</p>
              {match.rank === 1 && (
                <span className="relative text-[10px] font-mono uppercase tracking-wider text-abyss px-1.5 py-0.5 rounded-md font-bold overflow-hidden bg-aurora-gradient">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-ink-dim">{match.resource.providerName} · {match.resource.locationLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-semibold text-lg ${scoreColor(match.score)}`}>{match.score}</div>
          <div className="text-[10px] text-ink-faint uppercase tracking-wide">Score</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-dim font-mono">
        <span className="inline-flex items-center gap-1"><Navigation size={12} /> {match.distanceKm.toFixed(1)} km</span>
        <span className="inline-flex items-center gap-1"><Clock size={12} /> {match.etaMinutes} min ETA</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {match.reasons.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            {r.passed ? <Check size={12} className="text-signal shrink-0" /> : <X size={12} className="text-ink-faint shrink-0" />}
            <span className={r.passed ? "text-ink-dim" : "text-ink-faint"}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
