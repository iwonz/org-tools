#!/usr/bin/env node

import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const employeeCount = 20_000;
const unitCount = 4_000;
const timestamp = "2026-01-15T12:00:00.000Z";

const uuid = (group, index) =>
  `00000000-0000-${group}-8000-${index.toString(16).padStart(12, "0")}`;
const employeeId = (index) => uuid("4002", index + 1);
const unitId = (index) => uuid("4001", index + 1);
const tagId = (index) => uuid("4003", index + 1);

const tagDefinitions = Array.from({ length: 20 }, (_, index) => ({
  color: ["blue", "cyan", "green", "orange", "red", "rose", "teal", "amber"][index % 8],
  id: tagId(index),
  label: `Group ${String(index + 1).padStart(2, "0")}`,
}));

const employees = Array.from({ length: employeeCount }, (_, index) => {
  const serial = String(index + 1).padStart(5, "0");
  return {
    avatarBase64Url: null,
    birthday: `${String((index % 28) + 1).padStart(2, "0")}.${String((index % 12) + 1).padStart(2, "0")}.${index % 5 === 0 ? "1900" : String(1970 + (index % 35))}`,
    createdAt: timestamp,
    customFieldValues: {},
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
        tagId: tagId(index % tagDefinitions.length),
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
    noteMarkdown: "",
    staffingSlots: [],
    order: index,
    parentId: null,
    updatedAt: timestamp,
    x: (index % 50) * 360,
    y: Math.floor(index / 50) * 240,
  };
});

const emptyFilters = {
  birthday: null,
  customFields: [],
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
};

const fixturePath = fileURLToPath(
  new URL("../packages/screenshots/fixtures/synthetic-state.json", import.meta.url),
);
const state = JSON.parse(await readFile(fixturePath, "utf8"));
const systemView = state.organization.views.find((view) => view.kind === "system");
if (!systemView) throw new Error("Synthetic system View is unavailable.");

systemView.structure.canvasElements = [];
systemView.structure.units = units;
systemView.updatedAt = timestamp;
state.organization.employeeFieldDefinitions = [];
state.organization.employees = employees;
state.organization.tags = tagDefinitions;
state.organization.views = [systemView];
state.ui.activeTab = "orgEditor";
state.ui.download.employeeFilters = structuredClone(emptyFilters);
state.ui.download.employeeQuery = "";
state.ui.download.excludedEmployeeIds = [];
state.ui.download.excludedJsonTagKeys = [];
state.ui.download.excludedJsonUnitIds = [];
state.ui.download.jsonFieldNames.custom = {};
state.ui.download.jsonTopLevelFieldOrder = state.ui.download.jsonTopLevelFieldOrder.filter(
  (field) => !field.startsWith("custom:"),
);
state.ui.download.selectedCustomEmployeeFieldIds = [];
state.ui.download.selectedFilters = structuredClone(emptyFilters);
state.ui.download.selectedQuery = "";
state.ui.download.selections = [];
state.ui.download.sourceViewId = systemView.id;
state.ui.download.unitQuery = "";
state.ui.editor = {
  activeViewId: systemView.id,
  searchOpen: false,
  searchQuery: "",
  views: [
    {
      distributionModeUnitIds: [],
      selectedItems: [],
      viewId: systemView.id,
      viewport: { scale: 1, x: 0, y: 0 },
    },
  ],
};
state.ui.employees = { filters: structuredClone(emptyFilters), query: "" };
state.ui.expandedUnitIds = [];
state.ui.selectedUnitId = null;
state.ui.units = {
  employeeFilters: structuredClone(emptyFilters),
  employeeQuery: "",
  unitQuery: "",
};

const directory = await mkdtemp(join(tmpdir(), "org-tools-performance-"));
const outputPath = join(directory, "org-tools-state.json");
await writeFile(outputPath, `${JSON.stringify(state)}\n`, "utf8");
console.log(outputPath);
