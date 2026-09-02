import { readFile } from "node:fs/promises";

import type { OrgToolsState } from "@org-tools/types";
import type { Locator, Page, Request } from "@playwright/test";
import sharp from "sharp";

import { expect, test } from "./browser-test.js";
import {
  expectLocalRequestsOnly,
  openBlankState,
  openImportDialog,
  productTabs,
  replaceWithSyntheticState,
  resetServerState,
  syntheticStatePath,
} from "./helpers.js";

async function expectNoHorizontalRule(locator: Locator) {
  expect(
    await locator.evaluate((element) => ({
      bottom: window.getComputedStyle(element).borderBottomWidth,
      top: window.getComputedStyle(element).borderTopWidth,
    })),
  ).toEqual({ bottom: "0px", top: "0px" });
}

async function getBackgroundColor(locator: Locator) {
  return locator.evaluate((element) => window.getComputedStyle(element).backgroundColor);
}

async function getBackgroundPresentation(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const background = style.backgroundColor;
    const slashAlpha = /\/\s*([\d.]+)(%)?\s*\)$/.exec(background);
    const commaAlpha = /rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(background);
    const alpha = slashAlpha
      ? Number(slashAlpha[1]) / (slashAlpha[2] ? 100 : 1)
      : commaAlpha
        ? Number(commaAlpha[1])
        : background === "rgba(0, 0, 0, 0)"
          ? 0
          : 1;
    return { alpha, background, opacity: style.opacity };
  });
}

async function expectTransparentBackground(locator: Locator) {
  expect(await getBackgroundColor(locator)).toBe("rgba(0, 0, 0, 0)");
}

async function expectIconBeforeText(locator: Locator) {
  const positions = await locator.evaluate((element) => {
    const label = element.querySelector("span");
    const icon = element.querySelector("svg");
    if (!(label instanceof HTMLElement) || !(icon instanceof SVGElement)) {
      throw new Error("Expected an SVG icon followed by a text label.");
    }
    return {
      iconRight: icon.getBoundingClientRect().right,
      labelDisplay: window.getComputedStyle(label).display,
      labelLeft: label.getBoundingClientRect().left,
    };
  });

  expect(positions.labelDisplay).not.toBe("none");
  expect(positions.iconRight).toBeLessThanOrEqual(positions.labelLeft);
}

async function expectTextBeforeTrailingIcon(locator: Locator) {
  const positions = await locator.evaluate((element) => {
    const label = element.querySelector("span");
    const icon = element.querySelector("svg");
    if (!(label instanceof HTMLElement) || !(icon instanceof SVGElement)) {
      throw new Error("Expected a text label followed by a trailing SVG affordance.");
    }
    return {
      iconLeft: icon.getBoundingClientRect().left,
      labelRight: label.getBoundingClientRect().right,
    };
  });

  expect(positions.iconLeft).toBeGreaterThanOrEqual(positions.labelRight);
}

async function createLongRosterState(): Promise<OrgToolsState> {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const mainView = state.organization.views.find((view) => view.kind === "main");
  const product = mainView?.document.units.find((unit) => unit.name === "Product");
  const platform = mainView?.document.units.find((unit) => unit.name === "Platform");
  const avatar = state.organization.employees[0]?.avatarBase64Url ?? null;
  if (!product || !platform) throw new Error("Synthetic hierarchy is unavailable.");

  const addedEmployees = Array.from({ length: 10 }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      avatarBase64Url: index % 3 === 0 ? avatar : null,
      birthday: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      email: `synthetic.person.${suffix}@example.test`,
      firstName: "Synthetic",
      gender: "unspecified" as const,
      id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      lastName: `Person ${suffix}`,
      phone: `+1-202-555-01${String(10 + index).padStart(2, "0")}`,
      profileUrl: null,
      tags: [
        { date: null, label: index % 2 === 0 ? "Client Applications" : "Platform" },
        { date: null, label: "Accessibility" },
        { date: null, label: "Engineering" },
        { date: null, label: "Remote" },
      ],
      updatedAt: "2026-01-15T12:00:00.000Z",
      username: `synthetic.person.${suffix}`,
    };
  });

  state.organization.employees.push(...addedEmployees);
  product.employeeIds.push(...addedEmployees.map((employee) => employee.id));
  product.employeePositions.push(
    ...addedEmployees.map((employee) => ({
      employeeId: employee.id,
      position: "Software Engineer",
    })),
  );
  platform.y = 960;
  return state;
}

async function expectStableHoverGeometry(locator: Locator) {
  const getGeometry = () =>
    locator.evaluate((element) => {
      const itemBox = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        children: [...element.children].map((child) => {
          const childBox = child.getBoundingClientRect();
          return {
            left: childBox.left - itemBox.left,
            top: childBox.top - itemBox.top,
          };
        }),
        height: itemBox.height,
        transform: style.transform,
        translate: style.translate,
        width: itemBox.width,
      };
    });
  const before = await getGeometry();
  await locator.hover();
  const after = await getGeometry();

  expect(after).toEqual(before);
  expect(after.transform).toBe("none");
  expect(after.translate).toBe("none");
}

async function expectStablePressedGeometry(locator: Locator) {
  const getGeometry = () =>
    locator.evaluate((element) => {
      const itemBox = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        children: [...element.children].map((child) => {
          const childBox = child.getBoundingClientRect();
          return {
            left: childBox.left - itemBox.left,
            top: childBox.top - itemBox.top,
          };
        }),
        height: itemBox.height,
        left: itemBox.left,
        top: itemBox.top,
        transform: style.transform,
        translate: style.translate,
        width: itemBox.width,
      };
    });

  await locator.hover();
  const before = await getGeometry();
  const page = locator.page();
  await page.mouse.down();
  const pressed = await getGeometry();
  await page.mouse.move(1, 1);
  await page.mouse.up();

  expect(pressed).toEqual(before);
  expect(pressed.transform).toBe("none");
  expect(pressed.translate).toBe("none");
}

test("shows one centered icon-only loader while loading initial state", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  const path = await resetServerState(page);
  await page.addInitScript(() => window.localStorage.setItem("org-tools-locale", "en"));

  let releaseStateRequest = () => {};
  const stateRequestGate = new Promise<void>((resolve) => {
    releaseStateRequest = resolve;
  });
  await page.route("**/api/state", async (route) => {
    if (route.request().method() === "GET") await stateRequestGate;
    await route.continue();
  });

  await page.goto(path, { waitUntil: "domcontentloaded" });
  const loadingSurface = page.locator('[data-demo-id="state-loading"]');
  const loadingStatus = loadingSurface.getByRole("status");
  const indicator = page.locator('[data-demo-id="state-loading-indicator"]');

  try {
    await expect(loadingSurface).toBeVisible();
    await expect(loadingSurface).toHaveAttribute("aria-busy", "true");
    await expect(loadingStatus).toHaveAccessibleName("Loading");
    await expect(loadingStatus).toHaveText("");
    await expect(indicator).toHaveCount(1);

    const presentation = await loadingStatus.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const ring = element.firstElementChild;
      if (!(ring instanceof SVGElement)) throw new Error("Startup loading indicator is missing.");
      const ringStyle = window.getComputedStyle(ring);
      return {
        boxCenterX: box.left + box.width / 2,
        boxCenterY: box.top + box.height / 2,
        boxShadow: ringStyle.boxShadow,
        childElements: [...ring.children].map((child) => child.tagName.toLowerCase()),
        color: ringStyle.color,
        height: box.height,
        tagName: ring.tagName.toLowerCase(),
        viewportCenterX: window.innerWidth / 2,
        viewportCenterY: window.innerHeight / 2,
        width: box.width,
      };
    });
    expect(presentation).toMatchObject({
      boxShadow: "none",
      childElements: ["circle", "path"],
      height: 32,
      tagName: "svg",
      width: 32,
    });
    expect(presentation.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(presentation.boxCenterX).toBeCloseTo(presentation.viewportCenterX, 1);
    expect(presentation.boxCenterY).toBeCloseTo(presentation.viewportCenterY, 1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(indicator).toHaveCSS("animation-name", "none");
  } finally {
    releaseStateRequest();
  }

  await expect(loadingSurface).toHaveCount(0);
  await expect(page.locator('[data-demo-id="app-shell"]')).toBeVisible();
  await assertLocalRequests();
});

test("registers responsive workflow actions in the shared header", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  const header = page.locator('[data-demo-id="app-header"]');
  const actionSlot = page.locator('[data-demo-id="context-header-action-slot"]');

  await page.getByRole("tab", { name: "Units", exact: true }).click();
  const addUnit = page.locator('[data-demo-id="unit-create-root-button"]');
  await expect(addUnit).toHaveCount(1);
  await expectContainedBy(header, addUnit);
  await expectIconBeforeText(addUnit);
  await expect(
    page.locator('[data-demo-id="units-tab-content"] [data-demo-id="unit-create-root-button"]'),
  ).toHaveCount(0);
  await addUnit.click();
  const unitDialog = page.getByRole("dialog", { name: "Add Unit" });
  await expect(unitDialog).toBeVisible();
  await unitDialog.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  const addEmployee = page.locator('[data-demo-id="employee-create-button"]');
  await expect(addEmployee).toHaveCount(1);
  await expectContainedBy(header, addEmployee);
  await expectIconBeforeText(addEmployee);
  await expect(
    page.locator('[data-demo-id="employees-tab-content"] [data-demo-id="employee-create-button"]'),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "Download", exact: true }).click();
  const continueButton = page.locator('[data-demo-id="export-continue-button"]');
  await expect(continueButton).toBeDisabled();
  await expectContainedBy(header, continueButton);
  await expectIconBeforeText(continueButton);
  await page
    .getByRole("button", { name: "Add Unit Employees to download", exact: true })
    .first()
    .click();
  await expect(continueButton).toBeEnabled();
  await expect(
    page.locator('[data-demo-id="export-surface"] [data-demo-id="export-continue-button"]'),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 720 });
  await expect(actionSlot).toBeVisible();
  await expect(continueButton.locator("span")).toBeHidden();
  await expect(continueButton).toHaveAccessibleName("Continue");
  const compactActionBox = await continueButton.boundingBox();
  expect(compactActionBox).not.toBeNull();
  expect(compactActionBox?.width).toBe(compactActionBox?.height);
  await continueButton.hover();
  await expect(actionSlot.getByRole("tooltip")).toHaveText("Continue");
  await assertLocalRequests();
});

async function getSidebarControlGeometry(locator: Locator) {
  return locator.evaluate((element) => {
    const icon = element.querySelector("svg");
    if (!icon) throw new Error("Missing sidebar control icon");
    const itemBox = element.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return {
      height: itemBox.height,
      iconLeft: iconBox.left - itemBox.left,
      iconRight: itemBox.right - iconBox.right,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      width: itemBox.width,
    };
  });
}

