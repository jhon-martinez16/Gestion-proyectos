/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Tipografía ──────────────────────────────────────────────
      fontFamily: {
        sans:  ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        mono:  ["JetBrains Mono", "Courier New", "monospace"],
      },

      // ── Paleta ──────────────────────────────────────────────────
      colors: {
        // Texto (warm zinc, no slate)
        "ink":      "#18181B",
        "ink-2":    "#71717A",
        "ink-3":    "#A1A1AA",
        "ink-4":    "#D4D4D8",

        // Fondos warm
        "canvas":   "#FAFAF9",
        "canvas-2": "#F4F4F5",

        // Borders
        "ui-border":       "#E7E5E4",
        "ui-border-strong": "#D4D4D8",

        // Acción primaria positiva (verde profundo)
        "primary":       "#15803D",
        "primary-dark":  "#166534",
        "primary-light": "#F0FDF4",

        // Acento (naranja — IA, HOY, highlights)
        "accent":        "#F97316",
        "accent-light":  "#FFF7ED",
        "accent-dark":   "#EA6C0A",

        // Estados semánticos (saturados, no pasteles)
        "state-blue":        "#2563EB",
        "state-blue-bg":     "#EFF6FF",
        "state-red":         "#DC2626",
        "state-red-bg":      "#FEF2F2",
        "state-amber":       "#D97706",
        "state-amber-bg":    "#FFFBEB",
        "state-violet":      "#7C3AED",
        "state-violet-bg":   "#F5F3FF",
        "state-zinc":        "#52525B",
        "state-zinc-bg":     "#F4F4F5",
        "state-green":       "#15803D",
        "state-green-bg":    "#F0FDF4",

        // Aliases para backward-compat con código existente
        "danger":        "#DC2626",
        "danger-light":  "#FEF2F2",
        "warning":       "#D97706",
        "warning-light": "#FFFBEB",
        "info":          "#2563EB",
        "info-light":    "#EFF6FF",
        "surface":       "#FAFAF9",

        // Sidebar (dark navy)
        "sidebar":       "#0F172A",
      },

      // ── Sombras multi-capa ───────────────────────────────────────
      boxShadow: {
        "card":        "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-hover":  "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        "elevated":    "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)",
        "fab":         "0 10px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
        "modal":       "0 0 0 1px rgba(0,0,0,0.05), 0 24px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)",
        "focus":       "0 0 0 3px rgba(249,115,22,0.18)",
        "focus-green": "0 0 0 3px rgba(21,128,61,0.15)",
      },

      // ── Radios ──────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: "6px",
        sm:  "4px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
        "3xl": "24px",
      },

      // ── Tracking ─────────────────────────────────────────────────
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.02em",
        tight:    "-0.01em",
        normal:   "0em",
        wide:     "0.04em",
        wider:    "0.08em",
        widest:   "0.12em",
      },

      // ── Animaciones ──────────────────────────────────────────────
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.3" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        shimmer:          "shimmer 1.6s ease-in-out infinite",
        "pulse-dot":      "pulse-dot 2s ease-in-out infinite",
        "fade-up":        "fade-up 0.22s cubic-bezier(0.4,0,0.2,1) both",
        "slide-in-right": "slide-in-right 0.22s cubic-bezier(0.4,0,0.2,1) both",
        ping:             "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
      },

      // ── Transiciones ─────────────────────────────────────────────
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
}
