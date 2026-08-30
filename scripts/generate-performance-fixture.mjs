#!/usr/bin/env node

import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const employeeCount = 20_000;
const unitCount = 4_000;
const timestamp = "2026-01-15T12:00:00.000Z";

const uuid = (group, index) =>
  `00000000-0000-${group}-8000-${index.toString(16).padStart(12, "0")}`;
const employeeId = (index) => uuid("4000", index + 1);
const unitId = (index) => uuid("4001", index + 1);
const mainViewId = "00000000-0000-4002-8000-000000000001";

const employees = Array.from({ length: employeeCount }, (_, index) => {
  const serial = String(index + 1).padStart(5, "0");
  return {
    avatarBase64Url: null,
    birthday: `${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`,
    createdAt: timestamp,
    email: `employee${serial}@example.test`,
    firstName: "Employee",
    gender: "unspecified",
    id: employeeId(index),
    lastName: serial,
    phone: null,
    profileUrl: null,
    tags: [
      {
        date:
          index % 4 === 0
            ? `2026-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`
            : null,
        label: `Group ${String((index % 20) + 1).padStart(2, "0")}`,
      },
    ],
    updatedAt: timestamp,
    username: `employee${serial}`,
  };
});

const units = Array.from({ length: unitCount }, (_, index) => {
  const firstEmployeeIndex = index * (employeeCount / unitCount);
  const employeeIds = Array.from({ length: employeeCount / unitCount }, (_, offset) =>
    employeeId(firstEmployeeIndex + offset),
  );
  return {
    bossEmployeeId: employeeIds[0] ?? null,
    collapsed: false,
    createdAt: timestamp,
    employeeIds,
    employeePositions: employeeIds.map((id, positionIndex) => ({
      employeeId: id,
      position: positionIndex === 0 ? "Unit Lead" : "Specialist",
    })),
    id: unitId(index),
    liveFilter: null,
    name: `Unit ${String(index + 1).padStart(4, "0")}`,
    order: index,
    parentId: null,
    updatedAt: timestamp,
    x: (index % 50) * 360,
    y: Math.floor(index / 50) * 240,
  };
});

const emptyFilters = {
  birthday: null,
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
};
const unitFields = ["unitId", "unitName", "unitFullPath", "position", "isBoss"];
const employeeFields = [
  "id",
  "firstName",
  "lastName",
  "fullName",
  "gender",
  "username",
  "profileUrl",
  "email",
  "phone",
  "avatarBase64Url",
  "birthday",
  "tags",
  "tagDates",
];
const state = {
  organization: {
    employees,
    views: [
      {
        createdAt: timestamp,
        document: {
          employeeOverrides: [],
          employees: [],
          layoutMode: "topDown",
          units,
        },
        id: mainViewId,
        kind: "main",
        name: "Main",
        updatedAt: timestamp,
      },
    ],
  },
  ui: {
    activeTab: "orgEditor",
    activeViewId: mainViewId,
    analytics: { filters: emptyFilters, query: "" },
    calendar: { cloudExpanded: false, monthIndex: 6, year: 2026 },
    download: {
      employeeFieldOrder: employeeFields,
      employeeFilters: emptyFilters,
      employeeQuery: "",
      excludedEmployeeIds: [],
      fieldNames: Object.fromEntries(
        [...employeeFields, ...unitFields].map((field) => [field, field]),
      ),
      flatUnitFieldOrder: unitFields,
      jsonUnitFieldOrder: unitFields,
      rowMode: "allUnits",
      selectedEmployeeFieldKeys: ["username"],
      selectedFilters: emptyFilters,
      selectedFlatUnitFieldKeys: ["unitName", "unitFullPath"],
      selectedJsonUnitFieldKeys: unitFields,
      selectedQuery: "",
      selections: [],
      sourceViewId: mainViewId,
      tabMode: "csv",
      templateFormat: "{email}, ",
      unitFullPathSeparator: " / ",
      unitQuery: "",
    },
    editor: { searchOpen: false, searchQuery: "" },
    employees: { filters: emptyFilters, query: "" },
    expandedUnitIds: [],
    locale: "en",
    selectedUnitId: null,
    sidebarCollapsed: true,
    theme: "light",
    units: { employeeFilters: emptyFilters, employeeQuery: "", unitQuery: "" },
    views: [{ selectedItems: [], viewId: mainViewId, viewport: { scale: 1, x: 0, y: 0 } }],
  },
};

const directory = await mkdtemp(join(tmpdir(), "org-tools-performance-"));
const outputPath = join(directory, "org-tools-state.json");
await writeFile(outputPath, `${JSON.stringify(state)}\n`, "utf8");
console.log(outputPath);
