import type { OrgToolsState } from "@org-tools/types";

import { parseOrgToolsState } from "@/lib/org-file";

type Preference = "local" | "remote";
type MergeConflict = { path: string };
type Missing = { readonly missing: true };
const MISSING: Missing = { missing: true };

const isMissing = (value: unknown): value is Missing => value === MISSING;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) && !isMissing(value);
const equal = (left: unknown, right: unknown) =>
  (isMissing(left) && isMissing(right)) ||
  (!isMissing(left) && !isMissing(right) && JSON.stringify(left) === JSON.stringify(right));
const cloneValue = (value: unknown | Missing): unknown | Missing =>
  isMissing(value) ? MISSING : structuredClone(value);

const arrayIdentityKey = (values: readonly unknown[][]): "employeeId" | "id" | "label" | null => {
  const items = values.flat();
  if (items.length === 0 || items.some((item) => !isRecord(item))) return null;
  for (const key of ["id", "employeeId", "label"] as const) {
    if (items.every((item) => typeof (item as Record<string, unknown>)[key] === "string"))
      return key;
  }
  return null;
};

const mergeValue = (
  base: unknown | Missing,
  local: unknown | Missing,
  remote: unknown | Missing,
  path: string,
  preference: Preference,
  conflicts: MergeConflict[],
): unknown | Missing => {
  if (equal(local, base)) return cloneValue(remote);
  if (equal(remote, base) || equal(local, remote)) return cloneValue(local);

  if (!isMissing(base) && !isMissing(local) && !isMissing(remote)) {
    if (isRecord(base) && isRecord(local) && isRecord(remote)) {
      const result: Record<string, unknown> = {};
      const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
      for (const key of keys) {
        const merged = mergeValue(
          Object.hasOwn(base, key) ? base[key] : MISSING,
          Object.hasOwn(local, key) ? local[key] : MISSING,
          Object.hasOwn(remote, key) ? remote[key] : MISSING,
          `${path}/${key}`,
          preference,
          conflicts,
        );
        if (!isMissing(merged)) result[key] = merged;
      }
      return result;
    }
    if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
      const identityKey = arrayIdentityKey([base, local, remote]);
      if (identityKey) {
        const baseById = new Map(
          base.map((item) => [(item as Record<string, unknown>)[identityKey] as string, item]),
        );
        const localById = new Map(
          local.map((item) => [(item as Record<string, unknown>)[identityKey] as string, item]),
        );
        const remoteById = new Map(
          remote.map((item) => [(item as Record<string, unknown>)[identityKey] as string, item]),
        );
        const order = [
          ...remote.map((item) => (item as Record<string, unknown>)[identityKey] as string),
          ...local.map((item) => (item as Record<string, unknown>)[identityKey] as string),
        ];
        const result: unknown[] = [];
        for (const id of [...new Set(order)]) {
          const merged = mergeValue(
            baseById.get(id) ?? MISSING,
            localById.get(id) ?? MISSING,
            remoteById.get(id) ?? MISSING,
            `${path}/${identityKey}:${id}`,
            preference,
            conflicts,
          );
          if (!isMissing(merged)) result.push(merged);
        }
        return result;
      }
    }
  }

  conflicts.push({ path });
  return cloneValue(preference === "local" ? local : remote);
};

const mergeWithPreference = (
  base: OrgToolsState,
  local: OrgToolsState,
  remote: OrgToolsState,
  preference: Preference,
) => {
  const conflicts: MergeConflict[] = [];
  const organization = mergeValue(
    base.organization,
    local.organization,
    remote.organization,
    "organization",
    preference,
    conflicts,
  );
  if (isMissing(organization)) throw new Error("Organization merge removed the root.");
  const candidate = { organization, ui: local.ui };
  try {
    return { conflicts, state: parseOrgToolsState(candidate) };
  } catch {
    return { conflicts, state: parseOrgToolsState({ organization, ui: remote.ui }) };
  }
};

export type StateThreeWayMerge = {
  conflicts: MergeConflict[];
  keepLocal: OrgToolsState;
  useRemote: OrgToolsState;
};

export const mergeOrgToolsStates = (
  base: OrgToolsState,
  local: OrgToolsState,
  remote: OrgToolsState,
): StateThreeWayMerge => {
  const remotePreferred = mergeWithPreference(base, local, remote, "remote");
  const localPreferred = mergeWithPreference(base, local, remote, "local");
  const conflicts = [
    ...new Map(remotePreferred.conflicts.map((conflict) => [conflict.path, conflict])).values(),
  ];
  return { conflicts, keepLocal: localPreferred.state, useRemote: remotePreferred.state };
};
