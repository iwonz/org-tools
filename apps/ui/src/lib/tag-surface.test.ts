import { describe, expect, test } from "vitest";

import { getTagSurfaceHeight, layoutInlineSurfaces, TAG_SURFACE_METRICS } from "@/lib/tag-surface";

const measure = (value: string) => [...value].length * 6;

describe("shared inline surface layout", () => {
  test.each([
    "A deliberately long Latin Tag name",
    "\u041e\u0447\u0435\u043d\u044c \u0434\u043b\u0438\u043d\u043d\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u0438\u0440\u0438\u043b\u043b\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0442\u0435\u0433\u0430",
    "\u0627\u0633\u0645 \u0639\u0644\u0627\u0645\u0629 \u0639\u0631\u0628\u064a\u0629 \u0637\u0648\u064a\u0644 \u0644\u0644\u063a\u0627\u064a\u0629",
    "\u975e\u5e38\u306b\u9577\u3044\u30c1\u30fc\u30e0\u30bf\u30b0\u540d",
    "Platform \ud83d\ude80\ud83e\uddd1\ud83c\udffd\u200d\ud83d\udcbb reliability",
  ])("wraps %s by words and graphemes without losing content", (label) => {
    const layout = layoutInlineSurfaces({
      availableWidth: 60,
      density: "compact",
      locale: "en",
      measureText: measure,
      texts: [label],
    });

    expect(layout.fragments.length).toBeGreaterThan(1);
    expect(
      layout.fragments
        .map((fragment) => fragment.text)
        .join("")
        .replace(/\s+/gu, ""),
    ).toBe(label.normalize("NFC").replace(/\s+/gu, ""));
    expect(layout.fragments.every((fragment) => fragment.width <= 60)).toBe(true);
  });

  test("keeps a short final fragment content-sized", () => {
    const layout = layoutInlineSurfaces({
      availableWidth: 60,
      density: "compact",
      measureText: measure,
      texts: ["abcdefghijk"],
    });

    expect(layout.fragments).toHaveLength(2);
    expect(layout.fragments[0]?.width).toBe(60);
    expect(layout.fragments[1]?.width).toBe(30);
  });

  test("keeps a counter suffix whole on the last fragment or its own fragment", () => {
    const layout = layoutInlineSurfaces({
      availableWidth: 72,
      density: "compact",
      measureText: measure,
      suffixes: [" · 12"],
      texts: ["Long employee tag"],
    });
    const suffixFragments = layout.fragments.filter((fragment) => fragment.text.includes("·"));

    expect(suffixFragments).toHaveLength(1);
    expect(suffixFragments[0]?.text.endsWith("· 12")).toBe(true);
    expect(suffixFragments[0]?.text.match(/·/gu)).toHaveLength(1);
  });

  test("uses the centralized normal and compact metrics", () => {
    const compact = layoutInlineSurfaces({
      availableWidth: 200,
      density: "compact",
      measureText: measure,
      texts: ["Alpha"],
    });
    const normal = layoutInlineSurfaces({
      availableWidth: 200,
      density: "normal",
      measureText: measure,
      texts: ["Alpha"],
    });

    expect(compact.fragments[0]).toMatchObject({
      height: getTagSurfaceHeight("compact"),
      width: measure("Alpha") + TAG_SURFACE_METRICS.compact.horizontalPadding * 2,
    });
    expect(normal.fragments[0]).toMatchObject({
      height: getTagSurfaceHeight("normal"),
      width: measure("Alpha") + TAG_SURFACE_METRICS.normal.horizontalPadding * 2,
    });
  });

  test("mirrors geometry for RTL while preserving semantic order", () => {
    const leftToRight = layoutInlineSurfaces({
      availableWidth: 180,
      density: "normal",
      direction: "ltr",
      locale: "ar",
      measureText: measure,
      texts: ["الهندسة", "المنصة"],
    });
    const rightToLeft = layoutInlineSurfaces({
      availableWidth: 180,
      density: "normal",
      direction: "rtl",
      locale: "ar",
      measureText: measure,
      texts: ["الهندسة", "المنصة"],
    });

    expect(rightToLeft.fragments.map((fragment) => fragment.text)).toEqual(
      leftToRight.fragments.map((fragment) => fragment.text),
    );
    expect(rightToLeft.fragments[0]?.x).toBe(
      180 - (leftToRight.fragments[0]?.width ?? 0) - (leftToRight.fragments[0]?.x ?? 0),
    );
  });
});
