import type { AvailabilityStatus, RequestStatus, Severity } from "../types";

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
  CRITICAL: { bg: "bg-severity-critical/10", text: "text-severity-critical", border: "border-severity-critical/40", dot: "bg-severity-critical" },
  HIGH: { bg: "bg-severity-high/10", text: "text-severity-high", border: "border-severity-high/40", dot: "bg-severity-high" },
  MEDIUM: { bg: "bg-severity-medium/10", text: "text-severity-medium", border: "border-severity-medium/40", dot: "bg-severity-medium" },
  LOW: { bg: "bg-severity-low/10", text: "text-severity-low", border: "border-severity-low/40", dot: "bg-severity-low" },
};

export const STATUS_STYLES: Record<RequestStatus, { label: string; text: string; bg: string }> = {
  SEARCHING: { label: "Searching", text: "text-ink-dim", bg: "bg-ink-dim/10" },
  ASSIGNED: { label: "Assigned", text: "text-pulse", bg: "bg-pulse/10" },
  ACCEPTED: { label: "Accepted", text: "text-signal", bg: "bg-signal/10" },
  EN_ROUTE: { label: "En Route", text: "text-signal", bg: "bg-signal/10" },
  ARRIVED: { label: "Arrived", text: "text-signal-glow", bg: "bg-signal/15" },
  RESOLVED: { label: "Resolved", text: "text-severity-low", bg: "bg-severity-low/10" },
  CANCELLED: { label: "Cancelled", text: "text-ink-faint", bg: "bg-ink-faint/10" },
};

export const AVAILABILITY_STYLES: Record<AvailabilityStatus, { label: string; text: string; bg: string; dot: string }> = {
  AVAILABLE: { label: "Available", text: "text-severity-low", bg: "bg-severity-low/10", dot: "bg-severity-low" },
  BUSY: { label: "Busy", text: "text-pulse", bg: "bg-pulse/10", dot: "bg-pulse" },
  OFFLINE: { label: "Offline", text: "text-ink-faint", bg: "bg-ink-faint/10", dot: "bg-ink-faint" },
};

export function scoreColor(score: number): string {
  if (score >= 85) return "text-signal";
  if (score >= 65) return "text-pulse";
  return "text-severity-high";
}
