"use client";

import { HiOutlineArrowUturnLeft, HiOutlineTag, HiOutlineUsers } from "react-icons/hi2";

import {
  type ExportExclusionOption,
  ExportExclusionSelect,
} from "@/components/export-exclusion-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiText } from "@/i18n/use-ui-text";
import {
  type ExportFieldNameError,
  exportJsonEmployeeFieldByKey,
  exportJsonTagFieldByKey,
  exportJsonUnitFieldByKey,
} from "@/lib/export-format";
import type {
  ExportJsonEmployeeFieldKey,
  ExportJsonFieldNames,
  ExportJsonSettingsState,
  ExportJsonTagFieldKey,
  ExportJsonUnitFieldKey,
} from "@/stores/org-store";

export type StructuredJsonSettingsValue = ExportJsonSettingsState;

type JsonGroup = "tags" | "units";

export function StructuredJsonSettings({
  errors,
  onChange,
  tagOptions,
  unitOptions,
  value,
}: {
  errors: ExportFieldNameError[];
  onChange: (value: StructuredJsonSettingsValue) => void;
  tagOptions: ExportExclusionOption[];
  unitOptions: ExportExclusionOption[];
  value: StructuredJsonSettingsValue;
}) {
  const t = useUiText();
  const update = (patch: Partial<StructuredJsonSettingsValue>) => onChange({ ...value, ...patch });
  const toggle = <Field extends string>(selected: Field[], order: Field[], field: Field) => {
    const next = new Set(selected);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    return order.filter((key) => next.has(key));
  };
  const setEmployeeFieldName = (key: ExportJsonEmployeeFieldKey, name: string) =>
    update({
      jsonFieldNames: {
        ...value.jsonFieldNames,
        employee: { ...value.jsonFieldNames.employee, [key]: name },
      },
    });
  const setGroupCollectionName = (group: JsonGroup, name: string) =>
    update({
      jsonFieldNames: {
        ...value.jsonFieldNames,
        [group]: { ...value.jsonFieldNames[group], collection: name },
      },
    });
  const setGroupFieldName = (
    group: JsonGroup,
    key: ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
    name: string,
  ) =>
    update({
      jsonFieldNames: {
        ...value.jsonFieldNames,
        [group]: {
          ...value.jsonFieldNames[group],
          fields: { ...value.jsonFieldNames[group].fields, [key]: name },
        },
      } as ExportJsonFieldNames,
    });

  const renderReset = (visible: boolean, onClick: () => void, name: string) => (
    <Button
      className={visible ? "size-8" : "invisible size-8"}
      onClick={onClick}
      size="icon"
      title={t("Reset field name {name}", { name })}
      type="button"
      variant="ghost"
    >
      <HiOutlineArrowUturnLeft />
    </Button>
  );

  const renderGroup = (group: JsonGroup) => {
    const isUnits = group === "units";
    const order = isUnits ? value.jsonUnitFieldOrder : value.jsonTagFieldOrder;
    const selected = isUnits ? value.selectedJsonUnitFieldKeys : value.selectedJsonTagFieldKeys;
    const allSelected = selected.length === order.length;
    const checked = selected.length === 0 ? false : allSelected ? true : "indeterminate";
    const title = isUnits ? t("Units") : t("Tags");
    const collection = value.jsonFieldNames[group].collection;
    const optionValues = isUnits ? value.excludedJsonUnitIds : value.excludedJsonTagKeys;

    return (
      <section
        className="grid gap-2 rounded-lg bg-muted/25 p-3"
        data-demo-id={`json-${group}-group`}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(9rem,0.8fr)_auto] items-center gap-2">
          <Checkbox
            aria-label={title}
            checked={checked}
            onCheckedChange={() =>
              update(
                isUnits
                  ? { selectedJsonUnitFieldKeys: allSelected ? [] : [...value.jsonUnitFieldOrder] }
                  : { selectedJsonTagFieldKeys: allSelected ? [] : [...value.jsonTagFieldOrder] },
              )
            }
          />
          <Label className="flex items-center gap-2">
            {isUnits ? <HiOutlineUsers /> : <HiOutlineTag />}
            {title}
          </Label>
          <Input
            aria-label={t("Collection field name for {name}", { name: title })}
            className="h-8 text-xs"
            disabled={selected.length === 0}
            onChange={(event) => setGroupCollectionName(group, event.currentTarget.value)}
            value={collection}
          />
          {renderReset(collection !== group, () => setGroupCollectionName(group, group), title)}
        </div>
        <div className="grid gap-1 pl-6">
          {order.map((rawKey) => {
            const key = rawKey as ExportJsonTagFieldKey | ExportJsonUnitFieldKey;
            const selectedKey = isUnits
              ? value.selectedJsonUnitFieldKeys.includes(key as ExportJsonUnitFieldKey)
              : value.selectedJsonTagFieldKeys.includes(key as ExportJsonTagFieldKey);
            const fieldName = isUnits
              ? value.jsonFieldNames.units.fields[key as ExportJsonUnitFieldKey]
              : value.jsonFieldNames.tags.fields[key as ExportJsonTagFieldKey];
            const label = isUnits
              ? exportJsonUnitFieldByKey.get(key as ExportJsonUnitFieldKey)?.label
              : exportJsonTagFieldByKey.get(key as ExportJsonTagFieldKey)?.label;
            return (
              <div
                className="grid grid-cols-[auto_minmax(7rem,1fr)_minmax(9rem,1fr)_auto] items-center gap-2 rounded-md px-2 py-1"
                key={key}
              >
                <Checkbox
                  aria-label={t("Field {name}", { name: label ?? key })}
                  checked={selectedKey}
                  onCheckedChange={() =>
                    update(
                      isUnits
                        ? {
                            selectedJsonUnitFieldKeys: toggle(
                              value.selectedJsonUnitFieldKeys,
                              value.jsonUnitFieldOrder,
                              key as ExportJsonUnitFieldKey,
                            ),
                          }
                        : {
                            selectedJsonTagFieldKeys: toggle(
                              value.selectedJsonTagFieldKeys,
                              value.jsonTagFieldOrder,
                              key as ExportJsonTagFieldKey,
                            ),
                          },
                    )
                  }
                />
                <span className="truncate text-xs">{label ?? key}</span>
                <Input
                  aria-label={t("Export field name for {name}", { name: label ?? key })}
                  className="h-8 text-xs"
                  disabled={!selectedKey}
                  onChange={(event) => setGroupFieldName(group, key, event.currentTarget.value)}
                  value={fieldName}
                />
                {renderReset(
                  fieldName !== key,
                  () => setGroupFieldName(group, key, key),
                  label ?? key,
                )}
              </div>
            );
          })}
        </div>
        {selected.length > 0 && (
          <ExportExclusionSelect
            dataDemoId={`json-${group}-exclusions`}
            label={isUnits ? t("Exclude Units") : t("Exclude tags")}
            onChange={(nextValues) =>
              update(
                isUnits ? { excludedJsonUnitIds: nextValues } : { excludedJsonTagKeys: nextValues },
              )
            }
            options={isUnits ? unitOptions : tagOptions}
            searchPlaceholder={isUnits ? t("Search Units by name") : t("Search tags")}
            values={optionValues}
          />
        )}
      </section>
    );
  };

  return (
    <div className="grid gap-3" data-demo-id="structured-json-settings">
      <section className="grid gap-2 rounded-lg bg-muted/25 p-3">
        <Label>{t("Employee fields")}</Label>
        <div className="grid gap-1">
          {value.employeeFieldOrder.map((rawKey) => {
            const key = rawKey as ExportJsonEmployeeFieldKey;
            const selected = value.selectedEmployeeFieldKeys.includes(key);
            const fieldName = value.jsonFieldNames.employee[key];
            const label = exportJsonEmployeeFieldByKey.get(key)?.label ?? key;
            return (
              <div
                className="grid grid-cols-[auto_minmax(7rem,1fr)_minmax(9rem,1fr)_auto] items-center gap-2 rounded-md px-2 py-1"
                key={key}
              >
                <Checkbox
                  aria-label={t("Field {name}", { name: label })}
                  checked={selected}
                  onCheckedChange={() =>
                    update({
                      selectedEmployeeFieldKeys: toggle(
                        value.selectedEmployeeFieldKeys,
                        value.employeeFieldOrder,
                        key,
                      ),
                    })
                  }
                />
                <span className="truncate text-xs">{label}</span>
                <Input
                  aria-label={t("Export field name for {name}", { name: label })}
                  className="h-8 text-xs"
                  disabled={!selected}
                  onChange={(event) => setEmployeeFieldName(key, event.currentTarget.value)}
                  value={fieldName}
                />
                {renderReset(fieldName !== key, () => setEmployeeFieldName(key, key), label)}
              </div>
            );
          })}
        </div>
      </section>
      {renderGroup("units")}
      {renderGroup("tags")}
      {errors.length > 0 && (
        <div className="grid gap-1 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.map((error) => (
            <div key={JSON.stringify(error)}>
              {error.kind === "missing"
                ? t("{group}: {field} must have an export name.", {
                    field: error.fieldKey,
                    group: error.group,
                  })
                : t("{group}: {field} is used by both {first} and {second}.", {
                    field: error.fieldName,
                    first: error.previousFieldKey,
                    group: error.group,
                    second: error.fieldKey,
                  })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
