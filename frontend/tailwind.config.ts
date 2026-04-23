import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./contexts/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18201f",
        mist: "#eff5f2",
        fern: "#24755a",
        signal: "#ffbf47",
        coral: "#e15b4f",
        night: "#101514"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(16, 21, 20, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
