import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { OrgToolsState } from "@org-tools/types";
import { expect, type Page, type Request } from "@playwright/test";

import {
  expectLocalRequestsOnly,
  localeStorageKey,
  openBlankState,
  openImportDialog,
  syntheticStatePath,
} from "./helpers.js";

type EditorPerformanceRuntime = "pages" | "server";

const createTestEmployeeId = (fields: {
  email: string | null;
  firstName: string;
  lastName: string;
}) => {
  const hash = createHash("sha256")
    .update(
      [fields.firstName, fields.lastName, fields.email]
        .map((value) => (value ?? "").normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase())
        .join("\u001f"),
    )
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

const createLargeEditorState = async (): Promise<OrgToolsState> => {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const systemView = state.organization.views.find((view) => view.kind === "system");
  if (!systemView) throw new Error("System View is unavailable.");

  const timestamp = "2026-08-31T12:00:00.000Z";
  const uuid = (group: string, index: number) =>
    `00000000-0000-${group}-8000-${index.toString(16).padStart(12, "0")}`;
  const employeeId = (index: number) =>
    createTestEmployeeId({
      email: `employee-${index + 1}@example.test`,
      firstName: "Employee",
      lastName: String(index + 1).padStart(5, "0"),
    });
  const unitId = (index: number) => uuid("4001", index + 1);
  const typography = {
    color: "#334155" as const,
    fontFamily: "system-ui",
    fontSize: 18,
    fontWeight: 400 as const,
    horizontalAlign: "left" as const,
    verticalAlign: "top" as const,
  };

  state.organization.employees = Array.from({ length: 20_000 }, (_, index) => ({
    avatarBase64Url: null,
    birthday: null,
    createdAt: timestamp,
    customFieldValues: {},
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
  systemView.structure.canvasElements = [
    ...Array.from({ length: 400 }, (_, index) => ({
      attachment:
        index % 20 === 0
          ? {
              offset: { x: 72, y: 0 },
              sourceAnchorId: "center" as const,
              target: {
                anchorId: "center" as const,
                owner: { type: "unit" as const, unitId: unitId(index) },
              },
            }
          : null,
      autoWidth: true,
      fillColor: "amber" as const,
      fillMode: "none" as const,
      formatRuns: [],
      height: 32,
      id: uuid("5001", index + 1),
      layer: "aboveUnits" as const,
      rotation: 0,
      text:
        index === 0
          ? "Long performance text ".repeat(3_000).slice(0, 60_000)
          : `Performance text ${index + 1}`,
      typography,
      type: "text" as const,
      width: 48,
      x: (index % 50) * 360 + 48,
      y: Math.floor(index / 50) * 240 + 48,
    })),
    ...Array.from({ length: 400 }, (_, index) => ({
      attachment: null,
      backgroundColor: index % 2 === 0 ? ("amber" as const) : ("blue" as const),
      formatRuns: [],
      height: 168,
      id: uuid("5002", index + 1),
      layer: "aboveUnits" as const,
      rotation: 0,
      text: `Performance note ${index + 1}`,
      typography: {
        ...typography,
        fontSize: 20,
        horizontalAlign: "center" as const,
        verticalAlign: "middle" as const,
      },
      type: "sticker" as const,
      width: 220,
      x: (index % 50) * 360 + 120,
      y: Math.floor(index / 50) * 240 + 300,
    })),
    ...Array.from({ length: 400 }, (_, index) => {
      const start = {
        x: (index % 50) * 360 + 280,
        y: Math.floor(index / 50) * 240 + 110,
      };
      const end = { x: start.x + 120, y: start.y + 80 };
      return {
        dash: "solid" as const,
        end: { attachment: null, ...end },
        endControl: { x: -40, y: 0 },
        endMarker: "arrow" as const,
        id: uuid("5003", index + 1),
        layer: "behindUnits" as const,
        start: { attachment: null, ...start },
        startControl: { x: 40, y: 0 },
        startMarker: "none" as const,
        strokeColor: "#334155" as const,
        strokeWidth: 2,
        type: "arrow" as const,
      };
    }),
  ];
  systemView.structure.units = Array.from({ length: 4_000 }, (_, index) => {
    const firstEmployeeIndex = index * 5;
    const employeeIds = Array.from({ length: 5 }, (_, offset) =>
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
      openPositions: [],
      order: index,
      parentId: null,
      updatedAt: timestamp,
      x: (index % 50) * 360,
      y: Math.floor(index / 50) * 240,
    };
  });
  state.ui.activeTab = "orgEditor";
  state.ui.expandedUnitIds = [];
  state.ui.selectedUnitId = null;
  state.ui.editor.activeViewId = systemView.id;
  state.ui.editor.views = [
    {
      distributionModeUnitIds: [],
      selectedItems: [],
      viewId: systemView.id,
      viewport: { scale: 1, x: 0, y: 0 },
    },
  ];
  return state;
};

const resetPerformanceDiagnostics = (page: Page) =>
  page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __ORG_TOOLS_EDITOR_PERFORMANCE__?: { reset: () => void };
      }
    ).__ORG_TOOLS_EDITOR_PERFORMANCE__;
    if (!diagnostics) throw new Error("Editor performance diagnostics are unavailable.");
    diagnostics.reset();
  });

