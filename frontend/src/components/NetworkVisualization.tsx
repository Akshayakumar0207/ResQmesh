import { useMemo } from "react";

export interface MeshNode {
  id: string;
  label: string;
  sublabel?: string;
  kind: "hospital" | "shelter" | "vehicle" | "medic" | "pharmacy" | "food" | "water" | "other";
  highlighted?: boolean;
  score?: number;
}

const KIND_COLOR: Record<MeshNode["kind"], string> = {
  hospital: "#3B82F6", shelter: "#A78BFA", vehicle: "#17E9C0", medic: "#F87171",
  pharmacy: "#FBBF24", food: "#FB923C", water: "#38BDF8", other: "#8494AB",
};

/**
 * Renders the emergency as a central pulsing node with candidate resources
 * arranged around it — the platform's core idea made visible: fragmented
 * resources, pulled into one coordinated mesh around a need.
 */
export default function NetworkVisualization({
  centerLabel, severityCritical, nodes,
}: {
  centerLabel: string;
  severityCritical?: boolean;
  nodes: MeshNode[];
}) {
  const width = 560;
  const height = 380;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 145;

  const positioned = useMemo(
    () =>
      nodes.map((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        return { ...n, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
      }),
    [nodes, cx, cy],
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF3B4E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF3B4E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* connections */}
      {positioned.map((n) => (
        <line
          key={`line-${n.id}`}
          x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke={n.highlighted ? "#17E9C0" : "#1E2C40"}
          strokeWidth={n.highlighted ? 2.5 : 1.2}
          strokeDasharray={n.highlighted ? "6 4" : undefined}
          className={n.highlighted ? "animate-mesh-flow" : ""}
          opacity={n.highlighted ? 1 : 0.6}
        />
      ))}

      {/* center emergency node */}
      {severityCritical && <circle cx={cx} cy={cy} r={26} fill="url(#centerGlow)" className="animate-radar-ping" />}
      <circle cx={cx} cy={cy} r={20} fill="#FF3B4E" />
      <circle cx={cx} cy={cy} r={20} fill="none" stroke="#FF3B4E" strokeWidth={1} opacity={0.5} />
      <text x={cx} y={cy + 40} textAnchor="middle" className="fill-ink font-mono" fontSize={12}>
        {centerLabel}
      </text>

      {/* resource nodes */}
      {positioned.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.highlighted ? 14 : 10} fill={KIND_COLOR[n.kind]} opacity={n.highlighted ? 1 : 0.75} />
          {n.highlighted && <circle cx={n.x} cy={n.y} r={14} fill="none" stroke="#17E9C0" strokeWidth={2} className="animate-pulse-soft" />}
          <text x={n.x} y={n.y - 18} textAnchor="middle" className="fill-ink-dim font-mono" fontSize={10}>
            {n.label}
          </text>
          {typeof n.score === "number" && (
            <text x={n.x} y={n.y + 26} textAnchor="middle" className={n.highlighted ? "fill-signal" : "fill-ink-faint"} fontSize={10} fontFamily="JetBrains Mono">
              {n.score}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
