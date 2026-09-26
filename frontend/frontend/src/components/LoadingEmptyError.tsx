import { Loader2, Inbox, AlertCircle } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-dim">
      <Loader2 size={22} className="animate-spin text-signal" />
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <Inbox size={26} className="text-ink-faint" />
      <p className="text-sm font-medium text-ink-dim">{title}</p>
      {description && <p className="text-xs text-ink-faint max-w-xs">{description}</p>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <AlertCircle size={26} className="text-severity-critical" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="text-xs text-ink-faint max-w-xs">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2 text-xs">Try again</button>
      )}
    </div>
  );
}
