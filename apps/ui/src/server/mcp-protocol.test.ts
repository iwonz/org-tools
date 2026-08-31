import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DELETE, GET, OPTIONS, POST } from "@/app/mcp/route";
import { createBlankOrgToolsState } from "@/lib/org-file";
import { getMcpRepository, resetMcpRepositoryForTests } from "@/server/mcp-repository";
import { getStateRepository, resetStateRepositoryForTests } from "@/server/state-repository";

let directory = "";
let token = "";

const rpcRequest = (
  body: Record<string, unknown>,
  options?: { authorization?: string; host?: string; origin?: string },
) =>
  new Request("http://127.0.0.1:3000/mcp", {
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: options?.authorization ?? `Bearer ${token}`,
      "Content-Type": "application/json",
      Host: options?.host ?? "127.0.0.1:3000",
      ...(options?.origin ? { Origin: options.origin } : {}),
    },
    method: "POST",
  });

const responseValue = async (response: Response): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    const data = text
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice("data: ".length);
    if (!data) throw new Error("MCP event stream did not contain data.");
    return JSON.parse(data) as Record<string, unknown>;
  }
  return JSON.parse(text) as Record<string, unknown>;
};

const call = async (method: string, params: Record<string, unknown>, id: number) => {
  const response = await POST(rpcRequest({ id, jsonrpc: "2.0", method, params }));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  return responseValue(response);
};

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "org-tools-mcp-protocol-"));
  process.env.ORG_TOOLS_DB_PATH = join(directory, "state.sqlite3");
  getStateRepository();
  const repository = getMcpRepository();
  repository.setEnabled(true);
  token = repository.revealToken();
});

afterEach(() => {
  resetMcpRepositoryForTests();
  resetStateRepositoryForTests();
  delete process.env.ORG_TOOLS_DB_PATH;
  rmSync(directory, { force: true, recursive: true });
});

