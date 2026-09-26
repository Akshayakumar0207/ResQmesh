import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import { useAuthStore } from "../store/useAuthStore";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { resetPassword } = useAuthStore();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const r = await resetPassword(token, password);
      setMessage(r.message);
      setSucceeded(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <p className="text-sm text-ink-dim">Missing reset token. Request a new link from the <Link to="/forgot-password" className="text-signal hover:underline">forgot password</Link> page.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-signal/10 border border-signal/30 mb-4">
            <ShieldCheck size={22} className="text-signal" />
          </span>
          <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
        </div>

        <div className="glass-panel p-5">
          {succeeded ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink">{message}</p>
              <button onClick={() => navigate("/login")} className="btn-primary w-full">Go to sign in</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="label-console">New password</label>
                <input type="password" required minLength={8} className="input-console" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              {message && <p className="text-xs text-severity-critical">{message}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
