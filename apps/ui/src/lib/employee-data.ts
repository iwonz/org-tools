import type { EditableEmployeeFields, EmployeeGender, EmployeeId } from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { parseEmployeeBirthday } from "@/lib/birthday";
import { createEmployeeId } from "@/lib/employee-id";
import { normalizeEmployeeTags } from "@/lib/employee-tags";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

export const createUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const createOrganizationEmployeeId = (
  fields: Pick<EditableEmployeeFields, "email" | "firstName" | "lastName">,
): EmployeeId => createEmployeeId(fields);

export const EMPLOYEE_GENDERS = ["male", "female", "unspecified"] as const;

export const isEmployeeGender = (value: unknown): value is EmployeeGender =>
  typeof value === "string" && EMPLOYEE_GENDERS.includes(value as EmployeeGender);

export const normalizeEmployeeGender = (value: unknown): EmployeeGender => {
  if (!isEmployeeGender(value)) {
    throw new LocalizedError(uiMessage("Gender is invalid."));
  }
  return value;
};

export const normalizeOptionalEmployeeText = (value: string | null | undefined) =>
  value?.trim() || null;

export const normalizeBirthday = (value: string | null): string | null => {
  const normalized = normalizeOptionalEmployeeText(value);
  if (normalized === null) return null;

  if (!/^(\d{2})\.(\d{2})\.(\d{4})$/.test(normalized)) {
    throw new LocalizedError(uiMessage("Birthday must use the DD.MM.YYYY format."));
  }
  if (!parseEmployeeBirthday(normalized)) {
    throw new LocalizedError(uiMessage("Birthday must be a valid date that is not in the future."));
  }

  return normalized;
};

export const normalizeProfileUrl = (value: string | null): string | null => {
  const normalized = normalizeOptionalEmployeeText(value);
  if (normalized === null) return null;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new LocalizedError(uiMessage("Profile URL must be an absolute HTTP(S) URL."));
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new LocalizedError(uiMessage("Profile URL must use HTTP or HTTPS."));
  }

  return normalized;
};

export const normalizeAvatarBase64Url = (value: string | null): string | null => {
  const normalized = normalizeOptionalEmployeeText(value);
  if (normalized === null) return null;

  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(normalized);
  const payload = match?.[2];
  if (!payload || payload.length % 4 !== 0) {
    throw new LocalizedError(uiMessage("Avatar must be a base64 PNG, JPEG, or WebP data URL."));
  }

  const paddingBytes = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const decodedBytes = (payload.length / 4) * 3 - paddingBytes;
  if (decodedBytes > MAX_AVATAR_BYTES) {
    throw new LocalizedError(uiMessage("Avatar exceeds the 2 MiB decoded size limit."));
  }

  return normalized;
};

export const isSafeAvatarBase64Url = (value: string | null | undefined): value is string => {
  try {
    return normalizeAvatarBase64Url(value ?? null) !== null;
  } catch {
    return false;
  }
};

export const isSafeProfileUrl = (value: string | null | undefined): value is string => {
  try {
    return normalizeProfileUrl(value ?? null) !== null;
  } catch {
    return false;
  }
};

export const normalizeEditableEmployeeFields = (
  fields: EditableEmployeeFields,
): EditableEmployeeFields => {
  const normalized: EditableEmployeeFields = {
    avatarBase64Url: normalizeAvatarBase64Url(fields.avatarBase64Url),
    birthday: normalizeBirthday(fields.birthday),
    email: normalizeOptionalEmployeeText(fields.email),
    firstName: fields.firstName.trim(),
    gender: normalizeEmployeeGender(fields.gender),
    lastName: fields.lastName.trim(),
    phone: normalizeOptionalEmployeeText(fields.phone),
    profileUrl: normalizeProfileUrl(fields.profileUrl),
    tags: normalizeEmployeeTags(fields.tags),
    username: normalizeOptionalEmployeeText(fields.username),
  };
  if (!normalized.firstName && !normalized.lastName && !normalized.username && !normalized.email) {
    throw new LocalizedError(uiMessage("Employee must have a name, username, or email."));
  }
  return normalized;
};
