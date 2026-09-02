"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUiText } from "@/i18n/use-ui-text";

export type ExportTemplateToken = {
  key: string;
  label: string;
};

type ExportTemplateSettingsProps = {
  children?: ReactNode;
  dataDemoId?: string;
  employeeFields: ExportTemplateToken[];
  format: string;
  onAppendField: (fieldKey: string) => void;
  onFormatChange: (value: string) => void;
  previewDataDemoId?: string;
  previewMeta: string;
  previewText: string;
  showPreviewLabel?: boolean;
  unitFields: ExportTemplateToken[];
};

export function ExportTemplateSettings({
  children,
  dataDemoId,
  employeeFields,
  format,
  onAppendField,
  onFormatChange,
  previewDataDemoId,
  previewMeta,
  previewText,
  showPreviewLabel = true,
  unitFields,
}: ExportTemplateSettingsProps) {
  const t = useUiText();
  return (
    <div className="grid min-w-0 gap-3" data-demo-id={dataDemoId}>
      <div className="grid min-w-0 gap-3">
        <section className="grid gap-2">
          <Label>{t("Employee fields")}</Label>
          <div className="flex min-w-0 flex-wrap gap-2">
            {employeeFields.map((field) => (
              <Button
                key={field.key}
                onClick={() => onAppendField(field.key)}
                size="sm"
                type="button"
                variant="outline"
              >
                {field.label}
              </Button>
            ))}
          </div>
        </section>
        <section className="grid gap-2">
          <Label>{t("Units")}</Label>
          <div className="flex min-w-0 flex-wrap gap-2">
            {unitFields.map((field) => (
              <Button
                key={field.key}
                onClick={() => onAppendField(field.key)}
                size="sm"
                type="button"
                variant="outline"
              >
                {field.label}
              </Button>
            ))}
          </div>
        </section>
      </div>
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${dataDemoId ?? "export"}-template-format`}>{t("Format")}</Label>
        <Textarea
          className="h-24 w-full min-w-0 resize-none overflow-x-hidden"
          id={`${dataDemoId ?? "export"}-template-format`}
          onChange={(event) => onFormatChange(event.currentTarget.value)}
          value={format}
        />
      </div>
      {children}
      <div
        className="grid gap-2"
        data-demo-id={previewDataDemoId ?? `${dataDemoId ?? "export"}-preview`}
      >
        <div className="flex flex-wrap items-center justify-end gap-3">
          {showPreviewLabel && <Label className="mr-auto">{t("Preview")}</Label>}
          <div className="text-xs text-muted-foreground">{previewMeta}</div>
        </div>
        <div className="max-h-80 min-h-40 overflow-auto rounded-md border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
            {previewText}
          </pre>
        </div>
      </div>
    </div>
  );
}
