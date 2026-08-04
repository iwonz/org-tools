import type { OrgToolsState, OrgToolsStateContent } from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";

import {
  describeError,
  LocalizedError,
  type UiMessageDescriptor,
  uiMessage,
} from "@/i18n/messages";
import {
  createEmployeeImportAutoMapping,
  createEmptyEmployeeImportMapping,
  type EmployeeFieldMapping,
  type EmployeeImportCollection,
  type EmployeeImportDocument,
  type EmployeeImportPlan,
  type EmployeeImportTarget,
  type ExistingEmployeeIdentity,
  getEmployeeImportSourceExamples,
  type ImportedEmployeeDraft,
  normalizeEmployeeImportRows,
  parseEmployeeImportText,
  planEmployeeImport,
} from "@/lib/employee-import";
import {
  buildGenericImportPlan,
  createEmptyTeamFieldMapping,
  createTeamImportAutoMapping,
  type GenericImportPlan,
  type GenericImportTarget,
  type TeamFieldMapping,
  type TeamImportTarget,
} from "@/lib/generic-import";
import {
  getAvailableStateImportContents,
  type MappedImportDocument,
  planStateImport,
  type StateImportOperation,
  type StructuredImportPlan,
} from "@/lib/structured-import";

export const MAX_EMPLOYEE_IMPORT_FILE_BYTES = 25 * 1024 * 1024;

export type StateImportCandidate = {
  fileName: string;
  fileSizeBytes: number;
  state: OrgToolsState;
};

export type EmployeeImportCommitSummary = Pick<
  EmployeeImportPlan,
  "duplicateRowCount" | "emptyRowCount" | "newEmployeeCount" | "totalRowCount"
>;

export class ImportSessionStore {
  document: EmployeeImportDocument | null = null;
  existingEmployees: ExistingEmployeeIdentity[] = [];
  fileName: string | null = null;
  fileSizeBytes: number | null = null;
  stateCandidate: StateImportCandidate | null = null;
  stateContent: OrgToolsStateContent | null = null;
  stateOperation: StateImportOperation = "append";
  mapping: EmployeeFieldMapping = createEmptyEmployeeImportMapping();
  genericTarget: GenericImportTarget = "employees";
  teamMapping: TeamFieldMapping = createEmptyTeamFieldMapping();
  selectedCollectionId: string | null = null;
  tagDelimiter = ",";

  constructor(existingEmployees: readonly ExistingEmployeeIdentity[] = []) {
    this.existingEmployees = [...existingEmployees];
    makeAutoObservable(
      this,
      {
        document: observable.ref,
        existingEmployees: observable.shallow,
        stateCandidate: observable.ref,
        mapping: observable.ref,
        teamMapping: observable.ref,
      },
      { autoBind: true },
    );
  }

  get selectedCollection(): EmployeeImportCollection | null {
    if (this.document === null || this.selectedCollectionId === null) return null;
    return (
      this.document.collections.find((collection) => collection.id === this.selectedCollectionId) ??
      null
    );
  }

  get plan(): EmployeeImportPlan | null {
    if (this.genericTarget !== "employees") return null;
    const collection = this.selectedCollection;
    if (collection === null) return null;
    const rows = normalizeEmployeeImportRows(collection, this.mapping, this.tagDelimiter);
    return planEmployeeImport(rows, this.existingEmployees, this.mapping);
  }

  get genericPlan(): GenericImportPlan | null {
    const collection = this.selectedCollection;
    if (
      collection === null ||
      this.genericTarget === "employees" ||
      this.teamMapping.teamName === null
    ) {
      return null;
    }
    try {
      return buildGenericImportPlan(
        collection,
        this.mapping,
        this.teamMapping,
        this.genericTarget,
        this.existingEmployees,
        this.tagDelimiter,
      );
    } catch {
      return null;
    }
  }

  get genericPlanIssue(): UiMessageDescriptor | null {
    const collection = this.selectedCollection;
    if (collection === null || this.genericTarget === "employees") return null;
    if (this.teamMapping.teamName === null) {
      return uiMessage("Map a Team name before importing Teams.");
    }
    try {
      buildGenericImportPlan(
        collection,
        this.mapping,
        this.teamMapping,
        this.genericTarget,
        this.existingEmployees,
        this.tagDelimiter,
      );
      return null;
    } catch (error) {
      return describeError(error);
    }
  }

  get availableStateContents(): OrgToolsStateContent[] {
    return this.stateCandidate
      ? getAvailableStateImportContents(this.stateCandidate.state.content)
      : [];
  }

  get structuredPlan(): StructuredImportPlan | null {
    return this.stateCandidate && this.stateContent && this.stateContent !== "workspace"
      ? planStateImport(
          this.stateCandidate.state,
          this.stateContent,
          this.stateOperation === "append" ? this.existingEmployees : [],
        )
      : null;
  }

  setExistingEmployees(existingEmployees: readonly ExistingEmployeeIdentity[]): void {
    this.existingEmployees = [...existingEmployees];
  }

