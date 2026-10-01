import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { OrgToolsState, SessionBootstrap } from "@org-tools/types";
import { expect, type Page, type Request } from "@playwright/test";

import {
  expectLocalRequestsOnly,
  openBlankState,
  replaceStateFromFile,
  syntheticStatePath,
} from "./helpers.js";

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
      staffingSlots: [],
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

export async function exerciseLargeEditorPerformance(page: Page): Promise<void> {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openBlankState(page);
  const diagnosticsUrl = new URL(page.url());
  diagnosticsUrl.searchParams.set("editorPerformance", "1");
  const state = await createLargeEditorState();
  await page.goto("/api/health/live", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await replaceStateFromFile(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "large-editor-state.json",
  });
  await page.goto(diagnosticsUrl.toString(), { waitUntil: "domcontentloaded" });
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
  await expect
    .poll(
      async () => {
        const response = await page.request.get("/api/session");
        const bootstrap = (await response.json()) as SessionBootstrap;
        const persistedLongText = bootstrap.projection.views
          .flatMap((view) => view.structure.canvasElements)
          .find((element) => element.id === "00000000-0000-5001-8000-000000000001");
        return persistedLongText?.type === "text" ? persistedLongText.width : null;
      },
      { intervals: [500, 1_000], timeout: 60_000 },
    )
    .toBe(480);
  await page.waitForTimeout(2_000);
  const performanceCdp = await page.context().newCDPSession(page);
  await performanceCdp.send("HeapProfiler.collectGarbage");
  await performanceCdp.detach();
  let previousDiagnostics = "";
  let stableSamples = 0;
  await expect
    .poll(
      async () => {
        const diagnostics = JSON.stringify(await readPerformanceDiagnostics(page));
        stableSamples = diagnostics === previousDiagnostics ? stableSamples + 1 : 0;
        previousDiagnostics = diagnostics;
        return stableSamples;
      },
      { intervals: [250], timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(2);
  const visibleCanvasElementCount = await canvas.locator("[data-canvas-element-id]").count();
  expect(visibleCanvasElementCount).toBeGreaterThan(0);

  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("Large Editor canvas is unavailable.");
  const panStart = {
    x: canvasBox.x + canvasBox.width - 80,
    y: canvasBox.y + canvasBox.height - 80,
  };
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(panStart.x + 8, panStart.y + 4, { steps: 4 });
  await page.mouse.up({ button: "middle" });
  await page.waitForTimeout(500);
  await expect(page.locator('main[data-state-pending="false"]')).toBeVisible();

  const writes: Array<{ kind: "organization" | "ui" }> = [];
  const onRequest = (request: Request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/commands")) {
      writes.push({ kind: "organization" });
    } else if (request.method() === "PUT" && request.url().endsWith("/api/ui")) {
      writes.push({ kind: "ui" });
    }
  };
  page.on("request", onRequest);

  try {
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
    expect(panPreviewDiagnostics.richTextLayoutComputations).toBeLessThan(200);
    expect(panPreviewDiagnostics.unitRenders).toBeLessThan(200);
    expect(panPreviewDiagnostics.canvasElementRenders).toBeLessThanOrEqual(
      visibleCanvasElementCount * 4,
    );
    const frameSamples = await stopFrameSampling(page);
    const sortedFrameSamples = [...frameSamples].sort((first, second) => first - second);
    const frameP95 = sortedFrameSamples[Math.floor((sortedFrameSamples.length - 1) * 0.95)] ?? 0;
    expect(frameSamples.length).toBeGreaterThan(10);
    expect(frameP95).toBeLessThanOrEqual(33);
    expect(Math.max(...frameSamples)).toBeLessThanOrEqual(250);
    await page.mouse.up({ button: "middle" });
    await expect.poll(() => writes.filter((write) => write.kind === "ui").length).toBe(1);
    expect(Number(await canvas.getAttribute("data-spatial-candidate-count"))).toBeLessThan(200);
    writes.length = 0;

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
        { signal: AbortSignal.timeout(30_000) },
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
    expect(writes.filter((write) => write.kind === "organization")).toEqual([]);
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
      .toBeGreaterThanOrEqual(inputSample.length / 2);
    const inputLatencies = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __ORG_TOOLS_EDITOR_INPUT_LATENCIES__?: number[];
          }
        ).__ORG_TOOLS_EDITOR_INPUT_LATENCIES__ ?? [],
    );
    const sortedInputLatencies = [...inputLatencies].sort((first, second) => first - second);
    const inputP95 =
      sortedInputLatencies[Math.floor((sortedInputLatencies.length - 1) * 0.95)] ?? 0;
    expect(inputP95).toBeLessThanOrEqual(67);
    expect(Math.max(...inputLatencies)).toBeLessThanOrEqual(250);
    const textCommitResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" && response.url().endsWith("/api/commands"),
    );
    await richTextEditor.press("Escape");
    await expect.poll(() => writes.filter((write) => write.kind === "organization").length).toBe(1);
    expect((await textCommitResponsePromise).ok()).toBe(true);
    await assertLocalRequests();
  } finally {
    page.off("request", onRequest);
    await page.goto("/api/health/live", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await openBlankState(page);
  }
}
