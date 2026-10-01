import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type {
  AccountId,
  AccountUiState,
  AuditEvent,
  OrganizationDocument,
  OrgToolsState,
} from "@org-tools/types";
import type { Pool, PoolClient } from "pg";

import { createBlankOrgToolsState, parseOrgToolsState, parseOrgToolsUiState } from "@/lib/org-file";
import { assertActiveSession, getDatabasePool, withDatabaseTransaction } from "@/server/database";

type DocumentRow = {
  bootstrap_ui_json: unknown;
  organization_json: unknown;
  revision: string | number;
  security_revision: string | number;
};

export type OrganizationSnapshot = {
  organization: OrganizationDocument;
  revision: number;
  securityRevision: number;
};

export const isIdempotentOrganizationRetry = (input: {
  candidate: OrganizationDocument;
  current: OrganizationSnapshot;
  expectedRevision: number;
  expectedSecurityRevision: number;
}): boolean =>
  input.expectedRevision < input.current.revision &&
  input.expectedSecurityRevision === input.current.securityRevision &&
  isDeepStrictEqual(input.candidate, input.current.organization);

export class OrganizationConflictError extends Error {
  constructor(
    readonly revision: number,
    readonly securityRevision: number,
  ) {
    super("Organization revision changed.");
    this.name = "OrganizationConflictError";
  }
}

const normalizedEmail = (value: string | null): string | null => {
  const normalized = value?.trim().normalize("NFKC").toLocaleLowerCase("en-US") ?? "";
  return normalized === "" ? null : normalized;
};

const asNumber = (value: string | number): number => Number(value);

const parseOrganizationState = (value: unknown): OrgToolsState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SyntaxError();
  const input = value as { employeeFieldDefinitions?: unknown; views?: unknown };
  if (!Array.isArray(input.views) || !Array.isArray(input.employeeFieldDefinitions))
    throw new SyntaxError();
  const viewIds = input.views
    .filter(
      (view): view is { id: string; kind: string } =>
        typeof view === "object" &&
        view !== null &&
        !Array.isArray(view) &&
        typeof (view as { id?: unknown }).id === "string" &&
        typeof (view as { kind?: unknown }).kind === "string",
    )
    .map((view) => ({ id: view.id, kind: view.kind }));
  const systemViewId = viewIds.find((view) => view.kind === "system")?.id;
  if (!systemViewId) throw new SyntaxError();
  const customFields = input.employeeFieldDefinitions.map((field) => {
    if (
      typeof field !== "object" ||
      field === null ||
      Array.isArray(field) ||
      typeof (field as { id?: unknown }).id !== "string" ||
      typeof (field as { key?: unknown }).key !== "string"
    ) {
      throw new SyntaxError();
    }
    return field as { id: string; key: string };
  });
  const blank = createBlankOrgToolsState();
  const defaultViewUi = blank.ui.editor.views[0];
  if (!defaultViewUi) throw new Error("Blank UI state is invalid.");
  const customFieldKeys = customFields.map((field) => `custom:${field.id}` as const);
  const unitsIndex = blank.ui.download.jsonTopLevelFieldOrder.indexOf("units");
  blank.ui.download.jsonTopLevelFieldOrder.splice(unitsIndex, 0, ...customFieldKeys);
  blank.ui.download.jsonFieldNames.custom = Object.fromEntries(
    customFields.map((field) => [field.id, field.key]),
  );
  blank.ui.download.sourceViewId = systemViewId;
  blank.ui.editor.activeViewId = systemViewId;
  blank.ui.editor.views = viewIds.map((view) => ({
    ...structuredClone(defaultViewUi),
    viewId: view.id,
  }));
  return parseOrgToolsState({ organization: value, ui: blank.ui });
};

export const parseOrganizationDocument = (value: unknown): OrganizationDocument =>
  parseOrganizationState(value).organization;

const parseDocumentRow = (row: DocumentRow): OrganizationSnapshot => {
  const organization = parseOrganizationDocument(row.organization_json);
  return {
    organization,
    revision: asNumber(row.revision),
    securityRevision: asNumber(row.security_revision),
  };
};

const readRow = async (client: PoolClient, lock = false): Promise<DocumentRow> => {
  const result = await client.query<DocumentRow>(
    `SELECT organization_json, bootstrap_ui_json, revision, security_revision
     FROM organization_documents WHERE singleton = TRUE${lock ? " FOR UPDATE" : ""}`,
  );
  const row = result.rows[0];
  if (!row) throw new Error("Organization document is missing.");
  return row;
};

