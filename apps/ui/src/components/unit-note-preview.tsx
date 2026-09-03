"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { HiOutlinePhoto } from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

const isAllowedLink = (href: string | undefined) =>
  Boolean(href && /^(?:https?:|mailto:|tel:)/iu.test(href));

export function UnitNotePreview({ className, source }: { className?: string; source: string }) {
  const t = useUiText();

  return (
    <section
      aria-label={t("Markdown preview")}
      className={cn(
        "min-w-0 text-sm leading-6 text-foreground",
        "[&_a]:font-medium [&_a]:text-signal [&_a]:underline [&_a]:underline-offset-4",
        "[&_blockquote]:my-4 [&_blockquote]:border-s-2 [&_blockquote]:border-signal/35 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]",
        "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_hr]:my-5 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border",
        "[&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6",
        "[&_input[type=checkbox]]:me-2 [&_input[type=checkbox]]:accent-signal",
        className,
      )}
      data-demo-id="unit-note-preview"
    >
      <ReactMarkdown
        components={{
          a: ({ children, href }) =>
            isAllowedLink(href) ? (
              <a href={href} referrerPolicy="no-referrer" rel="noopener noreferrer" target="_blank">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ alt }) => {
            const label = t("Markdown image {alt}", { alt: alt?.trim() || t("Image") });
            return (
              <span
                aria-label={label}
                className="my-3 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                role="img"
              >
                <HiOutlinePhoto aria-hidden="true" className="size-4 shrink-0" />
                <span>{label}</span>
              </span>
            );
          },
          table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
            <div className="my-4 max-w-full overflow-x-auto rounded-md">
              <table className="w-full border-collapse text-start text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
            <td className="border border-border px-3 py-2 align-top" {...props}>
              {children as ReactNode}
            </td>
          ),
          th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
            <th
              className="border border-border bg-muted/55 px-3 py-2 text-start font-medium"
              {...props}
            >
              {children as ReactNode}
            </th>
          ),
        }}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </section>
  );
}
