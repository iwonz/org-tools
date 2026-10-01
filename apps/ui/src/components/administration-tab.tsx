"use client";

import type {
  AccessAudience,
  Permission,
  PermissionGrant,
  PermissionScope,
  ResourcePolicyKind,
} from "@org-tools/types";
import { PERMISSION_SCOPES, PERMISSIONS } from "@org-tools/types/security";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useAuth } from "@/components/auth-context";
import { BackupRestorePanel } from "@/components/backup-restore-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";

type AdminAccount = {
  direct_grants: PermissionGrant[];
  email: string;
  employee_id: string | null;
  id: string;
  must_change_password: boolean;
  role_id: string;
  status: "active" | "disabled";
};

type AdminRole = {
  account_count: number;
  grants: PermissionGrant[];
  id: string;
  name: string;
  system_key: "employee" | "manager" | "superAdmin" | null;
};

type AdminPolicy = {
  hide_employees_when_unread: boolean;
  read_audience: AccessAudience;
  resource_id: string;
  resource_kind: ResourcePolicyKind;
  write_audience: AccessAudience;
};

type AdminResource = {
  defaultAudience: "authenticated" | "closed";
  id: string;
  kind: ResourcePolicyKind;
  label: string;
};

type AdminData = {
  accounts: AdminAccount[];
  audit: Array<{
    action: string;
    actor_account_id: string | null;
    correlation_id: string;
    created_at: string;
    id: string;
    result: string;
  }>;
  employees: Array<{ id: string; label: string; normalized_email: string | null }>;
  policies: AdminPolicy[];
  resources: AdminResource[];
  roles: AdminRole[];
};

const emptyAudience = (): AccessAudience => ({
  allAuthenticated: false,
  relations: [],
  roleIds: [],
  userIds: [],
});

const defaultAudience = (resource: AdminResource): AccessAudience =>
  resource.defaultAudience === "authenticated"
    ? { ...emptyAudience(), allAuthenticated: true }
    : emptyAudience();