async function expectSidebarNavigation(page: Page, expectedWidth: 64 | 240) {
  await page.mouse.move(320, 200);
  const sidebar = page.locator('[data-demo-id="app-sidebar"]');
  const tabsList = page.locator('[data-demo-id="product-tabs-list"]');
  const tabs = tabsList.locator('[data-demo-id^="tab-"]');
  const listStyle = await tabsList.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      borderWidth: style.borderWidth,
      columnGap: style.columnGap,
      flexDirection: style.flexDirection,
      width: element.getBoundingClientRect().width,
    };
  });
  const tabStyles = await tabs.evaluateAll((elements) =>
    elements.map((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        fontWeight: style.fontWeight,
        height: element.getBoundingClientRect().height,
      };
    }),
  );
  const tabIconOrders = await tabs.evaluateAll((elements) =>
    elements.map((element) => ({
      firstChild: element.firstElementChild?.tagName.toLowerCase() ?? null,
      iconIndex: [...element.children].findIndex((child) => child.tagName.toLowerCase() === "svg"),
      labelIndex: [...element.children].findIndex((child) =>
        child.hasAttribute("data-sidebar-label"),
      ),
    })),
  );

  expect(await sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBe(
    expectedWidth,
  );
  expect(listStyle).toEqual({
    borderWidth: "0px",
    columnGap: "4px",
    flexDirection: "column",
    width: expectedWidth - 16,
  });
  expect(tabStyles).toHaveLength(6);
  expect(new Set(tabStyles.map(({ borderWidth }) => borderWidth))).toEqual(new Set(["0px"]));
  expect(new Set(tabStyles.map(({ height }) => height)).size).toBe(1);
  expect(new Set(tabStyles.map(({ height }) => height))).toEqual(new Set([40]));
  expect(tabIconOrders).toEqual(
    tabIconOrders.map(() => ({ firstChild: "svg", iconIndex: 0, labelIndex: 1 })),
  );

  const active = tabsList.locator('[data-demo-id^="tab-"][aria-selected="true"]');
  const inactive = tabsList.locator('[data-demo-id^="tab-"][aria-selected="false"]').first();
  await expect.poll(() => getBackgroundColor(inactive)).toBe("rgba(0, 0, 0, 0)");
  const restingInactiveColor = await inactive.evaluate(
    (element) => window.getComputedStyle(element).color,
  );
  const activeColor = await active.evaluate((element) => window.getComputedStyle(element).color);
  expect(await getBackgroundColor(active)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(inactive)).toBe("rgba(0, 0, 0, 0)");
  expect(await active.evaluate((element) => window.getComputedStyle(element).boxShadow)).toBe(
    "none",
  );
  expect(restingInactiveColor).not.toBe(activeColor);
  expect(
    Number(await active.evaluate((element) => window.getComputedStyle(element).fontWeight)),
  ).toBe(Number(await inactive.evaluate((element) => window.getComputedStyle(element).fontWeight)));
  await inactive.hover();
  expect(await getBackgroundColor(inactive)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await inactive.evaluate((element) => window.getComputedStyle(element).boxShadow)).toBe(
    "none",
  );
  await expect(inactive).toHaveCSS("border-width", "0px");
  await expect(inactive).toHaveCSS("outline-style", "none");
  const label = inactive.locator('[data-sidebar-label=""]');
  const tooltip = inactive.locator('[role="tooltip"]');
  if (expectedWidth === 64) {
    await expect(label).toBeHidden();
    await expect(tooltip).toBeVisible();
    expect(
      await tabs.evaluateAll((elements) =>
        elements.map((element) => {
          const icon = element.querySelector("svg");
          if (!icon) return Number.POSITIVE_INFINITY;
          const rowBox = element.getBoundingClientRect();
          const iconBox = icon.getBoundingClientRect();
          return Math.abs(iconBox.left + iconBox.width / 2 - (rowBox.left + rowBox.width / 2));
        }),
      ),
    ).toEqual(Array.from({ length: 6 }, () => 0));
  } else {
    await expect(label).toBeVisible();
    await expect(tooltip).toBeHidden();
  }
}

async function expectSidebarActions(page: Page) {
  const actions = page.locator('[data-demo-id="sidebar-actions"]');
  const buttons = actions.locator("button");
  const groupStyle = await actions.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      borderWidth: style.borderWidth,
      columnGap: style.columnGap,
      flexDirection: style.flexDirection,
    };
  });
  const buttonStyles = await buttons.evaluateAll((elements) =>
    elements.map((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        height: element.getBoundingClientRect().height,
      };
    }),
  );

  expect(groupStyle).toEqual({ borderWidth: "0px", columnGap: "4px", flexDirection: "column" });
  expect(buttonStyles).toHaveLength(5);
  expect(new Set(buttonStyles.map(({ height }) => height)).size).toBe(1);
  expect(new Set(buttonStyles.map(({ height }) => height))).toEqual(new Set([40]));
  expect(new Set(buttonStyles.map(({ borderWidth }) => borderWidth))).toEqual(new Set(["0px"]));
  const preferenceButtons = page.locator(
    '[data-demo-id="language-toggle"], [data-demo-id="theme-toggle"]',
  );
  const preferenceBackgrounds = await preferenceButtons.evaluateAll((elements) =>
    elements.map((element) => window.getComputedStyle(element).backgroundColor),
  );
  expect(new Set(preferenceBackgrounds).size).toBe(1);
  expect(preferenceBackgrounds[0]).toBe("rgba(0, 0, 0, 0)");
  await expect(page.locator('[data-demo-id="import-action"]')).toHaveCSS("border-width", "0px");
  await page.locator('[data-demo-id="import-action"]').hover();
  expect(
    await page
      .locator('[data-demo-id="import-action"]')
      .evaluate((element) => window.getComputedStyle(element).boxShadow),
  ).not.toContain("inset");
  expect(await getBackgroundColor(page.locator('[data-demo-id="import-action"]'))).not.toBe(
    "rgba(0, 0, 0, 0)",
  );

  if (
    (await page
      .locator('[data-demo-id="app-sidebar"]')
      .evaluate((element) => element.getBoundingClientRect().width)) === 64
  ) {
    expect(
      await buttons.evaluateAll((elements) =>
        elements.map((element) => {
          const icon = [...element.children].find(
            (child) =>
              !child.matches('[data-sidebar-label=""]') && !child.matches('[role="tooltip"]'),
          );
          if (!icon) return Number.POSITIVE_INFINITY;
          const rowBox = element.getBoundingClientRect();
          const iconBox = icon.getBoundingClientRect();
          return Math.abs(iconBox.left + iconBox.width / 2 - (rowBox.left + rowBox.width / 2));
        }),
      ),
    ).toEqual(Array.from({ length: 5 }, () => 0));
  }
}

async function expectTonalTabGroup(tabsList: Locator) {
  await tabsList.page().mouse.move(1, 200);
  const triggers = tabsList.getByRole("tab");
  const listStyle = await tabsList.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      borderWidth: style.borderWidth,
      columnGap: style.columnGap,
      overflow: style.overflow,
      padding: style.padding,
    };
  });
  const triggerStyles = await triggers.evaluateAll((elements) =>
    elements.map((element) => {
      const style = window.getComputedStyle(element);
      return {
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        fontWeight: style.fontWeight,
      };
    }),
  );

  expect(listStyle).toEqual({
    borderWidth: "0px",
    columnGap: "4px",
    overflow: "visible",
    padding: "0px",
  });
  expect(triggerStyles.length).toBeGreaterThan(1);
  expect(new Set(triggerStyles.map(({ borderWidth }) => borderWidth))).toEqual(new Set(["0px"]));

  const active = tabsList.getByRole("tab", { selected: true });
  const inactive = tabsList.getByRole("tab", { selected: false }).first();
  await expect.poll(() => getBackgroundColor(inactive)).toBe("rgba(0, 0, 0, 0)");
  const restingInactiveColor = await inactive.evaluate(
    (element) => window.getComputedStyle(element).color,
  );
  const activeColor = await active.evaluate((element) => window.getComputedStyle(element).color);
  expect(await getBackgroundColor(active)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(inactive)).toBe("rgba(0, 0, 0, 0)");
  expect(restingInactiveColor).not.toBe(activeColor);
  expect(
    Number(await active.evaluate((element) => window.getComputedStyle(element).fontWeight)),
  ).toBe(Number(await inactive.evaluate((element) => window.getComputedStyle(element).fontWeight)));
  await inactive.hover();
  expect(await getBackgroundColor(inactive)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await inactive.evaluate((element) => window.getComputedStyle(element).boxShadow)).toBe(
    "none",
  );
  await expect(inactive).toHaveCSS("border-width", "0px");
  await expect(inactive).toHaveCSS("outline-style", "none");
}

async function expectUniformUiFont(page: Page) {
  const families = await page
    .locator("body *")
    .evaluateAll((elements) =>
      Array.from(new Set(elements.map((element) => window.getComputedStyle(element).fontFamily))),
    );
  expect(families.length).toBeGreaterThan(0);
  expect(families.every((family) => family.startsWith("Inter"))).toBe(true);
}

async function expectFullBleedProductSurface(surface: Locator) {
  await expect(surface).toBeVisible();
  expect(
    await surface.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        boxShadow: style.boxShadow,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
      };
    }),
  ).toMatchObject({
    borderRadius: "0px",
    borderWidth: "0px",
    boxShadow: "none",
    overflowX: "hidden",
    overflowY: "hidden",
  });
  expect(await getBackgroundColor(surface)).not.toBe("rgba(0, 0, 0, 0)");
}

async function expectContainedBy(parent: Locator, child: Locator) {
  const [parentBox, childBox] = await Promise.all([parent.boundingBox(), child.boundingBox()]);
  expect(parentBox).not.toBeNull();
  expect(childBox).not.toBeNull();
  expect(childBox?.x ?? 0).toBeGreaterThanOrEqual((parentBox?.x ?? 0) - 1);
  expect(childBox?.y ?? 0).toBeGreaterThanOrEqual((parentBox?.y ?? 0) - 1);
  expect((childBox?.x ?? 0) + (childBox?.width ?? 0)).toBeLessThanOrEqual(
    (parentBox?.x ?? 0) + (parentBox?.width ?? 0) + 1,
  );
  expect((childBox?.y ?? 0) + (childBox?.height ?? 0)).toBeLessThanOrEqual(
    (parentBox?.y ?? 0) + (parentBox?.height ?? 0) + 1,
  );
}

