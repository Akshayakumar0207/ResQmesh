import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, critical: XCircle };
const COLOR = {
  info: "border-signal/30 text-signal",
  success: "border-severity-low/30 text-severity-low",
  warning: "border-pulse/30 text-pulse",
  critical: "border-severity-critical/30 text-severity-critical",
};

export default function NotificationPanel() {
  const { toasts, dismissToast } = useAppStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const Icon = ICON[t.type];
        return (
          <div key={t.id} className={`glass-panel-solid border p-3 flex items-start gap-2.5 animate-rise-in shadow-xl ${COLOR[t.type]}`}>
            <Icon size={16} className="mt-0.5 shrink-0" />
            <p className="text-sm text-ink flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-ink-faint hover:text-ink">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
