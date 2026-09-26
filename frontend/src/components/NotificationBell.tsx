import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { authApi, isBackendConfigured } from "../services/authApi";
import type { BroadcastNotification } from "../types/auth";
import { timeAgo } from "../utils/format";

export default function NotificationBell() {
  const { accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BroadcastNotification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isBackendConfigured() || !accessToken) return;
    authApi.listNotifications().then(setItems).catch(() => {});
  }, [accessToken, open]);

  if (!isBackendConfigured() || !accessToken) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); setLoaded(true); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-panel-border bg-panel-light text-ink-dim hover:text-signal hover:border-signal/40"
        title="Live emergency feed"
      >
        <Bell size={16} />
        {items.length > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-severity-critical animate-pulse-soft" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-panel-solid p-2 shadow-xl max-h-96 overflow-y-auto console-scroll">
          <p className="eyebrow px-2 py-1.5">Live Feed</p>
          {!loaded ? null : items.length === 0 ? (
            <p className="text-sm text-ink-faint px-2 py-4 text-center">No broadcasts yet.</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className="px-2 py-2.5 border-b border-panel-border last:border-0">
                <p className="text-sm text-ink font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-ink-dim mt-0.5">{n.body}</p>}
                <p className="text-xs text-ink-faint font-mono mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