test("opens a blank state with all product surfaces", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);

  await expect(page.locator('[data-demo-id="app-header"]')).toHaveCSS("border-bottom-width", "0px");
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveCSS("border-right-width", "0px");

  const header = page.locator('[data-demo-id="app-header"]');
  const sidebar = page.locator('[data-demo-id="app-sidebar"]');
  const navigation = page.locator('[data-demo-id="product-navigation"]');
  const actions = page.locator('[data-demo-id="sidebar-actions"]');
  await expect(sidebar.locator('[data-demo-id="product-navigation"]')).toHaveCount(1);
  await expect(sidebar.locator('[data-demo-id="sidebar-actions"]')).toHaveCount(1);
  await expect(header.locator('[data-demo-id="product-navigation"]')).toHaveCount(0);
  await expect(header.locator('[data-demo-id="sidebar-actions"]')).toHaveCount(0);
  await expect(header.getByRole("img", { name: "Org Tools", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-demo-id="brand-wordmark"]')).toHaveCount(0);
  await expect(sidebar.getByText("Org Tools", { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-demo-id="sidebar-header"] svg')).toHaveCount(1);
  await expect(page.locator('[data-demo-id="app-title"]')).toHaveText("Editor");
  await expect(header).toHaveCSS("box-shadow", "none");
  await expect(sidebar).toHaveCSS("box-shadow", "none");
  expect(await header.evaluate((element) => element.getBoundingClientRect().height)).toBe(64);
  const navigationBox = await navigation.boundingBox();
  const actionsBox = await actions.boundingBox();
  expect(navigationBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(navigationBox?.y ?? 0).toBeLessThan(actionsBox?.y ?? 0);
  await expect(page.locator('[data-demo-id="import-action-icon"]')).toHaveAttribute(
    "data-icon",
    "document-arrow-up",
  );
  await expect(page.locator('[data-demo-id="export-action-icon"]')).toHaveAttribute(
    "data-icon",
    "document-arrow-down",
  );
  await page.locator('[data-demo-id="theme-toggle"]').click();
  const themeMenu = page.locator('[data-demo-id="theme-menu"]');
  await expect(themeMenu).toHaveCSS("border-width", "1px");
  expect(
    await themeMenu.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return style.borderColor !== style.backgroundColor;
    }),
  ).toBe(true);
  const darkThemeOption = page.getByRole("option", { name: "Dark", exact: true });
  await expectStableHoverGeometry(darkThemeOption);
  await darkThemeOption.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectSidebarNavigation(page, 64);
  await expectSidebarActions(page);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await expect(themeMenu).toHaveCSS("border-width", "1px");
  await page.getByRole("option", { name: "Light", exact: true }).click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await expect(page.locator('[data-demo-id="language-menu"]')).toHaveCSS("border-width", "1px");
  await expectStableHoverGeometry(
    page.locator('[data-demo-id="language-menu"]').getByRole("option").first(),
  );
  await page.keyboard.press("Escape");
  await expectStablePressedGeometry(page.locator('[data-demo-id="tab-units"]'));
  await expectUniformUiFont(page);
  expect(
    await page
      .locator('[data-demo-id^="tab-"]')
      .evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute("data-demo-id"))),
  ).toEqual([
    "tab-units",
    "tab-employees",
    "tab-org-editor",
    "tab-analytics",
    "tab-calendar",
    "tab-export",
  ]);
  for (const tabName of productTabs) {
    const tab = page.getByRole("tab", { name: tabName, exact: true });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  }
  const unitsTab = page.getByRole("tab", { name: "Units", exact: true });
  await unitsTab.focus();
  await unitsTab.press("End");
  await expect(page.getByRole("tab", { name: "Download", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  await expect(page.locator('[data-demo-id="org-view-toolbar"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-editor-actions"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-editor-focus-primary-unit-button"]')).toHaveCount(
    0,
  );
  expect(consoleErrors.filter((message) => message.includes("INVALID_KEY"))).toEqual([]);

  await assertLocalRequests();
});

test("keeps interaction cues accessible with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openBlankState(page);

  const tab = page.locator('[data-demo-id="tab-units"]');
  const action = page.locator('[data-demo-id="export-state"]');
  await tab.focus();

  const reducedMotionStyle = await tab.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      transform: style.transform,
      transitionDuration: style.transitionDuration,
    };
  });
  expect(reducedMotionStyle.transform).toBe("none");
  expect(reducedMotionStyle.transitionDuration).toBe("0s");
  expect(reducedMotionStyle.boxShadow).not.toBe("none");
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveCSS(
    "transition-property",
    "none",
  );
  await expect(action).toHaveCSS("border-width", "0px");
  await expectUniformUiFont(page);
});

test("contains the collapsible sidebar at narrow and desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBlankState(page);

  const header = page.locator('[data-demo-id="app-header"]');
  const sidebar = page.locator('[data-demo-id="app-sidebar"]');
  const sidebarToggle = page.locator('[data-demo-id="sidebar-toggle"]');
  const importLabel = page.locator('[data-demo-id="import-action"] [data-sidebar-label=""]');
  const exportLabel = page.locator('[data-demo-id="export-state"] [data-sidebar-label=""]');

  await expectSidebarNavigation(page, 64);
  await expectSidebarActions(page);
  expect(await getBackgroundColor(header)).not.toBe("rgba(0, 0, 0, 0)");
  await expect(importLabel).toBeHidden();
  await expect(exportLabel).toBeHidden();
  await expect(sidebarToggle).toBeHidden();
  await expect(page.locator('[data-demo-id="import-action"]')).toHaveAccessibleName("Import");
  await expect(page.locator('[data-demo-id="export-state"]')).toHaveAccessibleName("Export state");
  expect(await header.evaluate((element) => element.getBoundingClientRect().height)).toBe(64);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  for (const width of [1024, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    await expectSidebarNavigation(page, 64);
    await expectSidebarActions(page);
    expect(await getBackgroundColor(header)).not.toBe("rgba(0, 0, 0, 0)");
    await expect(importLabel).toBeHidden();
    await expect(exportLabel).toBeHidden();
    await expect(sidebarToggle).toBeVisible();
    await expectStableHoverGeometry(sidebarToggle);
    await expectStablePressedGeometry(sidebarToggle);
    const compactNavigationItem = page.locator('[data-demo-id="tab-units"]');
    const [toggleStyle, compactToggleGeometry, compactNavigationGeometry] = await Promise.all([
      sidebarToggle.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          color: style.color,
        };
      }),
      getSidebarControlGeometry(sidebarToggle),
      getSidebarControlGeometry(compactNavigationItem),
    ]);
    expect(toggleStyle).toMatchObject({
      borderRadius: "6px",
      boxShadow: "none",
    });
    expect(compactToggleGeometry).toEqual(compactNavigationGeometry);
    expect(compactToggleGeometry).toMatchObject({
      height: 40,
      iconLeft: 14,
      iconRight: 14,
      paddingLeft: "14px",
      paddingRight: "14px",
      width: 48,
    });
    expect(toggleStyle.color).not.toBe(toggleStyle.backgroundColor);
    const [compactToggleIconBox, compactNavigationIconBox] = await Promise.all([
      sidebarToggle.locator("svg").boundingBox(),
      compactNavigationItem.locator("svg").boundingBox(),
    ]);
    expect(compactToggleIconBox).not.toBeNull();
    expect(compactNavigationIconBox).not.toBeNull();
    expect(compactToggleIconBox?.x ?? 0).toBeCloseTo(compactNavigationIconBox?.x ?? 0, 1);
    expect(await header.evaluate((element) => element.getBoundingClientRect().height)).toBe(64);
    const selectedBeforeCollapse = await page
      .locator('[data-demo-id="product-tabs-list"] [aria-selected="true"]')
      .getAttribute("data-demo-id");
    const transitionSamples = await sidebar.evaluate(async (sidebarElement) => {
      const icon = sidebarElement.querySelector('[data-demo-id="tab-units"] svg');
      const label = sidebarElement.querySelector('[data-demo-id="tab-units"] [data-sidebar-label]');
      const toggle = sidebarElement.querySelector<HTMLButtonElement>(
        '[data-demo-id="sidebar-toggle"]',
      );
      const toggleIcon = toggle?.querySelector("svg");
      if (!icon || !label || !toggle || !toggleIcon) {
        throw new Error("Missing sidebar transition fixture");
      }

      const samples: Array<{
        iconLeft: number;
        labelOpacity: number;
        toggleIconLeft: number;
        width: number;
      }> = [];
      const startedAt = performance.now();
      toggle.click();

      await new Promise<void>((resolve) => {
        const sample = () => {
          const sidebarBox = sidebarElement.getBoundingClientRect();
          const iconBox = icon.getBoundingClientRect();
          samples.push({
            iconLeft: iconBox.left,
            labelOpacity: Number(window.getComputedStyle(label).opacity),
            toggleIconLeft: toggleIcon.getBoundingClientRect().left,
            width: sidebarBox.width,
          });
          if (performance.now() - startedAt >= 280) {
            resolve();
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });

      return samples;
    });
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(transitionSamples.length).toBeGreaterThanOrEqual(5);
    expect(transitionSamples.at(-1)?.width).toBe(240);
    for (let index = 1; index < transitionSamples.length; index += 1) {
      expect(transitionSamples[index]?.width ?? 0).toBeGreaterThanOrEqual(
        (transitionSamples[index - 1]?.width ?? 0) - 0.5,
      );
      expect(transitionSamples[index]?.labelOpacity ?? 0).toBeGreaterThanOrEqual(
        (transitionSamples[index - 1]?.labelOpacity ?? 0) - 0.03,
      );
    }
    expect(
      Math.max(...transitionSamples.map(({ iconLeft }) => iconLeft)) -
        Math.min(...transitionSamples.map(({ iconLeft }) => iconLeft)),
    ).toBeLessThanOrEqual(0.5);
    expect(
      Math.max(...transitionSamples.map(({ toggleIconLeft }) => toggleIconLeft)) -
        Math.min(...transitionSamples.map(({ toggleIconLeft }) => toggleIconLeft)),
    ).toBeLessThanOrEqual(0.5);
    expect(transitionSamples.at(-1)?.labelOpacity).toBe(1);
    await expectSidebarNavigation(page, 240);
    await expect(importLabel).toBeVisible();
    await expect(exportLabel).toBeVisible();
    const [expandedHeaderBox, expandedToggleBox, expandedToggleGeometry] = await Promise.all([
      page.locator('[data-demo-id="sidebar-header"]').boundingBox(),
      sidebarToggle.boundingBox(),
      getSidebarControlGeometry(sidebarToggle),
    ]);
    expect(expandedHeaderBox).not.toBeNull();
    expect(expandedToggleBox).not.toBeNull();
    expect(expandedToggleGeometry).toEqual(compactNavigationGeometry);
    expect(expandedToggleBox?.x ?? 0).toBeCloseTo((expandedHeaderBox?.x ?? 0) + 8, 1);
    const [expandedToggleIconBox, expandedNavigationIconBox] = await Promise.all([
      sidebarToggle.locator("svg").boundingBox(),
      compactNavigationItem.locator("svg").boundingBox(),
    ]);
    expect(expandedToggleIconBox).not.toBeNull();
    expect(expandedNavigationIconBox).not.toBeNull();
    expect(expandedToggleIconBox?.x ?? 0).toBeCloseTo(expandedNavigationIconBox?.x ?? 0, 1);
    await expect(
      page.locator('[data-demo-id="product-tabs-list"] [aria-selected="true"]'),
    ).toHaveAttribute("data-demo-id", selectedBeforeCollapse ?? "tab-org-editor");
    await sidebarToggle.click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expectSidebarNavigation(page, 64);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test("uses full-bleed tonal workflows with a distinct Editor canvas", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openBlankState(page);

  const shell = page.locator('[data-demo-id="app-shell"]');
  const header = page.locator('[data-demo-id="app-header"]');
  const lightShellBackground = await getBackgroundColor(shell);
  const lightSurfaceTokens = await shell.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      accent: style.getPropertyValue("--accent").trim(),
      accentStrong: style.getPropertyValue("--accent-strong").trim(),
      background: style.getPropertyValue("--background").trim(),
      primary: style.getPropertyValue("--primary").trim(),
      shell: style.getPropertyValue("--shell").trim(),
      signal: style.getPropertyValue("--signal").trim(),
    };
  });

  expect(lightShellBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(lightSurfaceTokens.shell).not.toBe(lightSurfaceTokens.background);
  expect(lightSurfaceTokens).toMatchObject({
    accent: "oklch(95.5% .014 240)",
    accentStrong: "oklch(92% .028 240)",
    primary: "oklch(24.5% 0 0)",
    shell: "oklch(97.5% .004 245)",
    signal: "oklch(53% .095 240)",
  });
  expect(await getBackgroundColor(header)).not.toBe("rgba(0, 0, 0, 0)");
  await expectTransparentBackground(page.locator('[data-demo-id="top-level-empty-state"]'));

  await replaceWithSyntheticState(page);
  await page.locator('[data-demo-id="tab-org-editor"]').click();
  const editorCanvas = page.locator('[data-demo-id="org-editor-canvas"]');
  const editorCanvasBox = await editorCanvas.boundingBox();
  expect(editorCanvasBox).not.toBeNull();

  const surfaces = [
    ["tab-units", '[data-demo-id="units-surface"]', ['[data-demo-id="units-employee-header"]']],
    ["tab-employees", '[data-demo-id="employees-surface"]', ['[data-demo-id="employees-search"]']],
    ["tab-analytics", '[data-demo-id="analytics-surface"]', ['[data-demo-id="analytics-header"]']],
    ["tab-calendar", '[data-demo-id="calendar-tab"]', ['[data-demo-id="calendar-header"]']],
    [
      "tab-export",
      '[data-demo-id="export-surface"]',
      [
        '[data-demo-id="export-source-tabs"]',
        '[data-demo-id="export-selected-panel"] > div:first-child',
      ],
    ],
  ] as const;

  for (const [tabDemoId, selector, leadingSelectors] of surfaces) {
    await page.locator(`[data-demo-id="${tabDemoId}"]`).click();
    const surface = page.locator(selector);
    await expectFullBleedProductSurface(surface);
    const surfaceBox = await surface.boundingBox();
    expect(surfaceBox).not.toBeNull();
    expect(Math.abs((surfaceBox?.y ?? 0) - (editorCanvasBox?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((surfaceBox?.x ?? 0) - (editorCanvasBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((surfaceBox?.width ?? 0) - (editorCanvasBox?.width ?? 0))).toBeLessThanOrEqual(
      1,
    );
    for (const leadingSelector of leadingSelectors) {
      await expectContainedBy(surface, page.locator(leadingSelector));
    }
  }

  await page.locator('[data-demo-id="tab-org-editor"]').click();
  const canvas = page.locator('[data-demo-id="org-editor-canvas"]');
  expect(await getBackgroundColor(canvas)).not.toBe(lightShellBackground);
  expect(await getBackgroundColor(canvas)).not.toBe("rgba(0, 0, 0, 0)");

  await page.locator('[data-demo-id="tab-employees"]').click();
  const employeeCard = page.locator('[data-demo-id="employees-list"] article').first();
  await expect(employeeCard).toBeVisible();
  await expectTransparentBackground(employeeCard);

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkShellBackground = await getBackgroundColor(shell);
  const darkInteractionTokens = await shell.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      accent: style.getPropertyValue("--accent").trim(),
      accentStrong: style.getPropertyValue("--accent-strong").trim(),
      primary: style.getPropertyValue("--primary").trim(),
      shell: style.getPropertyValue("--shell").trim(),
      signal: style.getPropertyValue("--signal").trim(),
    };
  });
  expect(darkShellBackground).not.toBe(lightShellBackground);
  expect(darkInteractionTokens).toEqual({
    accent: "oklch(25.5% .028 240)",
    accentStrong: "oklch(30% .04 240)",
    primary: "oklch(92% 0 0)",
    shell: "oklch(11.5% .006 245)",
    signal: "oklch(72% .085 235)",
  });
  await expectTransparentBackground(employeeCard);
  expect(await getBackgroundColor(header)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(page.locator('[data-demo-id="employees-surface"]'))).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
});

