"use client";

import { useRef, useState } from "react";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineBars3,
  HiOutlineTag,
  HiOutlineUsers,
} from "react-icons/hi2";

import {
  type ExportExclusionOption,
  ExportExclusionSelect,
} from "@/components/export-exclusion-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUiText } from "@/i18n/use-ui-text";
import {
  type ExportFieldNameError,
  exportJsonEmployeeFieldByKey,
  exportJsonTagFieldByKey,
  exportJsonUnitFieldByKey,
} from "@/lib/export-format";
import { cn } from "@/lib/utils";
import type {
  ExportFieldDropPlacement,
  ExportJsonEmployeeFieldKey,
  ExportJsonFieldNames,
  ExportJsonSettingsState,
  ExportJsonTagFieldKey,
  ExportJsonTopLevelFieldKey,
  ExportJsonUnitFieldKey,
} from "@/stores/org-store";

export type StructuredJsonSettingsValue = ExportJsonSettingsState;

type JsonGroup = "tags" | "units";
type SortableList = "tags" | "topLevel" | "units";
type DragState = { key: string; list: SortableList } | null;

const moveInOrder = <Field extends string>(
  order: Field[],
  field: Field,
  target: Field,
  placement: ExportFieldDropPlacement,
) => {
  if (field === target) return order;
  const next = order.filter((key) => key !== field);
  const targetIndex = next.indexOf(target);
  if (targetIndex === -1) return order;
  next.splice(placement === "after" ? targetIndex + 1 : targetIndex, 0, field);
  return next;
};

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
  const [dragState, setDragState] = useState<DragState>(null);
  const dragStateRef = useRef<DragState>(null);
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

  const renderDragHandle = (list: SortableList, key: string, name: string) => (
    <button
      aria-label={t("Drag {name} to reorder", { name })}
      className="grid size-8 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-accent/55 hover:text-foreground active:cursor-grabbing"
      draggable
      onDragEnd={() => {
        dragStateRef.current = null;
        setDragState(null);
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", `${list}:${key}`);
        dragStateRef.current = { key, list };
        setDragState({ key, list });
      }}
      title={t("Drag {name} to reorder", { name })}
      type="button"
    >
      <HiOutlineBars3 />
    </button>
  );

  const getDropHandlers = <Field extends string>(
    list: SortableList,
    target: Field,
    reorder: (field: Field, target: Field, placement: ExportFieldDropPlacement) => void,
  ) => {
    const resolveSource = (event: React.DragEvent<HTMLElement>) => {
      const payload = event.dataTransfer.getData("text/plain");
      const separatorIndex = payload.indexOf(":");
      const fallback = dragStateRef.current;
      return {
        sourceKey: separatorIndex === -1 ? fallback?.key : payload.slice(separatorIndex + 1),
        sourceList: separatorIndex === -1 ? fallback?.list : payload.slice(0, separatorIndex),
      };
    };
    const reorderAtPointer = (event: React.DragEvent<HTMLElement>) => {
      const { sourceKey, sourceList } = resolveSource(event);
      if (sourceList !== list || !sourceKey || sourceKey === target) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const placement = event.clientY >= bounds.top + bounds.height / 2 ? "after" : "before";
      reorder(sourceKey as Field, target, placement);
    };
    return {
      onDragEnter: (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        reorderAtPointer(event);
      },
      onDragOver: (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDrop: (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        reorderAtPointer(event);
        dragStateRef.current = null;
        setDragState(null);
      },
    };
  };

  const moveTopLevelField = (
    field: ExportJsonTopLevelFieldKey,
    target: ExportJsonTopLevelFieldKey,
    placement: ExportFieldDropPlacement,
  ) =>
    update({
      jsonTopLevelFieldOrder: moveInOrder(value.jsonTopLevelFieldOrder, field, target, placement),
    });

  const moveGroupField = (
    group: JsonGroup,
    field: ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
    target: ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
    placement: ExportFieldDropPlacement,
  ) => {
    if (group === "units") {
      const order = moveInOrder(
        value.jsonUnitFieldOrder,
        field as ExportJsonUnitFieldKey,
        target as ExportJsonUnitFieldKey,
        placement,
      );
      update({
        jsonUnitFieldOrder: order,
        selectedJsonUnitFieldKeys: order.filter((key) =>
          value.selectedJsonUnitFieldKeys.includes(key),
        ),
      });
      return;
    }
    const order = moveInOrder(
      value.jsonTagFieldOrder,
      field as ExportJsonTagFieldKey,
      target as ExportJsonTagFieldKey,
      placement,
    );
    update({
      jsonTagFieldOrder: order,
      selectedJsonTagFieldKeys: order.filter((key) => value.selectedJsonTagFieldKeys.includes(key)),
    });
  };

  const renderGroupChildren = (group: JsonGroup) => {
    const isUnits = group === "units";
    const order = isUnits ? value.jsonUnitFieldOrder : value.jsonTagFieldOrder;
    const selected = isUnits ? value.selectedJsonUnitFieldKeys : value.selectedJsonTagFieldKeys;
    const optionValues = isUnits ? value.excludedJsonUnitIds : value.excludedJsonTagKeys;
    return (
      <div className="grid gap-1 pl-10">
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
          const name = label ?? key;
          return (
            <div
              className={cn(
                "grid grid-cols-[auto_auto_minmax(7rem,1fr)_minmax(9rem,1fr)_auto] items-center gap-2 rounded-md bg-muted/20 px-2 py-1",
                dragState?.list === group && dragState.key === key && "bg-accent/45",
              )}
              data-demo-id={`json-${group}-field-${key}`}
              key={key}
              {...getDropHandlers(group, key, (field, target, placement) =>
                moveGroupField(group, field, target, placement),
              )}
            >
              {renderDragHandle(group, key, name)}
              <Checkbox
                aria-label={t("Field {name}", { name })}
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
              <span className="truncate text-xs">{name}</span>
              <Input
                aria-label={t("Export field name for {name}", { name })}
                className="h-8 text-xs"
                disabled={!selectedKey}
                onChange={(event) => setGroupFieldName(group, key, event.currentTarget.value)}
                value={fieldName}
              />
              {renderReset(fieldName !== key, () => setGroupFieldName(group, key, key), name)}
            </div>
          );
        })}
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
      </div>
    );
  };

  const renderTopLevelField = (key: ExportJsonTopLevelFieldKey) => {
    const group = key === "units" || key === "tags" ? key : null;
    const employeeKey = group ? null : (key as ExportJsonEmployeeFieldKey);
    const selectedGroupFields =
      group === "units"
        ? value.selectedJsonUnitFieldKeys
        : group === "tags"
          ? value.selectedJsonTagFieldKeys
          : null;
    const groupOrder =
      group === "units"
        ? value.jsonUnitFieldOrder
        : group === "tags"
          ? value.jsonTagFieldOrder
          : null;
    const allGroupFieldsSelected = Boolean(
      selectedGroupFields && groupOrder && selectedGroupFields.length === groupOrder.length,
    );
    const checked = group
      ? selectedGroupFields?.length === 0
        ? false
        : allGroupFieldsSelected
          ? true
          : "indeterminate"
      : value.selectedEmployeeFieldKeys.includes(employeeKey as ExportJsonEmployeeFieldKey);
    const title =
      group === "units"
        ? t("Units")
        : group === "tags"
          ? t("Tags")
          : (exportJsonEmployeeFieldByKey.get(employeeKey as ExportJsonEmployeeFieldKey)?.label ??
            key);
    const fieldName = group
      ? value.jsonFieldNames[group].collection
      : value.jsonFieldNames.employee[employeeKey as ExportJsonEmployeeFieldKey];

    return (
      <div className="grid gap-1" key={key}>
        <div
          className={cn(
            "grid grid-cols-[auto_auto_minmax(7rem,1fr)_minmax(9rem,1fr)_auto] items-center gap-2 rounded-md bg-muted/30 px-2 py-1",
            dragState?.list === "topLevel" && dragState.key === key && "bg-accent/45",
          )}
          data-demo-id={`json-top-level-field-${key}`}
          {...getDropHandlers("topLevel", key, moveTopLevelField)}
        >
          {renderDragHandle("topLevel", key, title)}
          <Checkbox
            aria-label={group ? title : t("Field {name}", { name: title })}
            checked={checked}
            onCheckedChange={() => {
              if (group) {
                update(
                  group === "units"
                    ? {
                        selectedJsonUnitFieldKeys: allGroupFieldsSelected
                          ? []
                          : [...value.jsonUnitFieldOrder],
                      }
                    : {
                        selectedJsonTagFieldKeys: allGroupFieldsSelected
                          ? []
                          : [...value.jsonTagFieldOrder],
                      },
                );
                return;
              }
              update({
                selectedEmployeeFieldKeys: toggle(
                  value.selectedEmployeeFieldKeys,
                  value.jsonTopLevelFieldOrder.filter(
                    (field): field is ExportJsonEmployeeFieldKey =>
                      field !== "tags" && field !== "units",
                  ),
                  employeeKey as ExportJsonEmployeeFieldKey,
                ),
              });
            }}
          />
          <span className="flex min-w-0 items-center gap-2 text-xs">
            {group === "units" && <HiOutlineUsers />}
            {group === "tags" && <HiOutlineTag />}
            <span className="truncate">{title}</span>
          </span>
          <Input
            aria-label={
              group
                ? t("Collection field name for {name}", { name: title })
                : t("Export field name for {name}", { name: title })
            }
            className="h-8 text-xs"
            disabled={group ? selectedGroupFields?.length === 0 : !checked}
            onChange={(event) =>
              group
                ? setGroupCollectionName(group, event.currentTarget.value)
                : setEmployeeFieldName(
                    employeeKey as ExportJsonEmployeeFieldKey,
                    event.currentTarget.value,
                  )
            }
            value={fieldName}
          />
          {renderReset(
            fieldName !== key,
            () =>
              group
                ? setGroupCollectionName(group, group)
                : setEmployeeFieldName(
                    employeeKey as ExportJsonEmployeeFieldKey,
                    employeeKey as ExportJsonEmployeeFieldKey,
                  ),
            title,
          )}
        </div>
        {group && renderGroupChildren(group)}
      </div>
    );
  };

  return (
    <div className="grid gap-3" data-demo-id="structured-json-settings">
      <div className="grid gap-1">{value.jsonTopLevelFieldOrder.map(renderTopLevelField)}</div>
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
