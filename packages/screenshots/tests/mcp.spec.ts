import type { APIRequestContext, Locator, Page } from "@playwright/test";
import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import {
  expectLocalRequestsOnly,
  openBlankState,
  replaceWithSyntheticState,
  resetServerState,
} from "./helpers.js";

type RpcResponse = {
  result?: { structuredContent?: Record<string, unknown> };
};

const configuredOrigin = () => {
  const port = process.env.ORG_TOOLS_PORT ?? "4273";
  return process.env.ORG_TOOLS_BASE_URL ?? `http://127.0.0.1:${port}`;
};

const expectSuccessIconColor = async (page: Page, control: Locator) => {
  const iconColor = await control
    .locator("svg")
    .evaluate((element) => window.getComputedStyle(element).color);
  const successColor = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--success)";
    document.body.appendChild(probe);
    const color = window.getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(iconColor).toBe(successColor);
};

const disableMcp = async (request: APIRequestContext) => {
  const response = await request.post("/api/mcp", {
    data: { action: "disable" },
    headers: { Origin: configuredOrigin() },
  });
  expect(response.ok()).toBe(true);
};

const enableAndRevealMcp = async (request: APIRequestContext) => {
  const headers = { Origin: configuredOrigin() };
  const enabled = await request.post("/api/mcp", { data: { action: "enable" }, headers });
  expect(enabled.ok()).toBe(true);
  const revealed = await request.post("/api/mcp", { data: { action: "reveal" }, headers });
  expect(revealed.ok()).toBe(true);
  const value = (await revealed.json()) as { token?: string };
  expect(value.token).toMatch(/^ot_mcp_[A-Za-z0-9_-]{43}$/u);
  return value.token ?? "";
};