test("imports only complete states through a compact confirmation", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);

  await expect(page.locator('[data-demo-id="import-file-input"]')).toHaveAttribute(
    "accept",
    ".json,application/json",
  );
  const canceledChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await (await canceledChooserPromise).setFiles([]);
  await expect(page.getByRole("dialog", { name: "Import state" })).toHaveCount(0);

  const dialog = await openImportDialog(page, syntheticStatePath);
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-footer"]'));
  await expect(dialog.getByRole("tab")).toHaveCount(0);
  await expect(dialog.getByRole("radio")).toHaveCount(0);
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "4 Employees",
  );
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText("2 Units");
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText("1 View");
  await expect(dialog.getByRole("button", { name: "Replace state" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

  const invalidDialog = await openImportDialog(page, {
    buffer: Buffer.from('[{"name":"Ordinary row"}]'),
    mimeType: "application/json",
    name: "ordinary.json",
  });
  await expect(
    invalidDialog.getByText("Only a complete Org Tools state can be imported.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(invalidDialog.getByRole("button", { name: "Replace state" })).toBeDisabled();
  await invalidDialog.locator('input[type="file"]').setInputFiles(syntheticStatePath);
  await expect(invalidDialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "4 Employees",
  );
  await invalidDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await assertLocalRequests();
});

test("atomically imports, directly exports, automatically writes, and reloads state", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  const rootUrl = page.url();
  await expect(page.locator('[data-demo-id="project-save"]')).toHaveCount(0);

  const importDialog = await openImportDialog(page, syntheticStatePath);
  await importDialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(importDialog).toBeHidden();
  await expect(page).toHaveURL(rootUrl);
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-demo-id="state-write-error"]')).toHaveCount(0);

  const exportPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export state", exact: true }).click();
  const exported = await exportPromise;
  expect(exported.suggestedFilename()).toBe("org-tools-state.json");
  await expect(page.getByRole("dialog", { name: "Export state" })).toHaveCount(0);
  const exportedPath = await exported.path();
  const exportedState = JSON.parse(await readFile(exportedPath ?? "", "utf8")) as OrgToolsState;
  expect(Object.keys(exportedState).sort()).toEqual(["organization", "ui"]);
  expect(exportedState.organization.employees).toHaveLength(4);

  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await assertLocalRequests();
});

test("rejects malformed, partial, generic, and oversized imports without mutation", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);

  const rejectedFiles = [
    {
      error: "Could not read or parse the selected file.",
      file: { buffer: Buffer.from("{"), mimeType: "application/json", name: "broken.json" },
    },
    {
      error: "Only a complete Org Tools state can be imported.",
      file: {
        buffer: Buffer.from(JSON.stringify({ content: "employees", kind: "org-tools-state" })),
        mimeType: "application/json",
        name: "partial.json",
      },
    },
    {
      error: "Only a complete Org Tools state can be imported.",
      file: {
        buffer: Buffer.from(JSON.stringify({ employees: [{ name: "Ordinary row" }] })),
        mimeType: "application/json",
        name: "generic.json",
      },
    },
    {
      error: "The selected file is 26 MiB; the limit is 25 MiB.",
      file: {
        buffer: Buffer.alloc(25 * 1024 * 1024 + 1, 32),
        mimeType: "application/json",
        name: "oversized.json",
      },
    },
  ];

  for (const rejected of rejectedFiles) {
    const dialog = await openImportDialog(page, rejected.file);
    await expect(dialog.getByText(rejected.error, { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Replace state" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  }
  await expect(page.locator('[data-demo-id="state-write-error"]')).toHaveCount(0);
  await assertLocalRequests();
});

test("keeps CSV as a Download output while Import accepts JSON only", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);

  await expect(page.locator('[data-demo-id="import-file-input"]')).toHaveAttribute(
    "accept",
    ".json,application/json",
  );
  await page.getByRole("tab", { name: "Download", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Unit Employees to download", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const settings = page.getByRole("dialog").filter({ hasText: "Download settings" });
  await expect(settings.getByRole("tab", { name: "CSV", exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Download", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("org-tools-export.csv");
  await expect(settings.locator('[data-demo-id="export-actions"] > div')).toHaveCount(0);

  await assertLocalRequests();
});

test("creates, crops, re-crops, pastes, and removes a local Employee avatar", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Add Employee", exact: true }).click();
  const employeeDialog = page.getByRole("dialog", { name: "Create Employee" });
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2R2sAAAAASUVORK5CYII=";
  const pngBuffer = Buffer.from(pngBase64, "base64");

  await employeeDialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: Buffer.from("<svg></svg>"),
    mimeType: "image/svg+xml",
    name: "avatar.svg",
  });
  await expect(employeeDialog.getByText("Choose a PNG, JPEG, or WebP image.")).toBeVisible();

  await employeeDialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: pngBuffer,
    mimeType: "image/png",
    name: "avatar.png",
  });
  let cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await expect(cropDialog).toBeVisible();
  await cropDialog.getByRole("slider", { name: "Zoom" }).fill("2");
  await cropDialog.getByRole("button", { name: "Use avatar", exact: true }).click();
  const preview = employeeDialog.locator('[data-demo-id="employee-avatar-preview"]');
  await expect(preview).toHaveAttribute("src", /^data:image\/webp;base64,/);
  expect(
    await preview.evaluate(async (element) => {
      const image = element as HTMLImageElement;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }),
  ).toEqual([512, 512]);

  const croppedSource = await preview.getAttribute("src");
  await employeeDialog.getByRole("button", { name: "Adjust crop", exact: true }).click();
  cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await cropDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(preview).toHaveAttribute("src", croppedSource ?? "");

  await employeeDialog.locator("form").evaluate((form, encodedImage) => {
    const bytes = Uint8Array.from(atob(encodedImage), (character) => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "pasted.png", { type: "image/png" }));
    form.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: transfer }));
  }, pngBase64);
  cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await expect(cropDialog).toBeVisible();
  await cropDialog.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.evaluate((encodedImage) => {
    const bytes = Uint8Array.from(atob(encodedImage), (character) => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: "image/png" });
    Object.defineProperty(navigator.clipboard, "read", {
      configurable: true,
      value: async () => [{ getType: async () => blob, types: ["image/png"] }],
    });
  }, pngBase64);
  await employeeDialog.getByRole("button", { name: "Paste image", exact: true }).click();
  cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await cropDialog.getByRole("button", { name: "Use avatar", exact: true }).click();
  await employeeDialog.getByLabel("First name", { exact: true }).fill("Riley");
  await employeeDialog.getByRole("button", { name: "Create", exact: true }).click();

  await page.locator('[data-demo-id="employee-edit-button"]').click();
  const editDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(editDialog.locator('[data-demo-id="employee-avatar-preview"]')).toHaveAttribute(
    "src",
    /^data:image\/webp;base64,/,
  );
  await editDialog.getByRole("button", { name: "Remove avatar", exact: true }).click();
  await expect(editDialog.locator('[data-demo-id="employee-avatar-preview"]')).toHaveCount(0);
  await editDialog.getByRole("button", { name: "Save", exact: true }).click();

  await assertLocalRequests();
});

