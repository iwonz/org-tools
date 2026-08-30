export const AUTOSAVE_STORAGE_KEY = "org-tools-autosave-enabled";
export const AUTOSAVE_DEBOUNCE_MS = 1_000;

export const readAutosavePreference = (storage: Pick<Storage, "getItem">): boolean => {
  try {
    return storage.getItem(AUTOSAVE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const persistAutosavePreference = (
  enabled: boolean,
  storage: Pick<Storage, "setItem">,
): boolean => {
  try {
    storage.setItem(AUTOSAVE_STORAGE_KEY, enabled ? "true" : "false");
    return true;
  } catch {
    return false;
  }
};
