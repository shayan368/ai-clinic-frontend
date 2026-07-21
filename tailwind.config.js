/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ──
        primary:         "#0F766E",
        primaryHover:    "#0d6560",
        secondary:       "#14B8A6",
        aiAccent:        "#6366F1",
        highlight:       "#A855F7",

        // ── Semantic ──
        success:         "#22C55E",
        warning:         "#F59E0B",
        danger:          "#EF4444",

        // ── Light theme backgrounds ──
        background:      "#F8FAFC",
        surface:         "#FFFFFF",
        card:            "#FFFFFF",
        border:          "#E2E8F0",
        borderDark:      "#CBD5E1",
        muted:           "#F1F5F9",
        mutedDark:       "#E2E8F0",

        // ── Text ──
        textPrimary:     "#0F172A",
        textSecondary:   "#475569",
        textMuted:       "#94A3B8",

        // ── Sidebar specific ──
        sidebarBg:       "#FFFFFF",
        sidebarBorder:   "#E2E8F0",
        sidebarActive:   "#F0FDFA",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl:    "1rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "brand-gradient":      "linear-gradient(135deg, #0F766E 0%, #6366F1 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #F0FDFA 0%, #EEF2FF 100%)",
      },
      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        cardHover: "0 4px 12px rgba(0,0,0,0.08)",
        modal:  "0 20px 60px rgba(0,0,0,0.15)",
      },
    },
  },
  safelist: [
    "text-primary","text-secondary","text-aiAccent","text-highlight",
    "text-success","text-warning","text-danger",
    "bg-primary","bg-secondary","bg-aiAccent",
    "border-primary","border-secondary","border-aiAccent",
  ],
  plugins: [],
};