test("atomically opens a complete synthetic state", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);

  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await expect(page.locator('[data-demo-id="units-tree-panel"]')).toHaveCSS(
    "border-right-width",
    "0px",
  );
  await expect(page.locator('[data-demo-id="units-tree-header"]')).toHaveCount(0);
  await expectNoHorizontalRule(page.locator('[data-demo-id="units-employee-header"]'));
  const firstUnitRow = page.locator('[data-demo-id="unit-tree-item"]').first();
  await expect(firstUnitRow).toHaveCSS("border-width", "0px");
  await expectTransparentBackground(page.locator('[data-demo-id="unit-tree-item"]').nth(1));
  const unitsSurface = page.locator('[data-demo-id="units-surface"]');
  await expectFullBleedProductSurface(unitsSurface);
  await expectContainedBy(unitsSurface, page.locator('[data-demo-id="units-tree-panel"]'));
  await expectContainedBy(unitsSurface, page.locator('[data-demo-id="units-employee-panel"]'));
  const [surfaceBox, firstUnitBox] = await Promise.all([
    unitsSurface.boundingBox(),
    firstUnitRow.boundingBox(),
  ]);
  expect(surfaceBox).not.toBeNull();
  expect(firstUnitBox).not.toBeNull();
  expect((firstUnitBox?.y ?? 0) - (surfaceBox?.y ?? 0)).toBeLessThanOrEqual(16);

  const unitEmployeeSearch = page.locator('[data-demo-id="units-employee-search"]');
  const unitBreadcrumbs = page.locator('[data-demo-id="units-selected-path"]');
  const unitEmployeeAvatar = page.locator('[data-demo-id="unit-employee-card"] > span').first();
  const [unitSearchBox, breadcrumbsBox, employeeAvatarBox] = await Promise.all([
    unitEmployeeSearch.boundingBox(),
    unitBreadcrumbs.boundingBox(),
    unitEmployeeAvatar.boundingBox(),
  ]);
  expect(unitSearchBox).not.toBeNull();
  expect(breadcrumbsBox).not.toBeNull();
  expect(employeeAvatarBox).not.toBeNull();
  expect(Math.abs((unitSearchBox?.x ?? 0) - (employeeAvatarBox?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((breadcrumbsBox?.x ?? 0) - (employeeAvatarBox?.x ?? 0))).toBeLessThanOrEqual(1);
  await expect(page.getByText("Direct Employees", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Employees in descendant Units", { exact: true })).toHaveCount(0);
  const unitSummary = page.locator('[data-demo-id="units-employee-summary"]');
  await expect(unitSummary).toContainText(/\d+ Employees/u);
  const unitRosterRows = page.locator(
    '[data-demo-id="units-employee-cards"] [data-employee-list-track] > [data-index]',
  );
  await expect(unitRosterRows).toHaveCount(4);
  await expect(unitRosterRows.locator('[data-demo-id="unit-employee-card"]')).toHaveCount(4);
  await expect(unitRosterRows.first().locator("[data-employee-card-actions] button")).toHaveCount(
    3,
  );
  const [unitSummaryBox, unitSearchControlBox] = await Promise.all([
    unitSummary.boundingBox(),
    unitEmployeeSearch.boundingBox(),
  ]);
  expect(unitSummaryBox).not.toBeNull();
  expect(unitSearchControlBox).not.toBeNull();
  expect(unitSummaryBox?.y ?? 0).toBeGreaterThanOrEqual(
    (unitSearchControlBox?.y ?? 0) + (unitSearchControlBox?.height ?? 0),
  );
  await unitEmployeeSearch.getByRole("searchbox").fill("Avery");
  await expect(page.locator('[data-demo-id="units-employee-match-count"]')).toContainText(
    "1 match",
  );
  await expect(page.locator('[data-demo-id="unit-employee-card"]')).toHaveCount(1);
  await unitEmployeeSearch.getByRole("searchbox").fill("");
  await expect(page.locator('[data-demo-id="units-employee-match-count"]')).toHaveCount(0);

  await page.getByRole("tab", { name: "Download", exact: true }).click();
  await expect(page.locator('[data-demo-id="export-source-panel"]')).toHaveCSS(
    "border-right-width",
    "0px",
  );
  await expectTonalTabGroup(page.locator('[data-demo-id="export-source-tabs"]'));
  const exportSurface = page.locator('[data-demo-id="export-surface"]');
  await expectFullBleedProductSurface(exportSurface);
  await expectContainedBy(exportSurface, page.locator('[data-demo-id="export-selection-grid"]'));
  await assertLocalRequests();
});

test("shows reactive total and filtered Employee counts", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();

  await expectNoHorizontalRule(page.locator('[data-demo-id="employees-header"]'));

  const employeesSurface = page.locator('[data-demo-id="employees-surface"]');
  await expectFullBleedProductSurface(employeesSurface);
  await expectContainedBy(employeesSurface, page.locator('[data-demo-id="employees-header"]'));
  await expectContainedBy(employeesSurface, page.locator('[data-demo-id="employees-list"]'));

  const summary = page.locator('[data-demo-id="employees-summary"]');
  const search = page.locator('[data-demo-id="employees-search"]');
  await expect(
    page.locator('[data-demo-id="employees-header"]').getByText("Employees", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("4 Employees");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);
  const searchBox = await search.boundingBox();
  const summaryBox = await summary.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(summaryBox).not.toBeNull();
  expect(summaryBox?.y ?? 0).toBeGreaterThanOrEqual((searchBox?.y ?? 0) + (searchBox?.height ?? 0));
  expect(Math.abs((summaryBox?.x ?? 0) - (searchBox?.x ?? 0))).toBeLessThanOrEqual(4);

  const employeeCards = page.locator('[data-demo-id="employees-list"] article');
  await expect(employeeCards).toHaveCount(4);
  const firstCardStyle = await employeeCards.first().evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { borderRadius: style.borderRadius };
  });
  expect(firstCardStyle.borderRadius).toBe("0px");
  const firstTwoCardRects = await employeeCards.evaluateAll((cards) =>
    cards.slice(0, 2).map((card) => {
      const rect = card.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    }),
  );
  const cardGap = (firstTwoCardRects[1]?.top ?? 0) - (firstTwoCardRects[0]?.bottom ?? 0);
  expect(cardGap).toBeGreaterThanOrEqual(0);
  expect(cardGap).toBeLessThanOrEqual(1);
  expect(
    await getBackgroundColor(
      page.locator('[data-demo-id="employees-list"] [data-employee-list-track]'),
    ),
  ).toBe(await getBackgroundColor(employeeCards.first()));

  await search.getByRole("searchbox").fill("Avery");
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("4 Employees");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveText("· 1 match");
  await search.getByRole("searchbox").fill("");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);

  await page.locator('[data-demo-id="employees-position-filter"]').click();
  const filterPopover = page.locator('[data-demo-id="employees-position-popover"]');
  await filterPopover.getByRole("button", { name: "Gender", exact: true }).click();
  await filterPopover.getByRole("checkbox", { name: "Gender: Female", exact: true }).click();
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveText("· 2 matches");
  await expect(page.locator('[data-demo-id="employees-list"]')).toContainText("Riley Chen");
  await filterPopover.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.locator('[data-demo-id="employee-create-button"]').click();
  const createDialog = page.getByRole("dialog", { name: "Create Employee" });
  await expectNoHorizontalRule(createDialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(createDialog.locator('[data-slot="dialog-footer"]'));
  await expect(
    createDialog.getByText("The Employee is stored only in this in-memory workspace.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    createDialog.getByText(
      "PNG, JPEG, or WebP, up to 25 MiB and 40 megapixels. The saved avatar is a 512 × 512 WebP embedded in the workspace.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await createDialog.getByLabel("First name", { exact: true }).fill("Taylor");
  await createDialog.getByLabel("Last name", { exact: true }).fill("Tester");
  const genderSelect = createDialog.getByRole("combobox", { name: "Gender", exact: true });
  await expect(genderSelect).toContainText("Not specified");
  await genderSelect.click();
  await expect(page.getByRole("option")).toHaveText(["Male", "Female", "Not specified"]);
  await page.getByRole("option", { name: "Female", exact: true }).click();
  await createDialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("5 Employees");

  const createdEmployee = page.locator("article").filter({ hasText: "Taylor Tester" });
  await createdEmployee.getByRole("button", { name: "Edit", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(editDialog.getByRole("combobox", { name: "Gender", exact: true })).toContainText(
    "Female",
  );
  await editDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await createdEmployee.getByRole("button", { name: "Delete", exact: true }).click();
  const deleteDialog = page.getByRole("alertdialog");
  await expectNoHorizontalRule(deleteDialog.locator('[data-slot="alert-dialog-header"]'));
  await expectNoHorizontalRule(deleteDialog.locator('[data-slot="alert-dialog-footer"]'));
  await page.locator('[data-demo-id="confirm-delete-employee"]').click();
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("4 Employees");
  await assertLocalRequests();
});

test("renders tonal content-sized Analytics groups with working drill-down", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();

  const analyticsHeader = page.locator('[data-demo-id="analytics-header"]');
  await expectNoHorizontalRule(analyticsHeader);
  const analyticsSurface = page.locator('[data-demo-id="analytics-surface"]');
  await expectFullBleedProductSurface(analyticsSurface);
  await expectContainedBy(analyticsSurface, analyticsHeader);
  expect(
    await page.locator('[data-demo-id="analytics-grid"]').evaluate((element) => {
      const style = window.getComputedStyle(element);
      return { columnGap: style.columnGap, rowGap: style.rowGap };
    }),
  ).toEqual({ columnGap: "16px", rowGap: "16px" });
  const positions = page.locator('[data-demo-id="analytics-positions"]');
  await expect(positions).toHaveAttribute("data-analytics-entry-count", "4");
  await expect(positions).toHaveAttribute("data-analytics-visible-rows", "4");
  await expect(positions).toHaveCSS("height", "252px");
  expect(await getBackgroundColor(positions)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(positions.locator("thead"))).toBe(
    await getBackgroundColor(positions),
  );
  await expect(positions).toHaveCSS("border-width", "0px");
  await expect(positions).toHaveCSS("box-shadow", "none");
  await expect(positions.locator("header")).toHaveCSS("border-bottom-width", "0px");
  expect(
    await positions.locator("[data-analytics-row]").evaluateAll((rows) =>
      rows.map((row) => ({
        bottom: window.getComputedStyle(row).borderBottomWidth,
        top: window.getComputedStyle(row).borderTopWidth,
      })),
    ),
  ).toEqual(
    Array.from({ length: 4 }, () => ({
      bottom: "0px",
      top: "0px",
    })),
  );

  const firstRow = positions.locator("[data-analytics-row]").first();
  const restingBackground = await firstRow.evaluate(
    (row) => window.getComputedStyle(row).backgroundColor,
  );
  await firstRow.hover();
  expect(await firstRow.evaluate((row) => window.getComputedStyle(row).backgroundColor)).not.toBe(
    restingBackground,
  );
  await expect(firstRow).toHaveCSS("box-shadow", "none");

  const valueHeader = positions.getByRole("columnheader", { name: /Value/u });
  const valueSortButton = valueHeader.getByRole("button", { name: "Value", exact: true });
  await valueSortButton.click();
  await expect(valueHeader).toHaveAttribute("aria-sort", "ascending");
  await expectTextBeforeTrailingIcon(valueSortButton);
  await positions.locator('[data-demo-id="analytics-positions-view-button"]').first().click();
  const drillDown = page.locator('[data-demo-id="analytics-employees-dialog"]');
  await expect(drillDown).toBeVisible();
  await drillDown.getByRole("button", { name: "Close", exact: true }).click();

  const duplicates = page.locator('[data-demo-id="analytics-full-name-duplicates"]');
  await expect(duplicates).toHaveAttribute("data-analytics-visible-rows", "0");
  await expect(duplicates).toHaveCSS("height", "148px");
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await getBackgroundColor(positions.locator("thead"))).toBe(
    await getBackgroundColor(positions),
  );
  await assertLocalRequests();
});

test("renders surfaced Org Editor controls and reveals search to the right", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  await page.getByRole("tab", { name: "Editor", exact: true }).click();

  const canvas = page.locator('[data-demo-id="org-editor-canvas"]');
  const topActions = page.locator('[data-demo-id="org-editor-actions"]');
  const viewportActions = page.locator('[data-demo-id="org-editor-viewport-actions"]');
  const topStyle = await topActions.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
      columnGap: style.columnGap,
      padding: style.padding,
    };
  });
  const viewportStyle = await viewportActions.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
      columnGap: style.columnGap,
      padding: style.padding,
    };
  });
  expect(topStyle).toMatchObject({
    borderRadius: "8px",
    borderWidth: "0px",
    columnGap: "4px",
    padding: "6px",
  });
  expect(viewportStyle).toMatchObject({
    borderRadius: "8px",
    borderWidth: "0px",
    columnGap: "4px",
    padding: "6px",
  });
  expect(topStyle.boxShadow).toBe("none");
  expect(viewportStyle.boxShadow).toBe("none");
  expect(topStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(viewportStyle.backgroundColor).toBe(topStyle.backgroundColor);
  expect(await getBackgroundColor(canvas)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(canvas)).not.toBe(
    await getBackgroundColor(page.locator('[data-demo-id="app-shell"]')),
  );
  await expect(canvas).toHaveAttribute("data-grid-base-size", "24");
  await expect(canvas).toHaveAttribute("data-grid-size", "24");
  expect(Number(await canvas.getAttribute("data-grid-screen-size"))).toBe(24);
  await expect(topActions.locator('[data-demo-id="org-view-toolbar"]')).toHaveCount(1);
  const viewSelect = page.locator('[data-demo-id="org-view-select-trigger"]');
  await expect(viewSelect).toHaveAttribute("role", "combobox");
  await expect(viewSelect.locator("svg")).toBeVisible();
  expect(await getBackgroundColor(viewSelect)).not.toBe("rgba(0, 0, 0, 0)");
  await viewSelect.click();
  await expect(page.getByRole("option", { name: "Units", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "Units", exact: true }).click();
  expect(
    await topActions.evaluate(
      (element) => element.lastElementChild?.getAttribute("data-demo-id") ?? null,
    ),
  ).toBe("org-editor-search");
  expect(
    new Set(
      await topActions
        .locator("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => window.getComputedStyle(button).borderWidth),
        ),
    ),
  ).toEqual(new Set(["0px", "1px"]));

  const editorCommand = page.locator('[data-demo-id="org-editor-align-button"]');
  const collapseCommand = page.locator('[data-demo-id="org-editor-toggle-all-units-button"]');
  for (const command of [editorCommand, collapseCommand]) {
    await expect(command).toHaveCSS("font-weight", "400");
    await expectIconBeforeText(command);
  }
  await collapseCommand.click();
  await expect(collapseCommand).toHaveAccessibleName("Expand all");
  await expectIconBeforeText(collapseCommand);
  await collapseCommand.click();
  await expect(collapseCommand).toHaveAccessibleName("Collapse all");
  await expectIconBeforeText(collapseCommand);
  await expectStableHoverGeometry(editorCommand);
  const editorCommandHover = await getBackgroundPresentation(editorCommand);
  expect(editorCommandHover.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(editorCommandHover.alpha).toBe(1);
  expect(editorCommandHover.opacity).toBe("1");

  const editorUnit = page.locator(
    '[data-org-editor-unit-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]',
  );
  const lightUnitResting = await getBackgroundPresentation(editorUnit);
  await expectStableHoverGeometry(editorUnit);
  const lightUnitHover = await getBackgroundPresentation(editorUnit);
  expect(lightUnitHover).toEqual(lightUnitResting);
  expect(lightUnitHover.alpha).toBe(1);
  expect(lightUnitHover.opacity).toBe("1");
  const restingBorderColor = await editorUnit.evaluate(
    (element) => window.getComputedStyle(element).borderColor,
  );
  await editorUnit.click({ position: { x: 72, y: 64 } });
  await expect(editorUnit).toHaveClass(/border-signal/u);
  const selectedUnit = await getBackgroundPresentation(editorUnit);
  expect(selectedUnit).toEqual(lightUnitResting);
  expect(
    await editorUnit.evaluate((element) => window.getComputedStyle(element).borderColor),
  ).not.toBe(restingBorderColor);

  const zoomOutButton = viewportActions.getByRole("button").first();
  for (let index = 0; index < 5; index += 1) await zoomOutButton.click();
  const adaptiveDocumentGridSize = Number(await canvas.getAttribute("data-grid-size"));
  const adaptiveScreenGridSize = Number(await canvas.getAttribute("data-grid-screen-size"));
  expect(adaptiveDocumentGridSize).toBeGreaterThan(24);
  expect(adaptiveDocumentGridSize % 24).toBe(0);
  expect(adaptiveScreenGridSize).toBeGreaterThanOrEqual(24);
  expect(adaptiveScreenGridSize).toBeLessThanOrEqual(52.8);
  const renderedGridSizes = await canvas.evaluate((element) =>
    window
      .getComputedStyle(element)
      .backgroundSize.split(",")
      .flatMap((layer) => layer.trim().split(" ").map(Number.parseFloat)),
  );
  expect(renderedGridSizes).toHaveLength(4);
  expect(renderedGridSizes.every((size) => Math.abs(size - adaptiveScreenGridSize) <= 0.001)).toBe(
    true,
  );
  await viewportActions.getByRole("button").nth(2).click();

  await editorCommand.click();
  expect(
    (
      await canvas.locator("[data-org-editor-unit-id]").evaluateAll((units) =>
        units.map((unit) => {
          const element = unit as HTMLElement;
          return {
            x: Number.parseFloat(element.style.left),
            y: Number.parseFloat(element.style.top),
          };
        }),
      )
    ).every(({ x, y }) => Math.abs(x % 24) === 0 && Math.abs(y % 24) === 0),
  ).toBe(true);
  expect(
    new Set(
      await viewportActions
        .locator("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => window.getComputedStyle(button).borderWidth),
        ),
    ),
  ).toEqual(new Set(["0px"]));

  const canvasBox = await canvas.boundingBox();
  const topActionsBox = await topActions.boundingBox();
  expect(canvasBox).not.toBeNull();
  expect(topActionsBox).not.toBeNull();
  expect(Math.abs((topActionsBox?.x ?? 0) - (canvasBox?.x ?? 0) - 12)).toBeLessThanOrEqual(1);

  const searchButton = page.locator('[data-demo-id="org-editor-search-button"]');
  await searchButton.click();
  const searchInput = page.locator('[data-demo-id="org-editor-search-input"]');
  await expect(searchInput).toBeVisible();
  await expect(page.locator('[data-demo-id="org-editor-search-results"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-editor-search-field"]')).toHaveCSS(
    "width",
    "288px",
  );
  const [buttonBox, inputBox] = await Promise.all([
    searchButton.boundingBox(),
    searchInput.boundingBox(),
  ]);
  expect(buttonBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  expect(inputBox?.x ?? 0).toBeGreaterThanOrEqual(
    (buttonBox?.x ?? 0) + (buttonBox?.width ?? 0) - 1,
  );
  await searchInput.fill("Product");
  await expect(page.locator('[data-demo-id="org-editor-search-results"]')).toBeVisible();
  await searchButton.click();
  await expect(searchInput).toBeHidden();
  await expect(page.locator('[data-demo-id="org-editor-search-results"]')).toHaveCount(0);
  await searchButton.click();
  await expect(searchInput).toHaveValue("");
  await expect(page.locator('[data-demo-id="org-editor-search-results"]')).toHaveCount(0);

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectSidebarNavigation(page, 64);
  const darkTopBackground = await getBackgroundColor(topActions);
  expect(darkTopBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(viewportActions)).toBe(darkTopBackground);
  const darkUnitResting = await getBackgroundPresentation(editorUnit);
  await expectStableHoverGeometry(editorUnit);
  const darkUnitHover = await getBackgroundPresentation(editorUnit);
  expect(darkUnitHover).toEqual(darkUnitResting);
  expect(darkUnitHover.alpha).toBe(1);
  expect(darkUnitHover.opacity).toBe("1");
  await assertLocalRequests();
});

test("exports an aligned long-roster hierarchy as a decoded local PNG", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  const state = await createLongRosterState();
  const importDialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "synthetic-long-roster.json",
  });
  await expect(importDialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "14 Employees",
  );
  await importDialog.getByRole("button", { name: "Replace state", exact: true }).click();

  const product = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  const firstRow = product.locator("[data-org-editor-employee-row]").first();
  const geometry = await product.evaluate((unitElement) => {
    const unit = unitElement.getBoundingClientRect();
    const header = unitElement.querySelector("[data-org-editor-unit-header]");
    const row = unitElement.querySelector("[data-org-editor-employee-row]");
    const avatar = row?.querySelector("[data-org-editor-employee-avatar]");
    const content = row?.querySelector("[data-org-editor-employee-content]");
    if (!(header instanceof HTMLElement) || !(row instanceof HTMLElement)) {
      throw new Error("Editor card geometry is unavailable.");
    }
    if (!(avatar instanceof HTMLElement) || !(content instanceof HTMLElement)) {
      throw new Error("Employee geometry is unavailable.");
    }
    const headerBox = header.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const avatarBox = avatar.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    return {
      avatarCenterX: avatarBox.left + avatarBox.width / 2 - unit.left,
      avatarCenterY: avatarBox.top + avatarBox.height / 2 - rowBox.top,
      borderRadius: Number.parseFloat(window.getComputedStyle(unitElement).borderRadius),
      contentX: contentBox.left - unit.left,
      headerHeight: headerBox.height,
      rowHeight: rowBox.height,
      rowX: rowBox.left - unit.left,
    };
  });
  expect(geometry).toMatchObject({
    avatarCenterX: 27,
    borderRadius: 8,
    contentX: 45,
    headerHeight: 72,
    rowX: 9,
  });
  expect(geometry.avatarCenterY).toBe(geometry.rowHeight / 2);
  await expect(firstRow).toBeVisible();

  await product.click({ button: "right", position: { x: 20, y: 20 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const exportDialog = page.getByRole("dialog", { name: "Export" });
  const preview = exportDialog.locator('[data-demo-id="org-editor-export-image"]');
  await expect(preview).toBeVisible();
  await expect
    .poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalHeight))
    .toBeGreaterThan(1_000);

  const downloadPromise = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Save", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Product.png");
  const path = await download.path();
  const metadata = await sharp(await readFile(path ?? "")).metadata();
  expect(metadata).toMatchObject({ format: "png", hasAlpha: true });
  expect(metadata.width ?? 0).toBeGreaterThanOrEqual(300);
  expect(metadata.height ?? 0).toBeGreaterThan(1_000);
  await assertLocalRequests();
});

