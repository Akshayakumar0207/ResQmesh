import { Navigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function Dashboard() {
  const { currentUser } = useAppStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === "ADMIN") return <Navigate to="/command-center" replace />;
  if (currentUser.role === "PROVIDER") return <Navigate to="/provider" replace />;
  return <Navigate to="/request" replace />;
}
