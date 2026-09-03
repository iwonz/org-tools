import type { EmployeeTagColor, EmployeeTagColorName } from "@org-tools/types";
import type { CSSProperties } from "react";

export const EMPLOYEE_TAG_COLOR_NAMES = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "cyan",
  "blue",
  "rose",
] as const satisfies readonly EmployeeTagColorName[];

export const EMPLOYEE_TAG_COLOR_HEX = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  rose: "#f43f5e",
  teal: "#14b8a6",
} as const satisfies Record<EmployeeTagColorName, `#${string}`>;

export const DEFAULT_CUSTOM_TAG_COLOR = "#6366f1" as const;

const CUSTOM_TAG_COLOR_PATTERN = /^#[0-9a-f]{6}$/u;

export const isEmployeeTagColorName = (color: string): color is EmployeeTagColorName =>
  (EMPLOYEE_TAG_COLOR_NAMES as readonly string[]).includes(color);

export const isCustomEmployeeTagColor = (color: string): color is `#${string}` =>
  CUSTOM_TAG_COLOR_PATTERN.test(color);

export const normalizeCustomEmployeeTagColor = (color: string): `#${string}` | null => {
  const normalized = color.trim().toLowerCase();
  return CUSTOM_TAG_COLOR_PATTERN.test(normalized) ? (normalized as `#${string}`) : null;
};

type Rgb = { blue: number; green: number; red: number };
export type Hsv = { hue: number; saturation: number; value: number };

const parseHex = (hex: string): Rgb | null => {
  if (!CUSTOM_TAG_COLOR_PATTERN.test(hex)) return null;
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  };
};

const channelToHex = (channel: number) =>
  Math.round(Math.min(255, Math.max(0, channel)))
    .toString(16)
    .padStart(2, "0");

const rgbToHex = ({ blue, green, red }: Rgb): `#${string}` =>
  `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;

const mix = (foreground: Rgb, background: Rgb, amount: number): Rgb => ({
  red: foreground.red * amount + background.red * (1 - amount),
  green: foreground.green * amount + background.green * (1 - amount),
  blue: foreground.blue * amount + background.blue * (1 - amount),
});

const luminance = ({ blue, green, red }: Rgb) => {
  const linearize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
};

const contrast = (first: Rgb, second: Rgb) => {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
};

export const customTagColorSurfaceStyle = (
  color: EmployeeTagColor | null | undefined,
): CSSProperties | undefined => {
  if (!color || !isCustomEmployeeTagColor(color)) return undefined;
  const rgb = parseHex(color);
  if (!rgb) return undefined;
  const white = { blue: 255, green: 255, red: 255 };
  const nearBlack = { blue: 23, green: 23, red: 23 };
  const lightFill = mix(rgb, white, 0.18);
  const darkFill = mix(rgb, nearBlack, 0.24);
  const tintedDark = mix(rgb, nearBlack, 0.52);
  const tintedLight = mix(rgb, white, 0.68);
  const lightText = contrast(tintedDark, lightFill) >= 4.5 ? tintedDark : nearBlack;
  const darkText = contrast(tintedLight, darkFill) >= 4.5 ? tintedLight : white;
  return {
    "--tag-custom-fill": rgbToHex(lightFill),
    "--tag-custom-fill-active": rgbToHex(mix(rgb, white, 0.3)),
    "--tag-custom-fill-hover": rgbToHex(mix(rgb, white, 0.24)),
    "--tag-custom-foreground": rgbToHex(lightText),
    "--tag-custom-fill-dark": rgbToHex(darkFill),
    "--tag-custom-fill-active-dark": rgbToHex(mix(rgb, nearBlack, 0.36)),
    "--tag-custom-fill-hover-dark": rgbToHex(mix(rgb, nearBlack, 0.3)),
    "--tag-custom-foreground-dark": rgbToHex(darkText),
  } as CSSProperties;
};

export const employeeTagColorToHex = (color: EmployeeTagColor | null | undefined): `#${string}` => {
  if (color && isCustomEmployeeTagColor(color)) return color;
  if (color && isEmployeeTagColorName(color)) return EMPLOYEE_TAG_COLOR_HEX[color];
  return DEFAULT_CUSTOM_TAG_COLOR;
};

