import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Loader2 } from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import { useAuthStore } from "../store/useAuthStore";
import { isBackendConfigured } from "../services/authApi";

export default function Register() {
  const { register, status, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const backendReady = isBackendConfigured();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await register(email, password, displayName);
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
            <UserPlus size={22} className="text-signal" />
          </span>
          <h1 className="font-display text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-ink-dim mt-2">Join the coordination network.</p>
        </div>

        {!backendReady ? (
          <div className="glass-panel p-5 text-sm text-ink-dim">
            Backend isn't configured for this deployment, so account creation isn't available right now —
            use a <Link to="/login" className="text-signal hover:underline">demo account</Link> instead.
          </div>
        ) : (
          <div className="glass-panel p-5">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="label-console">Full name</label>
                <input required className="input-console" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="label-console">Email</label>
                <input type="email" required className="input-console" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="label-console">Password</label>
                <input type="password" required minLength={8} className="input-console" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>

              {error && <p className="text-xs text-severity-critical">{error}</p>}

              <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
                {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
              </button>
            </form>
            <p className="text-center text-sm text-ink-dim mt-4">
              Already have an account? <Link to="/login" className="text-signal hover:underline">Sign in</Link>
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
