import { readFile } from "node:fs/promises";

import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  expectLocalRequestsOnly,
  openBlankWorkspace,
  openImportDialog,
  productTabs,
  replaceWithSyntheticWorkspace,
  syntheticEmployeesJsonPath,
  syntheticWorkspacePath,
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

async function expectTransparentBackground(locator: Locator) {
  expect(await getBackgroundColor(locator)).toBe("rgba(0, 0, 0, 0)");
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
  expect(buttonStyles).toHaveLength(4);
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
    ).toEqual(Array.from({ length: 4 }, () => 0));
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

test("opens a blank workspace with all product surfaces", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

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
  const darkThemeOption = page.getByRole("option", { name: "Dark", exact: true });
  await expectStableHoverGeometry(darkThemeOption);
  await darkThemeOption.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectSidebarNavigation(page, 64);
  await expectSidebarActions(page);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Light", exact: true }).click();
  await page.locator('[data-demo-id="language-toggle"]').click();
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
  await openBlankWorkspace(page);

  const tab = page.locator('[data-demo-id="tab-units"]');
  const action = page.locator('[data-demo-id="save-workspace"]');
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
  await openBlankWorkspace(page);

  const header = page.locator('[data-demo-id="app-header"]');
  const sidebar = page.locator('[data-demo-id="app-sidebar"]');
  const sidebarToggle = page.locator('[data-demo-id="sidebar-toggle"]');
  const importLabel = page.locator('[data-demo-id="import-action"] [data-sidebar-label=""]');
  const exportLabel = page.locator('[data-demo-id="save-workspace"] [data-sidebar-label=""]');

  await expectSidebarNavigation(page, 64);
  await expectSidebarActions(page);
  expect(await getBackgroundColor(header)).not.toBe("rgba(0, 0, 0, 0)");
  await expect(importLabel).toBeHidden();
  await expect(exportLabel).toBeHidden();
  await expect(sidebarToggle).toBeHidden();
  await expect(page.locator('[data-demo-id="import-action"]')).toHaveAccessibleName("Import");
  await expect(page.locator('[data-demo-id="save-workspace"]')).toHaveAccessibleName("Export");
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
  await openBlankWorkspace(page);

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

  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="tab-org-editor"]').click();
  const editorCanvas = page.locator('[data-demo-id="org-editor-canvas"]');
  const editorCanvasBox = await editorCanvas.boundingBox();
  expect(editorCanvasBox).not.toBeNull();

  const surfaces = [
    [
      "tab-units",
      '[data-demo-id="units-surface"]',
      ['[data-demo-id="unit-create-root-button"]', '[data-demo-id="units-employee-header"]'],
    ],
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

test("opens the chooser before the dialog and maps ordinary JSON without format examples", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  await expect(page.locator('[data-demo-id="import-file-input"]')).toHaveAttribute(
    "accept",
    ".json,application/json",
  );
  const canceledChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const canceledChooser = await canceledChooserPromise;
  await canceledChooser.setFiles([]);
  await expect(page.getByRole("dialog", { name: "Import" })).toHaveCount(0);

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await expect(page.getByRole("dialog", { name: "Import" })).toHaveCount(0);
  await fileChooser.setFiles(syntheticEmployeesJsonPath);
  const dialog = page.getByRole("dialog", { name: "Import" });
  await expect(dialog).toBeVisible();
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-footer"]'));
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expectNoHorizontalRule(dialog.locator('[data-demo-id="employee-mapping-row"]').first());
  await expect(dialog.getByRole("tab")).toHaveCount(0);
  await expect(dialog.getByRole("radiogroup", { name: "Import as" })).toContainText("Teams");
  await expect(dialog.getByRole("radiogroup", { name: "Import as" })).toContainText("Employees");
  await expect(dialog.getByText("employees.json", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

  const repeatedFileDialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(repeatedFileDialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await repeatedFileDialog.getByRole("button", { name: "Cancel", exact: true }).click();

  const malformedStateDialog = await openImportDialog(page, {
    buffer: Buffer.from(
      JSON.stringify({ employees: [], kind: "org-tools-state", unexpected: [], views: [] }),
    ),
    mimeType: "application/json",
    name: "malformed-state.json",
  });
  await expect(
    malformedStateDialog.getByText("Could not read or parse the selected file.", { exact: true }),
  ).toBeVisible();
  await expect(malformedStateDialog.getByText("Field mapping", { exact: true })).toHaveCount(0);
  await malformedStateDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("selects and appends Employees from a recognized workspace state", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Employees", exact: true }).check();
  await expect(dialog.getByText("Structured import preview", { exact: true })).toBeVisible();
  await expect(dialog.getByText("4 new Employees", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="structured-preview-employee-card"]')).toHaveCount(4);
  const importMode = dialog.locator('[data-demo-id="state-import-mode"]');
  await expect(importMode.getByText("Import mode", { exact: true })).toBeVisible();
  await expectNoHorizontalRule(importMode);
  const appendOperation = importMode.locator('[data-demo-id="state-operation-append"]');
  const replaceOperation = importMode.locator('[data-demo-id="state-operation-replace"]');
  await expect(appendOperation).toHaveCSS("border-top-width", "0px");
  await expect(replaceOperation).toHaveCSS("border-top-width", "0px");
  expect(await getBackgroundColor(appendOperation)).not.toBe(
    await getBackgroundColor(replaceOperation),
  );
  await expect(appendOperation).toHaveCSS("box-shadow", "none");
  await expect(
    dialog.getByRole("radiogroup", { name: "Import operation" }).getByRole("radio").first(),
  ).toBeChecked();
  await dialog.getByRole("button", { name: "Append", exact: true }).click();
  const importNotice = page.getByRole("status");
  await expect(importNotice).toHaveText("Import merged into Main.");
  await expect(importNotice).toHaveCSS("border-top-width", "0px");
  await expect(importNotice).toHaveCSS("border-bottom-width", "0px");

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByText("Avery Stone", { exact: true }).first()).toBeVisible();
  await assertLocalRequests();
});

test("previews nested recognized Teams with Employee cards and cancels without mutation", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();

  const product = dialog
    .locator('[data-demo-id="structured-preview-team"]')
    .filter({ hasText: "Product" });
  const platform = dialog
    .locator('[data-demo-id="structured-preview-team"]')
    .filter({ hasText: "Platform" });
  await expect(product).toBeVisible();
  await expect(platform).toBeVisible();
  expect(
    await platform.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).marginInlineStart),
    ),
  ).toBeGreaterThan(
    await product.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).marginInlineStart),
    ),
  );

  const cards = dialog.locator('[data-demo-id="structured-preview-employee-card"]');
  await expect(cards).toHaveCount(4);
  await expect(cards.filter({ hasText: "Avery Stone" })).toContainText("Product Lead");
  await expect(cards.filter({ hasText: "Avery Stone" })).toContainText("Boss");
  await expect(cards.filter({ hasText: "Riley Chen" })).toContainText("Research");

  await product.getByRole("button", { name: "Collapse" }).click();
  await expect(platform).toHaveCount(0);
  await product.getByRole("button", { name: "Expand" }).click();
  await expect(platform).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await assertLocalRequests();
});

