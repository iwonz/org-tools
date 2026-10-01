import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { OrgToolsState } from "@org-tools/types";
import type { Pool } from "pg";
import { describe, expect, it } from "vitest";

import {
  isIdempotentOrganizationRetry,
  OrganizationRepository,
} from "@/server/organization-repository";

describe("OrganizationRepository organization parsing", () => {
  it("accepts a valid organization with custom Employee fields", async () => {
    const state = JSON.parse(
      await readFile(
        resolve(process.cwd(), "packages/screenshots/fixtures/synthetic-state.json"),
        "utf8",
      ),
    ) as OrgToolsState;
    const repository = new OrganizationRepository({} as Pool);

    const organization = repository.parseOrganization(state.organization);

    expect(organization.employeeFieldDefinitions).toHaveLength(3);
    expect(organization.views).toHaveLength(state.organization.views.length);
  });

  it("accepts only an exact stale retry as idempotent", async () => {
    const state = JSON.parse(
      await readFile(
        resolve(process.cwd(), "packages/screenshots/fixtures/synthetic-state.json"),
        "utf8",
      ),
    ) as OrgToolsState;
    const current = {
      organization: state.organization,
      revision: 42,
      securityRevision: 7,
    };

    expect(
      isIdempotentOrganizationRetry({
        candidate: structuredClone(state.organization),
        current,
        expectedRevision: 41,
        expectedSecurityRevision: 7,
      }),
    ).toBe(true);
    expect(
      isIdempotentOrganizationRetry({
        candidate: { ...state.organization, tags: [] },
        current,
        expectedRevision: 41,
        expectedSecurityRevision: 7,
      }),
    ).toBe(false);
    expect(
      isIdempotentOrganizationRetry({
        candidate: state.organization,
        current,
        expectedRevision: 41,
        expectedSecurityRevision: 6,
      }),
    ).toBe(false);
  });
});
