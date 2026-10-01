import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { argon2id, hash, needsRehash, verify } from "argon2";

export const ARGON2_OPTIONS = {
  hashLength: 32,
  memoryCost: 65_536,
  parallelism: 1,
  timeCost: 3,
  type: argon2id,
} as const;

export class PasswordPolicyError extends Error {
  constructor() {
    super("Password must contain between 15 and 128 Unicode code points.");
    this.name = "PasswordPolicyError";
  }
}

export const normalizeAccountEmail = (input: string): string =>
  input.trim().normalize("NFKC").toLocaleLowerCase("en-US");

export const isPlausibleAccountEmail = (input: string): boolean => {
  const value = normalizeAccountEmail(input);
  if (value.length < 3 || value.length > 320 || /\s/u.test(value)) return false;
  const separator = value.lastIndexOf("@");
  return separator > 0 && separator < value.length - 1;
};

export const assertPasswordPolicy = (password: string): void => {
  const length = [...password].length;
  if (length < 15 || length > 128) throw new PasswordPolicyError();
};

export const hashPassword = async (password: string): Promise<string> => {
  assertPasswordPolicy(password);
  return hash(password, ARGON2_OPTIONS);
};

export const verifyPassword = async (
  encodedHash: string,
  password: string,
): Promise<{ needsRehash: boolean; valid: boolean }> => {
  const valid = await verify(encodedHash, password).catch(() => false);
  return { needsRehash: valid && needsRehash(encodedHash, ARGON2_OPTIONS), valid };
};

export const createOpaqueToken = (): string => randomBytes(32).toString("base64url");

export const createSessionCsrfToken = (sessionId: string, secret: string): string =>
  createHmac("sha256", secret).update(`org-tools-session-csrf\0${sessionId}`).digest("base64url");

export const digestToken = (token: string): Buffer => createHash("sha256").update(token).digest();

export const safeTokenEqual = (left: string, right: string): boolean => {
  const leftDigest = digestToken(left);
  const rightDigest = digestToken(right);
  return timingSafeEqual(leftDigest, rightDigest);
};

export const createTemporaryPassword = (): string => {
  const value = randomBytes(24).toString("base64url");
  assertPasswordPolicy(value);
  return value;
};
