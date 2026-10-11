/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#12121a",
        "surface-2": "#1a1a26",
        "surface-3": "#22223a",
        primary: "#6c63ff",
        "primary-dark": "#4c45cc",
        accent: "#f72585",
        gold: "#fbbf24",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.7) 50%, rgba(10,10,15,0.3) 100%)",
        "card-gradient":
          "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(108,99,255,0.35)",
        "glow-accent": "0 0 24px rgba(247,37,133,0.35)",
        card: "0 8px 32px rgba(0,0,0,0.6)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        fadeUp: "fadeUp 0.5s ease forwards",
      },
    },
  },
  plugins: [],
}
