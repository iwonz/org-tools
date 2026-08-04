import { describe, expect, test } from "vitest";

import { createEmployeeImportAutoMapping, parseJsonEmployeeImport } from "@/lib/employee-import";
import { buildGenericImportPlan, createTeamImportAutoMapping } from "@/lib/generic-import";

describe("generic Teams and Employees mapping", () => {
  test("maps recursive JSON children and inline Employees", () => {
    const document = parseJsonEmployeeImport({
      teams: [
        {
          children: [
            {
              employees: [
                {
                  email: "avery.stone@example.test",
                  firstName: "Avery",
                  isBoss: true,
                  position: "Lead",
                  username: "avery",
                },
              ],
              key: "platform",
              name: "Platform",
            },
          ],
          key: "product",
          name: "Product",
        },
      ],
    });
    const collection = document.collections.find(({ id }) => id === "$.teams");
    if (!collection) throw new Error("Expected Teams collection.");
    const plan = buildGenericImportPlan(
      collection,
      createEmployeeImportAutoMapping(collection.sourceFields),
      createTeamImportAutoMapping(collection.sourceFields),
      "teamsEmployees",
      [],
    );

    expect(plan.preview).toMatchObject({
      assignmentCount: 1,
      manualUnitCount: 2,
      newEmployeeCount: 1,
      unitCount: 2,
    });
    expect(plan.document.units[0]?.children[0]).toMatchObject({
      employees: [{ employeeKey: "avery", isBoss: true, position: "Lead" }],
      key: "platform",
      name: "Platform",
    });
  });
});
