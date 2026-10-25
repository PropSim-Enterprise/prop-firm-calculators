import { defineConfig } from "vite";

const CALCULATORS = ["drawdown", "position-size", "challenge-cost", "payout", "revenue"];

export default defineConfig({
  // Relative asset paths, so the build works on GitHub Pages or any folder.
  base: "./",
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        ...Object.fromEntries(CALCULATORS.map((c) => [c, `${c}/index.html`])),
      },
    },
  },
});
