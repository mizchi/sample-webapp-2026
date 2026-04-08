import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/**/*.test.ts", "apps/**/*.test.tsx", "scripts/**/*.test.ts"],
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
