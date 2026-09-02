export type ActiveTemplateFormatQuery = {
  end: number;
  start: number;
  value: string;
};

export type TemplateFormatKeyAction = "close" | "insert" | "move-next" | "move-previous" | "none";

export const getTemplateFormatKeyAction = (
  key: string,
  menuOpen: boolean,
): TemplateFormatKeyAction => {
  if (!menuOpen) return "none";
  if (key === "ArrowDown") return "move-next";
  if (key === "ArrowUp") return "move-previous";
  if (key === "Enter") return "insert";
  if (key === "Escape" || key === "Tab" || key === "Backspace") return "close";
  return "none";
};

export const getActiveTemplateFormatQuery = (
  value: string,
  caret: number,
): ActiveTemplateFormatQuery | null => {
  const match = /@([^\s@{}]*)$/u.exec(value.slice(0, caret));
  if (!match) return null;
  return { end: caret, start: caret - match[0].length, value: match[1] ?? "" };
};

export const replaceTemplateFormatQuery = (
  value: string,
  query: Pick<ActiveTemplateFormatQuery, "end" | "start">,
  tokenKey: string,
) => `${value.slice(0, query.start)}{${tokenKey}}${value.slice(query.end)}`;
