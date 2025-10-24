import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import scrollbar from "tailwind-scrollbar";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "max-w-[1120px]",
    "max-w-[1150px]",
    "max-w-[1180px]",
    "max-w-[min(95vw,1120px)]",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Noto Sans JP"',
          '"Noto Sans"',
          "ui-sans-serif",
          "system-ui",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
    },
  },
  plugins: [forms, typography, scrollbar({ nocompatible: true })],
};
