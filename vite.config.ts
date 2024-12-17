import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      root: "examples",
      resolve: {
        alias: {
          "@": resolve(__dirname, "./src"),
        },
      },
    };
  } else {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/ImageSequenceEngine.ts"),
          name: "ImageSequenceEngine",
          fileName: (format) => `image-sequence-engine.${format}.js`,
          formats: ["es", "umd"],
        },
        rollupOptions: {
          external: ["lenis"],
          output: {
            globals: {
              lenis: "Lenis",
            },
          },
        },
        outDir: "dist",
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          "@": resolve(__dirname, "./src"),
        },
      },
    };
  }
});