  loadText(fileName: string, text: string, fileSizeBytes = new Blob([text]).size): void {
    if (fileSizeBytes > MAX_EMPLOYEE_IMPORT_FILE_BYTES) {
      throw new LocalizedError(
        uiMessage("The selected file is {size} MiB; the limit is {limit} MiB.", {
          limit: Math.round(MAX_EMPLOYEE_IMPORT_FILE_BYTES / 1024 / 1024),
          size: Math.ceil(fileSizeBytes / 1024 / 1024),
        }),
      );
    }

    const source = parseEmployeeImportText(text);
    this.resetSource();
    this.fileName = fileName;
    this.fileSizeBytes = fileSizeBytes;

    if (source.kind === "state") {
      this.stateCandidate = { fileName, fileSizeBytes, state: source.state };
      this.stateContent = source.state.content;
      this.stateOperation = source.state.content === "workspace" ? "replace" : "append";
      return;
    }

    this.loadDocument(source.document, fileName, fileSizeBytes);
  }

  async loadFile(file: File): Promise<void> {
    if (file.size > MAX_EMPLOYEE_IMPORT_FILE_BYTES) {
      throw new LocalizedError(
        uiMessage("The selected file is {size} MiB; the limit is {limit} MiB.", {
          limit: Math.round(MAX_EMPLOYEE_IMPORT_FILE_BYTES / 1024 / 1024),
          size: Math.ceil(file.size / 1024 / 1024),
        }),
      );
    }
    this.loadText(file.name, await file.text(), file.size);
  }

  loadDocument(
    document: EmployeeImportDocument,
    fileName = this.fileName ?? "Employees",
    fileSizeBytes = this.fileSizeBytes ?? 0,
  ): void {
    if (document.collections.length === 0) {
      throw new LocalizedError(
        uiMessage("The selected file does not contain an Employee collection."),
      );
    }
    this.document = document;
    this.fileName = fileName;
    this.fileSizeBytes = fileSizeBytes;
    this.stateCandidate = null;
    this.stateContent = null;
    this.selectCollection(document.collections[0]?.id ?? null);
  }

  selectCollection(collectionId: string | null): void {
    const collection =
      collectionId === null
        ? null
        : (this.document?.collections.find((candidate) => candidate.id === collectionId) ?? null);
    this.selectedCollectionId = collection?.id ?? null;
    this.mapping = collection
      ? createEmployeeImportAutoMapping(collection.sourceFields)
      : createEmptyEmployeeImportMapping();
    this.teamMapping = collection
      ? createTeamImportAutoMapping(collection.sourceFields)
      : createEmptyTeamFieldMapping();
  }

  setMapping(target: EmployeeImportTarget, sourceField: string | null): void {
    if (sourceField !== null && !this.selectedCollection?.sourceFields.includes(sourceField)) {
      throw new LocalizedError(uiMessage("Unknown source field: {field}", { field: sourceField }));
    }
    this.mapping = { ...this.mapping, [target]: sourceField };
  }

  setTagDelimiter(delimiter: string): void {
    this.tagDelimiter = delimiter;
  }

  setGenericTarget(target: GenericImportTarget): void {
    this.genericTarget = target;
  }

  setTeamMapping(target: TeamImportTarget, sourceField: string | null): void {
    if (sourceField !== null && !this.selectedCollection?.sourceFields.includes(sourceField)) {
      throw new LocalizedError(uiMessage("Unknown source field: {field}", { field: sourceField }));
    }
    this.teamMapping = { ...this.teamMapping, [target]: sourceField };
  }

  setStateContent(content: OrgToolsStateContent): void {
    if (!this.availableStateContents.includes(content)) {
      throw new LocalizedError(uiMessage("Structured import is invalid."));
    }
    this.stateContent = content;
    this.stateOperation = content === "workspace" ? "replace" : "append";
  }

  setStateOperation(operation: StateImportOperation): void {
    if (this.stateContent === "workspace") return;
    this.stateOperation = operation;
  }

  getSourceExamples(sourceField: string, limit = 3): string[] {
    const collection = this.selectedCollection;
    return collection ? getEmployeeImportSourceExamples(collection, sourceField, limit) : [];
  }

  commit(
    onCommit: (
      drafts: readonly ImportedEmployeeDraft[],
      summary: EmployeeImportCommitSummary,
    ) => void,
  ): EmployeeImportCommitSummary {
    const plan = this.plan;
    if (plan === null)
      throw new LocalizedError(uiMessage("Select an Employee collection before importing."));
    if (!plan.canCommit)
      throw new LocalizedError(
        uiMessage("Resolve all mapping, validation, and identity conflicts."),
      );

    const summary: EmployeeImportCommitSummary = {
      duplicateRowCount: plan.duplicateRowCount,
      emptyRowCount: plan.emptyRowCount,
      newEmployeeCount: plan.newEmployeeCount,
      totalRowCount: plan.totalRowCount,
    };
    onCommit(plan.drafts, summary);
    return summary;
  }

  commitGeneric(onCommit: (document: MappedImportDocument) => void): StructuredImportPlan {
    const plan = this.genericPlan;
    if (!plan)
      throw new LocalizedError(
        uiMessage("Resolve all mapping, validation, and identity conflicts."),
      );
    onCommit(plan.document);
    return plan.preview;
  }

  reset(): void {
    this.resetSource();
  }

  private resetSource(): void {
    this.document = null;
    this.fileName = null;
    this.fileSizeBytes = null;
    this.stateCandidate = null;
    this.stateContent = null;
    this.stateOperation = "append";
    this.mapping = createEmptyEmployeeImportMapping();
    this.genericTarget = "employees";
    this.teamMapping = createEmptyTeamFieldMapping();
    this.selectedCollectionId = null;
    this.tagDelimiter = ",";
  }
}
