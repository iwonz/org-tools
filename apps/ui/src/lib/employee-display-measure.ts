export type EmployeeDisplayFontStyle = {
  fontFamily: string;
  fontSize: number;
  fontStyle?: "italic" | "normal";
  fontWeight?: number;
};

export type EmployeeDisplayTextMeasure = (value: string, style: EmployeeDisplayFontStyle) => number;

const DEFAULT_MEASURE_CACHE_LIMIT = 32_768;
export const DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY =
  '"Noto Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const EMPLOYEE_DISPLAY_MONOSPACE_FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

const getCanvasFont = ({
  fontFamily,
  fontSize,
  fontStyle = "normal",
  fontWeight = 400,
}: EmployeeDisplayFontStyle) =>
  `${fontStyle === "italic" ? "italic " : ""}${fontWeight} ${fontSize}px ${fontFamily}`;

const estimateTextWidth: EmployeeDisplayTextMeasure = (value, style) => {
  const base = style.fontSize * 0.54;
  return [...value.normalize("NFC")].reduce((width, glyph) => {
    if (/\s/u.test(glyph)) return width + base * 0.48;
    if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(glyph)) {
      return width + style.fontSize;
    }
    if (/\p{Script=Arabic}/u.test(glyph)) return width + base * 0.95;
    if (/[ilI|!.,:;'"`]/u.test(glyph)) return width + base * 0.45;
    if (/[MWmw@%&]/u.test(glyph)) return width + base * 1.45;
    return width + base;
  }, 0);
};

export const createEmployeeDisplayTextMeasureEngine = ({
  createContext,
  maxEntries = DEFAULT_MEASURE_CACHE_LIMIT,
}: {
  createContext: () => CanvasRenderingContext2D | null;
  maxEntries?: number;
}) => {
  let context: CanvasRenderingContext2D | null | undefined;
  const cache = new Map<string, number>();

  const measure: EmployeeDisplayTextMeasure = (value, style) => {
    if (!value) return 0;
    const font = getCanvasFont(style);
    const key = `${font}\u0000${value}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      cache.delete(key);
      cache.set(key, cached);
      return cached;
    }
    context ??= createContext();
    let width = estimateTextWidth(value, style);
    if (context) {
      context.font = font;
      width = context.measureText(value).width;
    }
    cache.set(key, width);
    while (cache.size > maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
    return width;
  };

  return {
    getCacheSize: () => cache.size,
    invalidate: () => {
      context = undefined;
      cache.clear();
    },
    measure,
  };
};

export const employeeDisplayTextMeasureEngine = createEmployeeDisplayTextMeasureEngine({
  createContext: () =>
    typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d"),
});

let employeeDisplayMeasurementRevision = 0;
let browserFontsReadyPromise: Promise<void> | null = null;
let browserFontsReadyKey = "";
let cachedUiFontFamily: string | null = null;
let cachedUiFontKey = "";
const employeeDisplayMeasurementSubscribers = new Set<() => void>();

export const getEmployeeDisplayMeasurementRevision = () => employeeDisplayMeasurementRevision;

export const invalidateEmployeeDisplayTextMeasurements = () => {
  employeeDisplayTextMeasureEngine.invalidate();
  cachedUiFontFamily = null;
  cachedUiFontKey = "";
  employeeDisplayMeasurementRevision += 1;
  for (const subscriber of employeeDisplayMeasurementSubscribers) subscriber();
};

export const subscribeEmployeeDisplayTextMeasurements = (subscriber: () => void) => {
  employeeDisplayMeasurementSubscribers.add(subscriber);
  return () => employeeDisplayMeasurementSubscribers.delete(subscriber);
};

export const ensureEmployeeDisplayFontsReady = (locale?: string) => {
  if (typeof document === "undefined") return browserFontsReadyPromise;
  const key = locale ?? document.documentElement.lang;
  if (browserFontsReadyPromise && browserFontsReadyKey === key) return browserFontsReadyPromise;
  browserFontsReadyKey = key;
  browserFontsReadyPromise = document.fonts.ready.then(() => {
    invalidateEmployeeDisplayTextMeasurements();
  });
  return browserFontsReadyPromise;
};

export const getEmployeeDisplayUiFontFamily = () => {
  if (typeof document === "undefined") return DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY;
  const key = `${document.documentElement.lang}\u0000${document.body.className}`;
  if (cachedUiFontFamily && cachedUiFontKey === key) return cachedUiFontFamily;
  cachedUiFontKey = key;
  cachedUiFontFamily =
    window.getComputedStyle(document.body).fontFamily || DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY;
  return cachedUiFontFamily;
};
