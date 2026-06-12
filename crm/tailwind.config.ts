import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        live: "var(--live)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
      },
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "fade-up": "fade-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
