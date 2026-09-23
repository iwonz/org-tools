"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineBold,
  HiOutlineCodeBracket,
  HiOutlineInformationCircle,
  HiOutlineItalic,
  HiOutlineLink,
  HiOutlineStrikethrough,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUiText } from "@/i18n/use-ui-text";
import {
  applyTemplateFormatMarkdownLink,
  findTemplateFormatMarkdownLink,
  removeTemplateFormatMarkdownLink,
  type TemplateFormatEdit,
  type TemplateFormatSelection,
  toggleTemplateFormatMarkdown,
} from "@/lib/template-format-markdown";
import {
  type ActiveTemplateFormatQuery,
  getActiveTemplateFormatQuery,
  getTemplateFormatKeyAction,
  replaceTemplateFormatQuery,
} from "@/lib/template-format-suggestions";
import { cn } from "@/lib/utils";

export type TemplateFormatToken = {
  description: string;
  key: string;
};

const caretCoordinates = (textarea: HTMLTextAreaElement, caret: number) => {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const copiedProperties = [
    "borderBottomWidth",
    "borderLeftWidth",
    "borderRightWidth",
    "borderTopWidth",
    "boxSizing",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "textIndent",
    "textTransform",
    "whiteSpace",
    "wordBreak",
    "wordSpacing",
    "overflowWrap",
  ] as const;
  mirror.style.position = "fixed";
  mirror.style.left = "-10000px";
  mirror.style.top = "0";
  mirror.style.visibility = "hidden";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  for (const property of copiedProperties) mirror.style[property] = style[property];
  mirror.textContent = textarea.value.slice(0, caret);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(caret) || "\u200b";
  mirror.append(marker);
  document.body.append(mirror);
  const left = Math.max(
    8,
    Math.min(marker.offsetLeft - textarea.scrollLeft, textarea.clientWidth - 280),
  );
  const top = marker.offsetTop - textarea.scrollTop + Number.parseFloat(style.lineHeight || "20");
  mirror.remove();
  return { left, top };
};