function GrantEditor({
  disabled = false,
  grants,
  onChange,
}: {
  disabled?: boolean;
  grants: PermissionGrant[];
  onChange: (grants: PermissionGrant[]) => void;
}) {
  const t = useUiText();
  const add = () => {
    const permission = PERMISSIONS.find(
      (candidate) => !grants.some((grant) => grant.permission === candidate),
    );
    if (!permission) return;
    onChange([...grants, { permission, scope: PERMISSION_SCOPES[permission][0] ?? "all" }]);
  };
  return (
    <div className="grid gap-2">
      {grants.map((grant, index) => (
        <div
          className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.45fr)_auto] gap-2"
          key={grant.permission}
        >
          <Select
            disabled={disabled}
            onValueChange={(permission: Permission) => {
              const next = [...grants];
              next[index] = {
                permission,
                scope: PERMISSION_SCOPES[permission][0] ?? "all",
              };
              onChange(next);
            }}
            value={grant.permission}
          >
            <SelectTrigger aria-label={t("Permission")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERMISSIONS.map((permission) => (
                <SelectItem
                  disabled={grants.some(
                    (candidate, candidateIndex) =>
                      candidateIndex !== index && candidate.permission === permission,
                  )}
                  key={permission}
                  value={permission}
                >
                  {permission}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            disabled={disabled}
            onValueChange={(scope: PermissionScope) => {
              const next = [...grants];
              next[index] = { ...grant, scope };
              onChange(next);
            }}
            value={grant.scope}
          >
            <SelectTrigger aria-label={t("Scope")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERMISSION_SCOPES[grant.permission].map((scope) => (
                <SelectItem key={scope} value={scope}>
                  {scope}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            aria-label={t("Remove permission")}
            disabled={disabled}
            onClick={() => onChange(grants.filter((_, candidateIndex) => candidateIndex !== index))}
            size="icon"
            type="button"
            variant="ghost"
          >
            <HiOutlineXMark />
          </Button>
        </div>
      ))}
      <Button
        className="w-fit"
        disabled={disabled || grants.length === PERMISSIONS.length}
        onClick={add}
        size="sm"
        type="button"
        variant="secondary"
      >
        <HiOutlinePlus />
        {t("Add permission")}
      </Button>
    </div>
  );
}

function UserEditor({
  account,
  command,
  roles,
}: {
  account: AdminAccount;
  command: (value: object) => Promise<{ temporaryPassword?: string } | null>;
  roles: AdminRole[];
}) {
  const t = useUiText();
  const [editing, setEditing] = useState(false);
  const [roleId, setRoleId] = useState(account.role_id);
  const [grants, setGrants] = useState(account.direct_grants);
  const [newEmail, setNewEmail] = useState(account.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const selectedRole = roles.find((role) => role.id === roleId);
  return (
    <article className="grid gap-3 border-t border-border p-4 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{account.email}</p>
          <p className="text-xs text-muted-foreground">
            {roles.find((role) => role.id === account.role_id)?.name} ·{" "}
            {t(account.status === "active" ? "Active" : "Disabled")}
            {account.must_change_password ? ` · ${t("Password change required")}` : ""}
          </p>
        </div>
        <Button
          onClick={() => setEditing((value) => !value)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <HiOutlinePencilSquare />
          {t("Edit")}
        </Button>
      </div>
      {editing && (
        <div className="grid gap-4 rounded-md bg-muted/40 p-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("Role")}</Label>
              <Select onValueChange={setRoleId} value={roleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("Effective access")}</Label>
              <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                {selectedRole?.grants.length ?? 0} + {grants.length}
              </p>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("Additional permissions")}</Label>
            <GrantEditor grants={grants} onChange={setGrants} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                void command({
                  accountId: account.id,
                  directGrants: grants,
                  roleId,
                  type: "user.access.update",
                }).then(() => setEditing(false))
              }
              size="sm"
              type="button"
            >
              {t("Save")}
            </Button>
            <Button
              onClick={() =>
                void command({ accountId: account.id, type: "user.password.reset" }).then(
                  (result) => setTemporaryPassword(result?.temporaryPassword ?? null),
                )
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              {t("Reset password")}
            </Button>
            <Button
              onClick={() => void command({ accountId: account.id, type: "user.sessions.revoke" })}
              size="sm"
              type="button"
              variant="secondary"
            >
              {t("Revoke sessions")}
            </Button>
            <Button
              onClick={() =>
                void command({
                  accountId: account.id,
                  active: account.status !== "active",
                  type: "user.active.update",
                })
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              {t(account.status === "active" ? "Deactivate" : "Activate")}
            </Button>
          </div>
          {account.employee_id && (
            <div className="grid gap-2 border-t border-border pt-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor={`email-${account.id}`}>{t("Linked account email")}</Label>
                <Input
                  id={`email-${account.id}`}
                  onChange={(event) => setNewEmail(event.target.value)}
                  value={newEmail}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`password-${account.id}`}>{t("Administrator password")}</Label>
                <Input
                  id={`password-${account.id}`}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  value={currentPassword}
                />
              </div>
              <Button
                disabled={currentPassword.length < 15}
                onClick={() =>
                  void command({
                    accountId: account.id,
                    currentPassword,
                    email: newEmail,
                    type: "user.email.update",
                  }).then(() => setCurrentPassword(""))
                }
                size="sm"
                type="button"
              >
                {t("Update email")}
              </Button>
            </div>
          )}
          {temporaryPassword && (
            <div className="rounded-md border border-border bg-background p-3 text-sm">
              <strong>{t("Temporary password")}:</strong> <code>{temporaryPassword}</code>
              <p className="mt-1 text-muted-foreground">{t("This password is shown only once.")}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function RoleEditor({
  command,
  role,
}: {
  command: (value: object) => Promise<{ temporaryPassword?: string } | null>;
  role?: AdminRole;
}) {
  const t = useUiText();
  const [editing, setEditing] = useState(!role);
  const [name, setName] = useState(role?.name ?? "");
  const [grants, setGrants] = useState(role?.grants ?? []);
  const immutable = role?.system_key === "superAdmin";
  if (!editing && role) {
    return (
      <article className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{role.name}</h2>
            <p className="text-sm text-muted-foreground">
              {role.account_count} · {role.grants.length}
            </p>
          </div>
          {!immutable && (
            <Button onClick={() => setEditing(true)} size="sm" type="button" variant="secondary">
              <HiOutlinePencilSquare />
              {t("Edit")}
            </Button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {role.grants.map((grant) => (
            <code
              className="rounded bg-muted px-2 py-1 text-xs"
              key={`${grant.permission}:${grant.scope}`}
            >
              {grant.permission} · {grant.scope}
            </code>
          ))}
        </div>
      </article>
    );
  }
  return (
    <article className="grid gap-3 rounded-lg border border-border p-4">
      <div className="grid gap-1.5">
        <Label>{t("Role name")}</Label>
        <Input
          disabled={immutable}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </div>
      <GrantEditor disabled={immutable} grants={grants} onChange={setGrants} />
      {!immutable && (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!name.trim()}
            onClick={() =>
              void command(
                role
                  ? { grants, name, roleId: role.id, type: "role.update" }
                  : { grants, name, type: "role.create" },
              ).then(() => role && setEditing(false))
            }
            size="sm"
            type="button"
          >
            {t("Save")}
          </Button>
          {role && (
            <Button
              onClick={() => {
                setName(role.name);
                setGrants(role.grants);
                setEditing(false);
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {t("Cancel")}
            </Button>
          )}
          {role && (
            <Button
              disabled={role.account_count !== 0 || role.grants.length !== 0}
              onClick={() => void command({ roleId: role.id, type: "role.delete" })}
              size="sm"
              type="button"
              variant="destructive"
            >
              <HiOutlineTrash />
              {t("Delete")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

function AudienceEditor({
  audience,
  accounts,
  label,
  onChange,
  roles,
}: {
  accounts: AdminAccount[];
  audience: AccessAudience;
  label: string;
  onChange: (audience: AccessAudience) => void;
  roles: AdminRole[];
}) {
  const t = useUiText();
  const identifierPrefix = label.replaceAll(/[^A-Za-z0-9]/gu, "-").toLocaleLowerCase();
  const toggle = <T extends string>(values: T[], value: T): T[] =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  return (
    <fieldset className="grid gap-2 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <label className="flex items-center gap-2 text-sm" htmlFor={`${identifierPrefix}-all`}>
        <Checkbox
          checked={audience.allAuthenticated}
          id={`${identifierPrefix}-all`}
          onCheckedChange={(checked) =>
            onChange({ ...audience, allAuthenticated: checked === true })
          }
        />
        {t("All authenticated users")}
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["self", "managedDirect", "managedSubtree"] as const).map((relation) => (
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor={`${identifierPrefix}-${relation}`}
            key={relation}
          >
            <Checkbox
              checked={audience.relations.includes(relation)}
              id={`${identifierPrefix}-${relation}`}
              onCheckedChange={() =>
                onChange({ ...audience, relations: toggle(audience.relations, relation) })
              }
            />
            {relation}
          </label>
        ))}
        {roles
          .filter((role) => role.system_key !== "superAdmin")
          .map((role) => (
            <label
              className="flex items-center gap-2 text-sm"
              htmlFor={`${identifierPrefix}-role-${role.id}`}
              key={role.id}
            >
              <Checkbox
                checked={audience.roleIds.includes(role.id)}
                id={`${identifierPrefix}-role-${role.id}`}
                onCheckedChange={() =>
                  onChange({ ...audience, roleIds: toggle(audience.roleIds, role.id) })
                }
              />
              {role.name}
            </label>
          ))}
        {accounts.map((account) => (
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor={`${identifierPrefix}-account-${account.id}`}
            key={account.id}
          >
            <Checkbox
              checked={audience.userIds.includes(account.id)}
              id={`${identifierPrefix}-account-${account.id}`}
              onCheckedChange={() =>
                onChange({ ...audience, userIds: toggle(audience.userIds, account.id) })
              }
            />
            {account.email}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AccessEditor({
  data,
  command,
}: {
  command: (value: object) => Promise<{ temporaryPassword?: string } | null>;
  data: AdminData;
}) {
  const t = useUiText();
  const keyForResource = (candidate: AdminResource) => `${candidate.kind}:${candidate.id}`;
  const [resourceKey, setResourceKey] = useState(
    data.resources[0] ? keyForResource(data.resources[0]) : "",
  );
  const resource =
    data.resources.find((candidate) => keyForResource(candidate) === resourceKey) ??
    data.resources[0];
  const stored = resource
    ? data.policies.find(
        (policy) => policy.resource_id === resource.id && policy.resource_kind === resource.kind,
      )
    : undefined;
  const [read, setRead] = useState<AccessAudience>(
    resource ? (stored?.read_audience ?? defaultAudience(resource)) : emptyAudience(),
  );
  const [write, setWrite] = useState<AccessAudience>(
    resource ? (stored?.write_audience ?? defaultAudience(resource)) : emptyAudience(),
  );
  const [restrictive, setRestrictive] = useState(stored?.hide_employees_when_unread ?? false);
  useEffect(() => {
    if (!resource) return;
    const policy = data.policies.find(
      (candidate) =>
        candidate.resource_id === resource.id && candidate.resource_kind === resource.kind,
    );
    setRead(policy?.read_audience ?? defaultAudience(resource));
    setWrite(policy?.write_audience ?? defaultAudience(resource));
    setRestrictive(policy?.hide_employees_when_unread ?? false);
  }, [data.policies, resource]);
  if (!resource) return <p className="text-sm text-muted-foreground">{t("No resources")}</p>;
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label>{t("Resource")}</Label>
        <Select onValueChange={setResourceKey} value={keyForResource(resource)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.resources.map((candidate) => (
              <SelectItem key={keyForResource(candidate)} value={keyForResource(candidate)}>
                {candidate.kind} · {candidate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <AudienceEditor
          accounts={data.accounts}
          audience={read}
          label={t("Read audience")}
          onChange={setRead}
          roles={data.roles}
        />
        <AudienceEditor
          accounts={data.accounts}
          audience={write}
          label={t("Write audience")}
          onChange={setWrite}
          roles={data.roles}
        />
      </div>
      {resource.kind === "tag" && (
        <label className="flex items-center gap-2 text-sm" htmlFor="admin-restrictive-tag">
          <Checkbox
            checked={restrictive}
            id="admin-restrictive-tag"
            onCheckedChange={(checked) => setRestrictive(checked === true)}
          />
          {t("Hide Employees with unreadable Tag")}
        </label>
      )}
      <Button
        className="w-fit"
        onClick={() =>
          void command({
            hideEmployeesWhenUnread: restrictive,
            read,
            resourceId: resource.id,
            resourceKind: resource.kind,
            type: "policy.update",
            write,
          })
        }
        type="button"
      >
        {t("Save")}
      </Button>
    </div>
  );
}

export function AdministrationTab() {
  const auth = useAuth();
  const t = useUiText();
  const format = useAppFormatter();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState(false);
  const [commandError, setCommandError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("none");
  const [roleId, setRoleId] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [auditQuery, setAuditQuery] = useState("");
  const [auditPage, setAuditPage] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const value = (await response.json()) as AdminData;
      setData(value);
      setRoleId(
        (current) =>
          current ||
          value.roles.find((role) => role.system_key === "employee")?.id ||
          value.roles[0]?.id ||
          "",
      );
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const command = useCallback(
    async (value: object) => {
      if (!auth.csrfToken) return null;
      setBusy(true);
      setCommandError(false);
      try {
        const response = await fetch("/api/admin", {
          body: JSON.stringify(value),
          headers: {
            "Content-Type": "application/json",
            "X-Org-Tools-CSRF": auth.csrfToken,
          },
          method: "POST",
        });
        if (!response.ok) throw new Error();
        const result = (await response.json()) as { temporaryPassword?: string };
        await load();
        return result;
      } catch {
        setCommandError(true);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [auth.csrfToken, load],
  );

  const filteredAudit = useMemo(() => {
    if (!data) return [];
    const query = auditQuery.trim().toLocaleLowerCase();
    return query
      ? data.audit.filter((event) =>
          `${event.action} ${event.result} ${event.correlation_id}`
            .toLocaleLowerCase()
            .includes(query),
        )
      : data.audit;
  }, [auditQuery, data]);
  const pageSize = 50;
  const auditEvents = filteredAudit.slice(auditPage * pageSize, (auditPage + 1) * pageSize);
  const selectedRole = data?.roles.find((role) => role.id === roleId);
  const linkedEmployeeIds = new Set(
    data?.accounts.flatMap((account) => (account.employee_id ? [account.employee_id] : [])) ?? [],
  );
  const availableEmployees =
    data?.employees.filter(
      (employee) => employee.normalized_email && !linkedEmployeeIds.has(employee.id),
    ) ?? [];

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center" role={error ? "alert" : "status"}>
        {error ? (
          <Button onClick={() => void load()} variant="secondary">
            <HiOutlineArrowPath />
            {t("Retry")}
          </Button>
        ) : (
          t("Loading")
        )}
      </div>
    );
  }

  return (
    <div
      aria-busy={busy}
      className="min-h-0 flex-1 overflow-auto p-5"
      data-demo-id="administration-tab"
    >
      {commandError && (
        <div
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {t("The action could not be completed.")}
        </div>
      )}
      <Tabs defaultValue="users">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="users">{t("Users")}</TabsTrigger>
          <TabsTrigger value="roles">{t("Roles")}</TabsTrigger>
          <TabsTrigger value="access">{t("Access")}</TabsTrigger>
          <TabsTrigger value="audit">{t("Audit")}</TabsTrigger>
          <TabsTrigger value="backup">{t("Backup and Restore")}</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-5 grid gap-5" value="users">
          <section className="grid gap-4 rounded-lg border border-border p-4">
            <h2 className="font-semibold">{t("Create user")}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="admin-email">{t("Email")}</Label>
                <Input
                  id="admin-email"
                  onChange={(event) => setEmail(event.target.value)}
                  value={email}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("Employee")}</Label>
                <Select
                  onValueChange={(value) => {
                    setEmployeeId(value);
                    const employee = availableEmployees.find((candidate) => candidate.id === value);
                    if (employee?.normalized_email) setEmail(employee.normalized_email);
                  }}
                  value={employeeId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("No Employee")}</SelectItem>
                    {availableEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.label} · {employee.normalized_email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("Role")}</Label>
                <Select onValueChange={setRoleId} value={roleId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-fit"
              disabled={
                busy ||
                !email ||
                !roleId ||
                (selectedRole?.system_key !== "superAdmin" && employeeId === "none")
              }
              onClick={() =>
                void command({
                  employeeId: employeeId === "none" ? null : employeeId,
                  email,
                  roleId,
                  type: "user.create",
                }).then((result) => setTemporaryPassword(result?.temporaryPassword ?? null))
              }
            >
              <HiOutlinePlus />
              {t("Create user")}
            </Button>
            {temporaryPassword && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <strong>{t("Temporary password")}:</strong> <code>{temporaryPassword}</code>
                <p className="mt-1 text-muted-foreground">
                  {t("This password is shown only once.")}
                </p>
              </div>
            )}
          </section>
          <section className="overflow-hidden rounded-lg border border-border">
            {data.accounts.map((account) => (
              <UserEditor account={account} command={command} key={account.id} roles={data.roles} />
            ))}
          </section>
        </TabsContent>
        <TabsContent className="mt-5 grid gap-4" value="roles">
          <RoleEditor command={command} />
          {data.roles.map((role) => (
            <RoleEditor command={command} key={role.id} role={role} />
          ))}
        </TabsContent>
        <TabsContent className="mt-5 rounded-lg border border-border p-4" value="access">
          <AccessEditor command={command} data={data} />
        </TabsContent>
        <TabsContent className="mt-5 grid gap-3" value="audit">
          <div className="relative max-w-md">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("Search audit log")}
              className="ps-9"
              onChange={(event) => {
                setAuditQuery(event.target.value);
                setAuditPage(0);
              }}
              placeholder={t("Search audit log")}
              value={auditQuery}
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="p-3">{t("Time")}</th>
                  <th className="p-3">{t("Action")}</th>
                  <th className="p-3">{t("Result")}</th>
                  <th className="p-3">{t("Correlation ID")}</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event) => (
                  <tr className="border-t border-border" key={event.id}>
                    <td className="whitespace-nowrap p-3">
                      {format.dateTime(new Date(event.created_at), {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
                    </td>
                    <td className="p-3">{event.action}</td>
                    <td className="p-3">{event.result}</td>
                    <td className="p-3 font-mono text-xs">{event.correlation_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              disabled={auditPage === 0}
              onClick={() => setAuditPage((value) => value - 1)}
              size="sm"
              variant="secondary"
            >
              {t("Previous")}
            </Button>
            <Button
              disabled={(auditPage + 1) * pageSize >= filteredAudit.length}
              onClick={() => setAuditPage((value) => value + 1)}
              size="sm"
              variant="secondary"
            >
              {t("Next")}
            </Button>
          </div>
        </TabsContent>
        <TabsContent className="mt-5" value="backup">
          <BackupRestorePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
