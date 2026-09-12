import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F5E7E",
          dark: "#0A4258",
          light: "#E1EDF2",
        },
        // Paleta do site público (landing) — separada da paleta do ERP.
        verus: {
          bg: "#092935",
          bg2: "#143139",
          card: "#0F3543",
          line: "#1E4A57",
          text: "#F2F6F8",
          muted: "#B3CCD0",
          green: "#25D466",
          greenDark: "#1DB957",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "system-ui", "sans-serif"],
        sora: ["var(--font-sora)", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
