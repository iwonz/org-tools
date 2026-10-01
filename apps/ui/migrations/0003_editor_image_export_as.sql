ALTER DOMAIN permission_name DROP CONSTRAINT permission_name_check;

ALTER DOMAIN permission_name ADD CONSTRAINT permission_name_check CHECK (VALUE IN (
  'employee.read', 'employee.create', 'employee.update', 'employee.delete',
  'employee.assignments.update', 'employee.model.update',
  'tag.create', 'tag.update', 'tag.delete', 'tag.assign',
  'unit.read', 'unit.create', 'unit.update', 'unit.delete', 'unit.reparent', 'unit.boss.assign',
  'editor.system.read', 'editor.system.layout.update',
  'view.read', 'view.create', 'view.update', 'view.delete',
  'staffingSlot.create', 'staffingSlot.update', 'staffingSlot.delete',
  'calendar.read', 'dataDownload.create', 'editorImageExport.create',
  'editorImageExport.exportAs', 'backup.create', 'backup.restore'
));

CREATE OR REPLACE FUNCTION permission_scope_is_valid(permission_name, permission_scope)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
RETURN CASE
  WHEN $1 = 'editorImageExport.exportAs' THEN FALSE
  WHEN $1 IN (
    'employee.create', 'employee.delete', 'employee.model.update',
    'tag.create', 'tag.update', 'tag.delete',
    'editor.system.read', 'view.read', 'view.create', 'view.update', 'view.delete',
    'calendar.read', 'dataDownload.create', 'editorImageExport.create',
    'backup.create', 'backup.restore'
  ) THEN $2 = 'all'
  WHEN $1 IN (
    'unit.create', 'unit.update', 'unit.delete', 'unit.reparent', 'unit.boss.assign',
    'staffingSlot.create', 'staffingSlot.update', 'staffingSlot.delete'
  ) THEN $2 IN ('managedDirect', 'managedSubtree', 'all')
  ELSE TRUE
END;
