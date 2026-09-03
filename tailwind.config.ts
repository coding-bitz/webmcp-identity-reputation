import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--color-paper, #010204)",
          2: "var(--color-paper-2, #03060d)",
          3: "var(--color-paper-3, #0c121a)",
        },
        ink: {
          DEFAULT: "var(--color-ink, #e9f0f5)",
          2: "var(--color-ink-2, #718391)",
        },
        rule: "var(--color-rule, #1c222b)",
        accent: {
          DEFAULT: "var(--color-accent, #00bd8f)",
          sub: "var(--color-accent-sub, #3aa85b)",
          ink: "var(--color-accent-ink, #010204)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive, #fb2c36)",
          foreground: "#f8f8f8",
        },
      },
      fontFamily: {
        display: ["var(--font-geist-pixel)", "var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        card: "var(--radius-card, 0.75rem)",
        input: "var(--radius-input, 0.5rem)",
        pill: "var(--radius-pill, 9999px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
