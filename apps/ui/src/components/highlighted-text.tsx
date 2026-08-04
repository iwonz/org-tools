"use client";

import type { ReactNode } from "react";

type HighlightedTextProps = {
  className?: string;
  queryTokens: string[];
  text: string;
};

const normalizeHighlightValue = (value: string) => value.toLocaleLowerCase("en-US");

const mergeRanges = (ranges: Array<[number, number]>) => {
  const sortedRanges = ranges
    .filter(([startIndex, endIndex]) => startIndex <= endIndex)
    .sort(([firstStartIndex], [secondStartIndex]) => firstStartIndex - secondStartIndex);
  const mergedRanges: Array<[number, number]> = [];

  for (const [startIndex, endIndex] of sortedRanges) {
    const lastRange = mergedRanges.at(-1);

    if (lastRange && startIndex <= lastRange[1] + 1) {
      lastRange[1] = Math.max(lastRange[1], endIndex);
      continue;
    }

    mergedRanges.push([startIndex, endIndex]);
  }

  return mergedRanges;
};

const getTokenRanges = (text: string, queryTokens: string[]) => {
  const normalizedText = normalizeHighlightValue(text);
  const ranges: Array<[number, number]> = [];

  for (const token of queryTokens) {
    let searchFromIndex = 0;

    while (token && searchFromIndex < normalizedText.length) {
      const startIndex = normalizedText.indexOf(token, searchFromIndex);

      if (startIndex === -1) break;

      ranges.push([startIndex, startIndex + token.length - 1]);
      searchFromIndex = startIndex + token.length;
    }
  }

  return ranges;
};

export function HighlightedText({ className, queryTokens, text }: HighlightedTextProps) {
  const ranges = mergeRanges(getTokenRanges(text, queryTokens));

  if (ranges.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const [startIndex, endIndex] of ranges) {
    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }

    parts.push(
      <mark
        className="rounded-sm bg-primary/15 px-0.5 font-semibold text-foreground"
        key={`${startIndex}-${endIndex}`}
      >
        {text.slice(startIndex, endIndex + 1)}
      </mark>,
    );
    lastIndex = endIndex + 1;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
