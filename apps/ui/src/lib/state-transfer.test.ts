import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { MAX_STATE_IMPORT_BYTES, parseStateImportText } from "@/lib/state-transfer";
import { OrgStore } from "@/stores/org-store";

describe("state transfer", () => {
  it("parses one complete state and derives bounded summary counts", () => {
    const state = createBlankOrgToolsState("dark");
    const candidate = parseStateImportText("state.json", JSON.stringify(state));

    expect(candidate).toMatchObject({
      employeeCount: 0,
      fileName: "state.json",
      state,
      unitCount: 0,
    });
  });

  it.each(["teams", "employees", "teamsEmployees"])(
    "rejects the obsolete %s content scope",
    (content) => {
      const state = createBlankOrgToolsState("system") as unknown as Record<string, unknown>;
      expect(() =>
        parseStateImportText("partial.json", JSON.stringify({ ...state, content })),
      ).toThrow("Only a complete Org Tools state can be imported.");
    },
  );

  it("rejects arbitrary and malformed JSON", () => {
    expect(() => parseStateImportText("rows.json", '[{"name":"Example"}]')).toThrow(
      "Only a complete Org Tools state can be imported.",
    );
    expect(() => parseStateImportText("broken.json", "{")).toThrow(
      "Could not read or parse the selected file.",
    );
  });

  it("accepts current birthdays and reports obsolete birthday formats", () => {
    const store = new OrgStore();
    store.createEmployee(
      {
        avatarBase64Url: null,
        birthday: "29.02.1900",
        email: "leap@example.test",
        firstName: "Leap",
        gender: "unspecified",
        lastName: "Example",
        phone: null,
        profileUrl: null,
        tags: [],
        username: null,
      },
      [],
    );
    const state = store.createOrgToolsState();
    expect(parseStateImportText("state.json", JSON.stringify(state)).employeeCount).toBe(1);

    const employee = state.organization.employees[0];
    if (!employee) throw new Error("Expected an Employee.");
    employee.birthday = "02-29";
    expect(() => parseStateImportText("state.json", JSON.stringify(state))).toThrow(
      "Birthday must use the DD.MM.YYYY format.",
    );
  });

  it("rejects files larger than the state limit", () => {
    expect(() => parseStateImportText("large.json", "{}", MAX_STATE_IMPORT_BYTES + 1)).toThrow(
      "The selected file is {size} MiB; the limit is {limit} MiB.",
    );
  });
});
