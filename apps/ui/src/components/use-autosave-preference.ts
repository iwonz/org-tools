"use client";

import { useCallback, useEffect, useState } from "react";

import { persistAutosavePreference, readAutosavePreference } from "@/lib/autosave-preference";

export const useAutosavePreference = () => {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    setEnabledState(readAutosavePreference(window.localStorage));
  }, []);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    persistAutosavePreference(nextEnabled, window.localStorage);
    setEnabledState(nextEnabled);
  }, []);

  return [enabled, setEnabled] as const;
};
