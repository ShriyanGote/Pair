/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",         // root entry
    "./app/**/*.{js,jsx,ts,tsx}",    // your code folders
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",

    // ⬇︎ EXCLUDE heavy dirs ‑‑ note: quotes *inside* the array element
    "!./node_modules",
    "!./.git",
    "!./.expo",
  ],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};