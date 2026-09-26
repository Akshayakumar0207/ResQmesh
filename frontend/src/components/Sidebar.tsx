import { NavLink } from "react-router-dom";
import { LayoutGrid, Siren, PlusCircle, Truck, Map, BarChart3, PlayCircle, Info } from "lucide-react";

const LINKS = [
  { to: "/command-center", label: "Command Center", icon: LayoutGrid },
  { to: "/request", label: "Request Help", icon: PlusCircle },
  { to: "/provider", label: "Provider", icon: Truck },
  { to: "/emergencies", label: "Emergencies", icon: Siren },
  { to: "/resources", label: "Resources", icon: Map },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/demo", label: "Demo Mode", icon: PlayCircle },
  { to: "/about", label: "About", icon: Info },
];

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 min-h-[calc(100vh-4rem)] py-4 px-3 gap-1 console-scroll border-r border-white/[0.06]"
      style={{ background: "rgba(8,11,19,0.5)", backdropFilter: "blur(12px)" }}
    >
      {LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm border transition-all duration-300 overflow-hidden ${
              isActive
                ? "text-signal border-signal/30 bg-signal/[0.08] shadow-glow"
                : "text-ink-dim border-transparent hover:text-ink hover:border-white/10 hover:bg-white/[0.04] hover:translate-x-1"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gradient-to-b from-signal to-aurora" />}
              <Icon size={16} className={`transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110 group-hover:text-signal"}`} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </aside>
  );
}
