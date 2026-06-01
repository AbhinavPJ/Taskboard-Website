import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["src/tests/all.test.ts"],
    setupFiles: "./src/tests/setup.ts",
    environment: "node",
    silent: false,
    reporter: "verbose",
  },
});
