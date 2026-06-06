/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "9999px",
      md: "10000px",
      lg: "10001px",
      xl: "10002px",
      "2xl": "10003px"
    },
    extend: {
      colors: {
        ink: "#1f293d",
        deep: "#353d54",
        muted: "#647074",
        brand: {
          50: "#f3fffe",
          100: "#e1f8f6",
          200: "#c5efec",
          300: "#8cf4ee",
          400: "#72d9d4",
          500: "#59b2b0",
          600: "#448481",
          700: "#376c6a",
          900: "#1f293d",
          DEFAULT: "#448481"
        },
        mint: "#59b2b0",
        danger: "#dc2626",
        warning: "#d97706"
      },
      fontFamily: {
        sans: [
          "Poppins",
          "Avenir Next",
          "Avenir",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        panel: "0 1px 2px rgba(31, 41, 61, 0.08), 0 16px 32px rgba(31, 41, 61, 0.08)",
        brand: "0 18px 48px rgba(68, 132, 129, 0.22)"
      }
    }
  },
  plugins: []
};