const rpc = async (
  request: APIRequestContext,
  token: string,
  id: number,
  method: string,
  params: Record<string, unknown>,
) => {
  const response = await request.post("/mcp", {
    data: { id, jsonrpc: "2.0", method, params },
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  const text = await response.text();
  const data = response.headers()["content-type"]?.includes("text/event-stream")
    ? text
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice("data: ".length)
    : text;
  if (!data) throw new Error("MCP response did not contain a JSON-RPC payload.");
  return JSON.parse(data) as RpcResponse;
};

test("enables local MCP, applies a live agent change, shows activity, undoes, and rotates", async ({
  page,
  request,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await disableMcp(request);
  await openBlankState(page);
  const mcpButton = page.locator('[data-demo-id="mcp-control"]');
  const disabledIconColor = await mcpButton
    .locator("svg")
    .evaluate((element) => window.getComputedStyle(element).color);
  await expect(mcpButton).toHaveAttribute("data-mcp-enabled", "false");
  await page.getByRole("button", { name: "MCP", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "MCP" });
  await expect(dialog).toBeVisible();
  const accessibleDescription = dialog.getByText("Manage local MCP access and agent setup.", {
    exact: true,
  });
  await expect(accessibleDescription).toHaveClass(/sr-only/u);
  expect(
    await accessibleDescription.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width <= 1 && bounds.height <= 1;
    }),
  ).toBe(true);
  await expect(
    dialog.getByText("Allow local agents to read and change all organization data through MCP.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(dialog.getByText("MCP is disabled", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Enable MCP", exact: true }).click();
  await expect(mcpButton).toHaveAttribute("data-mcp-enabled", "true");
  await expect(mcpButton.locator("svg")).toHaveClass(/text-success/u);
  await expectSuccessIconColor(page, mcpButton);
  expect(
    await mcpButton.locator("svg").evaluate((element) => getComputedStyle(element).color),
  ).not.toBe(disabledIconColor);
  await expect(dialog.getByText("Enabled", { exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("tab", { name: "Examples", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Reveal", exact: true }).click();
  const tokenLocator = dialog.locator('[data-demo-id="mcp-token"]');
  await expect(tokenLocator).toHaveText(/^ot_mcp_[A-Za-z0-9_-]{43}$/u);
  const token = (await tokenLocator.textContent())?.trim();
  expect(token).toMatch(/^ot_mcp_[A-Za-z0-9_-]{43}$/u);
  const setupPrompt = dialog.locator('[data-demo-id="mcp-setup-prompt"]');
  await expect(setupPrompt).toContainText(
    "npx skills add iwonz/org-tools --skill org-tools -g -a codex -y",
  );
  await expect(setupPrompt).toContainText(`Authorization = "Bearer ${token}"`);
  await expect(setupPrompt).toContainText("get_domain_guide");
  await expect(setupPrompt).toContainText("get_organization_overview");
  await expect(dialog.locator('[data-demo-id="mcp-configuration"]')).toHaveCount(0);
  const setupPromptText = await setupPrompt.textContent();
  const organizationBeforeCopy = (
    (await (await request.get("/api/state")).json()) as {
      state: { organization: unknown };
    }
  ).state.organization;
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (value: string) => {
          Reflect.set(window, "__copiedMcpSetupPrompt", value);
          return Promise.resolve();
        },
      },
    });
  });
  await dialog.getByRole("button", { name: "Copy setup prompt", exact: true }).click();
  expect(await page.evaluate(() => Reflect.get(window, "__copiedMcpSetupPrompt"))).toBe(
    setupPromptText,
  );
  const organizationAfterCopy = (
    (await (await request.get("/api/state")).json()) as {
      state: { organization: unknown };
    }
  ).state.organization;
  expect(organizationAfterCopy).toEqual(organizationBeforeCopy);
  await dialog.getByRole("button", { name: "Pi", exact: true }).click();
  await expect(setupPrompt).toContainText(
    "npx skills add iwonz/org-tools --skill org-tools -g -a pi -y",
  );
  await expect(setupPrompt).toContainText("pi-codemcp");
  await expect(setupPrompt).toContainText(`Bearer ${token}`);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await mcpButton.hover();
  await expectSuccessIconColor(page, mcpButton);
  await page.mouse.down();
  await expectSuccessIconColor(page, mcpButton);
  await page.mouse.move(1_000, 500);
  await page.mouse.up();
  const sidebar = page.locator('[data-demo-id="app-sidebar"]');
  const initialCollapsed = await sidebar.getAttribute("data-collapsed");
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await expect(sidebar).toHaveAttribute(
    "data-collapsed",
    initialCollapsed === "true" ? "false" : "true",
  );
  await mcpButton.hover();
  await expectSuccessIconColor(page, mcpButton);
  await mcpButton.click();
  await expect(dialog).toBeVisible();
  await expectSuccessIconColor(page, mcpButton);

  const initialized = await rpc(request, token ?? "", 1, "initialize", {
    capabilities: {},
    clientInfo: { name: "browser-test", version: "1.0.0" },
    protocolVersion: "2025-06-18",
  });
  expect(initialized.result).toBeTruthy();
  const overviewResponse = await rpc(request, token ?? "", 2, "tools/call", {
    arguments: {},
    name: "get_organization_overview",
  });
  const revision = overviewResponse.result?.structuredContent?.revision;
  expect(revision).toEqual(expect.any(Number));
  const previewResponse = await rpc(request, token ?? "", 3, "tools/call", {
    arguments: {
      expectedRevision: revision,
      operations: [
        {
          employee: {
            avatarBase64Url: null,
            birthday: null,
            email: "rowan@example.test",
            firstName: "Rowan",
            gender: "unspecified",
            lastName: "Lee",
            phone: "+1 555-0104",
            profileUrl: null,
            tags: [],
            username: "rowan",
          },
          ref: "employee.rowan",
          type: "employee.create",
        },
      ],
      reason: "Add a synthetic Employee from the browser protocol test",
    },
    name: "preview_change",
  });
  const previewId = previewResponse.result?.structuredContent?.previewId;
  expect(previewId).toEqual(expect.any(String));
  const appliedResponse = await rpc(request, token ?? "", 4, "tools/call", {
    arguments: { previewId },
    name: "apply_change",
  });
  const changeId = appliedResponse.result?.structuredContent?.changeId;
  expect(appliedResponse.result?.structuredContent).toMatchObject({
    resultRevision: (revision as number) + 1,
  });
  expect(changeId).toEqual(expect.any(String));

  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByText("Rowan Lee", { exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByText("Rowan Lee", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "MCP", exact: true }).click();
  await dialog.getByRole("tab", { name: "Activity", exact: true }).click();
  await expect(
    dialog.getByText("Add a synthetic Employee from the browser protocol test", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Undo", exact: true }).click();
  const undoDialog = page.getByRole("alertdialog", { name: "Undo this agent change?" });
  await undoDialog.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(undoDialog).toBeHidden();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByText("Rowan Lee", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "MCP", exact: true }).click();
  await dialog.getByRole("tab", { name: "Setup", exact: true }).click();
  const promptBeforeRotation = await setupPrompt.textContent();
  await dialog.getByRole("button", { name: "Rotate token", exact: true }).click();
  const rotateDialog = page.getByRole("alertdialog", { name: "Rotate access token?" });
  await rotateDialog.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(rotateDialog).toBeHidden();
  await expect(setupPrompt).not.toHaveText(promptBeforeRotation ?? "");
  await expect(setupPrompt).not.toContainText(token ?? "");
  await expect(setupPrompt).toContainText(/Bearer ot_mcp_[A-Za-z0-9_-]{43}/u);
  const rejected = await request.post("/mcp", {
    data: { id: 5, jsonrpc: "2.0", method: "tools/list", params: {} },
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
  });
  expect(rejected.status()).toBe(401);
  await assertLocalRequests();
});

test("disables setup prompt copy when the current token cannot be loaded", async ({
  page,
  request,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await enableAndRevealMcp(request);
  await page.route("**/api/mcp", async (route) => {
    if (route.request().method() === "POST" && route.request().postData()?.includes('"reveal"')) {
      await route.fulfill({ body: "{}", contentType: "application/json", status: 200 });
      return;
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "MCP", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "MCP" });
  await expect(
    dialog.getByText("MCP settings could not be loaded.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Copy setup prompt", exact: true }),
  ).toBeDisabled();
  await expect(dialog.locator('[data-demo-id="mcp-setup-prompt"]')).toContainText(
    "Loading MCP settings…",
  );
  await page.unroute("**/api/mcp");
  await assertLocalRequests();
});

test("localizes the MCP consent and credentials in Russian", async ({ page, request }) => {
  await disableMcp(request);
  await page.goto(await resetServerState(page, "ru"), { waitUntil: "domcontentloaded" });
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: ruMessages.Ui.Dark, exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/u);
  const mcpButton = page.locator('[data-demo-id="mcp-control"]');
  await page.getByRole("button", { name: ruMessages.Ui.MCP, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: ruMessages.Ui.MCP });
  await expect(
    dialog.getByText(ruMessages.Ui["Manage local MCP access and agent setup."], {
      exact: true,
    }),
  ).toHaveClass(/sr-only/u);
  await expect(dialog.getByText(ruMessages.Ui["MCP is disabled"], { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: ruMessages.Ui["Enable MCP"], exact: true }).click();
  await expect(mcpButton).toHaveAttribute("data-mcp-enabled", "true");
  await expectSuccessIconColor(page, mcpButton);
  await expect(dialog.getByRole("tab", { name: ruMessages.Ui.Setup, exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="mcp-endpoint"]')).toContainText("/mcp");
  await expect(dialog.getByRole("tab")).toHaveCount(2);
  await expect(dialog.locator('[data-demo-id="mcp-setup-prompt"]')).toContainText("Authorization");
  await expect(
    dialog.getByRole("button", { name: ruMessages.Ui["Copy setup prompt"], exact: true }),
  ).toBeVisible();
  await dialog.getByRole("tab", { name: ruMessages.Ui.Activity, exact: true }).click();
  await expect(dialog.locator('[data-demo-id="mcp-activity"]')).toBeVisible();
});

test("requires an explicit choice when local and MCP edits overlap", async ({ page, request }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  const token = await enableAndRevealMcp(request);
  const currentResponse = await request.get("/api/state");
  const current = (await currentResponse.json()) as {
    revision: number;
    state: { organization: { employees: Array<{ id: string }> } };
  };
  const employeeId = current.state.organization.employees[0]?.id;
  expect(employeeId).toEqual(expect.any(String));
  const previewResponse = await rpc(request, token, 20, "tools/call", {
    arguments: {
      expectedRevision: current.revision,
      operations: [
        {
          employeeId,
          patch: { firstName: "Agent Avery" },
          type: "employee.update",
        },
      ],
      reason: "Change one synthetic Employee concurrently",
    },
    name: "preview_change",
  });
  const previewId = previewResponse.result?.structuredContent?.previewId;
  expect(previewId).toEqual(expect.any(String));

  let releaseWrite = () => {};
  let notifyIntercepted = () => {};
  const writeIntercepted = new Promise<void>((resolve) => {
    notifyIntercepted = resolve;
  });
  const writeGate = new Promise<void>((resolve) => {
    releaseWrite = resolve;
  });
  await page.route("**/api/state", async (route) => {
    if (route.request().method() !== "PUT") {
      await route.continue();
      return;
    }
    notifyIntercepted();
    await writeGate;
    await route.continue();
  });

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  const employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await employeeDialog.getByLabel("First name", { exact: true }).fill("Local Avery");
  await employeeDialog.getByRole("button", { name: "Save", exact: true }).click();
  await writeIntercepted;

  await rpc(request, token, 21, "tools/call", {
    arguments: { previewId },
    name: "apply_change",
  });

  const conflict = page.getByRole("alertdialog", { name: "Concurrent changes need review" });
  await expect(conflict).toBeVisible();
  await expect(conflict.getByRole("button", { name: "Keep local", exact: true })).toBeVisible();
  await expect(conflict.getByRole("button", { name: "Use MCP", exact: true })).toBeVisible();
  await expect(conflict.getByRole("button", { name: "Cancel", exact: true })).toBeVisible();
  await conflict.getByRole("button", { name: "Use MCP", exact: true }).click();
  const writeCompleted = page.waitForResponse(
    (response) => response.url().endsWith("/api/state") && response.request().method() === "PUT",
  );
  releaseWrite();
  await writeCompleted;
  await expect(conflict).toBeHidden();
  await expect(page.getByText("Agent Avery Stone", { exact: true })).toBeVisible();
  await page.unroute("**/api/state");
  await assertLocalRequests();
});
