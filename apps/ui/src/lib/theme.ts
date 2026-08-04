import type { UiTheme } from "@org-tools/types";

export const THEME_STORAGE_KEY = "org-tools-theme";

export const isUiTheme = (value: unknown): value is UiTheme =>
  value === "light" || value === "dark" || value === "system";

export const normalizeUiTheme = (value: unknown): UiTheme => (isUiTheme(value) ? value : "system");
