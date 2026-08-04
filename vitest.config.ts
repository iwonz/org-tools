import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const appSrcPath = fileURLToPath(new URL("./apps/ui/src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": appSrcPath,
    },
  },
  test: {
    include: ["apps/ui/src/**/*.test.ts"],
  },
});
