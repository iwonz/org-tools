CREATE OR REPLACE FUNCTION permission_scope_is_valid(permission_name, permission_scope)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
RETURN CASE
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
