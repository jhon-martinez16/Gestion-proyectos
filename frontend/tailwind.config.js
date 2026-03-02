/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#1E40AF",
        accent: "#F59E0B",
        dark: "#0F172A",
        surface: "#1E293B",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
}