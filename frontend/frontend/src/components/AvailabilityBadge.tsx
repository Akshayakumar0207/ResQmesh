import type { AvailabilityStatus } from "../types";
import { AVAILABILITY_STYLES } from "../utils/format";

export default function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const s = AVAILABILITY_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
