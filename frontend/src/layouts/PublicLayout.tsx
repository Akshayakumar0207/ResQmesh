import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import NotificationPanel from "../components/NotificationPanel";
import AmbientBackground from "../components/AmbientBackground";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-abyss">
      <AmbientBackground />
      <div className="relative z-10">
        <Navbar />
        <main>{children}</main>
        <NotificationPanel />
      </div>
    </div>
  );
}
