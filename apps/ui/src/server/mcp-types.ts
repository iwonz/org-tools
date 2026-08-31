import { z } from "zod";

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const nullableText = (maximum: number) => z.string().trim().max(maximum).nullable();
const entityReferenceSchema = boundedText(120);
const tagSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u)
      .nullable(),
    label: boundedText(100),
  })
  .strict();

export const employeeFieldsSchema = z
  .object({
    avatarBase64Url: z.string().max(35_000_000).nullable(),
    birthday: z
      .string()
      .regex(/^\d{2}-\d{2}$/u)
      .nullable(),
    email: nullableText(320),
    firstName: boundedText(120),
    gender: z.enum(["male", "female", "unspecified"]),
    lastName: boundedText(120),
    phone: nullableText(100),
    profileUrl: nullableText(2_048),
    tags: z.array(tagSchema).max(200),
    username: nullableText(120),
  })
  .strict();

const employeePatchSchema = employeeFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);

const birthdayFilterSchema = z
  .object({ day: z.number().int().min(1).max(31), month: z.number().int().min(1).max(12) })
  .strict()
  .nullable();

const liveFilterSchema = z
  .object({
    birthday: birthdayFilterSchema,
    includeWithoutTags: z.boolean(),
    includeWithoutUnits: z.boolean(),
    query: z.string().max(500),
    selectedPositions: z.array(z.string().max(200)).max(200),
    selectedTags: z.array(z.string().max(100)).max(200),
    selectedUnitIds: z.array(entityReferenceSchema).max(4_000),
  })
  .strict()
  .nullable();

const positionSchema = z
  .object({ employeeId: entityReferenceSchema, position: z.string().max(200).nullable() })
  .strict();

const unitPatchSchema = z
  .object({
    bossEmployeeId: entityReferenceSchema.nullable().optional(),
    collapsed: z.boolean().optional(),
    employeeIds: z.array(entityReferenceSchema).max(20_000).optional(),
    employeePositions: z.array(positionSchema).max(20_000).optional(),
    liveFilter: liveFilterSchema.optional(),
    name: boundedText(200).optional(),
    order: z.number().int().min(0).optional(),
    parentId: entityReferenceSchema.nullable().optional(),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const createEmployeeOperationSchema = z
  .object({
    employee: employeeFieldsSchema,
    ref: boundedText(80).optional(),
    type: z.literal("employee.create"),
  })
  .strict();
const updateEmployeeOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    patch: employeePatchSchema,
    type: z.literal("employee.update"),
  })
  .strict();
const deleteEmployeeOperationSchema = z
  .object({ employeeId: entityReferenceSchema, type: z.literal("employee.delete") })
  .strict();

const createUnitOperationSchema = z
  .object({
    ref: boundedText(80).optional(),
    type: z.literal("unit.create"),
    unit: z
      .object({
        bossEmployeeId: entityReferenceSchema.nullable().optional(),
        collapsed: z.boolean().optional(),
        employeeIds: z.array(entityReferenceSchema).max(20_000).optional(),
        employeePositions: z.array(positionSchema).max(20_000).optional(),
        liveFilter: liveFilterSchema.optional(),
        name: boundedText(200),
        order: z.number().int().min(0).optional(),
        parentId: entityReferenceSchema.nullable().optional(),
        x: z.number().finite().optional(),
        y: z.number().finite().optional(),
      })
      .strict(),
    viewId: entityReferenceSchema,
  })
  .strict();
const updateUnitOperationSchema = z
  .object({
    type: z.literal("unit.update"),
    unitId: entityReferenceSchema,
    patch: unitPatchSchema,
    viewId: entityReferenceSchema,
  })
  .strict();
const deleteUnitOperationSchema = z
  .object({
    cascade: z.boolean().optional(),
    type: z.literal("unit.delete"),
    unitId: entityReferenceSchema,
    viewId: entityReferenceSchema,
  })
  .strict();
const assignEmployeeOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    isBoss: z.boolean().optional(),
    position: z.string().max(200).nullable().optional(),
    type: z.literal("unit.assignEmployee"),
    unitId: entityReferenceSchema,
    viewId: entityReferenceSchema,
  })
  .strict();
const unassignEmployeeOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    type: z.literal("unit.unassignEmployee"),
    unitId: entityReferenceSchema,
    viewId: entityReferenceSchema,
  })
  .strict();

const createViewOperationSchema = z
  .object({
    name: boundedText(200),
    ref: boundedText(80).optional(),
    sourceViewId: entityReferenceSchema.optional(),
    type: z.literal("view.create"),
  })
  .strict();
const renameViewOperationSchema = z
  .object({ name: boundedText(200), type: z.literal("view.rename"), viewId: entityReferenceSchema })
  .strict();
const deleteViewOperationSchema = z
  .object({ type: z.literal("view.delete"), viewId: entityReferenceSchema })
  .strict();
const replaceViewOperationSchema = z
  .object({
    document: z.unknown(),
    type: z.literal("view.replaceStructure"),
    viewId: entityReferenceSchema,
  })
  .strict();
const arrangeViewOperationSchema = z
  .object({
    layoutMode: z.enum(["leftRight", "topDown"]).optional(),
    type: z.literal("view.arrange"),
    viewId: entityReferenceSchema,
  })
  .strict();

const createViewEmployeeOperationSchema = z
  .object({
    employee: employeeFieldsSchema,
    ref: boundedText(80).optional(),
    type: z.literal("viewEmployee.create"),
    viewId: entityReferenceSchema,
  })
  .strict();
const updateViewEmployeeOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    patch: employeePatchSchema,
    type: z.literal("viewEmployee.update"),
    viewId: entityReferenceSchema,
  })
  .strict();
const deleteViewEmployeeOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    type: z.literal("viewEmployee.delete"),
    viewId: entityReferenceSchema,
  })
  .strict();
const upsertOverrideOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    fields: employeeFieldsSchema,
    type: z.literal("viewOverride.upsert"),
    viewId: entityReferenceSchema,
  })
  .strict();
const deleteOverrideOperationSchema = z
  .object({
    employeeId: entityReferenceSchema,
    type: z.literal("viewOverride.delete"),
    viewId: entityReferenceSchema,
  })
  .strict();

export const mcpOperationSchema = z.discriminatedUnion("type", [
  createEmployeeOperationSchema,
  updateEmployeeOperationSchema,
  deleteEmployeeOperationSchema,
  createUnitOperationSchema,
  updateUnitOperationSchema,
  deleteUnitOperationSchema,
  assignEmployeeOperationSchema,
  unassignEmployeeOperationSchema,
  createViewOperationSchema,
  renameViewOperationSchema,
  deleteViewOperationSchema,
  replaceViewOperationSchema,
  arrangeViewOperationSchema,
  createViewEmployeeOperationSchema,
  updateViewEmployeeOperationSchema,
  deleteViewEmployeeOperationSchema,
  upsertOverrideOperationSchema,
  deleteOverrideOperationSchema,
]);

export const mcpOperationsSchema = z.array(mcpOperationSchema).min(1).max(100);
export type McpOperation = z.infer<typeof mcpOperationSchema>;

export type SemanticEntityType = "employee" | "unit" | "view" | "viewEmployee" | "viewOverride";

export type SemanticDiffEntry = {
  after: unknown;
  afterExists: boolean;
  before: unknown;
  beforeExists: boolean;
  entityId: string;
  entityType: SemanticEntityType;
  field: string | null;
  viewId: string | null;
};

export type McpChangeSummary = {
  created: number;
  deleted: number;
  message: string;
  updated: number;
};

export type McpPreviewResult = {
  affectedIds: string[];
  baseRevision: number;
  diff: SemanticDiffEntry[];
  expiresAt: string;
  previewId: string;
  resolvedRefs: Record<string, string>;
  summary: McpChangeSummary;
};

export type McpApplyResult = {
  affectedIds: string[];
  baseRevision: number;
  changeId: string;
  resultRevision: number;
  summary: McpChangeSummary;
};

export type McpActivity = McpApplyResult & {
  actor: string;
  createdAt: string;
  reason: string;
};
