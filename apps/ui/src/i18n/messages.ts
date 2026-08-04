import enMessages from "../../messages/en.json";

export type UiTextKey = keyof typeof enMessages.Ui;
export type UiMessageValues = Record<string, number | string>;
export type UiMessageDescriptor = {
  key: UiTextKey;
  values?: UiMessageValues;
};

export class LocalizedError extends Error {
  readonly descriptor: UiMessageDescriptor;

  constructor(descriptor: UiMessageDescriptor) {
    super(descriptor.key);
    this.name = "LocalizedError";
    this.descriptor = descriptor;
  }
}

export const uiMessage = (key: UiTextKey, values?: UiMessageValues): UiMessageDescriptor =>
  values ? { key, values } : { key };

export const isUiTextKey = (value: string): value is UiTextKey =>
  Object.hasOwn(enMessages.Ui, value);

export const describeError = (
  error: unknown,
  fallback: UiTextKey = "An unexpected error occurred.",
): UiMessageDescriptor => {
  if (error instanceof LocalizedError) return error.descriptor;
  if (error instanceof Error && isUiTextKey(error.message)) return uiMessage(error.message);
  return uiMessage(fallback);
};
