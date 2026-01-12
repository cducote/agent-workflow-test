import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        claude: {
          primary: "#D97757",
          secondary: "#1A1A1A",
          accent: "#E8DDD4",
          "text-light": "#FAFAF9",
          "text-dark": "#292524",
          success: "#10B981",
          error: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
export default config;
