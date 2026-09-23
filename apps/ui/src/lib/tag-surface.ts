export const TAG_SURFACE_METRICS = {
  compact: {
    fontSize: 9,
    gap: 2,
    horizontalPadding: 6,
    lineHeight: 12,
    radius: 6,
    verticalPadding: 0,
  },
  normal: {
    fontSize: 11,
    gap: 4,
    horizontalPadding: 8,
    lineHeight: 16,
    radius: 6,
    verticalPadding: 2,
  },
} as const;

export type TagSurfaceDensity = keyof typeof TAG_SURFACE_METRICS;

export const getTagSurfaceHeight = (density: TagSurfaceDensity) => {
  const metrics = TAG_SURFACE_METRICS[density];
  return metrics.lineHeight + metrics.verticalPadding * 2;
};

export const getTextGraphemes = (value: string, locale?: string) => {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(value)].map(
      ({ segment }) => segment,
    );
  }
  return [...value];
};

export const takeFittingText = (
  value: string,
  maxWidth: number,
  measureText: (value: string) => number,
  locale?: string,
) => {
  if (!value || maxWidth <= 0) return { rest: value, text: "" };
  if (measureText(value) <= maxWidth) return { rest: "", text: value };

  const graphemes = getTextGraphemes(value, locale);
  let candidate = "";
  let lastBreak = -1;
  for (let index = 0; index < graphemes.length; index += 1) {
    const next = `${candidate}${graphemes[index] ?? ""}`;
    if (candidate && measureText(next) > maxWidth) {
      const splitAt = lastBreak > 0 ? lastBreak : index;
      const text = graphemes.slice(0, splitAt).join("").trimEnd();
      const rest = graphemes.slice(splitAt).join("").trimStart();
      return { rest, text: text || graphemes[0] || "" };
    }
    candidate = next;
    if (/\s/u.test(graphemes[index] ?? "")) lastBreak = index + 1;
  }
  return { rest: "", text: candidate };
};

export type InlineSurfaceLayoutFragment = {
  continued: boolean;
  end: number;
  height: number;
  itemIndex: number;
  row: number;
  start: number;
  text: string;
  width: number;
  x: number;
  y: number;
};

export type InlineSurfaceLayout = {
  fragments: InlineSurfaceLayoutFragment[];
  height: number;
  rowCount: number;
};

export const layoutInlineSurfaces = ({
  availableWidth,
  density,
  direction = "ltr",
  locale,
  measureText,
  suffixes,
  texts,
}: {
  availableWidth: number;
  density: TagSurfaceDensity;
  direction?: "ltr" | "rtl";
  locale?: string;
  measureText: (value: string) => number;
  suffixes?: readonly (string | null | undefined)[];
  texts: readonly string[];
}): InlineSurfaceLayout => {
  if (texts.length === 0 || availableWidth <= 0) return { fragments: [], height: 0, rowCount: 0 };
  const metrics = TAG_SURFACE_METRICS[density];
  const fragmentHeight = getTagSurfaceHeight(density);
  const fragments: InlineSurfaceLayoutFragment[] = [];
  let row = 0;
  let usedWidth = 0;

  const appendFragmentedText = (
    itemIndex: number,
    sourceText: string,
    initialContinued: boolean,
    initialStart: number,
  ) => {
    let rest = sourceText.normalize("NFC").trim();
    let start = initialStart;
    let continued = initialContinued;
    if (!rest) rest = " ";

    while (rest) {
      const gap = usedWidth > 0 ? metrics.gap : 0;
      let maxTextWidth = availableWidth - usedWidth - gap - metrics.horizontalPadding * 2;
      if (maxTextWidth <= 0 && usedWidth > 0) {
        row += 1;
        usedWidth = 0;
        continue;
      }
      maxTextWidth = Math.max(1, maxTextWidth);
      const fitted = takeFittingText(rest, maxTextWidth, measureText, locale);
      if (!fitted.text && usedWidth > 0) {
        row += 1;
        usedWidth = 0;
        continue;
      }
      const text = fitted.text || getTextGraphemes(rest, locale)[0] || "";
      const width = Math.min(
        availableWidth,
        Math.max(
          metrics.horizontalPadding * 2 + 1,
          measureText(text) + metrics.horizontalPadding * 2,
        ),
      );
      const x = usedWidth + gap;
      fragments.push({
        continued,
        end: start + text.length,
        height: fragmentHeight,
        itemIndex,
        row,
        start,
        text,
        width,
        x,
        y: row * (fragmentHeight + metrics.gap),
      });
      usedWidth = x + width;
      start += text.length + Math.max(0, rest.length - fitted.rest.length - text.length);
      rest = fitted.rest;
      continued = true;
      if (rest) {
        row += 1;
        usedWidth = 0;
      }
    }
  };

  for (const [itemIndex, sourceText] of texts.entries()) {
    appendFragmentedText(itemIndex, sourceText, false, 0);
    const suffix = suffixes?.[itemIndex]?.normalize("NFC") ?? "";
    if (!suffix) continue;
    const lastFragment = fragments.at(-1);
    if (lastFragment?.itemIndex === itemIndex) {
      const combinedText = `${lastFragment.text}${suffix}`;
      const combinedWidth = Math.min(
        availableWidth,
        Math.max(
          metrics.horizontalPadding * 2 + 1,
          measureText(combinedText) + metrics.horizontalPadding * 2,
        ),
      );
      if (lastFragment.x + combinedWidth <= availableWidth) {
        lastFragment.text = combinedText;
        lastFragment.end += suffix.length;
        lastFragment.width = combinedWidth;
        usedWidth = lastFragment.x + combinedWidth;
        continue;
      }
    }
    appendFragmentedText(
      itemIndex,
      suffix.trimStart(),
      true,
      sourceText.normalize("NFC").trim().length,
    );
  }

  if (direction === "rtl") {
    for (const fragment of fragments) {
      fragment.x = availableWidth - fragment.x - fragment.width;
    }
  }

  return {
    fragments,
    height: (row + 1) * fragmentHeight + row * metrics.gap,
    rowCount: row + 1,
  };
};
