"use client";

import { templateFormatTokenDescriptionKeys } from "@/components/employee-display-format-tokens";
import { TemplateFormatInput } from "@/components/template-format-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUiText } from "@/i18n/use-ui-text";

export type ExportTemplateToken = {
  key: string;
  label: string;
};

type ExportTemplateSettingsProps = {
  dataDemoId?: string;
  employeeFields: ExportTemplateToken[];
  format: string;
  keepUniqueLines: boolean;
  onFormatChange: (value: string) => void;
  onKeepUniqueLinesChange: (value: boolean) => void;
  onRemoveEmptyLinesChange: (value: boolean) => void;
  previewDataDemoId?: string;
  previewMeta: string;
  previewText: string;
  removeEmptyLines: boolean;
  showPreviewLabel?: boolean;
  unitFields: ExportTemplateToken[];
};

export function ExportTemplateSettings({
  dataDemoId,
  employeeFields,
  format,
  keepUniqueLines,
  onFormatChange,
  onKeepUniqueLinesChange,
  onRemoveEmptyLinesChange,
  previewDataDemoId,
  previewMeta,
  previewText,
  removeEmptyLines,
  showPreviewLabel = true,
  unitFields,
}: ExportTemplateSettingsProps) {
  const t = useUiText();
  const tokens = [...employeeFields, ...unitFields].map((field) => ({
    description: (() => {
      const descriptionKey = templateFormatTokenDescriptionKeys[field.key];
      return descriptionKey ? t(descriptionKey) : field.label;
    })(),
    key: field.key,
  }));
  return (
    <div className="grid min-w-0 gap-3" data-demo-id={dataDemoId}>
      <TemplateFormatInput
        dataDemoId={`${dataDemoId ?? "export"}-format`}
        id={`${dataDemoId ?? "export"}-template-format`}
        label={t("Format")}
        onChange={onFormatChange}
        tokens={tokens}
        value={format}
      />
      <div
        className="flex w-fit cursor-pointer items-center gap-2 text-sm"
        data-demo-id={`${dataDemoId ?? "export"}-keep-unique-lines`}
      >
        <Checkbox
          checked={keepUniqueLines}
          id={`${dataDemoId ?? "export"}-keep-unique-lines-checkbox`}
          onCheckedChange={(checked) => onKeepUniqueLinesChange(checked === true)}
        />
        <Label
          className="cursor-pointer font-normal"
          htmlFor={`${dataDemoId ?? "export"}-keep-unique-lines-checkbox`}
        >
          {t("Keep only unique values")}
        </Label>
      </div>
      <div
        className="flex w-fit cursor-pointer items-center gap-2 text-sm"
        data-demo-id={`${dataDemoId ?? "export"}-remove-empty-lines`}
      >
        <Checkbox
          checked={removeEmptyLines}
          id={`${dataDemoId ?? "export"}-remove-empty-lines-checkbox`}
          onCheckedChange={(checked) => onRemoveEmptyLinesChange(checked === true)}
        />
        <Label
          className="cursor-pointer font-normal"
          htmlFor={`${dataDemoId ?? "export"}-remove-empty-lines-checkbox`}
        >
          {t("Remove empty lines")}
        </Label>
      </div>
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
