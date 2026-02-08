// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-obsidian": "#050505",
        "bg-midnight": "#010101",
        "text-primary": "#FF4F4F",
        "border-glass": "rgba(255, 255, 255, 0.08)",
        "glass-plate": "rgba(255,255,255,0.03)",
      },
      boxShadow: {
        "red-pulse": "0 0 8px #FF4F4F",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-lg": "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      backdropBlur: {
        xs: "4px",
        md: "12px",
        lg: "20px",
      },
      keyframes: {
        "anamorphic-rotate": {
          "0%": { transform: "rotate(0deg) scaleX(1.6)" },
          "100%": { transform: "rotate(360deg) scaleX(1.6)" },
        },
        "liquid-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "type-red-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "slow-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "anamorphic-spin": "anamorphic-rotate 60s linear infinite",
        "liquid-shimmer": "liquid-shimmer 3.2s linear infinite",
        "type-red-blink": "type-red-blink 1s steps(1) infinite",
        "slow-fade": "slow-fade 400ms ease forwards",
      },
      backgroundImage: {
        "anamorphic-dual":
          "radial-gradient(800px 360px at 10% 30%, rgba(255,79,79,0.22), transparent 30%), radial-gradient(700px 320px at 90% 70%, rgba(88,88,255,0.12), transparent 30%)",
      },
      fontFamily: {
        ui: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
