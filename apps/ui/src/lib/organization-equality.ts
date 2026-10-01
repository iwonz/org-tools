import type { OrganizationDocument } from "@org-tools/types";

export const organizationWithoutUpdateTimestamps = (
  organization: OrganizationDocument,
): OrganizationDocument => ({
  ...organization,
  employees: organization.employees.map(({ updatedAt: _updatedAt, ...employee }) => ({
    ...employee,
    updatedAt: "1970-01-01T00:00:00.000Z",
  })),
  views: organization.views.map(({ updatedAt: _updatedAt, ...view }) => ({
    ...view,
    structure: {
      ...view.structure,
      units: view.structure.units.map(({ updatedAt: _unitUpdatedAt, ...unit }) => ({
        ...unit,
        updatedAt: "1970-01-01T00:00:00.000Z",
      })),
    },
    updatedAt: "1970-01-01T00:00:00.000Z",
  })),
});

export const organizationBusinessJson = (organization: OrganizationDocument): string =>
  JSON.stringify(canonicalizeJson(organizationWithoutUpdateTimestamps(organization)));

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalizeJson(child)]),
  );
};

export const organizationBusinessHash = async (
  organization: OrganizationDocument,
): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(organizationBusinessJson(organization)),
  );
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
};
