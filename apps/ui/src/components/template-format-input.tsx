"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  label,
  onChange,
  tokens,
  value,
}: {
  dataDemoId?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  tokens: TemplateFormatToken[];
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<ActiveTemplateFormatQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: 8, top: 72 });
  const pendingCaretRef = useRef<number | null>(null);

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

  const refreshQuery = useCallback((nextValue: string, caret: number) => {
    const nextQuery = getActiveTemplateFormatQuery(nextValue, caret);
    setQuery(nextQuery);
    setActiveIndex(0);
    if (nextQuery && textareaRef.current) {
      setPosition(caretCoordinates(textareaRef.current, caret));
    }
  }, []);

  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    const textarea = textareaRef.current;
    if (caret === null || !textarea) return;
    pendingCaretRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  });

  const insertToken = useCallback(
    (token: TemplateFormatToken) => {
      if (!query) return;
      const inserted = `{${token.key}}`;
      const nextValue = replaceTemplateFormatQuery(value, query, token.key);
      pendingCaretRef.current = query.start + inserted.length;
      setQuery(null);
      onChange(nextValue);
    },
    [onChange, query, value],
  );

  return (
    <div className="grid min-w-0 gap-2" data-demo-id={dataDemoId}>
      <Label htmlFor={id}>{label}</Label>
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
            refreshQuery(nextValue, caret);
          }}
          onClick={(event) => refreshQuery(value, event.currentTarget.selectionStart)}
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
          }}
          onKeyUp={(event) => {
            if (
              ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab", "Backspace"].includes(event.key)
            ) {
              return;
            }
            refreshQuery(event.currentTarget.value, event.currentTarget.selectionStart);
          }}
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
      </div>
    </div>
  );
}
