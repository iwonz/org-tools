import type { AppLocale, EmployeeDisplayFormats, EmployeeDisplayLineGaps } from "@org-tools/types";

import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";
import ruMessages from "../../messages/ru.json";
import zhMessages from "../../messages/zh.json";

const managerLabelByLocale: Record<AppLocale, string> = {
  ar: arMessages.Ui.Manager,
  en: enMessages.Ui.Manager,
  es: esMessages.Ui.Manager,
  fr: frMessages.Ui.Manager,
  ru: ruMessages.Ui.Manager,
  zh: zhMessages.Ui.Manager,
};

export const createDefaultEmployeeDisplayFormats = (locale: AppLocale): EmployeeDisplayFormats => ({
  editor: "{fullName}\n{tags}",
  editorExport: `{fullName} {isBoss ? '· ${managerLabelByLocale[locale]}' : ''}\n{tags}`,
  employees: "{fullName}\n{username}\n{email}\n{positions}\n{tags}",
  units: "{fullName}\n{username}\n{email}\n{positions}\n{tags}",
});

export const DEFAULT_EMPLOYEE_DISPLAY_FORMATS = createDefaultEmployeeDisplayFormats("en");

export const DEFAULT_EMPLOYEE_DISPLAY_LINE_GAPS: EmployeeDisplayLineGaps = {
  editor: 4,
  editorExport: 4,
  employees: 4,
  units: 4,
};
