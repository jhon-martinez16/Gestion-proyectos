/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["DM Sans", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        mono:  ["JetBrains Mono", "Courier New", "monospace"],
      },
      colors: {
        primary:    "#16a34a",
        "primary-dark": "#15803d",
        "primary-light": "#dcfce7",
        accent:     "#f97316",
        "accent-light": "#fff7ed",
        danger:     "#ef4444",
        "danger-light": "#fef2f2",
        warning:    "#f59e0b",
        "warning-light": "#fffbeb",
        info:       "#3b82f6",
        "info-light": "#eff6ff",
        sidebar:    "#0f172a",
        surface:    "#f8fafc",
      },
      borderRadius: {
        DEFAULT: "6px",
        md:  "10px",
        lg:  "16px",
        xl:  "20px",
        xl2: "24px",
      },
      boxShadow: {
        card:       "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
}
