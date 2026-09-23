import type {
  CustomEmployeeFieldDefinition,
  Employee,
  EmployeeId,
  EmployeeUnitPosition,
  UnitId,
} from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  isSafeEmployeeDisplayHref,
  layoutEmployeeDisplayRichLines,
  renderEmployeeDisplayLines,
  renderEmployeeDisplayRichLines,
  wrapEmployeeDisplayRichLines,
} from "@/lib/employee-display";
import { createOrgUnitContext } from "@/lib/employee-unit-contexts";
import { OrgStore } from "@/stores/org-store";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const employee: Employee = {
  avatarBase64Url: null,
  birthday: null,
  customFieldValues: { [uuid(20)]: "Staff" },
  email: "avery.stone@example.test",
  firstName: "Avery",
  fullName: "Avery Stone",
  gender: "unspecified",
  id: uuid(1) as EmployeeId,
  lastName: "Stone",
  phone: null,
  profileUrl: null,
  tagPriority: 0,
  tags: [
    { color: null, date: null, label: "Design", tagId: uuid(10) },
    { color: null, date: null, label: "Mentor", tagId: uuid(11) },
  ],
  unitIds: [uuid(2) as UnitId, uuid(3) as UnitId],
  unitPositions: [],
  username: "avery",
};

const unitPosition = (
  value: number,
  unitName: string,
  position: string | null,
  isBoss = false,
): EmployeeUnitPosition => ({
  isBoss,
  parentId: null,
  position,
  unitId: uuid(value) as UnitId,
  unitName,
  unitPath: { fullName: unitName, ids: [uuid(value) as UnitId], names: [unitName] },
});