export const hexToHsv = (hex: string): Hsv => {
  const { blue, green, red } = parseHex(hex) ?? { blue: 241, green: 102, red: 99 };
  const redUnit = red / 255;
  const greenUnit = green / 255;
  const blueUnit = blue / 255;
  const maximum = Math.max(redUnit, greenUnit, blueUnit);
  const minimum = Math.min(redUnit, greenUnit, blueUnit);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta > 0) {
    if (maximum === redUnit) hue = 60 * (((greenUnit - blueUnit) / delta) % 6);
    else if (maximum === greenUnit) hue = 60 * ((blueUnit - redUnit) / delta + 2);
    else hue = 60 * ((redUnit - greenUnit) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return {
    hue,
    saturation: maximum === 0 ? 0 : delta / maximum,
    value: maximum,
  };
};

export const hsvToHex = ({ hue, saturation, value }: Hsv): `#${string}` => {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = value * saturation;
  const intermediate = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const match = value - chroma;
  const [red, green, blue] =
    normalizedHue < 60
      ? [chroma, intermediate, 0]
      : normalizedHue < 120
        ? [intermediate, chroma, 0]
        : normalizedHue < 180
          ? [0, chroma, intermediate]
          : normalizedHue < 240
            ? [0, intermediate, chroma]
            : normalizedHue < 300
              ? [intermediate, 0, chroma]
              : [chroma, 0, intermediate];
  return rgbToHex({
    red: (red + match) * 255,
    green: (green + match) * 255,
    blue: (blue + match) * 255,
  });
};

export const tagColorSurfaceClassName = (color: EmployeeTagColor | null | undefined) => {
  if (!color) {
    return "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20";
  }
  if (isCustomEmployeeTagColor(color)) return "tag-color-custom";
  return (
    {
      amber:
        "bg-amber-400/25 text-amber-950 hover:bg-amber-400/30 active:bg-amber-400/35 dark:bg-amber-300/20 dark:text-amber-100 dark:hover:bg-amber-300/25 dark:active:bg-amber-300/30",
      blue: "bg-blue-500/15 text-blue-900 hover:bg-blue-500/20 active:bg-blue-500/25 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25 dark:active:bg-blue-400/30",
      cyan: "bg-cyan-500/15 text-cyan-950 hover:bg-cyan-500/20 active:bg-cyan-500/25 dark:bg-cyan-400/20 dark:text-cyan-100 dark:hover:bg-cyan-400/25 dark:active:bg-cyan-400/30",
      green:
        "bg-green-500/15 text-green-900 hover:bg-green-500/20 active:bg-green-500/25 dark:bg-green-400/20 dark:text-green-100 dark:hover:bg-green-400/25 dark:active:bg-green-400/30",
      orange:
        "bg-orange-500/15 text-orange-950 hover:bg-orange-500/20 active:bg-orange-500/25 dark:bg-orange-400/20 dark:text-orange-100 dark:hover:bg-orange-400/25 dark:active:bg-orange-400/30",
      red: "bg-red-500/15 text-red-900 hover:bg-red-500/20 active:bg-red-500/25 dark:bg-red-400/20 dark:text-red-100 dark:hover:bg-red-400/25 dark:active:bg-red-400/30",
      rose: "bg-rose-500/15 text-rose-900 hover:bg-rose-500/20 active:bg-rose-500/25 dark:bg-rose-400/20 dark:text-rose-100 dark:hover:bg-rose-400/25 dark:active:bg-rose-400/30",
      teal: "bg-teal-500/15 text-teal-950 hover:bg-teal-500/20 active:bg-teal-500/25 dark:bg-teal-400/20 dark:text-teal-100 dark:hover:bg-teal-400/25 dark:active:bg-teal-400/30",
    } satisfies Record<EmployeeTagColorName, string>
  )[color];
};
