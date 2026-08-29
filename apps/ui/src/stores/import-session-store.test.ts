import { describe, expect, it, vi } from "vitest";
import { createBlankOrgToolsState } from "@/lib/org-file";
import { createStructuredSave } from "@/lib/structured-save";
import { ImportSessionStore } from "@/stores/import-session-store";

describe("ImportSessionStore", () => {
  it("selects a JSON collection, applies auto-mapping, and commits all drafts once", () => {
    const session = new ImportSessionStore([
      { email: "existing@example.test", id: "employee-existing", username: "existing" },
    ]);
    session.loadText(
      "employees.json",
      JSON.stringify({
        archive: [{ first_name: "Archived", user_login: "archived" }],
        current: [
          { email: "existing@example.test", first_name: "Existing", user_login: "existing" },
          { email: "new@example.test", first_name: "New", user_login: "new" },
        ],
      }),
    );
    session.selectCollection("$.current");
    const onCommit = vi.fn();

    const summary = session.commit(onCommit);

    expect(session.mapping).toMatchObject({
      email: "email",
      firstName: "first_name",
      username: "user_login",
    });
    expect(summary).toMatchObject({ duplicateRowCount: 1, newEmployeeCount: 1 });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({
        email: "new@example.test",
        firstName: "New",
        username: "new",
      }),
    ]);
    expect(onCommit.mock.calls[0]?.[0]?.[0]).not.toHaveProperty("unitIds");
  });

  it("never calls the commit callback while any row is invalid", () => {
    const session = new ImportSessionStore();
    session.loadText(
      "employees.json",
      JSON.stringify([
        { first_name: "Ada", profile_url: "https://example.test/ada" },
        { first_name: "", profile_url: "ftp://invalid.test" },
      ]),
    );
    const onCommit = vi.fn();

    expect(session.plan?.invalidRowCount).toBe(1);
    expect(() => session.commit(onCommit)).toThrow(/Resolve all mapping/);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("retains a full-state candidate without building a tabular plan", () => {
    const session = new ImportSessionStore();
    const state = createBlankOrgToolsState();
    session.loadText("state.json", JSON.stringify(state));

    expect(session.stateCandidate?.state).toEqual(state);
    expect(session.stateContent).toBe("workspace");
    expect(session.stateOperation).toBe("replace");
    expect(session.document).toBeNull();
    expect(session.plan).toBeNull();
  });

  it("retains a scoped state and exposes only compatible projections", () => {
    const session = new ImportSessionStore();
    const source = createBlankOrgToolsState();
    source.employees.push({
      avatarBase64Url: null,
      birthday: null,
      createdAt: "2026-08-04T08:00:00.000Z",
      email: "avery@example.test",
      firstName: "Avery",
      gender: "unspecified",
      id: "00000000-0000-4000-8000-000000000001",
      lastName: "Stone",
      phone: null,
      profileUrl: null,
      tags: [],
      updatedAt: "2026-08-04T08:00:00.000Z",
      username: "avery",
    });
    const employeesState = createStructuredSave(source, "employees");
    session.loadText("employees.json", JSON.stringify(employeesState));

    expect(session.stateCandidate?.state).toEqual(employeesState);
    expect(session.availableStateContents).toEqual(["employees"]);
    expect(session.structuredPlan).toMatchObject({
      existingEmployeeCount: 0,
      newEmployeeCount: 1,
      unitCount: 0,
    });
    expect(session.document).toBeNull();
  });

  it("cancels by discarding all transient source and mapping state", () => {
    const session = new ImportSessionStore([
      { email: "existing@example.test", id: "employee-existing", username: "existing" },
    ]);
    session.loadText(
      "employees.json",
      JSON.stringify([{ email: "ada@example.test", first_name: "Ada" }]),
    );

    session.reset();

    expect(session.document).toBeNull();
    expect(session.stateCandidate).toBeNull();
    expect(session.stateContent).toBeNull();
    expect(session.selectedCollectionId).toBeNull();
    expect(session.existingEmployees).toHaveLength(1);
  });

  it("rejects a JSON source above the local file-size limit before parsing", () => {
    const session = new ImportSessionStore();

    expect(() => session.loadText("large.json", "[]", 25 * 1024 * 1024 + 1)).toThrow(
      /selected file/,
    );
    expect(session.document).toBeNull();
    expect(session.stateCandidate).toBeNull();
  });
});
