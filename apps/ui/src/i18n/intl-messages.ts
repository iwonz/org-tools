const NEXT_INTL_PERIOD_TOKEN = "__org_tools_period__";

type MessageCatalog = {
  Counts: Record<string, string>;
  Metadata: Record<string, string>;
  Ui: Record<string, string>;
};

export const encodeUiMessageKey = (key: string) => key.replaceAll(".", NEXT_INTL_PERIOD_TOKEN);

const assertDotFreeKeys = (namespace: string, messages: Record<string, string>) => {
  const invalidKey = Object.keys(messages).find((key) => key.includes("."));
  if (invalidKey) {
    throw new Error(`${namespace} message keys must not contain periods: ${invalidKey}`);
  }
};

export const prepareMessagesForNextIntl = <Catalog extends MessageCatalog>(
  messages: Catalog,
): Catalog => {
  assertDotFreeKeys("Metadata", messages.Metadata);
  assertDotFreeKeys("Counts", messages.Counts);

  const encodedUi: Record<string, string> = {};
  for (const [key, value] of Object.entries(messages.Ui)) {
    const encodedKey = encodeUiMessageKey(key);
    if (Object.hasOwn(encodedUi, encodedKey)) {
      throw new Error(`UI message key encoding collision: ${key}`);
    }
    encodedUi[encodedKey] = value;
  }

  return { ...messages, Ui: encodedUi } as Catalog;
};
