UPDATE organization_documents
SET bootstrap_ui_json = jsonb_set(
  bootstrap_ui_json,
  '{editorImageExport}',
  '{"excludedTagIds":[],"hideStaffingSlots":false}'::jsonb,
  TRUE
)
WHERE bootstrap_ui_json IS NOT NULL;

UPDATE account_ui_states
SET ui_json = jsonb_set(
  ui_json,
  '{editorImageExport}',
  '{"excludedTagIds":[],"hideStaffingSlots":false}'::jsonb,
  TRUE
);
