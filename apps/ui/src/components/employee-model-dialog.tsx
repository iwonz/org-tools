"use client";

import type {
  CustomEmployeeFieldDefinition,
  CustomEmployeeFieldHash,
  CustomEmployeeValueType,
  EmployeeFieldId,
} from "@org-tools/types";
import { useMemo, useState } from "react";
import { HiOutlineCodeBracket, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

import { TemplateFormatInput } from "@/components/template-format-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useMessageText, useUiText } from "@/i18n/use-ui-text";
import {
  BUILT_IN_EMPLOYEE_TEMPLATE_KEYS,
  wouldCreateTemplateDependencyCycle,
} from "@/lib/custom-employee-fields";
import { createUuid } from "@/lib/employee-data";
import { useOrgStore } from "@/stores/org-store-context";

const VALUE_TYPES: CustomEmployeeValueType[] = ["text", "number", "boolean", "date", "option"];
const HASHES: CustomEmployeeFieldHash[] = ["none", "md5", "sha256"];

const createDraft = (): CustomEmployeeFieldDefinition => ({
  hash: "none",
  id: createUuid(),
  key: "customField",
  kind: "template",
  name: "",
  template: "",
});

type PendingDraftChange = {
  description:
    | "Changing the field kind or type clears its stored values and filters."
    | "Deleting this option clears it from every Employee.";
  next: CustomEmployeeFieldDefinition;
};

export function EmployeeModelDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const store = useOrgStore();
  const t = useUiText();
  const messageText = useMessageText();
  const [draft, setDraft] = useState<CustomEmployeeFieldDefinition | null>(null);
  const [deleteId, setDeleteId] = useState<EmployeeFieldId | null>(null);
  const [pendingDraftChange, setPendingDraftChange] = useState<PendingDraftChange | null>(null);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const tokenOptions = useMemo(
    () => [
      ...BUILT_IN_EMPLOYEE_TEMPLATE_KEYS.map((key) => ({ description: key, key })),
      ...store.employeeFieldDefinitions
        .filter((field) => field.id !== draft?.id)
        .filter(
          (field) =>
            !draft ||
            !wouldCreateTemplateDependencyCycle(store.employeeFieldDefinitions, draft.id, field.id),
        )
        .map((field) => ({ description: field.name, key: field.key })),
    ],
    [draft, store.employeeFieldDefinitions],
  );
  const setDraftKind = (kind: "template" | "value") => {
    if (!draft || draft.kind === kind) return;
    const next: CustomEmployeeFieldDefinition =
      kind === "template"
        ? {
            hash: "none",
            id: draft.id,
            key: draft.key,
            kind,
            name: draft.name,
            template: "",
          }
        : {
            id: draft.id,
            key: draft.key,
            kind,
            name: draft.name,
            options: [],
            required: false,
            valueType: "text",
          };
    if (store.employeeFieldDefinitions.some((field) => field.id === draft.id)) {
      setPendingDraftChange({
        description: "Changing the field kind or type clears its stored values and filters.",
        next,
      });
    } else {
      setDraft(next);
    }
  };
  const save = () => {
    if (!draft) return;
    try {
      store.saveEmployeeFieldDefinition(draft);
      setDraft(null);
      setError(null);
    } catch (saveError) {
      setError(describeError(saveError));
    }
  };
  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="flex max-h-[90dvh] max-w-4xl flex-col"
          data-demo-id="employee-model-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("Employee model")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid min-h-0 flex-1 gap-5 overflow-y-auto">
            <section className="grid gap-2">
              <h3 className="text-sm font-medium">{t("Built-in fields")}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BUILT_IN_EMPLOYEE_TEMPLATE_KEYS.map((key) => (
                  <div className="rounded-md bg-muted/45 px-3 py-2" key={key}>
                    <div className="text-sm font-medium">{key}</div>
                    <code className="text-xs text-muted-foreground">{`{${key}}`}</code>
                  </div>
                ))}
              </div>
            </section>
            <section className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">{t("Custom fields")}</h3>
                <Button
                  onClick={() => {
                    setDraft(createDraft());
                    setError(null);
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <HiOutlinePlus />
                  {t("Add field")}
                </Button>
              </div>
              {store.employeeFieldDefinitions.length === 0 ? (
                <div className="rounded-md bg-muted/35 p-4 text-sm text-muted-foreground">
                  {t("No custom fields")}
                </div>
              ) : (
                store.employeeFieldDefinitions.map((field) => (
                  <div
                    className="flex items-center gap-3 rounded-md bg-muted/35 px-3 py-2"
                    key={field.id}
                  >
                    <HiOutlineCodeBracket className="size-4 text-muted-foreground" />
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setDraft(structuredClone(field));
                        setError(null);
                      }}
                      type="button"
                    >
                      <div className="truncate text-sm font-medium">{field.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{`{${field.key}} · ${field.kind === "template" ? t("Template") : t("Value")}`}</div>
                    </button>
                    <Button
                      aria-label={t("Delete field")}
                      onClick={() => setDeleteId(field.id)}
                      size="icon"
                      title={t("Delete field")}
                      type="button"
                      variant="ghost"
                    >
                      <HiOutlineTrash />
                    </Button>
                  </div>
                ))
              )}
            </section>
            {draft && (
              <section
                className="grid gap-4 rounded-lg bg-muted/25 p-4"
                data-demo-id="employee-field-editor"
              >
                <Tabs
                  value={draft.kind}
                  onValueChange={(kind) => setDraftKind(kind as "template" | "value")}
                >
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="template">
                      <HiOutlineCodeBracket />
                      {t("Template")}
                    </TabsTrigger>
                    <TabsTrigger value="value">
                      <HiOutlinePlus />
                      {t("Value")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="custom-field-name">{t("Name")}</Label>
                    <Input
                      id="custom-field-name"
                      onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
                      value={draft.name}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="custom-field-key">{t("Token key")}</Label>
                    <Input
                      id="custom-field-key"
                      onChange={(event) => setDraft({ ...draft, key: event.currentTarget.value })}
                      value={draft.key}
                    />
                  </div>
                </div>
                {draft.kind === "template" ? (
                  <>
                    <TemplateFormatInput
                      id="custom-field-template"
                      label={t("Format")}
                      onChange={(template) => setDraft({ ...draft, template })}
                      tokens={tokenOptions}
                      value={draft.template}
                    />
                    <div className="grid gap-2">
                      <Label>{t("Hashing")}</Label>
                      <Select
                        onValueChange={(hash) =>
                          setDraft({ ...draft, hash: hash as CustomEmployeeFieldHash })
                        }
                        value={draft.hash}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HASHES.map((hash) => (
                            <SelectItem key={hash} value={hash}>
                              {hash === "none" ? t("No hashing") : hash.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label>{t("Field type")}</Label>
                      <Select
                        onValueChange={(valueType) => {
                          const next: CustomEmployeeFieldDefinition = {
                            ...draft,
                            options: valueType === "option" ? draft.options : [],
                            valueType: valueType as CustomEmployeeValueType,
                          };
                          const original = store.employeeFieldDefinitions.find(
                            (field) => field.id === draft.id,
                          );
                          if (original?.kind === "value" && original.valueType !== valueType) {
                            setPendingDraftChange({
                              description:
                                "Changing the field kind or type clears its stored values and filters.",
                              next,
                            });
                          } else {
                            setDraft(next);
                          }
                        }}
                        value={draft.valueType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VALUE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(
                                type === "text"
                                  ? "Text"
                                  : type === "number"
                                    ? "Number"
                                    : type === "boolean"
                                      ? "Flag"
                                      : type === "date"
                                        ? "Date"
                                        : "Option",
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-sm">
                      <span>{t("Required")}</span>
                      <Checkbox
                        aria-label={t("Required")}
                        checked={draft.required}
                        onCheckedChange={(required) =>
                          setDraft({ ...draft, required: required === true })
                        }
                      />
                    </div>
                    {draft.valueType === "option" && (
                      <div className="grid gap-2">
                        <Label>{t("Options")}</Label>
                        {draft.options.map((option, index) => (
                          <div className="flex gap-2" key={option.id}>
                            <Input
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  options: draft.options.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, label: event.currentTarget.value }
                                      : current,
                                  ),
                                })
                              }
                              value={option.label}
                            />
                            <Button
                              aria-label={t("Delete option")}
                              onClick={() => {
                                const next: CustomEmployeeFieldDefinition = {
                                  ...draft,
                                  options: draft.options.filter(
                                    (current) => current.id !== option.id,
                                  ),
                                };
                                const original = store.employeeFieldDefinitions.find(
                                  (field) => field.id === draft.id,
                                );
                                if (
                                  original?.kind === "value" &&
                                  original.options.some((candidate) => candidate.id === option.id)
                                ) {
                                  setPendingDraftChange({
                                    description:
                                      "Deleting this option clears it from every Employee.",
                                    next,
                                  });
                                } else {
                                  setDraft(next);
                                }
                              }}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <HiOutlineTrash />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() =>
                            setDraft({
                              ...draft,
                              options: [...draft.options, { id: createUuid(), label: "" }],
                            })
                          }
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          <HiOutlinePlus />
                          {t("Add option")}
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {error && (
                  <div className="text-sm text-destructive" role="alert">
                    {messageText(error)}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setDraft(null)} type="button" variant="ghost">
                    {t("Cancel")}
                  </Button>
                  <Button onClick={save} type="button">
                    {t("Save")}
                  </Button>
                </div>
              </section>
            )}
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog onOpenChange={(next) => !next && setDeleteId(null)} open={deleteId !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete custom field?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Values stored for every Employee will be removed.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  try {
                    store.deleteEmployeeFieldDefinition(deleteId);
                    setError(null);
                  } catch (deleteError) {
                    setError(describeError(deleteError));
                  }
                }
                setDeleteId(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(nextOpen) => !nextOpen && setPendingDraftChange(null)}
        open={pendingDraftChange !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Clear stored values?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDraftChange ? t(pendingDraftChange.description) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDraftChange) setDraft(pendingDraftChange.next);
                setPendingDraftChange(null);
              }}
            >
              {t("Continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
