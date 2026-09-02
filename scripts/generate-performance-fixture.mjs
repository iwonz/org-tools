#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const employeeCount = 20_000;
const unitCount = 4_000;
const timestamp = "2026-01-15T12:00:00.000Z";

const uuid = (group, index) =>
  `00000000-0000-${group}-8000-${index.toString(16).padStart(12, "0")}`;
const unitId = (index) => uuid("4001", index + 1);
const normalizeIdentityPart = (value) =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const employeeId = (index) => {
  const serial = String(index + 1).padStart(5, "0");
  return createHash("sha256")
    .update(
      ["Employee", serial, `employee${serial}@example.test`]
        .map(normalizeIdentityPart)
        .join("\u001f"),
      "utf8",
    )
    .digest("hex");
};

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
];
const state = {
  organization: {
    employees,
    structure: { layoutMode: "topDown", units },
  },
  ui: {
    activeTab: "orgEditor",
    analytics: { filters: emptyFilters, query: "" },
    calendar: { cloudExpanded: false, monthIndex: 6, year: 2026 },
    download: {
      employeeFieldOrder: employeeFields,
      employeeFilters: emptyFilters,
      employeeQuery: "",
      excludedEmployeeIds: [],
      excludedJsonTagKeys: [],
      excludedJsonUnitIds: [],
      jsonFieldNames: {
        employee: Object.fromEntries(employeeFields.map((field) => [field, field])),
        tags: { collection: "tags", fields: { date: "date", label: "label" } },
        units: {
          collection: "units",
          fields: Object.fromEntries(unitFields.map((field) => [field, field])),
        },
      },
      jsonTagFieldOrder: ["label", "date"],
      jsonUnitFieldOrder: unitFields,
      rowMode: "allUnits",
      selectedEmployeeFieldKeys: ["username"],
      selectedFilters: emptyFilters,
      selectedJsonTagFieldKeys: [],
      selectedJsonUnitFieldKeys: [],
      selectedQuery: "",
      selections: [],
      tabMode: "json",
      templateFormat: "{email}, ",
      unitQuery: "",
    },
    editor: {
      searchOpen: false,
      searchQuery: "",
      selectedItems: [],
      viewport: { scale: 1, x: 0, y: 0 },
    },
    employees: { filters: emptyFilters, query: "" },
    expandedUnitIds: [],
    locale: "en",
    selectedUnitId: null,
    sidebarCollapsed: true,
    theme: "light",
    units: { employeeFilters: emptyFilters, employeeQuery: "", unitQuery: "" },
  },
};

const directory = await mkdtemp(join(tmpdir(), "org-tools-performance-"));
const outputPath = join(directory, "org-tools-state.json");
await writeFile(outputPath, `${JSON.stringify(state)}\n`, "utf8");
console.log(outputPath);