describe("Employee display formats", () => {
  test("renders normalized lines with aggregate and contextual Unit values", () => {
    const contexts = [
      createOrgUnitContext(unitPosition(2, "Product", "Lead", true)),
      createOrgUnitContext(unitPosition(3, "Research", "Advisor")),
    ];
    const format = " {fullName} \n{position}\n{unitName}\n{isBoss}\n\n{tags}";
    expect(
      renderEmployeeDisplayLines({
        customEmployeeFieldDefinitions: [],
        employee,
        format,
        unitContexts: contexts,
      }),
    ).toEqual(["Avery Stone", "Lead; Advisor", "Product; Research", "", "Design; Mentor"]);
    expect(
      renderEmployeeDisplayLines({
        customEmployeeFieldDefinitions: [],
        employee,
        format: "{position}\n{unitName}\n{isBoss}",
        unitContexts: contexts.slice(1, 2),
      }),
    ).toEqual(["Advisor", "Research"]);
    expect(
      renderEmployeeDisplayLines({
        customEmployeeFieldDefinitions: [],
        employee,
        format: "\n  \n",
        unitContexts: contexts,
      }),
    ).toEqual([]);
    expect(
      renderEmployeeDisplayLines({
        customEmployeeFieldDefinitions: [],
        employee,
        format: "{isBoss ? 'Manager' : 'Contributor'}\n{isBoss}",
        unitContexts: contexts,
      }),
    ).toEqual(["Manager"]);
  });

  test("preserves intentional blank rows and wraps words with character fallback", () => {
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee,
      format: "{fullName}\n\nLong words wrap\n{phone}\nabcdefghij",
      unitContexts: [],
    });
    expect(lines.map((line) => ({ blank: line.blank ?? false, text: line.text }))).toEqual([
      { blank: false, text: "Avery Stone" },
      { blank: true, text: "" },
      { blank: false, text: "Long words wrap" },
      { blank: false, text: "abcdefghij" },
    ]);
    expect(
      wrapEmployeeDisplayRichLines(lines, 25, (node) => node.text.length * 5).map(
        (line) => line.text,
      ),
    ).toEqual(["Avery", "Stone", "", "Long", "words", "wrap", "abcde", "fghij"]);
  });

  test("renders custom fields and conditionals through the shared grammar", () => {
    const definition: CustomEmployeeFieldDefinition = {
      allowCustomOptions: false,
      id: uuid(20),
      key: "level",
      kind: "value",
      multiple: false,
      name: "Level",
      options: [],
      required: false,
      valueType: "text",
    };
    expect(
      renderEmployeeDisplayLines({
        customEmployeeFieldDefinitions: [definition],
        employee,
        format: "{level ? 'Level: {level}' : ''}\n{phone}",
        unitContexts: [],
      }),
    ).toEqual(["Level: Staff"]);
  });

  test("renders inline Markdown without interpreting Employee values", () => {
    const richEmployee = {
      ...employee,
      fullName: "**Avery** <script>alert(1)</script>",
    };
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee: richEmployee,
      format:
        "**Name:** {fullName} _detail_ ~~old~~ `code` [Profile](https://example.test/profile)",
      unitContexts: [],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ marks: expect.objectContaining({ bold: true }), text: "Name:" }),
        expect.objectContaining({
          fieldName: "fullName",
          marks: expect.objectContaining({ bold: false }),
          text: "**Avery** <script>alert(1)</script>",
        }),
        expect.objectContaining({
          marks: expect.objectContaining({ italic: true }),
          text: "detail",
        }),
        expect.objectContaining({ marks: expect.objectContaining({ strike: true }), text: "old" }),
        expect.objectContaining({ marks: expect.objectContaining({ code: true }), text: "code" }),
        expect.objectContaining({
          explicitLink: true,
          href: "https://example.test/profile",
          text: "Profile",
        }),
      ]),
    );
  });

  test("keeps Tags and compound assignments semantic inside Markdown", () => {
    const contexts = [
      createOrgUnitContext(unitPosition(2, "Product", "Lead", true)),
      createOrgUnitContext(unitPosition(3, "Research", "Advisor")),
    ];
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee,
      format: "**{tags}**\n[{positions}](https://example.test)",
      unitContexts: contexts,
    });
    expect(lines[0]?.nodes).toEqual([{ tags: employee.tags, type: "tags" }]);
    expect(lines[1]?.nodes).toEqual([
      {
        positions: [
          { label: "Lead", unitContext: contexts[0] },
          { label: "Advisor", unitContext: contexts[1] },
        ],
        type: "positions",
      },
    ]);
    expect(lines[1]?.text).toBe("Lead · Product; Advisor · Research");
  });

  test("lays Markdown, Tags, following text, and positions into one shared inline flow", () => {
    const contexts = [createOrgUnitContext(unitPosition(2, "Product", "Lead", true))];
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee: { ...employee, tags: employee.tags.slice(0, 1) },
      format: "**Name** {tags} next {positions}",
      unitContexts: contexts,
    });
    const layout = layoutEmployeeDisplayRichLines(lines, {
      availableWidth: 260,
      density: "compact",
      direction: "ltr",
      font: "system-ui",
      locale: "en",
    });

    expect(layout.lines).toHaveLength(1);
    expect(layout.lines[0]?.fragments.map((fragment) => fragment.type)).toEqual([
      "text",
      "text",
      "tag",
      "text",
      "position",
    ]);
    expect(layout.lines[0]?.fragments.at(-1)).toMatchObject({
      text: "Lead · Product",
      type: "position",
    });
    expect(
      layout.lines[0]?.fragments.every(
        (fragment, index, fragments) => index === 0 || fragment.x >= (fragments[index - 1]?.x ?? 0),
      ),
    ).toBe(true);
    expect(
      layoutEmployeeDisplayRichLines(lines, {
        availableWidth: 260,
        density: "compact",
        direction: "ltr",
        font: "system-ui",
        locale: "en",
      }),
    ).toBe(layout);
  });

  test("keeps position and Unit tokens as ordinary text and localizes missing assignments", () => {
    const contexts = [
      createOrgUnitContext(unitPosition(2, "Product", "Lead")),
      createOrgUnitContext(unitPosition(3, "Research", null)),
    ];
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee,
      format: "**{position}**\n*{unitName}*\n{positions}",
      positionNotSpecifiedLabel: "No position",
      unitContexts: contexts,
    });

    expect(lines[0]?.nodes).toEqual([
      expect.objectContaining({
        fieldName: "position",
        marks: expect.objectContaining({ bold: true }),
        text: "Lead",
        type: "text",
      }),
    ]);
    expect(lines[1]?.nodes).toEqual([
      expect.objectContaining({
        fieldName: "unitName",
        marks: expect.objectContaining({ italic: true }),
        text: "Product; Research",
        type: "text",
      }),
    ]);
    expect(lines[2]?.nodes).toEqual([
      {
        positions: [
          { label: "Lead", unitContext: contexts[0] },
          { label: "No position", unitContext: contexts[1] },
        ],
        type: "positions",
      },
    ]);
    expect(lines[2]?.text).toBe("Lead · Product; No position · Research");
  });

  test("keeps plain email inert and supports an explicit mailto Markdown link", () => {
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee,
      format: "{email}\n[{email}](mailto:{email})",
      unitContexts: [],
    });

    expect(lines[0]?.nodes).toEqual([
      expect.objectContaining({
        explicitLink: false,
        fieldName: "email",
        href: null,
        text: "avery.stone@example.test",
      }),
    ]);
    expect(lines[1]?.nodes).toEqual([
      expect.objectContaining({
        explicitLink: true,
        fieldName: "email",
        href: "mailto:avery.stone@example.test",
        text: "avery.stone@example.test",
      }),
    ]);
  });

  test("preserves a legacy custom positions key and reserves it for new fields", () => {
    const legacyDefinition: CustomEmployeeFieldDefinition = {
      allowCustomOptions: false,
      id: uuid(20),
      key: "positions",
      kind: "value",
      multiple: false,
      name: "Legacy positions",
      options: [],
      required: false,
      valueType: "text",
    };
    const contexts = [createOrgUnitContext(unitPosition(2, "Product", "Lead"))];
    expect(
      renderEmployeeDisplayRichLines({
        customEmployeeFieldDefinitions: [legacyDefinition],
        employee,
        format: "{positions}",
        unitContexts: contexts,
      }),
    ).toEqual([
      expect.objectContaining({
        nodes: [expect.objectContaining({ text: "Staff", type: "text" })],
        text: "Staff",
      }),
    ]);

    const store = new OrgStore();
    store.employeeFieldDefinitions = [legacyDefinition];
    expect(() =>
      store.saveEmployeeFieldDefinition({ ...legacyDefinition, name: "Legacy assignments" }),
    ).not.toThrow();
    expect(() =>
      store.saveEmployeeFieldDefinition({ ...legacyDefinition, id: uuid(21), name: "Assignments" }),
    ).toThrow("Custom Employee field is invalid.");
  });

  test("keeps unsafe links and unsupported Markdown inert", () => {
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee,
      format: "[Unsafe](javascript:alert(1))\n![Remote](https://example.test/image.png)\n# literal",
      unitContexts: [],
    });
    expect(lines[0]?.nodes).toEqual([
      expect.objectContaining({ explicitLink: true, href: null, text: "Unsafe" }),
    ]);
    expect(lines[1]?.text).toContain("![Remote]");
    expect(lines[2]?.text).toBe("# literal");
    expect(isSafeEmployeeDisplayHref("mailto:avery@example.test")).toBe(true);
    expect(isSafeEmployeeDisplayHref("tel:+15550100")).toBe(true);
    expect(isSafeEmployeeDisplayHref("javascript:alert(1)")).toBe(false);
    expect(isSafeEmployeeDisplayHref("/relative")).toBe(false);
  });

  test("keeps incomplete inline Markdown as visible text", () => {
    const lines = renderEmployeeDisplayRichLines({
      customEmployeeFieldDefinitions: [],
      employee,
      format: "**unfinished _format [link](broken",
      unitContexts: [],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toBe("**unfinished _format [link](broken");
    expect(lines[0]?.nodes.every((node) => node.type !== "text" || node.href === null)).toBe(true);
  });

  test("rewrites and protects custom fields referenced by saved formats", () => {
    const store = new OrgStore();
    const definition: CustomEmployeeFieldDefinition = {
      allowCustomOptions: false,
      id: uuid(30),
      key: "focus",
      kind: "value",
      multiple: false,
      name: "Focus",
      options: [],
      required: false,
      valueType: "text",
    };
    store.saveEmployeeFieldDefinition(definition);
    store.setEmployeeDisplayFormats({ ...store.employeeDisplayFormats, employees: "{focus}" });
    expect(() => store.saveEmployeeFieldDefinition({ ...definition, key: "invalid key" })).toThrow(
      "Custom Employee field is invalid.",
    );
    expect(store.employeeDisplayFormats.employees).toBe("{focus}");
    store.saveEmployeeFieldDefinition({ ...definition, key: "specialty" });
    expect(store.employeeDisplayFormats.employees).toBe("{specialty}");
    expect(() => store.deleteEmployeeFieldDefinition(definition.id)).toThrow(
      "Custom Employee field is still in use.",
    );
  });
});
