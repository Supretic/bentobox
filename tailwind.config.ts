import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tare: {
          DEFAULT: "oklch(0.58 0.18 25)",
          dark: "oklch(0.48 0.20 25)",
          pale: "oklch(0.93 0.04 25)",
        },
        lacquer: {
          DEFAULT: "oklch(0.20 0.012 50)",
          light: "oklch(0.32 0.012 50)",
          inner: "oklch(0.16 0.012 50)",
        },
        rice: {
          DEFAULT: "oklch(0.975 0.012 85)",
          dark: "oklch(0.94 0.014 85)",
        },
        tamago: "oklch(0.84 0.13 85)",
        nori: "oklch(0.32 0.04 150)",
        shoyu: "oklch(0.30 0.04 60)",
        salmon: "oklch(0.86 0.07 30)",
      },
      fontFamily: {
        serif: ['"Shippori Mincho"', '"Times New Roman"', "serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        bento:
          "inset 0 0 0 1px oklch(0.30 0.012 50), 0 18px 40px -10px rgba(0,0,0,0.4)",
        cook: "0 3px 0 oklch(0.48 0.20 25)",
      },
    },
  },
  plugins: [],
};

export default config;
