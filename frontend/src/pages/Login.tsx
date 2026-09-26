import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, User, Truck, ShieldCheck, Loader2 } from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { isBackendConfigured } from "../services/authApi";
import GoogleSignInButton from "../components/GoogleSignInButton";

const ACCOUNTS = [
  { username: "demo.requester", label: "Demo Requester", desc: "Submit and track emergency requests", icon: User, path: "/request" },
  { username: "demo.volunteer", label: "Demo Volunteer", desc: "Manage your resources and missions", icon: Truck, path: "/provider" },
  { username: "demo.admin", label: "Demo Admin", desc: "Full command center + analytics access", icon: ShieldCheck, path: "/command-center" },
];

export default function Login() {
  const { login: demoLogin } = useAppStore();
  const { login, loginWithGoogle, status, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const backendReady = isBackendConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password, rememberMe);
      navigate("/command-center");
    } catch {
      /* error already reflected in store */
    }
  }

  async function handleGoogleCredential(idToken: string) {
    clearError();
    try {
      await loginWithGoogle(idToken, rememberMe);
      navigate("/command-center");
    } catch {
      /* error already reflected in store */
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-signal/10 border border-signal/30 mb-4">
            <Radio size={22} className="text-signal" />
          </span>
          <h1 className="font-display text-2xl font-semibold">Sign in to ResQMesh</h1>
          <p className="text-sm text-ink-dim mt-2">
            {backendReady ? "Sign in with your account, or jump straight into a demo role below." : "Backend not configured — use a demo role below to explore the app."}
          </p>
        </div>

        {backendReady && (
          <div className="glass-panel p-5 mb-8">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="label-console">Email</label>
                <input type="email" required className="input-console" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="label-console">Password</label>
                <input type="password" required className="input-console" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-ink-dim cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-panel-border" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-signal hover:underline">Forgot password?</Link>
              </div>

              {error && <p className="text-xs text-severity-critical">{error}</p>}

              <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
                {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-panel-border flex-1" />
              <span className="text-xs text-ink-faint">or</span>
              <div className="h-px bg-panel-border flex-1" />
            </div>

            <GoogleSignInButton onCredential={handleGoogleCredential} />

            <p className="text-center text-sm text-ink-dim mt-4">
              No account? <Link to="/register" className="text-signal hover:underline">Create one</Link>
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-panel-border flex-1" />
            <span className="text-xs text-ink-faint uppercase tracking-wider">Demo accounts</span>
            <div className="h-px bg-panel-border flex-1" />
          </div>
          <div className="space-y-3">
            {ACCOUNTS.map((a) => (
              <button
                key={a.username}
                onClick={() => { demoLogin(a.username); navigate(a.path); }}
                className="w-full glass-panel p-4 flex items-center gap-3.5 text-left hover:border-signal/40 transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-panel-light text-signal shrink-0">
                  <a.icon size={18} />
                </span>
                <div>
                  <p className="font-medium text-sm">{a.label}</p>
                  <p className="text-xs text-ink-dim">{a.desc}</p>
                  <p className="text-xs font-mono text-ink-faint mt-0.5">{a.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