test("keeps overlay-separated Import chrome contained at 390 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();

  const append = dialog.locator('[data-demo-id="state-operation-append"]');
  const replace = dialog.locator('[data-demo-id="state-operation-replace"]');
  const appendBox = await append.boundingBox();
  const replaceBox = await replace.boundingBox();
  expect(appendBox).not.toBeNull();
  expect(replaceBox).not.toBeNull();
  expect(replaceBox?.y ?? 0).toBeGreaterThan((appendBox?.y ?? 0) + (appendBox?.height ?? 0) - 1);
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-footer"]'));
  await expect(dialog.locator('[data-slot="dialog-footer"]')).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
    await dialog.evaluate((element) => element.clientWidth),
  );
  expect(
    await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => element.scrollHeight),
  ).toBeGreaterThan(
    await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => element.clientHeight),
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("virtualizes a large mapped Team and Employee preview", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const teams = Array.from({ length: 120 }, (_, index) => ({
    employees: [
      {
        email: `employee-${index}@example.test`,
        employeeKey: `employee-${index}`,
        firstName: "Employee",
        lastName: String(index),
        position: "Contributor",
        username: `employee-${index}`,
      },
    ],
    key: `team-${index}`,
    name: `Team ${index}`,
  }));
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(teams)),
    mimeType: "application/json",
    name: "large-teams.json",
  });
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  const viewport = dialog.locator('[data-demo-id="structured-preview-viewport"]');
  await expect(viewport).toBeVisible();
  expect(await viewport.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(400);
  expect(await viewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  expect(await dialog.locator('[data-demo-id="structured-preview-team"]').count()).toBeLessThan(
    teams.length,
  );
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(dialog.getByText("Team 119", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("selects and replaces current data with Teams from a recognized workspace state", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Teams", exact: true }).check();
  await expect(dialog.getByText("2 manual Teams", { exact: true })).toBeVisible();
  await dialog
    .getByRole("radiogroup", { name: "Import operation" })
    .getByRole("radio")
    .last()
    .check();
  await expect(
    dialog.getByText("Remove current Employees, Teams, and custom Views before importing."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Replace all current", exact: true }).click();

  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await page.getByText("Product", { exact: true }).first().click();
  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await assertLocalRequests();
});

test("maps nested generic JSON as Teams with Employee assignments", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(
      JSON.stringify([
        {
          children: [
            {
              employees: [
                {
                  email: "jordan.reed@example.test",
                  employeeKey: "jordan",
                  firstName: "Jordan",
                  isBoss: true,
                  lastName: "Reed",
                  position: "Engineer",
                  tags: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"],
                  username: "jordan.reed",
                },
              ],
              key: "platform",
              name: "Platform",
            },
          ],
          key: "engineering",
          name: "Engineering",
        },
      ]),
    ),
    mimeType: "application/json",
    name: "teams-employees.json",
  });
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  await expect(dialog.getByText("1 assignments", { exact: true })).toBeVisible();
  await expect(
    dialog.locator('[data-demo-id="structured-preview-team"]').filter({ hasText: "Platform" }),
  ).toBeVisible();
  await expect(
    dialog
      .locator('[data-demo-id="structured-preview-employee-card"]')
      .filter({ hasText: "Jordan Reed" }),
  ).toContainText("Engineer");
  await dialog.getByRole("button", { name: "Append", exact: true }).click();

  const editorEmployee = page
    .locator("[data-org-editor-employee-row]")
    .filter({ hasText: "Jordan Reed" });
  await expect(editorEmployee).toContainText("Theta");
  await expect(editorEmployee.locator('[data-employee-tags-hidden-count="0"]')).toBeVisible();
  const platformCanvasUnit = page.locator('fieldset[aria-label="Canvas Unit Platform"]');
  await platformCanvasUnit.click({ button: "right" });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const imageExportDialog = page.getByRole("dialog", { name: "Export" });
  const imagePreview = imageExportDialog.locator('[data-demo-id="org-editor-export-image"]');
  await expect(imagePreview).toBeVisible();
  expect(
    await imagePreview.evaluate((image) => (image as HTMLImageElement).naturalHeight),
  ).toBeGreaterThan(120);
  const pngDownloadPromise = page.waitForEvent("download");
  await imageExportDialog.getByRole("button", { name: "Save", exact: true }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toMatch(/\.png$/u);
  const pngPath = await pngDownload.path();
  expect(pngPath).not.toBeNull();
  expect((await readFile(pngPath ?? "")).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await page.getByText("Platform", { exact: true }).first().click();
  const unitEmployee = page.locator('[data-demo-id="unit-employee-card"]');
  await expect(unitEmployee).toContainText("Jordan Reed");
  await expect(unitEmployee).toContainText("Theta");
  await expect(unitEmployee.locator('[data-employee-tags-hidden-count="0"]')).toBeVisible();
  await assertLocalRequests();
});

test("exports a blank workspace as the public state format", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export workspace" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: /Full workspace/ })).toBeChecked();
  await expect(dialog.locator('input[value="teams"]')).toBeDisabled();
  await expect(dialog.locator('input[value="employees"]')).toBeDisabled();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("org-tools-state.json");
  await expect(page.getByRole("status")).toHaveCount(0);

  await assertLocalRequests();
});

test("downloads all workspace Export formats in order and re-imports the combined document", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  const downloads: Array<{
    fileName: string;
    content: "employees" | "teams" | "teamsEmployees" | "workspace";
  }> = [
    { content: "teams", fileName: "org-tools-teams.json" },
    { content: "employees", fileName: "org-tools-employees.json" },
    { content: "teamsEmployees", fileName: "org-tools-teams-employees.json" },
    { content: "workspace", fileName: "org-tools-state.json" },
  ];
  let combinedPath = "";

  for (const expected of downloads) {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Export workspace" });
    expect(
      await dialog
        .locator('input[name="save-format"]')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    ).toEqual(["teams", "employees", "teamsEmployees", "workspace"]);
    await expect(dialog.locator('input[value="workspace"]')).toBeChecked();
    await dialog.locator(`input[value="${expected.content}"]`).check();
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(expected.fileName);
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const document = JSON.parse(await readFile(filePath ?? "", "utf8")) as {
      content: string;
      kind: string;
    };
    expect(document.kind).toBe("org-tools-state");
    expect(document.content).toBe(expected.content);
    expect(document).not.toHaveProperty("formatVersion");
    expect(document).not.toHaveProperty("schemaVersion");
    if (expected.content === "teamsEmployees") combinedPath = filePath ?? "";
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  const importDialog = await openImportDialog(page, combinedPath);
  await expect(importDialog.getByText("Structured import preview", { exact: true })).toBeVisible();
  await importDialog.getByRole("button", { name: "Append", exact: true }).click();
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();

  await assertLocalRequests();
});

test("keeps CSV as a Download output while Import accepts JSON only", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

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
  await openBlankWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Create Employee", exact: true }).click();
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

test("atomically opens a complete synthetic workspace", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await expect(page.locator('[data-demo-id="units-tree-panel"]')).toHaveCSS(
    "border-right-width",
    "0px",
  );
  await expectNoHorizontalRule(page.locator('[data-demo-id="units-tree-header"]'));
  await expectNoHorizontalRule(page.locator('[data-demo-id="units-employee-header"]'));
  const firstUnitRow = page.locator('[data-demo-id="unit-tree-item"]').first();
  await expect(firstUnitRow).toHaveCSS("border-width", "0px");
  await expectTransparentBackground(page.locator('[data-demo-id="unit-tree-item"]').nth(1));
  const unitsSurface = page.locator('[data-demo-id="units-surface"]');
  await expectFullBleedProductSurface(unitsSurface);
  await expectContainedBy(unitsSurface, page.locator('[data-demo-id="units-tree-panel"]'));
  await expectContainedBy(unitsSurface, page.locator('[data-demo-id="units-employee-panel"]'));

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
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
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
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
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
  await valueHeader.getByRole("button", { name: "Value", exact: true }).click();
  await expect(valueHeader).toHaveAttribute("aria-sort", "ascending");
  await positions.locator('[data-demo-id="analytics-positions-view-button"]').first().click();
  const drillDown = page.locator('[data-demo-id="analytics-employees-dialog"]');
  await expect(drillDown).toBeVisible();
  await drillDown.getByRole("button", { name: "Close", exact: true }).click();

  const duplicates = page.locator('[data-demo-id="analytics-full-name-duplicates"]');
  await expect(duplicates).toHaveAttribute("data-analytics-visible-rows", "0");
  await expect(duplicates).toHaveCSS("height", "148px");
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  expect(await getBackgroundColor(positions.locator("thead"))).toBe(
    await getBackgroundColor(positions),
  );
  await assertLocalRequests();
});

test("renders surfaced Org Editor controls and reveals search to the right", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
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
  ).toEqual(new Set(["0px"]));

  const editorCommand = page.locator('[data-demo-id="org-editor-align-button"]');
  await expectStableHoverGeometry(editorCommand);
  const editorCommandHover = await editorCommand.evaluate((element) => {
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
  expect(editorCommandHover.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(editorCommandHover.alpha).toBe(1);
  expect(editorCommandHover.opacity).toBe("1");

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

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectSidebarNavigation(page, 64);
  const darkTopBackground = await getBackgroundColor(topActions);
  expect(darkTopBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(viewportActions)).toBe(darkTopBackground);
  await assertLocalRequests();
});

test("caps long Analytics groups at eight virtualized rows", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const state = JSON.parse(await readFile(syntheticWorkspacePath, "utf8")) as {
    employees: Array<Record<string, unknown>>;
  };
  const template = state.employees[0];
  if (!template) throw new Error("Synthetic Employee template is unavailable.");
  for (let index = 1; index <= 12; index += 1) {
    state.employees.push({
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
  await dialog.getByRole("button", { name: "Replace all current", exact: true }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
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
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

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
  await expect(birthdayDialog).toContainText("No birthdays");
  await expect(birthdayDialog.getByText("Dated tags", { exact: true })).toHaveCount(0);
  await birthdayDialog.getByRole("button", { name: "Close" }).click();
  await page.locator('[data-calendar-date="2026-07-10"]').click();
  const datedTagDayDialog = page.getByRole("dialog", { name: /July 10, 2026/ });
  await expect(datedTagDayDialog.getByText("Dated tags", { exact: true })).toBeVisible();
  await expect(datedTagDayDialog).toContainText("Morgan Park");
  await datedTagDayDialog.getByRole("button", { name: "Close" }).click();
  await page
    .locator('[data-demo-id="dated-tag-cloud"]')
    .getByRole("button", { name: /Operations/ })
    .click();
  const tagDialog = page.getByRole("dialog", { name: "Operations" });
  await expect(tagDialog).toContainText("Morgan Park");
  await expect(tagDialog).toContainText("Past");

  await assertLocalRequests();
});

test("keeps Calendar navigation in the header and fits July at 1280 by 720", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
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
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
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
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

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

test("maps and imports synthetic JSON Employees without Unit assignments", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  const dialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 new", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Import 2 Employees", exact: true }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByText("Avery Stone", { exact: true }).first()).toBeVisible();
  await assertLocalRequests();
});

test("discovers the nested Employee collection in synthetic JSON", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  const dialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(dialog.getByText("$.records (2 rows)", { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 new", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await assertLocalRequests();
});