const syncEmployeeIdentities = async (
  client: PoolClient,
  organization: OrganizationDocument,
): Promise<void> => {
  const seenEmails = new Set<string>();
  for (const employee of organization.employees) {
    const email = normalizedEmail(employee.email);
    if (email && seenEmails.has(email))
      throw new Error("Employee emails must be unique for access control.");
    if (email) seenEmails.add(email);
  }

  const linked = await client.query<{ employee_id: string; normalized_email: string }>(
    "SELECT employee_id::text, normalized_email FROM accounts WHERE employee_id IS NOT NULL",
  );
  const employeeEmails = new Map(
    organization.employees.map((employee) => [employee.id, normalizedEmail(employee.email)]),
  );
  for (const account of linked.rows) {
    if (!employeeEmails.has(account.employee_id))
      throw new Error("A linked Employee cannot be deleted.");
    if (employeeEmails.get(account.employee_id) !== account.normalized_email) {
      throw new Error("A linked Employee email can change only through Administration.");
    }
  }

  for (const employee of organization.employees) {
    await client.query(
      `INSERT INTO employee_identities (employee_id, normalized_email, updated_at)
       VALUES ($1, $2, clock_timestamp())
       ON CONFLICT (employee_id) DO UPDATE SET
         normalized_email = EXCLUDED.normalized_email,
         updated_at = EXCLUDED.updated_at`,
      [employee.id, normalizedEmail(employee.email)],
    );
  }
  const ids = organization.employees.map((employee) => employee.id);
  if (ids.length === 0) {
    await client.query(
      "DELETE FROM employee_identities WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE accounts.employee_id = employee_identities.employee_id)",
    );
  } else {
    await client.query(
      `DELETE FROM employee_identities
       WHERE NOT (employee_id = ANY($1::uuid[]))
         AND NOT EXISTS (SELECT 1 FROM accounts WHERE accounts.employee_id = employee_identities.employee_id)`,
      [ids],
    );
  }
};

