import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createBlankOrgToolsState } from "@/lib/org-file";
import {
  type BackupPayload,
  decryptBackup,
  encryptBackup,
  validateBackupPayload,
} from "@/server/backup-service";

const SUPER_ADMIN_ROLE_ID = "00000000-0000-4000-8000-000000000001";

const payload = (): BackupPayload => {
  const state = createBlankOrgToolsState();
  const accountId = randomUUID();
  const timestamp = "2026-09-29T00:00:00.000Z";
  return {
    accountGrants: [],
    accounts: [
      {
        created_at: timestamp,
        email: "administrator@example.test",
        employee_id: null,
        id: accountId,
        must_change_password: false,
        normalized_email: "administrator@example.test",
        password_hash:
          "$argon2id$v=19$m=65536,t=3,p=1$DNfRdh53srGeRpHlv6ER+w$lPb5uew6fp2gn5vvgQ7hKXlHUJq8ch/xKoUZlE/ZPMc",
        role_id: SUPER_ADMIN_ROLE_ID,
        status: "active",
        updated_at: timestamp,
      },
    ],
    auditEvents: [],
    employeeIdentities: [],
    organization: {
      bootstrapUi: state.ui,
      createdAt: timestamp,
      document: state.organization,
      revision: "1",
      securityRevision: "1",
      updatedAt: timestamp,
    },
    resourcePolicies: [],
    roleGrants: [],
    roles: [
      {
        created_at: timestamp,
        id: SUPER_ADMIN_ROLE_ID,
        name: "Super Administrator",
        system_key: "superAdmin",
        updated_at: timestamp,
      },
      {
        created_at: timestamp,
        id: "00000000-0000-4000-8000-000000000002",
        name: "Employee",
        system_key: "employee",
        updated_at: timestamp,
      },
      {
        created_at: timestamp,
        id: "00000000-0000-4000-8000-000000000003",
        name: "Manager",
        system_key: "manager",
        updated_at: timestamp,
      },
    ],
    schemaVersion: 1,
    uiStates: [{ account_id: accountId, ui_json: state.ui, updated_at: timestamp }],
  };
};

describe("encrypted Backup", () => {
  it("round trips an authenticated compressed payload", async () => {
    const source = payload();
    const encrypted = await encryptBackup(source, "correct horse battery staple");
    await expect(decryptBackup(encrypted, "correct horse battery staple")).resolves.toEqual(source);
  });

  it("rejects a wrong passphrase and authenticated tampering", async () => {
    const encrypted = await encryptBackup(payload(), "correct horse battery staple");
    await expect(decryptBackup(encrypted, "different secure passphrase")).rejects.toThrow();
    const tampered = Buffer.from(encrypted);
    tampered[tampered.length - 1] = (tampered[tampered.length - 1] ?? 0) ^ 1;
    await expect(decryptBackup(tampered, "correct horse battery staple")).rejects.toThrow();
  });

  it("validates schema, references, and an active Super Administrator before replacement", async () => {
    await expect(validateBackupPayload(payload(), 1)).resolves.toBeDefined();
    const currentArgon2Order = payload();
    (currentArgon2Order.accounts[0] as { password_hash: string }).password_hash =
      "$argon2id$v=19$m=65536,p=1,t=3$DNfRdh53srGeRpHlv6ER+w$lPb5uew6fp2gn5vvgQ7hKXlHUJq8ch/xKoUZlE/ZPMc";
    await expect(validateBackupPayload(currentArgon2Order, 1)).resolves.toBeDefined();
    await expect(validateBackupPayload(payload(), 2)).rejects.toThrow("schema_mismatch");
    const invalid = payload();
    (invalid.accounts[0] as { status: string }).status = "disabled";
    await expect(validateBackupPayload(invalid, 1)).rejects.toThrow("missing_super_administrator");
  });

  it("rejects weakened credentials and write audiences broader than read audiences", async () => {
    const weakened = payload();
    (weakened.accounts[0] as { password_hash: string }).password_hash =
      "$argon2id$v=19$m=8192,t=1,p=1$c2FsdA$aGFzaA";
    await expect(validateBackupPayload(weakened, 1)).rejects.toThrow("invalid_backup");

    const widened = payload();
    widened.resourcePolicies = [
      {
        hide_employees_when_unread: false,
        read_audience: {
          allAuthenticated: false,
          relations: [],
          roleIds: [],
          userIds: [],
        },
        resource_id: "builtin:firstName",
        resource_kind: "employeeField",
        updated_at: "2026-09-29T00:00:00.000Z",
        write_audience: {
          allAuthenticated: true,
          relations: [],
          roleIds: [],
          userIds: [],
        },
      },
    ];
    await expect(validateBackupPayload(widened, 1)).rejects.toThrow("invalid_backup");
  });
});
