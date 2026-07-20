import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".expo", "android", "ios"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
