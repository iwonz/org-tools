import type { Page } from "@playwright/test";

export type BrowserDiagnostic = {
  category: string;
  message: string;
  url: string;
};

export type BrowserDiagnostics = {
  assertClean(): void;
  attach(page: Page): void;
  diagnostics: BrowserDiagnostic[];
};

export function createBrowserDiagnostics(options: {
  runtime: string;
  scenario: string;
}): BrowserDiagnostics;
