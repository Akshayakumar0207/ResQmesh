import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import NotificationPanel from "../components/NotificationPanel";
import AmbientBackground from "../components/AmbientBackground";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-abyss">
      <AmbientBackground />
      <div className="relative z-10">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0 p-5 md:p-6 console-scroll">{children}</main>
        </div>
        <NotificationPanel />
      </div>
    </div>
  );
}
