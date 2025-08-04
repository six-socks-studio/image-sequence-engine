import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "examples",
  base: "/image-sequence-engine/",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "examples/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});