export function TemplateFormatInput({
  dataDemoId,
  id,
  inlineMarkdownTools = false,
  label,
  labelAction,
  onChange,
  tokens,
  value,
}: {
  dataDemoId?: string;
  id: string;
  inlineMarkdownTools?: boolean;
  label: string;
  labelAction?: ReactNode;
  onChange: (value: string) => void;
  tokens: TemplateFormatToken[];
  value: string;
}) {
  const t = useUiText();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<ActiveTemplateFormatQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: 8, top: 72 });
  const [markdownPosition, setMarkdownPosition] = useState({ left: 8, top: 72 });
  const [markdownSelection, setMarkdownSelection] = useState<TemplateFormatSelection | null>(null);
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const pendingSelectionRef = useRef<TemplateFormatSelection | null>(null);

  const matches = useMemo(() => {
    if (!query) return [];
    const needle = query.value.toLocaleLowerCase();
    return tokens.filter(
      (token) =>
        token.key.toLocaleLowerCase().includes(needle) ||
        token.description.toLocaleLowerCase().includes(needle),
    );
  }, [query, tokens]);
  const open = query !== null && matches.length > 0;
  const markdownOpen = inlineMarkdownTools && markdownSelection !== null;

  const refreshQuery = useCallback((nextValue: string, caret: number) => {
    const nextQuery = getActiveTemplateFormatQuery(nextValue, caret);
    setQuery(nextQuery);
    setActiveIndex(0);
    if (nextQuery && textareaRef.current) {
      setPosition(caretCoordinates(textareaRef.current, caret));
    }
  }, []);

  const refreshMarkdownSelection = useCallback(
    (textarea: HTMLTextAreaElement) => {
      if (!inlineMarkdownTools) return false;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) {
        setMarkdownSelection(null);
        setLinkDraft(null);
        setLinkError(false);
        return false;
      }
      setMarkdownSelection({ end, start });
      setMarkdownPosition(caretCoordinates(textarea, end));
      setQuery(null);
      return true;
    },
    [inlineMarkdownTools],
  );

  useEffect(() => {
    if (!markdownOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setMarkdownSelection(null);
      setLinkDraft(null);
      setLinkError(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [markdownOpen]);

  useEffect(() => {
    if (!markdownOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setMarkdownSelection(null);
      setLinkDraft(null);
      setLinkError(false);
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [markdownOpen]);

  useLayoutEffect(() => {
    const selection = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;
    pendingSelectionRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
  });

  const insertToken = useCallback(
    (token: TemplateFormatToken) => {
      if (!query) return;
      const inserted = `{${token.key}}`;
      const nextValue = replaceTemplateFormatQuery(value, query, token.key);
      const caret = query.start + inserted.length;
      pendingSelectionRef.current = { end: caret, start: caret };
      setQuery(null);
      onChange(nextValue);
    },
    [onChange, query, value],
  );

  const applyMarkdownEdit = useCallback(
    (edit: TemplateFormatEdit) => {
      pendingSelectionRef.current = edit.selection;
      setMarkdownSelection(edit.selection);
      setLinkDraft(null);
      setLinkError(false);
      onChange(edit.value);
    },
    [onChange],
  );

  const toggleMarkdown = (delimiter: "**" | "_" | "`" | "~~") => {
    if (!markdownSelection) return;
    applyMarkdownEdit(toggleTemplateFormatMarkdown(value, markdownSelection, delimiter));
  };

  const openLinkEditor = () => {
    if (!markdownSelection) return;
    setLinkDraft(findTemplateFormatMarkdownLink(value, markdownSelection)?.url ?? "");
    setLinkError(false);
  };

  const applyLink = () => {
    if (!markdownSelection || linkDraft === null) return;
    const edit = applyTemplateFormatMarkdownLink(value, markdownSelection, linkDraft);
    if (!edit) {
      setLinkError(true);
      return;
    }
    applyMarkdownEdit(edit);
  };

  const removeLink = () => {
    if (!markdownSelection) return;
    const edit = removeTemplateFormatMarkdownLink(value, markdownSelection);
    if (edit) applyMarkdownEdit(edit);
  };

  return (
    <div className="grid min-w-0 gap-2" data-demo-id={dataDemoId} ref={rootRef}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={id}>{label}</Label>
          <span className="group relative inline-flex">
            <button
              aria-describedby={`${id}-token-help`}
              aria-label={t("Token suggestions help")}
              className="inline-flex size-5 cursor-help items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-accent/55 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              data-demo-id="template-format-help"
              type="button"
            >
              <HiOutlineInformationCircle className="size-4" />
            </button>
            <span
              className="pointer-events-none absolute start-0 top-full z-[90] mt-1 hidden w-64 rounded-md border border-border/80 bg-popover px-3 py-2 text-start text-xs font-normal leading-relaxed text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)] group-hover:block group-focus-within:block"
              id={`${id}-token-help`}
              role="tooltip"
            >
              {t("Type @ to open token suggestions. Use {example} for conditional text.", {
                example: "{condition ? 'value' : 'fallback'}",
              })}
            </span>
          </span>
        </div>
        {labelAction}
      </div>
      <div className="relative min-w-0">
        <Textarea
          aria-activedescendant={open ? `${id}-token-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={open ? `${id}-suggestions` : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="h-24 w-full min-w-0 resize-none overflow-x-hidden"
          id={id}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            const caret = event.currentTarget.selectionStart;
            onChange(nextValue);
            setMarkdownSelection(null);
            setLinkDraft(null);
            setLinkError(false);
            refreshQuery(nextValue, caret);
          }}
          onClick={(event) => {
            if (!refreshMarkdownSelection(event.currentTarget)) {
              refreshQuery(value, event.currentTarget.selectionStart);
            }
          }}
          onKeyDown={(event) => {
            const action = getTemplateFormatKeyAction(event.key, open);
            if (action === "move-next" || action === "move-previous") {
              event.preventDefault();
              const delta = action === "move-next" ? 1 : -1;
              setActiveIndex((current) => (current + delta + matches.length) % matches.length);
              return;
            }
            if (action === "insert") {
              event.preventDefault();
              const token = matches[activeIndex];
              if (token) insertToken(token);
              return;
            }
            if (action === "close") {
              if (event.key !== "Tab") event.preventDefault();
              setQuery(null);
            }
            if (event.key === "Escape" && markdownOpen) {
              event.preventDefault();
              setMarkdownSelection(null);
              setLinkDraft(null);
              setLinkError(false);
            }
          }}
          onKeyUp={(event) => {
            if (refreshMarkdownSelection(event.currentTarget)) return;
            if (
              ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab", "Backspace"].includes(event.key)
            ) {
              return;
            }
            refreshQuery(event.currentTarget.value, event.currentTarget.selectionStart);
          }}
          onSelect={(event) => {
            if (!refreshMarkdownSelection(event.currentTarget)) {
              refreshQuery(value, event.currentTarget.selectionStart);
            }
          }}
          placeholder={t("Type @ to add tokens")}
          ref={textareaRef}
          role="combobox"
          value={value}
        />
        {open && (
          <div
            className="absolute z-[70] max-h-56 w-[min(20rem,calc(100%-1rem))] overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)]"
            data-demo-id="template-token-suggestions"
            id={`${id}-suggestions`}
            role="listbox"
            style={{ left: position.left, top: position.top }}
          >
            {matches.map((token, index) => (
              <button
                aria-selected={index === activeIndex}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left text-sm",
                  index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/70",
                )}
                id={`${id}-token-${index}`}
                key={token.key}
                onClick={() => insertToken(token)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <code className="shrink-0 text-xs font-medium text-foreground">{`{${token.key}}`}</code>
                <span className="min-w-0 text-xs leading-4 text-muted-foreground">
                  {token.description}
                </span>
              </button>
            ))}
          </div>
        )}
        {markdownOpen && (
          <div
            aria-label={t("Markdown formatting")}
            className="absolute z-[75] grid max-w-[calc(100%-1rem)] gap-2 rounded-lg border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)]"
            data-demo-id="template-markdown-tools"
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              event.stopPropagation();
              setMarkdownSelection(null);
              setLinkDraft(null);
              setLinkError(false);
            }}
            onMouseDown={(event) => {
              if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
            }}
            role="toolbar"
            style={{ left: markdownPosition.left, top: markdownPosition.top }}
          >
            <div className="flex items-center gap-1">
              {[
                { delimiter: "**" as const, icon: HiOutlineBold, label: t("Bold") },
                { delimiter: "_" as const, icon: HiOutlineItalic, label: t("Italic") },
                {
                  delimiter: "~~" as const,
                  icon: HiOutlineStrikethrough,
                  label: t("Strikethrough"),
                },
                { delimiter: "`" as const, icon: HiOutlineCodeBracket, label: t("Inline code") },
              ].map(({ delimiter, icon: Icon, label: actionLabel }) => (
                <Button
                  aria-label={actionLabel}
                  className="size-8 p-0"
                  key={delimiter}
                  onClick={() => toggleMarkdown(delimiter)}
                  title={actionLabel}
                  type="button"
                  variant="ghost"
                >
                  <Icon className="size-4" />
                </Button>
              ))}
              <Button
                aria-label={t("Link")}
                className="size-8 p-0"
                data-demo-id="template-markdown-link-action"
                onClick={openLinkEditor}
                title={t("Link")}
                type="button"
                variant="ghost"
              >
                <HiOutlineLink className="size-4" />
              </Button>
            </div>
            {linkDraft !== null && (
              <div className="grid w-72 max-w-full gap-2 p-1" data-demo-id="template-link-editor">
                <Label htmlFor={`${id}-markdown-link-url`}>{t("Link URL")}</Label>
                <Input
                  aria-invalid={linkError}
                  id={`${id}-markdown-link-url`}
                  onChange={(event) => {
                    setLinkDraft(event.currentTarget.value);
                    setLinkError(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyLink();
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setLinkDraft(null);
                      setLinkError(false);
                      pendingSelectionRef.current = markdownSelection;
                    }
                  }}
                  placeholder="https://example.test"
                  value={linkDraft}
                />
                {linkError && (
                  <span className="text-xs text-destructive" role="alert">
                    {t("Enter a valid http, https, mailto, or tel link")}
                  </span>
                )}
                <div className="flex justify-end gap-1">
                  {markdownSelection &&
                    findTemplateFormatMarkdownLink(value, markdownSelection) !== null && (
                      <Button onClick={removeLink} size="sm" type="button" variant="ghost">
                        {t("Remove link")}
                      </Button>
                    )}
                  <Button onClick={applyLink} size="sm" type="button">
                    {t("Apply")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
