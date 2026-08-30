import { test as base, expect } from "@playwright/test";

import { createBrowserDiagnostics } from "../browser-diagnostics.mjs";

export { expect };

export const test = base.extend<{ browserDiagnostics: undefined }>({
  browserDiagnostics: [
    async ({ context }, use, testInfo) => {
      const diagnostics = createBrowserDiagnostics({
        runtime: String(testInfo.project.metadata.runtime ?? "browser"),
        scenario: testInfo.title,
      });
      for (const page of context.pages()) diagnostics.attach(page);
      context.on("page", diagnostics.attach);

      await use(undefined);

      await Promise.all(
        context.pages().map(async (page) => {
          if (!page.isClosed()) await page.waitForTimeout(100);
        }),
      );
      diagnostics.assertClean();
    },
    { auto: true },
  ],
});
