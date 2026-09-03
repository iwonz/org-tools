"use client";

import { NextIntlClientProvider } from "next-intl";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { prepareMessagesForNextIntl } from "@/i18n/intl-messages";
import {
  APP_LOCALE_CONFIG,
  type AppLocale,
  isAppLocale,
  LOCALE_STORAGE_KEY,
  persistLocale,
  resolveInitialLocale,
} from "@/i18n/locale";
import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";
import ruMessages from "../../messages/ru.json";
import zhMessages from "../../messages/zh.json";

const messagesByLocale = {
  ar: prepareMessagesForNextIntl(arMessages),
  en: prepareMessagesForNextIntl(enMessages),
  es: prepareMessagesForNextIntl(esMessages),
  fr: prepareMessagesForNextIntl(frMessages),
  ru: prepareMessagesForNextIntl(ruMessages),
  zh: prepareMessagesForNextIntl(zhMessages),
} satisfies Record<AppLocale, typeof enMessages>;

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setResolvedLocale] = useState<AppLocale | null>(null);

  useEffect(() => {
    const nextLocale = resolveInitialLocale({
      languages: navigator.languages,
      readStoredLocale: () => window.localStorage.getItem(LOCALE_STORAGE_KEY),
    });
    persistLocale(nextLocale, window.localStorage);
    setResolvedLocale(nextLocale);
  }, []);

  useEffect(() => {
    if (!locale) return;

    const messages = messagesByLocale[locale];
    const syncDocumentMetadata = () => {
      document.documentElement.lang = locale;
      document.documentElement.dir = APP_LOCALE_CONFIG[locale].direction;

      const titles = [...document.head.querySelectorAll("title")];
      const title = titles[0] ?? document.createElement("title");
      if (!title.isConnected) document.head.append(title);
      if (title.textContent !== messages.Metadata.title)
        title.textContent = messages.Metadata.title;
      for (const duplicateTitle of titles.slice(1)) duplicateTitle.remove();

      const descriptions = [
        ...document.head.querySelectorAll<HTMLMetaElement>('meta[name="description"]'),
      ];
      const description = descriptions[0] ?? document.createElement("meta");
      if (!description.isConnected) {
        description.name = "description";
        document.head.append(description);
      }
      if (description.content !== messages.Metadata.description) {
        description.content = messages.Metadata.description;
      }
      for (const duplicateDescription of descriptions.slice(1)) duplicateDescription.remove();
    };

    syncDocumentMetadata();
    const observer = new MutationObserver(syncDocumentMetadata);
    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, [locale]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    if (!isAppLocale(nextLocale)) return;
    persistLocale(nextLocale, window.localStorage);
    setResolvedLocale(nextLocale);
  }, []);

  if (!locale) {
    return <div aria-busy="true" className="h-dvh w-dvw bg-shell" />;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export const useAppLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useAppLocale must be used inside LocaleProvider.");
  return context;
};
