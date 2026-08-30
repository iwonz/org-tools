"use client";

import { useFormatter, useMessages, useTranslations } from "next-intl";
import { useCallback } from "react";
import { encodeUiMessageKey } from "@/i18n/intl-messages";
import {
  isUiTextKey,
  type UiMessageDescriptor,
  type UiMessageValues,
  type UiTextKey,
} from "@/i18n/messages";
import type enMessages from "../../messages/en.json";

export type { UiMessageDescriptor, UiMessageValues, UiTextKey } from "@/i18n/messages";

const interpolate = (message: string, values: UiMessageValues | undefined) => {
  if (!values) return message;
  return message.replace(/\{([A-Za-z0-9_]+)\}/gu, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
};

export const useUiText = () => {
  const messages = useMessages() as unknown as typeof enMessages;
  return useCallback(
    (key: UiTextKey, values?: UiMessageValues) =>
      interpolate((messages.Ui as Record<string, string>)[encodeUiMessageKey(key)] ?? key, values),
    [messages.Ui],
  );
};

export const useMessageText = () => {
  const t = useUiText();
  const format = useFormatter();
  return useCallback(
    (descriptor: UiMessageDescriptor) =>
      t(
        descriptor.key,
        descriptor.values
          ? Object.fromEntries(
              Object.entries(descriptor.values).map(([key, value]) => [
                key,
                typeof value === "number" ? format.number(value) : value,
              ]),
            )
          : undefined,
      ),
    [format, t],
  );
};

export const useRuntimeUiText = () => {
  const t = useUiText();
  return useCallback(
    (message: string) => {
      if (isUiTextKey(message)) return t(message);

      return t("An unexpected error occurred.");
    },
    [t],
  );
};

export const useCountText = () => useTranslations("Counts");
export const useAppFormatter = () => useFormatter();