test("keeps empty custom Views manageable and deletes them safely", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);

  const viewTrigger = page.locator('[data-demo-id="org-view-select-trigger"]');
  await expect(viewTrigger.locator('[data-demo-id="org-view-active-value"]')).toHaveText("Units");
  await expect(page.locator('[data-demo-id="org-view-rename-button"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-view-delete-button"]')).toHaveCount(0);

  await page.locator('[data-demo-id="org-view-create-button"]').click();
  const createDialog = page.getByRole("dialog", { name: "New View" });
  await createDialog.getByLabel("Name", { exact: true }).fill("Disposable View");
  await createDialog.getByRole("tab", { name: "Blank", exact: true }).click();
  await createDialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(createDialog).toBeHidden();

  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await expect(page.locator('[data-demo-id="org-view-rename-button"]')).toHaveAccessibleName(
    "Rename View",
  );
  const deleteButton = page.locator('[data-demo-id="org-view-delete-button"]');
  await expect(deleteButton).toHaveAccessibleName("Delete View");
  await deleteButton.click();
  let deleteDialog = page.getByRole("alertdialog", { name: "Delete View?" });
  await expect(deleteDialog).toContainText("Units will not change.");
  await deleteDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(viewTrigger.locator('[data-demo-id="org-view-active-value"]')).toHaveText(
    "Disposable View",
  );

  await deleteButton.click();
  deleteDialog = page.getByRole("alertdialog", { name: "Delete View?" });
  await deleteDialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(deleteDialog).toBeHidden();
  await expect(viewTrigger.locator('[data-demo-id="org-view-active-value"]')).toHaveText("Units");
  await viewTrigger.click();
  await expect(page.getByRole("option", { name: "Disposable View", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await expect
    .poll(async () => {
      const response = await page.request.get("/api/state");
      const state = (await response.json()) as {
        state: {
          organization: { views: Array<{ id: string; kind: "custom" | "main"; name: string }> };
          ui: { activeViewId: string };
        };
      };
      const mainViewId = state.state.organization.views.find((view) => view.kind === "main")?.id;
      return {
        activeIsMain: state.state.ui.activeViewId === mainViewId,
        disposableViews: state.state.organization.views.filter(
          (view) => view.name === "Disposable View",
        ).length,
      };
    })
    .toEqual({
      activeIsMain: true,
      disposableViews: 0,
    });
  await assertLocalRequests();
});

test("coalesces large Editor previews and commits each gesture once", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openBlankState(page);
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const timestamp = "2026-08-31T12:00:00.000Z";
  const uuid = (group: string, index: number) =>
    `00000000-0000-${group}-8000-${index.toString(16).padStart(12, "0")}`;
  const employeeId = (index: number) => uuid("4000", index + 1);
  const unitId = (index: number) => uuid("4001", index + 1);
  state.organization.employees = Array.from({ length: 20_000 }, (_, index) => ({
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
  const mainView = state.organization.views.find((view) => view.kind === "main");
  if (!mainView) throw new Error("Synthetic state is missing Main.");
  mainView.document.employeeOverrides = [];
  mainView.document.employees = [];
  mainView.document.units = Array.from({ length: 4_000 }, (_, index) => {
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
      order: index,
      parentId: null,
      updatedAt: timestamp,
      x: (index % 50) * 360,
      y: Math.floor(index / 50) * 240,
    };
  });
  state.organization.views = [mainView];
  state.ui.activeTab = "orgEditor";
  state.ui.activeViewId = mainView.id;
  state.ui.expandedUnitIds = [];
  state.ui.selectedUnitId = null;
  state.ui.views = [{ selectedItems: [], viewId: mainView.id, viewport: { scale: 1, x: 0, y: 0 } }];
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
  await page.waitForTimeout(800);

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
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(panStart.x + 48, panStart.y + 24, { steps: 20 });
  await page.waitForTimeout(500);
  expect(writes).toEqual([]);
  await page.mouse.up({ button: "middle" });
  await expect.poll(() => writes.filter((write) => write.scope === "ui").length).toBe(1);

  const firstUnit = canvas.locator("[data-org-editor-unit-id]").first();
  await firstUnit.click({ position: { x: 72, y: 64 } });
  await page.waitForTimeout(500);
  writes.length = 0;
  const unitBox = await firstUnit.boundingBox();
  if (!unitBox) throw new Error("A visible large-state Unit is unavailable.");
  const dragStart = { x: unitBox.x + 72, y: unitBox.y + 64 };
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragStart.x + 37, dragStart.y + 35, { steps: 20 });
  await page.waitForTimeout(500);
  expect(writes.filter((write) => write.scope === "all")).toEqual([]);
  await page.mouse.up();
  await expect.poll(() => writes.filter((write) => write.scope === "all").length).toBe(1);
  const committedPosition = await firstUnit.evaluate((element) => {
    const unit = element as HTMLElement;
    return { x: Number.parseFloat(unit.style.left), y: Number.parseFloat(unit.style.top) };
  });
  expect(Math.abs(committedPosition.x % 24)).toBe(0);
  expect(Math.abs(committedPosition.y % 24)).toBe(0);
  expect(Number(await canvas.getAttribute("data-spatial-candidate-count"))).toBeLessThan(200);
  page.off("request", onRequest);
  await assertLocalRequests();
});

test("caps long Analytics groups at eight virtualized rows", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const template = state.organization.employees[0];
  if (!template) throw new Error("Synthetic Employee template is unavailable.");
  for (let index = 1; index <= 12; index += 1) {
    state.organization.employees.push({
      ...template,
      avatarBase64Url: null,
      birthday: null,
      email: `sample-${index}@example.test`,
      firstName: `Sample${String(index).padStart(2, "0")}`,
      id: `50000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      lastName: "Employee",
      profileUrl: null,
      tags: [],
      username: `sample-${index}`,
    });
  }
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "large-analytics-state.json",
  });
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(page.locator('[data-demo-id="app-notice"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="state-write-error"]')).toHaveCount(0);
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();

  const firstNames = page.locator('[data-demo-id="analytics-first-names"]');
  await expect(firstNames).toHaveAttribute("data-analytics-entry-count", "16");
  await expect(firstNames).toHaveAttribute("data-analytics-visible-rows", "8");
  await expect(firstNames).toHaveCSS("height", "420px");
  const scrollArea = page.locator('[data-demo-id="analytics-first-names-scroll-area"]');
  expect(
    await scrollArea.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    })),
  ).toMatchObject({ clientHeight: 368 });
  expect(await scrollArea.evaluate((element) => element.scrollHeight)).toBeGreaterThan(368);
  await assertLocalRequests();
});

test("renders safe profile links, birthdays, and dated tag events", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const datedEmployee = state.organization.employees.find(
    (employee) => employee.firstName === "Morgan" && employee.lastName === "Park",
  );
  if (!datedEmployee) throw new Error("Synthetic dated-tag Employee is unavailable.");
  datedEmployee.tags.push({ date: "2026-07-10", label: "Planning" });
  const importDialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "calendar-events-state.json",
  });
  await importDialog.getByRole("button", { name: "Replace state", exact: true }).click();

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  const profileLink = page.getByRole("link", { name: "Avery Stone", exact: true }).first();
  await expect(profileLink).toHaveAttribute("href", "https://example.test/profiles/avery-stone");
  await expect(profileLink).toHaveAttribute("target", "_blank");
  await expect(profileLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(profileLink).toHaveAttribute("referrerpolicy", "no-referrer");

  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await expect(page.getByText("Employee Calendar", { exact: true })).toBeVisible();
  const julyBirthday = page.locator('[data-calendar-date="2026-07-22"]');
  await expect(julyBirthday).toHaveRole("button");
  await julyBirthday.click();
  const birthdayDialog = page.getByRole("dialog", { name: /July 22, 2026/ });
  await expect(birthdayDialog).toContainText("Jordan Reed");
  await expect(
    birthdayDialog.getByText("Birthdays and dated tags for this day", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-demo-id="calendar-birthday-list"]')).toHaveCSS(
    "padding-left",
    "0px",
  );
  await expect(page.locator('[data-demo-id="calendar-birthday-list"]')).toHaveCSS(
    "padding-right",
    "0px",
  );
  await expect(
    birthdayDialog.getByRole("button", { name: "Edit Employee tags", exact: true }),
  ).toBeVisible();
  await birthdayDialog.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Edit Employee" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Edit Employee" })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await birthdayDialog.getByRole("button", { name: "Delete", exact: true }).click();
  await page.locator('[data-demo-id="calendar-confirm-delete-employee"]').click();
  await expect(birthdayDialog.locator('[data-demo-id="calendar-birthdays-section"]')).toHaveCount(
    0,
  );
  await expect(birthdayDialog.getByText("Birthdays", { exact: true })).toHaveCount(0);
  await expect(birthdayDialog.getByText("Dated tags", { exact: true })).toHaveCount(0);
  await birthdayDialog.getByRole("button", { name: "Close" }).click();
  await page.locator('[data-calendar-date="2026-07-10"]').click();
  const datedTagDayDialog = page.getByRole("dialog", { name: /July 10, 2026/ });
  await expect(datedTagDayDialog.getByText("Dated tags", { exact: true })).toHaveCount(0);
  await expect(datedTagDayDialog).toContainText("Morgan Park");
  const datedEmployeeCards = datedTagDayDialog.locator(
    '[data-demo-id="calendar-day-dated-event-employee-card"]',
  );
  await expect(datedEmployeeCards).toHaveCount(1);
  const datedEmployeeCard = datedEmployeeCards.first();
  await expect(datedEmployeeCard.locator("[data-employee-card-actions] button")).toHaveCount(3);
  await expect(datedEmployeeCard.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
  await expect(
    datedEmployeeCard.getByRole("button", { name: "Delete", exact: true }),
  ).toBeVisible();
  await expect(
    datedEmployeeCard.locator('[data-demo-id="calendar-day-dated-event-label"]'),
  ).toHaveText(["Operations", "Planning"]);
  await expect(
    datedTagDayDialog.locator('[data-demo-id="calendar-birthdays-section"]'),
  ).toHaveCount(0);
  await expect(datedTagDayDialog.getByText("Birthdays", { exact: true })).toHaveCount(0);
  await datedEmployeeCard.getByRole("button", { name: "Planning", exact: true }).click();
  const planningTagDialog = page.getByRole("dialog", { name: "Planning" });
  await expect(planningTagDialog).toContainText("Morgan Park");
  await expect(planningTagDialog.getByText("Current and upcoming", { exact: true })).toHaveCount(0);
  await planningTagDialog.getByRole("button", { name: "Close" }).click();
  await datedTagDayDialog.getByRole("button", { name: "Close" }).click();
  await page
    .locator('[data-demo-id="dated-tag-cloud"]')
    .getByRole("button", { name: /Remote/ })
    .click();
  const futureTagDialog = page.getByRole("dialog", { name: "Remote" });
  await expect(futureTagDialog).toContainText("Avery Stone");
  await expect(futureTagDialog.getByText("Current and upcoming", { exact: true })).toHaveCount(0);
  await expect(futureTagDialog.locator('[data-slot="dialog-description"]')).toHaveCount(0);
  const futureEmployeeCard = futureTagDialog
    .locator('[data-demo-id="calendar-tag-event-employee-card"]')
    .first();
  await expect(futureEmployeeCard).toBeVisible();
  await expect(futureEmployeeCard.locator("[data-employee-card-actions] button")).toHaveCount(3);
  await expect(futureEmployeeCard.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
  await expect(
    futureEmployeeCard.getByRole("button", { name: "Delete", exact: true }),
  ).toBeVisible();
  await expect(
    futureTagDialog.locator('[data-demo-id="calendar-past-events-section"]'),
  ).toHaveCount(0);
  await expect(futureTagDialog.getByText("Past", { exact: true })).toHaveCount(0);
  await expect(futureTagDialog.getByText("No past events", { exact: true })).toHaveCount(0);
  await futureTagDialog.getByRole("button", { name: "Close" }).click();
  await page
    .locator('[data-demo-id="dated-tag-cloud"]')
    .getByRole("button", { name: /Operations/ })
    .click();
  const tagDialog = page.getByRole("dialog", { name: "Operations" });
  await expect(tagDialog).toContainText("Morgan Park");
  await expect(tagDialog.getByText("Current and upcoming", { exact: true })).toHaveCount(0);
  await expect(tagDialog).toContainText("Past");
  const upcomingSection = tagDialog.locator('[data-demo-id="calendar-upcoming-events-section"]');
  const pastSection = tagDialog.locator('[data-demo-id="calendar-past-events-section"]');
  await expect(pastSection).toBeVisible();
  expect(
    await upcomingSection.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeLessThan(await pastSection.evaluate((element) => element.getBoundingClientRect().height));
  await expect(tagDialog.locator('[data-slot="dialog-description"]')).toHaveCount(0);
  const tagEmployeeCard = tagDialog
    .locator('[data-demo-id="calendar-tag-event-employee-card"]')
    .first();
  await expect(tagEmployeeCard.locator("[data-employee-card-actions] button")).toHaveCount(3);
  await tagEmployeeCard.getByRole("button", { name: "Edit", exact: true }).click();
  const tagEmployeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await tagEmployeeDialog.getByLabel("First name", { exact: true }).fill("Morgan Updated");
  await tagEmployeeDialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(tagDialog).toContainText("Morgan Updated Park");

  await assertLocalRequests();
});

test("keeps Calendar navigation in the header and fits July at 1280 by 720", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  await page.getByRole("tab", { name: "Calendar", exact: true }).click();

  const navigation = page.locator('[data-demo-id="calendar-header-navigation"]');
  await expectNoHorizontalRule(page.locator('[data-demo-id="calendar-header"]'));
  await expectNoHorizontalRule(page.locator('[data-demo-id="dated-tag-cloud"]'));
  const emptyDate = page.locator('[data-calendar-date="2026-07-01"]');
  const eventDate = page.locator('[data-calendar-date="2026-07-10"]');
  await expect(emptyDate).toHaveRole("button");
  await expect(eventDate).toHaveRole("button");
  await expect(emptyDate).toHaveCSS("border-top-width", "0px");
  await expect(emptyDate).toHaveCSS("cursor", "pointer");
  await expect(eventDate).toHaveCSS("cursor", "pointer");
  const emptyRestingBackground = await getBackgroundColor(emptyDate);
  await expectStableHoverGeometry(emptyDate);
  await expect.poll(() => getBackgroundColor(emptyDate)).not.toBe(emptyRestingBackground);
  const eventRestingBackground = await getBackgroundColor(eventDate);
  await expectStableHoverGeometry(eventDate);
  await expect.poll(() => getBackgroundColor(eventDate)).not.toBe(eventRestingBackground);
  const dateNumberOffsets = await Promise.all(
    [emptyDate, eventDate].map((date) =>
      date.evaluate((element) => {
        const number = element.querySelector("span");
        if (!(number instanceof HTMLElement)) throw new Error("Calendar date number is missing.");
        return number.getBoundingClientRect().top - element.getBoundingClientRect().top;
      }),
    ),
  );
  expect(dateNumberOffsets[0]).toBeCloseTo(dateNumberOffsets[1] ?? 0, 1);
  const todayDate = page.locator('[data-today="true"]');
  await expect(todayDate).toHaveCount(1);
  expect(await getBackgroundColor(todayDate)).not.toBe(await getBackgroundColor(emptyDate));
  expect(
    await todayDate
      .locator("span")
      .first()
      .evaluate((element) => window.getComputedStyle(element).backgroundColor),
  ).not.toBe("rgba(0, 0, 0, 0)");
  await expect(navigation).toContainText("July 2026");
  await expect(navigation.getByRole("button")).toHaveText(["Previous", "Next"]);
  const datedTagSpacing = await page
    .locator('[data-demo-id="calendar-dated-tag-group"]')
    .evaluateAll((groups) =>
      groups.map((group) => {
        const [label, dot, count] = [...group.children];
        if (
          !(label instanceof HTMLElement) ||
          !(dot instanceof HTMLElement) ||
          !(count instanceof HTMLElement)
        ) {
          throw new Error("Calendar dated-tag content is incomplete.");
        }
        return {
          afterDot: count.getBoundingClientRect().left - dot.getBoundingClientRect().right,
          beforeDot: dot.getBoundingClientRect().left - label.getBoundingClientRect().right,
        };
      }),
    );
  expect(datedTagSpacing.length).toBeGreaterThan(1);
  for (const spacing of datedTagSpacing) {
    expect(spacing.beforeDot).toBeCloseTo(spacing.afterDot, 1);
    expect(spacing.beforeDot).toBeCloseTo(4, 1);
  }
  const layout = await page.locator('[data-demo-id="calendar-scroll-area"]').evaluate((element) => {
    const grid = element.querySelector('[data-demo-id="calendar-month-grid"]');
    if (!(grid instanceof HTMLElement)) throw new Error("Calendar grid is unavailable.");
    const area = element as HTMLElement;
    return {
      gridBottom: grid.getBoundingClientRect().bottom,
      gridRight: grid.getBoundingClientRect().right,
      scrollBottom: area.getBoundingClientRect().bottom,
      scrollHeight: area.scrollHeight,
      scrollRight: area.getBoundingClientRect().right,
      scrollWidth: area.scrollWidth,
      visibleHeight: area.clientHeight,
      visibleWidth: area.clientWidth,
    };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.visibleWidth);
  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.visibleHeight);
  expect(layout.gridRight).toBeLessThanOrEqual(layout.scrollRight);
  expect(layout.gridBottom).toBeLessThanOrEqual(layout.scrollBottom);

  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-menu"]').getByRole("option").first().click();
  await navigation.getByRole("button").last().click();
  const localizedMonthTitle = (
    await page.locator('[data-demo-id="calendar-month-title"]').textContent()
  )?.trim();
  expect(localizedMonthTitle?.split(/\s+/u)).toHaveLength(2);
  expect(localizedMonthTitle?.endsWith("2026")).toBe(true);
  await navigation.getByRole("button").first().click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-menu"]').getByRole("option").nth(1).click();
  await expect(navigation).toContainText("July 2026");

  for (let index = 0; index < 6; index += 1) {
    await navigation.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(navigation).toContainText("January 2027");

  await assertLocalRequests();
});

test("edits and clears a dated tag from quick and full Employee editors", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();

  await page.locator('[data-demo-id="employees-tag-picker-trigger"]').first().click();
  const tagPopover = page.locator('[data-demo-id="employees-tag-picker-popover"]');
  await expect(tagPopover.locator('input[type="date"]')).toHaveCount(0);
  const firstTagOption = tagPopover.locator("[data-employee-tag-option]").first();
  await expect(firstTagOption).toBeVisible();
  const tagOptionGeometry = await firstTagOption.evaluate((element) => {
    const row = element.getBoundingClientRect();
    return {
      childrenInside: [...element.children].every((child) => {
        const box = child.getBoundingClientRect();
        return box.top >= row.top && box.bottom <= row.bottom;
      }),
      height: row.height,
    };
  });
  expect(tagOptionGeometry).toEqual({ childrenInside: true, height: 44 });
  await tagPopover.getByRole("button", { name: "Date for tag Remote" }).click();
  const quickDatePopover = page.locator('[data-demo-id="tag-date-popover"]');
  const quickCalendar = quickDatePopover.locator('[data-demo-id="tag-date-calendar"]');
  await expect(quickDatePopover.locator('input[type="date"]')).toHaveCount(0);
  await expect(quickDatePopover.getByText("Remote", { exact: true })).toHaveCount(0);
  await expect(quickCalendar.locator('[data-day="2026-08-12"]')).toHaveAttribute(
    "data-selected",
    "true",
  );
  await quickCalendar.locator('[data-day="2026-08-15"] button').click();
  await expect(quickDatePopover).toBeHidden();
  await page.keyboard.press("Escape");

  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  let employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(employeeDialog.locator('input[type="date"]')).toHaveCount(0);
  await employeeDialog.getByRole("button", { name: "Date for tag Remote" }).click();
  let employeeTagDatePopover = page.locator('[data-demo-id="tag-date-popover"]');
  await expect(employeeTagDatePopover.locator('[data-day="2026-08-15"]')).toHaveAttribute(
    "data-selected",
    "true",
  );
  await employeeTagDatePopover.getByRole("button", { name: "Clear date", exact: true }).click();
  await employeeDialog.getByRole("button", { name: "Save", exact: true }).click();

  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(employeeDialog.locator('input[type="date"]')).toHaveCount(0);
  await employeeDialog.getByRole("button", { name: "Date for tag Remote" }).click();
  employeeTagDatePopover = page.locator('[data-demo-id="tag-date-popover"]');
  await expect(employeeTagDatePopover.locator("[data-selected]")).toHaveCount(0);
  await expect(
    employeeTagDatePopover.getByRole("button", { name: "Clear date", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await employeeDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("adds a tag and applies one date through the bulk Org Editor menu", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankState(page);
  await replaceWithSyntheticState(page);

  const productUnit = page.locator(
    '[data-org-editor-unit-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]',
  );
  const rows = productUnit.locator("[data-org-editor-employee-row]");
  await expect(rows).toHaveCount(2);
  await rows.nth(0).click();
  await rows.nth(1).click({ modifiers: ["Control"] });
  await rows.nth(1).click({ button: "right" });
  const contextMenu = page.locator("[data-org-editor-context-menu]");
  await contextMenu.locator('[data-demo-id="org-editor-employee-tags-action"]').hover();
  const tagPanel = page.locator('[data-demo-id="org-editor-employee-tags-panel"]');
  await expect(tagPanel).toBeVisible();
  await tagPanel.getByRole("checkbox", { name: "Remote", exact: true }).click();
  await tagPanel.getByRole("button", { name: "Date for tag Remote" }).click();
  const bulkTagCalendar = page.locator('[data-demo-id="tag-date-calendar"]');
  await bulkTagCalendar.getByRole("button", { name: "Go to the Next Month", exact: true }).click();
  await bulkTagCalendar.locator('[data-day="2026-08-18"] button').click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-edit-button"]').nth(3).click();
  const employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await employeeDialog.getByRole("button", { name: "Date for tag Remote" }).click();
  await expect(
    page.locator('[data-demo-id="tag-date-calendar"] [data-day="2026-08-18"]'),
  ).toHaveAttribute("data-selected", "true");
  await page.keyboard.press("Escape");
  await employeeDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});
