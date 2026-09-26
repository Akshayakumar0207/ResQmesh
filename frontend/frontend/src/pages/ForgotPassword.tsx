import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import { useAuthStore } from "../store/useAuthStore";
import { isBackendConfigured } from "../services/authApi";

export default function ForgotPassword() {
  const { forgotPassword } = useAuthStore();
  const backendReady = isBackendConfigured();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; resetLink?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await forgotPassword(email);
      setResult(r);
    } catch (err) {
      setResult({ message: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-signal/10 border border-signal/30 mb-4">
            <KeyRound size={22} className="text-signal" />
          </span>
          <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-ink-dim mt-2">We'll send a reset link to your email.</p>
        </div>

        {!backendReady ? (
          <div className="glass-panel p-5 text-sm text-ink-dim">Backend isn't configured for this deployment.</div>
        ) : result ? (
          <div className="glass-panel p-5 space-y-3">
            <p className="text-sm text-ink">{result.message}</p>
            {result.resetLink && (
              <Link to={result.resetLink.replace(window.location.origin, "")} className="btn-primary w-full inline-flex">
                Open reset link (demo mode)
              </Link>
            )}
          </div>
        ) : (
          <div className="glass-panel p-5">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="label-console">Email</label>
                <input type="email" required className="input-console" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Send reset link"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-ink-dim mt-4">
          <Link to="/login" className="text-signal hover:underline">Back to sign in</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
