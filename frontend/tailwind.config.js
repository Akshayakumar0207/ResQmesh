/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: {
          DEFAULT: "#05070C",
          light: "#080B13",
        },
        panel: {
          DEFAULT: "#0F1826",
          light: "#131E30",
          border: "#1E2C40",
        },
        ink: {
          DEFAULT: "#EEF3F9",
          dim: "#93A3BC",
          faint: "#54627C",
        },
        signal: {
          DEFAULT: "#22F5D3",
          dim: "#0E8C76",
          glow: "#7CFFEA",
        },
        aurora: {
          DEFAULT: "#8B5CF6",
          dim: "#5B3FA8",
          glow: "#C4B5FD",
        },
        pulse: {
          DEFAULT: "#FFB020",
        },
        severity: {
          critical: "#FF3B4E",
          high: "#FF8A3D",
          medium: "#FFC93D",
          low: "#4FD1C5",
        },
        marker: {
          emergency: "#FF3B4E",
          resource: "#22C55E",
          assigned: "#FFC93D",
          hospital: "#3B82F6",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "radar-ping": {
          "0%": { transform: "scale(0.6)", opacity: "0.9" },
          "70%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "mesh-flow": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(3%,-4%) scale(1.05)" },
          "66%": { transform: "translate(-3%,3%) scale(0.97)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-4%,4%) scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.55", filter: "blur(18px)" },
          "50%": { opacity: "1", filter: "blur(24px)" },
        },
        "gradient-pan": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "radar-ping": "radar-ping 2.2s cubic-bezier(0,0,0.2,1) infinite",
        "mesh-flow": "mesh-flow 1s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "rise-in": "rise-in 0.5s cubic-bezier(0.16,1,0.3,1)",
        "scan-line": "scan-line 3s linear infinite",
        float: "float 14s ease-in-out infinite",
        "float-slow": "float-slow 20s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "gradient-pan": "gradient-pan 6s ease infinite",
      },
      boxShadow: {
        glow: "0 0 28px -4px rgba(34,245,211,0.4)",
        "glow-lg": "0 8px 40px -8px rgba(34,245,211,0.35), 0 0 0 1px rgba(34,245,211,0.15)",
        "glow-aurora": "0 0 28px -4px rgba(139,92,246,0.45)",
        "glow-critical": "0 0 28px -4px rgba(255,59,78,0.5)",
        "glass": "0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        "glass-lift": "0 20px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(30,44,64,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(30,44,64,0.35) 1px, transparent 1px)",
        "aurora-gradient": "linear-gradient(135deg, #22F5D3 0%, #8B5CF6 100%)",
        "aurora-gradient-soft": "linear-gradient(135deg, rgba(34,245,211,0.15) 0%, rgba(139,92,246,0.15) 100%)",
        shimmer: "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
      },
      backgroundSize: {
        grid: "36px 36px",
        shimmer: "200% 100%",
      },
    },
  },
  plugins: [],
};
