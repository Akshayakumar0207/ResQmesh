import { useEffect, useRef } from "react";
import { getApiBase, isBackendConfigured } from "./authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import type { NewEmergencyPush } from "../types/auth";

function toWsUrl(httpBase: string): string {
  return httpBase.replace(/^http/, "ws");
}

/** Mount once near the app root. Connects the live broadcast feed whenever
 * a real (JWT) session is active, so every signed-in user is pushed a
 * notification the instant anyone posts a new emergency — the same
 * mechanic as a social feed pushing a new post to followers. */
export function useNotificationSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const pushToast = useAppStore((s) => s.pushToast);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isBackendConfigured() || !accessToken) return;

    const url = `${toWsUrl(getApiBase())}/ws/notifications?token=${encodeURIComponent(accessToken)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NewEmergencyPush;
        if (data.type === "new_emergency") {
          const severityLabel = data.severity === "CRITICAL" ? "🔴 CRITICAL" : data.severity;
          pushToast(`${severityLabel} — ${data.requestCode}: ${data.category} near ${data.locationLabel}`, data.severity === "CRITICAL" ? "critical" : "warning");
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onerror = () => { /* silent — connection issues shouldn't break the UI */ };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [accessToken, pushToast]);
}
