import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync } from "fs";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        browser: resolve(__dirname, "src/browser.ts"),
        node: resolve(__dirname, "src/node.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "ml-kmeans",
        "chroma-js",
        "pureimage",
        "sharp",
        "fs",
        "tempfile",
        "temp-dir",
      ],
    },
  },
  plugins: [
    {
      name: "copy-dts",
      writeBundle() {
        copyFileSync("src/index.d.ts", "dist/index.d.ts");
      },
    },
  ],
});
