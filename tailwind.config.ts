import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "spin-gradient": {
          "0%": { "border-top-color": "transparent" },
          "50%": { "border-right-color": "transparent" },
          "100%": { "border-top-color": "transparent" },
        },
      },
      animation: {
        "spin-gradient": "spin-gradient 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
