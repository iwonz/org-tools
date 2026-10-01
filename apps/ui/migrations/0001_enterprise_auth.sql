CREATE TABLE organization_documents (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  organization_json JSONB NOT NULL,
  bootstrap_ui_json JSONB,
  revision BIGINT NOT NULL CHECK (revision >= 1),
  security_revision BIGINT NOT NULL CHECK (security_revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE DOMAIN permission_name AS TEXT CHECK (VALUE IN (
  'employee.read', 'employee.create', 'employee.update', 'employee.delete',
  'employee.assignments.update', 'employee.model.update',
  'tag.create', 'tag.update', 'tag.delete', 'tag.assign',
  'unit.read', 'unit.create', 'unit.update', 'unit.delete', 'unit.reparent', 'unit.boss.assign',
  'editor.system.read', 'editor.system.layout.update',
  'view.read', 'view.create', 'view.update', 'view.delete',
  'staffingSlot.create', 'staffingSlot.update', 'staffingSlot.delete',
  'calendar.read', 'dataDownload.create', 'editorImageExport.create',
  'backup.create', 'backup.restore'
));

CREATE DOMAIN permission_scope AS TEXT CHECK (VALUE IN ('self', 'managedDirect', 'managedSubtree', 'all'));

CREATE FUNCTION permission_scope_is_valid(permission_name, permission_scope)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
RETURN CASE
  WHEN $1 IN (
    'employee.create', 'employee.delete', 'employee.model.update',
    'tag.create', 'tag.update', 'tag.delete', 'view.create',
    'backup.create', 'backup.restore'
  ) THEN $2 = 'all'
  WHEN $1 IN (
    'unit.create', 'unit.update', 'unit.delete', 'unit.reparent', 'unit.boss.assign',
    'staffingSlot.create', 'staffingSlot.update', 'staffingSlot.delete'
  ) THEN $2 IN ('managedDirect', 'managedSubtree', 'all')
  ELSE TRUE
END;

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 120),
  system_key TEXT UNIQUE CHECK (system_key IS NULL OR system_key IN ('superAdmin', 'employee', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE role_grants (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission permission_name NOT NULL,
  scope permission_scope NOT NULL,
  PRIMARY KEY (role_id, permission, scope),
  CHECK (permission_scope_is_valid(permission, scope))
);

CREATE TABLE employee_identities (
  employee_id UUID PRIMARY KEY,
  normalized_email TEXT UNIQUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL UNIQUE,
  employee_id UUID UNIQUE REFERENCES employee_identities(employee_id) ON DELETE RESTRICT,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CHECK (char_length(email) BETWEEN 3 AND 320),
  CHECK (password_hash LIKE '$argon2id$%')
);

CREATE TABLE account_grants (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  permission permission_name NOT NULL,
  scope permission_scope NOT NULL,
  PRIMARY KEY (account_id, permission, scope),
  CHECK (permission_scope_is_valid(permission, scope))
);

CREATE TABLE resource_policies (
  resource_kind TEXT NOT NULL CHECK (resource_kind IN ('employeeField', 'tag', 'unit', 'staffingSlot', 'view')),
  resource_id TEXT NOT NULL,
  read_audience JSONB NOT NULL,
  write_audience JSONB NOT NULL,
  hide_employees_when_unread BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (resource_kind, resource_id)
);

CREATE TABLE account_ui_states (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  ui_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash BYTEA NOT NULL UNIQUE,
  csrf_hash BYTEA NOT NULL,
  previous_csrf_hash BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  idle_expires_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CHECK (idle_expires_at <= absolute_expires_at),
  CHECK (octet_length(token_hash) = 32),
  CHECK (octet_length(csrf_hash) = 32),
  CHECK (previous_csrf_hash IS NULL OR octet_length(previous_csrf_hash) = 32)
);

CREATE INDEX sessions_account_active_idx ON sessions (account_id, absolute_expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE login_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  failures INTEGER NOT NULL CHECK (failures >= 0),
  blocked_until TIMESTAMPTZ
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  actor_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  result TEXT NOT NULL CHECK (result IN ('allowed', 'denied', 'failed', 'succeeded')),
  correlation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CHECK (jsonb_typeof(target_ids) = 'array')
);

CREATE INDEX audit_events_created_idx ON audit_events (created_at DESC, id DESC);
CREATE INDEX audit_events_actor_idx ON audit_events (actor_account_id, created_at DESC);
CREATE INDEX audit_events_action_idx ON audit_events (action, created_at DESC);

CREATE TABLE server_events (
  id BIGSERIAL PRIMARY KEY,
  organization_revision BIGINT NOT NULL,
  security_revision BIGINT NOT NULL,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('organization', 'security', 'ui', 'restore')),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX server_events_created_idx ON server_events (created_at DESC);

INSERT INTO roles (id, name, system_key) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Super Administrator', 'superAdmin'),
  ('00000000-0000-4000-8000-000000000002', 'Employee', 'employee'),
  ('00000000-0000-4000-8000-000000000003', 'Manager', 'manager');

INSERT INTO role_grants (role_id, permission, scope) VALUES
  ('00000000-0000-4000-8000-000000000002', 'employee.read', 'all'),
  ('00000000-0000-4000-8000-000000000002', 'unit.read', 'all'),
  ('00000000-0000-4000-8000-000000000002', 'editor.system.read', 'all'),
  ('00000000-0000-4000-8000-000000000002', 'view.read', 'all'),
  ('00000000-0000-4000-8000-000000000002', 'calendar.read', 'all'),
  ('00000000-0000-4000-8000-000000000003', 'employee.read', 'all'),
  ('00000000-0000-4000-8000-000000000003', 'unit.read', 'all'),
  ('00000000-0000-4000-8000-000000000003', 'editor.system.read', 'all'),
  ('00000000-0000-4000-8000-000000000003', 'view.read', 'all'),
  ('00000000-0000-4000-8000-000000000003', 'calendar.read', 'all'),
  ('00000000-0000-4000-8000-000000000003', 'employee.update', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'employee.assignments.update', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'tag.assign', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'unit.create', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'unit.update', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'unit.delete', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'unit.reparent', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'unit.boss.assign', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'staffingSlot.create', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'staffingSlot.update', 'managedSubtree'),
  ('00000000-0000-4000-8000-000000000003', 'staffingSlot.delete', 'managedSubtree');
