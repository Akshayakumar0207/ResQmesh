import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const COLORS = ["#17E9C0", "#FFB020", "#FF8A3D", "#FF3B4E", "#3B82F6", "#A78BFA", "#4FD1C5"];

const tooltipStyle = {
  background: "#0F1826", border: "1px solid #1E2C40", borderRadius: 8, fontSize: 12, color: "#E8EEF5",
};

export function BarAnalytics({ data, xKey, yKey, height = 220 }: { data: Record<string, unknown>[]; xKey: string; yKey: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid stroke="#1E2C40" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: "#8494AB", fontSize: 11 }} axisLine={{ stroke: "#1E2C40" }} tickLine={false} />
        <YAxis tick={{ fill: "#8494AB", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(23,233,192,0.05)" }} />
        <Bar dataKey={yKey} fill="#17E9C0" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineAnalytics({ data, xKey, lines, height = 220 }: { data: Record<string, unknown>[]; xKey: string; lines: { key: string; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid stroke="#1E2C40" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: "#8494AB", fontSize: 11 }} axisLine={{ stroke: "#1E2C40" }} tickLine={false} />
        <YAxis tick={{ fill: "#8494AB", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PieAnalytics({ data, dataKey, nameKey, height = 220 }: { data: Record<string, unknown>[]; dataKey: string; nameKey: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
