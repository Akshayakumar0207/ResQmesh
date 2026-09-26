import type { RequestStatus } from "../types";
import { STATUS_STYLES } from "../utils/format";

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
