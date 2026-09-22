import type { CustomEmployeeFieldDefinition, Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  createEmptyEmployeeSearchFilters,
  employeeSearchDocumentMatches,
} from "@/lib/employee-search";
import { createEmployeeSearchDocument } from "@/lib/search-index";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

describe("advanced custom field search", () => {
  test("matches any multi-option label and each Composite primary value", () => {
    const skillsId = uuid(1);
    const planningId = uuid(2);
    const researchId = uuid(3);
    const compositeId = uuid(4);
    const primaryFieldId = uuid(5);
    const definitions: CustomEmployeeFieldDefinition[] = [
      {
        allowCustomOptions: false,
        id: skillsId,
        key: "skills",
        kind: "value",
        multiple: true,
        name: "Skills",
        options: [
          { id: planningId, label: "Planning" },
          { id: researchId, label: "Research" },
        ],
        required: false,
        valueType: "option",
      },
      {
        fields: [
          {
            id: primaryFieldId,
            name: "Certificate",
            options: [],
            required: true,
            valueType: "text",
          },
        ],
        id: compositeId,
        key: "certificates",
        kind: "composite",
        name: "Certificates",
        primaryFieldId,
        required: false,
      },
    ];
    const employee: Employee = {
      avatarBase64Url: null,
      birthday: null,
      customFieldValues: {
        [compositeId]: [{ [primaryFieldId]: "First aid" }, { [primaryFieldId]: "Security" }],
        [skillsId]: [planningId, researchId],
      },
      email: "casey.morgan@example.test",
      firstName: "Casey",
      fullName: "Casey Morgan",
      gender: "unspecified",
      id: uuid(10),
      lastName: "Morgan",
      phone: null,
      profileUrl: null,
      tags: [],
      tagPriority: null,
      unitIds: [],
      unitPositions: [],
      username: null,
    };
    const document = createEmployeeSearchDocument(employee, definitions);
    for (const [fieldId, selectedValue] of [
      [skillsId, "Research"],
      [compositeId, "Security"],
    ] as const) {
      expect(
        employeeSearchDocumentMatches({
          document,
          filters: {
            ...createEmptyEmployeeSearchFilters(),
            customFields: [{ fieldId, includeUnset: false, selectedValues: [selectedValue] }],
          },
          membership: undefined,
          queryTokens: [],
        }),
      ).toBe(true);
    }
  });
});
