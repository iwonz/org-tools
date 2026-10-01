import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { OrgToolsState } from "@org-tools/types";
import type { Pool } from "pg";
import { describe, expect, it } from "vitest";

import { organizationBusinessHash } from "@/lib/organization-equality";
import {
  canRebaseOrganizationRetry,
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

  it("accepts a semantically exact stale retry while ignoring update timestamps", async () => {
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
    const timestampOnlyCandidate = structuredClone(state.organization);
    const firstEmployee = timestampOnlyCandidate.employees[0];
    const firstView = timestampOnlyCandidate.views[0];
    const firstUnit = firstView?.structure.units[0];
    if (!firstEmployee || !firstView || !firstUnit) throw new Error("Fixture is incomplete.");
    firstEmployee.updatedAt = "2027-01-01T00:00:00.000Z";
    firstView.updatedAt = "2027-01-01T00:00:00.000Z";
    firstUnit.updatedAt = "2027-01-01T00:00:00.000Z";
    expect(await organizationBusinessHash(timestampOnlyCandidate)).toBe(
      await organizationBusinessHash(state.organization),
    );
    const reorderedOrganization = Object.fromEntries(
      Object.entries(state.organization).reverse(),
    ) as typeof state.organization;
    expect(await organizationBusinessHash(reorderedOrganization)).toBe(
      await organizationBusinessHash(state.organization),
    );
    expect(
      isIdempotentOrganizationRetry({
        candidate: timestampOnlyCandidate,
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
    expect(await organizationBusinessHash({ ...state.organization, tags: [] })).not.toBe(
      await organizationBusinessHash(state.organization),
    );
    expect(
      await canRebaseOrganizationRetry({
        current: {
          ...current,
          organization: timestampOnlyCandidate,
        },
        expectedOrganizationHash: await organizationBusinessHash(state.organization),
        expectedRevision: 41,
        expectedSecurityRevision: 7,
      }),
    ).toBe(true);
    expect(
      await canRebaseOrganizationRetry({
        current: {
          ...current,
          organization: { ...state.organization, tags: [] },
        },
        expectedOrganizationHash: await organizationBusinessHash(state.organization),
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