const readPerformanceDiagnostics = (page: Page) =>
  page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __ORG_TOOLS_EDITOR_PERFORMANCE__?: {
          snapshot: () => Record<string, number>;
        };
      }
    ).__ORG_TOOLS_EDITOR_PERFORMANCE__;
    if (!diagnostics) throw new Error("Editor performance diagnostics are unavailable.");
    return diagnostics.snapshot();
  });

const startFrameSampling = (page: Page) =>
  page.evaluate(() => {
    const sampleWindow = window as typeof window & {
      __ORG_TOOLS_EDITOR_FRAME_SAMPLES__?: number[];
      __ORG_TOOLS_EDITOR_FRAME_SAMPLING__?: boolean;
    };
    sampleWindow.__ORG_TOOLS_EDITOR_FRAME_SAMPLES__ = [];
    sampleWindow.__ORG_TOOLS_EDITOR_FRAME_SAMPLING__ = true;
    let previous: number | null = null;
    const sample = (time: number) => {
      if (previous !== null) sampleWindow.__ORG_TOOLS_EDITOR_FRAME_SAMPLES__?.push(time - previous);
      previous = time;
      if (sampleWindow.__ORG_TOOLS_EDITOR_FRAME_SAMPLING__) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

const stopFrameSampling = (page: Page) =>
  page.evaluate(() => {
    const sampleWindow = window as typeof window & {
      __ORG_TOOLS_EDITOR_FRAME_SAMPLES__?: number[];
      __ORG_TOOLS_EDITOR_FRAME_SAMPLING__?: boolean;
    };
    sampleWindow.__ORG_TOOLS_EDITOR_FRAME_SAMPLING__ = false;
    return sampleWindow.__ORG_TOOLS_EDITOR_FRAME_SAMPLES__ ?? [];
  });

export async function exerciseLargeEditorPerformance(
  page: Page,
  runtime: EditorPerformanceRuntime,
): Promise<void> {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  if (runtime === "server") {
    await openBlankState(page);
    const diagnosticsUrl = new URL(page.url());
    diagnosticsUrl.searchParams.set("editorPerformance", "1");
    await page.goto(diagnosticsUrl.toString(), { waitUntil: "domcontentloaded" });
  } else {
    await page.addInitScript((key) => window.localStorage.setItem(key, "en"), localeStorageKey);
    await page.goto("./?editorPerformance=1", { waitUntil: "domcontentloaded" });
  }

  const state = await createLargeEditorState();
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "large-editor-state.json",
  });
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "20,000 Employees",
  );
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  const canvas = page.locator('[data-demo-id="org-editor-canvas"]');
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-spatial-candidate-count")))
    .toBeLessThan(200);
  const longTextElement = canvas.locator(
    '[data-canvas-element-id="00000000-0000-5001-8000-000000000001"]',
  );
  await expect(longTextElement).toBeVisible();
  await expect
    .poll(() =>
      longTextElement.evaluate((element: HTMLElement) => Number.parseFloat(element.style.width)),
    )
    .toBe(480);
  if (runtime === "server") {
    await expect
      .poll(async () => {
        const response = await page.request.get("/api/state");
        const document = (await response.json()) as { state: OrgToolsState };
        const persistedLongText = document.state.organization.views
          .flatMap((view) => view.structure.canvasElements)
          .find((element) => element.id === "00000000-0000-5001-8000-000000000001");
        return persistedLongText?.type === "text" ? persistedLongText.width : null;
      })
      .toBe(480);
  }
  await page.waitForTimeout(2_000);
  const performanceCdp = await page.context().newCDPSession(page);
  await performanceCdp.send("HeapProfiler.collectGarbage");
  await performanceCdp.detach();

  const writes: Array<{ scope?: string }> = [];
  const onRequest = (request: Request) => {
    if (request.method() !== "PUT" || !request.url().endsWith("/api/state")) return;
    const payload = request.postDataJSON();
    if (payload && typeof payload === "object") writes.push(payload as { scope?: string });
  };
  page.on("request", onRequest);

  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("Large Editor canvas is unavailable.");
  const panStart = {
    x: canvasBox.x + canvasBox.width - 80,
    y: canvasBox.y + canvasBox.height - 80,
  };
  await resetPerformanceDiagnostics(page);
  await startFrameSampling(page);
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(panStart.x + 48, panStart.y + 24, { steps: 20 });
  await page.waitForTimeout(500);
  expect(writes).toEqual([]);
  const panPreviewDiagnostics = await readPerformanceDiagnostics(page);
  expect(panPreviewDiagnostics.viewportFrames).toBeGreaterThan(0);
  expect(panPreviewDiagnostics.viewportWindowInvalidations).toBe(0);
  expect(panPreviewDiagnostics.richTextLayoutComputations).toBe(0);
  expect(panPreviewDiagnostics.unitRenders).toBe(0);
  expect(panPreviewDiagnostics.canvasElementRenders).toBe(0);
  const frameSamples = await stopFrameSampling(page);
  const sortedFrameSamples = [...frameSamples].sort((first, second) => first - second);
  const frameP95 = sortedFrameSamples[Math.floor((sortedFrameSamples.length - 1) * 0.95)] ?? 0;
  expect(frameSamples.length).toBeGreaterThan(10);
  expect(frameP95).toBeLessThanOrEqual(33);
  expect(Math.max(...frameSamples)).toBeLessThanOrEqual(100);
  await page.mouse.up({ button: "middle" });
  if (runtime === "server") {
    await expect.poll(() => writes.filter((write) => write.scope === "ui").length).toBe(1);
  } else {
    expect(writes).toEqual([]);
  }

  const firstUnit = canvas.locator("[data-org-editor-unit-id]").first();
  await firstUnit.click({ position: { x: 72, y: 64 } });
  await page.waitForTimeout(500);
  writes.length = 0;
  const unitBox = await firstUnit.boundingBox();
  if (!unitBox) throw new Error("A visible large-state Unit is unavailable.");
  const originalPosition = await firstUnit.evaluate((element) => {
    const unit = element as HTMLElement;
    return { x: Number.parseFloat(unit.style.left), y: Number.parseFloat(unit.style.top) };
  });
  const dragStart = { x: unitBox.x + 72, y: unitBox.y + 64 };
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragStart.x + 37, dragStart.y + 35, { steps: 20 });
  await page.waitForTimeout(500);
  expect(writes.filter((write) => write.scope === "all")).toEqual([]);
  await page.mouse.up();
  if (runtime === "server") {
    await expect.poll(() => writes.filter((write) => write.scope === "all").length).toBe(1);
  } else {
    expect(writes).toEqual([]);
  }
  const committedPosition = await firstUnit.evaluate((element) => {
    const unit = element as HTMLElement;
    return { x: Number.parseFloat(unit.style.left), y: Number.parseFloat(unit.style.top) };
  });
  expect(Math.abs(committedPosition.x % 24)).toBe(0);
  expect(Math.abs(committedPosition.y % 24)).toBe(0);
  expect(Number(await canvas.getAttribute("data-spatial-candidate-count"))).toBeLessThan(200);
  if (runtime === "pages") {
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect
      .poll(() =>
        firstUnit.evaluate((element) => {
          const unit = element as HTMLElement;
          return { x: Number.parseFloat(unit.style.left), y: Number.parseFloat(unit.style.top) };
        }),
      )
      .toEqual(originalPosition);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await expect
      .poll(() =>
        firstUnit.evaluate((element) => {
          const unit = element as HTMLElement;
          return { x: Number.parseFloat(unit.style.left), y: Number.parseFloat(unit.style.top) };
        }),
      )
      .toEqual(committedPosition);
  }

  await longTextElement.dblclick({ force: true });
  const richTextEditor = longTextElement.getByRole("textbox");
  await expect(richTextEditor).toBeFocused();
  await richTextEditor.press("End");
  await page.keyboard.type("w");
  await richTextEditor.press("Backspace");
  await page.waitForTimeout(350);
  await expect
    .poll(() => richTextEditor.evaluate((element) => element.textContent?.length))
    .toBe(60_000);
  await richTextEditor.evaluate((element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    const textNode = element.querySelector("span:last-child")?.lastChild;
    if (textNode instanceof Text) range.setStart(textNode, textNode.length);
    else {
      range.selectNodeContents(element);
      range.collapse(false);
    }
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await richTextEditor.evaluate((element) => {
    const latencyWindow = window as typeof window & {
      __ORG_TOOLS_EDITOR_INPUT_LATENCIES__?: number[];
    };
    latencyWindow.__ORG_TOOLS_EDITOR_INPUT_LATENCIES__ = [];
    element.addEventListener(
      "input",
      () => {
        const start = performance.now();
        requestAnimationFrame(() => {
          latencyWindow.__ORG_TOOLS_EDITOR_INPUT_LATENCIES__?.push(performance.now() - start);
        });
      },
      { signal: AbortSignal.timeout(5_000) },
    );
  });
  writes.length = 0;
  const inputSample = "abcdefghij".repeat(4);
  for (const character of inputSample) {
    await page.keyboard.insertText(character);
    await page.waitForTimeout(24);
  }
  await expect
    .poll(() => richTextEditor.evaluate((element) => element.textContent?.length))
    .toBe(60_000 + inputSample.length);
  expect(writes.filter((write) => write.scope === "all")).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __ORG_TOOLS_EDITOR_INPUT_LATENCIES__?: number[];
            }
          ).__ORG_TOOLS_EDITOR_INPUT_LATENCIES__?.length ?? 0,
      ),
    )
    .toBe(inputSample.length);
  const inputLatencies = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __ORG_TOOLS_EDITOR_INPUT_LATENCIES__?: number[];
        }
      ).__ORG_TOOLS_EDITOR_INPUT_LATENCIES__ ?? [],
  );
  const sortedInputLatencies = [...inputLatencies].sort((first, second) => first - second);
  const inputP95 = sortedInputLatencies[Math.floor((sortedInputLatencies.length - 1) * 0.95)] ?? 0;
  expect(inputP95).toBeLessThanOrEqual(50);
  const textCommitResponsePromise =
    runtime === "server"
      ? page.waitForResponse(
          (response) =>
            response.request().method() === "PUT" && response.url().endsWith("/api/state"),
        )
      : null;
  await richTextEditor.press("Escape");
  if (runtime === "server") {
    await expect.poll(() => writes.filter((write) => write.scope === "all").length).toBe(1);
    expect((await textCommitResponsePromise)?.ok()).toBe(true);
  } else {
    expect(writes).toEqual([]);
  }
  page.off("request", onRequest);
  if (runtime === "server") await openBlankState(page);
  await assertLocalRequests();
}
