import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import RequestForm from "./pages/RequestForm";
import ProviderDashboard from "./pages/ProviderDashboard";
import CommandCenter from "./pages/CommandCenter";
import ResourcesPage from "./pages/ResourcesPage";
import EmergenciesPage from "./pages/EmergenciesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DemoPage from "./pages/DemoPage";
import AboutPage from "./pages/AboutPage";
import { useAuthStore } from "./store/useAuthStore";
import { useNotificationSocket } from "./services/notificationSocket";

export default function App() {
  const tryRestoreSession = useAuthStore((s) => s.tryRestoreSession);

  useEffect(() => {
    tryRestoreSession();
  }, [tryRestoreSession]);

  useNotificationSocket();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/request" element={<RequestForm />} />
      <Route path="/provider" element={<ProviderDashboard />} />
      <Route path="/command-center" element={<CommandCenter />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/emergencies" element={<EmergenciesPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
