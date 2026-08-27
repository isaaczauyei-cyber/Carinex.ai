import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carinex: {
          navy: "#081C2D",
          navySoft: "#13273A", // lighter navy panel tone, used for depth without leaving the palette
          emerald: "#1F7A63",
          white: "#F5F7FA",
          gray: "#9AA3A8",
          yellow: "#FEDD00", // restricted use — badges/achievement moments only, never large fills
        },
      },
      fontFamily: {
        // Single family per the brand direction (restraint over a second display face);
        // weight carries the hierarchy instead.
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        arch: "999px 999px 0 0", // the recurring "arch" signature shape used across the site
      },
    },
  },
  plugins: [],
};

export default config;
