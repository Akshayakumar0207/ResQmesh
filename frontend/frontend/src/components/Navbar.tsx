import { Link } from "react-router-dom";
import { Radio, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import NotificationBell from "./NotificationBell";

const DEMO_ACCOUNTS = [
  { username: "demo.requester", label: "Demo Requester" },
  { username: "demo.volunteer", label: "Demo Volunteer" },
  { username: "demo.admin", label: "Demo Admin" },
];

export default function Navbar() {
  const { currentUser, login, logout } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="h-16 flex items-center justify-between px-5 sticky top-0 z-40 border-b border-white/[0.06]"
      style={{ background: "rgba(5,7,12,0.72)", backdropFilter: "blur(16px) saturate(140%)", WebkitBackdropFilter: "blur(16px) saturate(140%)" }}
    >
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-signal/30 bg-signal/10 transition-all duration-300 group-hover:border-aurora/50 group-hover:shadow-glow group-hover:scale-110">
          <Radio size={16} className="text-signal transition-colors duration-300 group-hover:text-aurora-glow" />
        </span>
        <span className="font-display font-semibold tracking-tight text-lg">
          RESQ<span className="shimmer-text">MESH</span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative">
          {currentUser ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-all duration-300 hover:border-signal/40 hover:bg-signal/5 hover:shadow-glow"
            >
              <span className="h-2 w-2 rounded-full bg-signal animate-pulse-soft" />
              {currentUser.displayName}
              <span className="text-ink-faint font-mono text-xs">({currentUser.role})</span>
              <ChevronDown size={14} className={`text-ink-dim transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
          )}

          {open && currentUser && (
            <div className="absolute right-0 mt-2 w-52 glass-panel-solid p-1.5 animate-rise-in">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  onClick={() => { login(a.username); setOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-ink-dim transition-colors duration-200 hover:bg-signal/10 hover:text-signal"
                >
                  {a.label}
                </button>
              ))}
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-severity-critical transition-colors duration-200 hover:bg-severity-critical/10"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