export const appendAuditEvent = async (
  client: PoolClient,
  input: Omit<AuditEvent, "createdAt" | "id">,
): Promise<void> => {
  await client.query(
    `INSERT INTO audit_events
       (id, actor_account_id, action, target_ids, result, correlation_id)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
    [
      randomUUID(),
      input.actorAccountId,
      input.action,
      JSON.stringify(input.targetIds),
      input.result,
      input.correlationId,
    ],
  );
};

const pruneServerEvents = async (client: PoolClient): Promise<void> => {
  await client.query(
    `DELETE FROM server_events
     WHERE id < COALESCE(
       (SELECT id FROM server_events ORDER BY id DESC OFFSET 9999 LIMIT 1),
       0
     )`,
  );
};

export class OrganizationRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async ensureInitialized(): Promise<OrganizationSnapshot> {
    return withDatabaseTransaction(async (client) => {
      const existing = await client.query(
        "SELECT 1 FROM organization_documents WHERE singleton = TRUE",
      );
      if (existing.rowCount === 0) {
        const blank = createBlankOrgToolsState();
        await client.query(
          `INSERT INTO organization_documents
             (singleton, organization_json, bootstrap_ui_json, revision, security_revision)
           VALUES (TRUE, $1::jsonb, $2::jsonb, 1, 1)`,
          [JSON.stringify(blank.organization), JSON.stringify(blank.ui)],
        );
        await syncEmployeeIdentities(client, blank.organization);
      }
      return parseDocumentRow(await readRow(client));
    }, this.pool);
  }

  async read(): Promise<OrganizationSnapshot> {
    const result = await this.pool.query<DocumentRow>(
      `SELECT organization_json, bootstrap_ui_json, revision, security_revision
       FROM organization_documents WHERE singleton = TRUE`,
    );
    const row = result.rows[0];
    if (!row) return this.ensureInitialized();
    return parseDocumentRow(row);
  }

  parseOrganization(value: unknown): OrganizationDocument {
    return parseOrganizationDocument(value);
  }

  async readUi(accountId: AccountId): Promise<AccountUiState> {
    const result = await this.pool.query<{ ui_json: unknown }>(
      `SELECT ui_json FROM account_ui_states WHERE account_id = $1
       UNION ALL
       SELECT bootstrap_ui_json FROM organization_documents WHERE singleton = TRUE
       LIMIT 1`,
      [accountId],
    );
    const value = result.rows[0]?.ui_json;
    if (!value) throw new Error("Account UI state is missing.");
    return parseOrgToolsUiState(value);
  }

  async writeUi(
    accountId: AccountId,
    sessionId: string,
    ui: unknown,
  ): Promise<{ eventId: string; ui: AccountUiState }> {
    const parsed = parseOrgToolsUiState(ui);
    const eventId = await withDatabaseTransaction(async (client) => {
      await assertActiveSession(client, accountId, sessionId);
      await client.query(
        `INSERT INTO account_ui_states (account_id, ui_json, updated_at)
         VALUES ($1, $2::jsonb, clock_timestamp())
         ON CONFLICT (account_id) DO UPDATE SET
           ui_json = EXCLUDED.ui_json,
           updated_at = EXCLUDED.updated_at`,
        [accountId, JSON.stringify(parsed)],
      );
      const document = await readRow(client);
      const event = await client.query<{ id: string }>(
        `INSERT INTO server_events
           (organization_revision, security_revision, event_kind, account_id)
         VALUES ($1, $2, 'ui', $3)
         RETURNING id::text`,
        [document.revision, document.security_revision, accountId],
      );
      await pruneServerEvents(client);
      const id = event.rows[0]?.id;
      if (!id) throw new Error("UI event was not created.");
      return id;
    }, this.pool);
    return { eventId, ui: parsed };
  }

  async replaceOrganization(input: {
    actorAccountId: AccountId;
    correlationId: string;
    expectedRevision: number;
    expectedSecurityRevision: number;
    organization: unknown;
    sessionId: string;
  }): Promise<OrganizationSnapshot> {
    return withDatabaseTransaction(async (client) => {
      await assertActiveSession(client, input.actorAccountId, input.sessionId);
      const row = await readRow(client, true);
      const current = parseDocumentRow(row);
      const candidate = this.parseOrganization(input.organization);
      if (
        current.revision !== input.expectedRevision ||
        current.securityRevision !== input.expectedSecurityRevision
      ) {
        if (
          isIdempotentOrganizationRetry({
            candidate,
            current,
            expectedRevision: input.expectedRevision,
            expectedSecurityRevision: input.expectedSecurityRevision,
          })
        ) {
          return current;
        }
        throw new OrganizationConflictError(current.revision, current.securityRevision);
      }
      await syncEmployeeIdentities(client, candidate);
      const currentViewIds = new Set(current.organization.views.map((view) => view.id));
      const creatorAudience = {
        allAuthenticated: false,
        relations: [],
        roleIds: [],
        userIds: [input.actorAccountId],
      };
      for (const view of candidate.views) {
        if (view.kind !== "custom" || currentViewIds.has(view.id)) continue;
        await client.query(
          `INSERT INTO resource_policies
             (resource_kind, resource_id, read_audience, write_audience, hide_employees_when_unread)
           VALUES ('view', $1, $2::jsonb, $2::jsonb, FALSE)
           ON CONFLICT (resource_kind, resource_id) DO NOTHING`,
          [view.id, JSON.stringify(creatorAudience)],
        );
      }
      const policyResources = {
        employeeField: new Set(candidate.employeeFieldDefinitions.map((field) => field.id)),
        staffingSlot: new Set(
          candidate.views.flatMap((view) =>
            view.structure.units.flatMap((unit) => unit.staffingSlots.map((slot) => slot.id)),
          ),
        ),
        tag: new Set(candidate.tags.map((tag) => tag.id)),
        unit: new Set(
          candidate.views.flatMap((view) => view.structure.units.map((unit) => unit.id)),
        ),
        view: new Set(candidate.views.map((view) => view.id)),
      } as const;
      for (const [kind, identifiers] of Object.entries(policyResources)) {
        const ids = [...identifiers];
        const preserveBuiltIns =
          kind === "employeeField" ? " AND resource_id NOT LIKE 'builtin:%'" : "";
        if (ids.length === 0) {
          await client.query(
            `DELETE FROM resource_policies WHERE resource_kind = $1${preserveBuiltIns}`,
            [kind],
          );
        } else {
          await client.query(
            `DELETE FROM resource_policies WHERE resource_kind = $1 AND NOT (resource_id = ANY($2::text[]))${preserveBuiltIns}`,
            [kind, ids],
          );
        }
      }
      const revision = current.revision + 1;
      await client.query(
        `UPDATE organization_documents
         SET organization_json = $1::jsonb, revision = $2, updated_at = clock_timestamp()
         WHERE singleton = TRUE`,
        [JSON.stringify(candidate), revision],
      );
      await client.query(
        `INSERT INTO server_events
           (organization_revision, security_revision, event_kind, account_id)
         VALUES ($1, $2, 'organization', NULL)`,
        [revision, current.securityRevision],
      );
      await pruneServerEvents(client);
      await appendAuditEvent(client, {
        action: "organization.replace",
        actorAccountId: input.actorAccountId,
        correlationId: input.correlationId,
        result: "succeeded",
        targetIds: [],
      });
      return {
        organization: candidate,
        revision,
        securityRevision: current.securityRevision,
      };
    }, this.pool);
  }

  async incrementSecurityRevision(client: PoolClient, eventKind: "restore" | "security") {
    const result = await client.query<{ revision: string; security_revision: string }>(
      `UPDATE organization_documents
       SET security_revision = security_revision + 1, updated_at = clock_timestamp()
       WHERE singleton = TRUE
       RETURNING revision, security_revision`,
    );
    const row = result.rows[0];
    if (!row) throw new Error("Organization document is missing.");
    await client.query(
      `INSERT INTO server_events
         (organization_revision, security_revision, event_kind, account_id)
       VALUES ($1, $2, $3, NULL)`,
      [row.revision, row.security_revision, eventKind],
    );
    await pruneServerEvents(client);
    return { revision: Number(row.revision), securityRevision: Number(row.security_revision) };
  }

  async createStateForTests(): Promise<OrgToolsState> {
    const snapshot = await this.read();
    const result = await this.pool.query<{ bootstrap_ui_json: unknown }>(
      "SELECT bootstrap_ui_json FROM organization_documents WHERE singleton = TRUE",
    );
    try {
      return parseOrgToolsState({
        organization: snapshot.organization,
        ui: result.rows[0]?.bootstrap_ui_json,
      });
    } catch {
      return parseOrganizationState(snapshot.organization);
    }
  }
}
