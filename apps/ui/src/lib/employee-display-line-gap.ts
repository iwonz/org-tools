export const EMPLOYEE_DISPLAY_LINE_GAP_MIN = 0;
export const EMPLOYEE_DISPLAY_LINE_GAP_MAX = 24;

export const parseEmployeeDisplayLineGapInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d+$/u.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) &&
    parsed >= EMPLOYEE_DISPLAY_LINE_GAP_MIN &&
    parsed <= EMPLOYEE_DISPLAY_LINE_GAP_MAX
    ? parsed
    : null;
};

export const normalizeEmployeeDisplayLineGapInput = (value: string, fallback: number): number => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(
    EMPLOYEE_DISPLAY_LINE_GAP_MAX,
    Math.max(EMPLOYEE_DISPLAY_LINE_GAP_MIN, Math.round(parsed)),
  );
};
