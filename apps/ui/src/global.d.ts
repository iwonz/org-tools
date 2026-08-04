import enMessages from "../messages/en.json";
import type { AppLocale } from "./i18n/locale";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof enMessages;
  }
}
