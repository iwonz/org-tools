"use client";

import type { ReactNode } from "react";

import { TemplateFormatInput } from "@/components/template-format-input";
import { Label } from "@/components/ui/label";
import type { UiTextKey } from "@/i18n/messages";
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
  onFormatChange,
  previewDataDemoId,
  previewMeta,
  previewText,
  showPreviewLabel = true,
  unitFields,
}: ExportTemplateSettingsProps) {
  const t = useUiText();
  const descriptionKeys: Record<string, UiTextKey> = {
    avatarBase64Url: "Template token: embedded avatar",
    birthday: "Template token: complete birthday",
    email: "Template token: email address",
    firstName: "Template token: first name",
    fullName: "Template token: full name",
    gender: "Template token: gender",
    id: "Template token: Employee identifier",
    isBoss: "Template token: manager status",
    lastName: "Template token: last name",
    phone: "Template token: phone number",
    position: "Template token: Unit position",
    profileUrl: "Template token: profile link",
    tagDates: "Template token: dated Tags",
    tags: "Template token: Tag labels",
    unitFullPath: "Template token: full Unit path",
    unitId: "Template token: Unit identifier",
    unitName: "Template token: Unit name",
    username: "Template token: username",
  };
  const tokens = [...employeeFields, ...unitFields].map((field) => ({
    description: descriptionKeys[field.key]
      ? t(descriptionKeys[field.key] as UiTextKey)
      : field.label,
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
