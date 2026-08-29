"use client";

import type { Employee } from "@org-tools/types";
import { HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

import { EmployeeTagPopover } from "@/components/employee-tag-picker";
import { Button } from "@/components/ui/button";
import { useUiText } from "@/i18n/use-ui-text";
import type { EmployeeTagUpdate } from "@/lib/employee-tags";

export function EmployeeCardActions({
  employee,
  onApplyTags,
  onDelete,
  onEdit,
  tagOptions,
  tagPickerDataDemoId,
}: {
  employee: Employee;
  onApplyTags: (updates: EmployeeTagUpdate[]) => void;
  onDelete: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  tagOptions: readonly string[];
  tagPickerDataDemoId?: string;
}) {
  const t = useUiText();

  return (
    <>
      <EmployeeTagPopover
        {...(tagPickerDataDemoId ? { dataDemoId: tagPickerDataDemoId } : {})}
        employee={employee}
        onApply={onApplyTags}
        tagOptions={tagOptions}
      />
      <Button
        aria-label={t("Edit")}
        data-demo-id="employee-edit-button"
        onClick={() => onEdit(employee)}
        size="icon"
        title={t("Edit")}
        type="button"
        variant="ghost"
      >
        <HiOutlinePencilSquare />
      </Button>
      <Button
        aria-label={t("Delete")}
        onClick={() => onDelete(employee)}
        size="icon"
        title={t("Delete")}
        type="button"
        variant="ghost"
      >
        <HiOutlineTrash />
      </Button>
    </>
  );
}
