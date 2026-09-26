/** Renders once per layout. Fixed, behind all content (z-0), so every
 * glass-panel across the app has something colorful and alive to blur —
 * without this, backdrop-blur on a flat dark background just looks like a
 * darker flat background. Purely decorative, aria-hidden, respects
 * prefers-reduced-motion via the global CSS rule. */
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div
        className="ambient-blob animate-float"
        style={{ top: "-10%", left: "-8%", width: 520, height: 520, background: "radial-gradient(circle, rgba(34,245,211,0.22), transparent 70%)" }}
      />
      <div
        className="ambient-blob animate-float-slow"
        style={{ top: "10%", right: "-12%", width: 600, height: 600, background: "radial-gradient(circle, rgba(139,92,246,0.20), transparent 70%)" }}
      />
      <div
        className="ambient-blob animate-float"
        style={{ bottom: "-15%", left: "20%", width: 480, height: 480, background: "radial-gradient(circle, rgba(255,59,78,0.10), transparent 70%)", animationDelay: "-6s" }}
      />
      <div className="absolute inset-0 bg-grid bg-grid opacity-[0.15] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
    </div>
  );
}