describe("stateless Streamable HTTP MCP", () => {
  it("initializes a 2025-era client and exposes the bounded agent contract", async () => {
    const initialized = await call(
      "initialize",
      {
        capabilities: {},
        clientInfo: { name: "protocol-test", version: "1.0.0" },
        protocolVersion: "2025-06-18",
      },
      1,
    );
    expect(initialized).toMatchObject({
      id: 1,
      jsonrpc: "2.0",
      result: { serverInfo: { name: "org-tools", version: "0.1.0" } },
    });

    const listed = await call("tools/list", {}, 2);
    const result = listed.result as {
      tools: Array<{ annotations?: Record<string, unknown>; name: string }>;
    };
    expect(result.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "get_domain_guide",
        "get_organization_overview",
        "list_views",
        "get_view_structure",
        "list_units",
        "get_unit",
        "search_employees",
        "get_employee",
        "analyze_team_composition",
        "list_changes",
        "get_change",
        "preview_change",
        "apply_change",
        "preview_undo",
      ]),
    );
    expect(
      result.tools.find((tool) => tool.name === "get_domain_guide")?.annotations,
    ).toMatchObject({
      readOnlyHint: true,
    });
    expect(result.tools.find((tool) => tool.name === "apply_change")?.annotations).toMatchObject({
      destructiveHint: true,
      idempotentHint: true,
    });

    const resources = await call("resources/list", {}, 3);
    expect(resources).toMatchObject({ result: { resources: [{ uri: "orgtools://guide" }] } });
    const prompts = await call("prompts/list", {}, 4);
    expect(prompts).toMatchObject({
      result: {
        prompts: expect.arrayContaining([
          expect.objectContaining({ name: "analyze_team_composition" }),
          expect.objectContaining({ name: "plan_reorganization" }),
          expect.objectContaining({ name: "undo_agent_change" }),
        ]),
      },
    });
    const guide = await call("tools/call", { arguments: {}, name: "get_domain_guide" }, 5);
    const guideText = JSON.stringify(guide);
    expect(guideText).toContain("wait for a new explicit user approval");
    expect(guideText).toContain("The request that led to Preview is not approval to Apply");
    expect(guideText).toContain("wait for explicit approval before applying any undo");
  });

  it("applies only a stored preview and reports the exact resulting revision", async () => {
    const overview = await call(
      "tools/call",
      { arguments: {}, name: "get_organization_overview" },
      10,
    );
    expect(overview).toMatchObject({ result: { structuredContent: { revision: 1 } } });
    const previewResponse = await call(
      "tools/call",
      {
        arguments: {
          expectedRevision: 1,
          operations: [
            {
              employee: {
                avatarBase64Url: null,
                birthday: null,
                email: "rowan@example.test",
                firstName: "Rowan",
                gender: "unspecified",
                lastName: "Lee",
                phone: "+1 555-0103",
                profileUrl: null,
                tags: [],
                username: "rowan",
              },
              ref: "employee.rowan",
              type: "employee.create",
            },
          ],
          reason: "Add a synthetic Employee for the protocol test",
        },
        name: "preview_change",
      },
      11,
    );
    const preview = (previewResponse.result as { structuredContent: { previewId: string } })
      .structuredContent;
    expect(getStateRepository().read().state.organization.employees).toHaveLength(0);

    const appliedResponse = await call(
      "tools/call",
      { arguments: { previewId: preview.previewId }, name: "apply_change" },
      12,
    );
    const applied = (appliedResponse.result as { structuredContent: Record<string, unknown> })
      .structuredContent;
    expect(applied).toMatchObject({ baseRevision: 1, resultRevision: 2 });
    expect(getStateRepository().read().state.organization.employees[0]).toMatchObject({
      email: "rowan@example.test",
    });

    const idempotent = await call(
      "tools/call",
      { arguments: { previewId: preview.previewId }, name: "apply_change" },
      13,
    );
    expect((idempotent.result as { structuredContent: unknown }).structuredContent).toEqual(
      applied,
    );

    const undoResponse = await call(
      "tools/call",
      {
        arguments: { changeId: applied.changeId, expectedRevision: 2 },
        name: "preview_undo",
      },
      14,
    );
    const undoPreview = (undoResponse.result as { structuredContent: { previewId: string } })
      .structuredContent;
    const undoneResponse = await call(
      "tools/call",
      { arguments: { previewId: undoPreview.previewId }, name: "apply_change" },
      15,
    );
    expect(undoneResponse).toMatchObject({
      result: { structuredContent: { baseRevision: 2, resultRevision: 3 } },
    });
    expect(getStateRepository().read().state.organization.employees).toHaveLength(0);
  });

  it("keeps large-state reads bounded and commits one revision per Apply", async () => {
    const employeeCount = 20_000;
    const unitCount = 4_000;
    const timestamp = "2026-08-31T12:00:00.000Z";
    const uuid = (group: string, index: number) =>
      `00000000-0000-${group}-8000-${index.toString(16).padStart(12, "0")}`;
    const employeeId = (index: number) => uuid("4000", index + 1);
    const unitId = (index: number) => uuid("4001", index + 1);
    const state = createBlankOrgToolsState();
    state.organization.employees = Array.from({ length: employeeCount }, (_, index) => ({
      avatarBase64Url: null,
      birthday: null,
      createdAt: timestamp,
      email: `employee-${index + 1}@example.test`,
      firstName: "Employee",
      gender: "unspecified" as const,
      id: employeeId(index),
      lastName: String(index + 1).padStart(5, "0"),
      phone: null,
      profileUrl: null,
      tags: [],
      updatedAt: timestamp,
      username: `employee-${index + 1}`,
    }));
    const mainView = state.organization.views[0];
    if (!mainView) throw new Error("Blank state is missing Main.");
    mainView.document.units = Array.from({ length: unitCount }, (_, index) => {
      const firstEmployeeIndex = index * 5;
      const employeeIds = Array.from({ length: 5 }, (_, offset) =>
        employeeId(firstEmployeeIndex + offset),
      );
      return {
        bossEmployeeId: employeeId(firstEmployeeIndex),
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
    getStateRepository().write({ scope: "all", state }, 1);

    const employees = await call(
      "tools/call",
      { arguments: { limit: 100 }, name: "search_employees" },
      20,
    );
    expect(employees).toMatchObject({
      result: { structuredContent: { items: { length: 100 }, totalMatches: employeeCount } },
    });
    const units = await call("tools/call", { arguments: { limit: 100 }, name: "list_units" }, 21);
    expect(units).toMatchObject({
      result: { structuredContent: { items: { length: 100 } } },
    });
    const listedUnit = (
      units.result as { structuredContent: { items: Array<Record<string, unknown>> } }
    ).structuredContent.items[0];
    expect(listedUnit).not.toHaveProperty("employeeIds");
    expect(listedUnit).not.toHaveProperty("employeePositions");
    const unit = await call(
      "tools/call",
      { arguments: { limit: 100, unitId: unitId(0) }, name: "get_unit" },
      22,
    );
    expect(unit).toMatchObject({
      result: { structuredContent: { employees: { items: { length: 5 } } } },
    });

    const previewResponse = await call(
      "tools/call",
      {
        arguments: {
          expectedRevision: 2,
          operations: [
            {
              employeeId: employeeId(0),
              patch: { firstName: "Updated" },
              type: "employee.update",
            },
          ],
          reason: "Update one synthetic Employee in the large-state check",
        },
        name: "preview_change",
      },
      23,
    );
    expect(getStateRepository().read().revision).toBe(2);
    const preview = (previewResponse.result as { structuredContent: { previewId: string } })
      .structuredContent;
    await call(
      "tools/call",
      { arguments: { previewId: preview.previewId }, name: "apply_change" },
      24,
    );
    expect(getStateRepository().read().revision).toBe(3);
  });

  it("rejects non-loopback, cross-origin, unauthenticated, and non-POST requests", async () => {
    expect(
      (
        await POST(
          rpcRequest(
            { id: 1, jsonrpc: "2.0", method: "tools/list", params: {} },
            { host: "example.test" },
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await POST(
          rpcRequest(
            { id: 2, jsonrpc: "2.0", method: "tools/list", params: {} },
            { origin: "https://example.test" },
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await POST(
          rpcRequest(
            { id: 3, jsonrpc: "2.0", method: "tools/list", params: {} },
            { authorization: "Bearer wrong" },
          ),
        )
      ).status,
    ).toBe(401);

    expect(GET().status).toBe(405);
    expect(DELETE().status).toBe(405);
    expect(OPTIONS().status).toBe(405);
  });
});
