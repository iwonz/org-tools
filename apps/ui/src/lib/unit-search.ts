import type { UnitId, UnitSearchDocument } from "@org-tools/types";

export const getVisibleUnitIdsForNameSearch = (
  unitSearchDocuments: UnitSearchDocument[] | null | undefined,
  queryTokens: string[],
) => {
  if (!unitSearchDocuments || queryTokens.length === 0) return null;

  const visibleUnitIds = new Set<UnitId>();

  for (const document of unitSearchDocuments) {
    if (!queryTokens.every((token) => document.normalizedName.includes(token))) {
      continue;
    }

    for (const unitId of document.pathIds) {
      visibleUnitIds.add(unitId);
    }
  }

  return visibleUnitIds;
};
