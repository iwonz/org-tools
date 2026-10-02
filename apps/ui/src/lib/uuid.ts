const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type UuidCrypto = {
  randomUUID(): string;
};

export const createUuid = (provider: UuidCrypto | null = globalThis.crypto): string => {
  if (!provider || typeof provider.randomUUID !== "function") {
    throw new Error("A cryptographically secure UUID generator is required.");
  }
  return provider.randomUUID();
};

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);
