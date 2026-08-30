"use client";

import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineDocumentText } from "react-icons/hi2";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAutosavePreference } from "@/components/use-autosave-preference";
import {
  type BrowserWorkspacePersistence,
  WorkspacePersistenceContext,
  type WorkspaceSaveStatus,
} from "@/components/workspace-persistence-context";
import { useUiText } from "@/i18n/use-ui-text";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/autosave-preference";
import {
  clearStoredBrowserFileHandle,
  readStoredBrowserFileHandle,
  storeBrowserFileHandle,
} from "@/lib/browser-file-handle-store";
import {
  type BrowserFileFingerprint,
  BrowserWorkspaceFileConflictError,
  type BrowserWorkspaceFileHandle,
  browserFileFingerprint,
  downloadBrowserWorkspace,
  isPickerCancellation,
  parseBrowserWorkspaceFile,
  readBrowserWorkspaceHandle,
  showBrowserWorkspaceOpenPicker,
  showBrowserWorkspaceSavePicker,
  supportsBrowserFileAccess,
  writeBrowserWorkspaceHandle,
} from "@/lib/browser-workspace-file";
import { runSingleFlightSave } from "@/lib/single-flight-save";
import { useOrgStore } from "@/stores/org-store-context";

type PendingWorkspace =
  | { kind: "new" }
  | {
      fingerprint: BrowserFileFingerprint;
      handle: BrowserWorkspaceFileHandle | null;
      kind: "open";
      name: string;
      state: Awaited<ReturnType<typeof parseBrowserWorkspaceFile>>;
    };

type StartupRecovery =
  | { handle: BrowserWorkspaceFileHandle; kind: "reconnect" }
  | { handle: BrowserWorkspaceFileHandle | null; kind: "unavailable"; message: string };

function BrowserWorkspaceLoading() {
  const t = useUiText();
  return (
    <main className="flex h-dvh items-center justify-center bg-shell text-foreground">
      <div
        className="flex items-center gap-3 text-sm font-medium text-muted-foreground"
        role="status"
      >
        <HiOutlineDocumentText className="size-5 animate-pulse" />
        {t("Reading workspace…")}
      </div>
    </main>
  );
}

function BrowserWorkspaceRecovery({
  onReconnect,
  onStartBlank,
  recovery,
}: {
  onReconnect: () => void;
  onStartBlank: () => void;
  recovery: StartupRecovery;
}) {
  const t = useUiText();
  return (
    <main className="flex h-dvh items-center justify-center bg-shell p-6 text-foreground">
      <section className="w-full max-w-md rounded-xl bg-card p-6">
        <HiOutlineDocumentText className="mb-5 size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">
          {t(
            recovery.kind === "reconnect"
              ? "Reconnect workspace file"
              : "Workspace file unavailable",
          )}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {recovery.kind === "reconnect"
            ? t("Allow access to continue with {name}.", { name: recovery.handle.name })
            : recovery.message}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {recovery.handle && (
            <Button onClick={onReconnect} type="button">
              {t("Reconnect file")}
            </Button>
          )}
          <Button onClick={onStartBlank} type="button" variant="secondary">
            {t("Start blank")}
          </Button>
        </div>
      </section>
    </main>
  );
}

export const BrowserWorkspaceController = observer(({ children }: { children: ReactNode }) => {
  const store = useOrgStore();
  const { setTheme } = useTheme();
  const t = useUiText();
  const [autosavePreference, persistAutosave] = useAutosavePreference();
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState<StartupRecovery | null>(null);
  const [fileAccessSupported, setFileAccessSupported] = useState(false);
  const [handle, setHandle] = useState<BrowserWorkspaceFileHandle | null>(null);
  const [fingerprint, setFingerprint] = useState<BrowserFileFingerprint | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [savedOrganizationSequence, setSavedOrganizationSequence] = useState(0);
  const [saveStatus, setSaveStatus] = useState<WorkspaceSaveStatus>("idle");
  const [pendingWorkspace, setPendingWorkspace] = useState<PendingWorkspace | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const savePromise = useRef<Promise<boolean> | null>(null);
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;
  const autosavePaused = saveStatus === "failed" || conflictOpen;
  const dirty = ready && store.organizationChangeSequence !== savedOrganizationSequence;
  const autosaveEnabled = fileAccessSupported && autosavePreference;

  const installWorkspace = useCallback(
    ({
      fingerprint: nextFingerprint,
      handle: nextHandle,
      name,
      state,
    }: Exclude<PendingWorkspace, { kind: "new" }>) => {
      store.loadOrgToolsState(state, name, null);
      store.resetProjectChangeTracking();
      setSavedOrganizationSequence(store.organizationChangeSequence);
      setThemeRef.current(state.ui.theme);
      setHandle(nextHandle);
      setFingerprint(nextFingerprint);
      setFileName(name);
      setSaveStatus("saved");
      setErrorMessage(null);
      if (nextHandle) void storeBrowserFileHandle(nextHandle);
    },
    [store],
  );

  const startBlank = useCallback(() => {
    store.createBlankWorkspace();
    store.resetProjectChangeTracking();
    setSavedOrganizationSequence(store.organizationChangeSequence);
    setHandle(null);
    setFingerprint(null);
    setFileName(null);
    setRecovery(null);
    setErrorMessage(null);
    setSaveStatus("idle");
    setReady(true);
    void clearStoredBrowserFileHandle();
  }, [store]);

  const loadHandle = useCallback(
    async (nextHandle: BrowserWorkspaceFileHandle) => {
      const opened = await readBrowserWorkspaceHandle(nextHandle);
      installWorkspace({
        fingerprint: opened.fingerprint,
        handle: nextHandle,
        kind: "open",
        name: nextHandle.name,
        state: opened.state,
      });
      setRecovery(null);
      setReady(true);
    },
    [installWorkspace],
  );

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const supported = supportsBrowserFileAccess();
      setFileAccessSupported(supported);
      if (!supported) {
        if (!active) return;
        store.resetProjectChangeTracking();
        setSavedOrganizationSequence(store.organizationChangeSequence);
        setReady(true);
        return;
      }
      const storedHandle = await readStoredBrowserFileHandle();
      if (!active) return;
      if (!storedHandle) {
        store.resetProjectChangeTracking();
        setSavedOrganizationSequence(store.organizationChangeSequence);
        setReady(true);
        return;
      }
      try {
        const permission = storedHandle.queryPermission
          ? await storedHandle.queryPermission({ mode: "readwrite" })
          : "prompt";
        if (!active) return;
        if (permission === "granted") await loadHandle(storedHandle);
        else setRecovery({ handle: storedHandle, kind: "reconnect" });
      } catch (error) {
        if (!active) return;
        setRecovery({
          handle: storedHandle,
          kind: "unavailable",
          message:
            error instanceof Error ? error.message : t("The workspace file could not be opened."),
        });
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [loadHandle, store, t]);

  const reconnect = useCallback(async () => {
    if (!recovery?.handle) return;
    try {
      const permission = recovery.handle.requestPermission
        ? await recovery.handle.requestPermission({ mode: "readwrite" })
        : "denied";
      if (permission !== "granted") return;
      await loadHandle(recovery.handle);
    } catch (error) {
      if (isPickerCancellation(error)) return;
      setRecovery({
        handle: recovery.handle,
        kind: "unavailable",
        message:
          error instanceof Error ? error.message : t("The workspace file could not be opened."),
      });
    }
  }, [loadHandle, recovery, t]);

  const writeHandle = useCallback(
    async (targetHandle: BrowserWorkspaceFileHandle, force = false) => {
      const sequence = store.organizationChangeSequence;
      const state = store.createOrgToolsState();
      const nextFingerprint = await writeBrowserWorkspaceHandle({
        expectedFingerprint: targetHandle === handle ? fingerprint : null,
        force,
        handle: targetHandle,
        state,
      });
      setHandle(targetHandle);
      setFingerprint(nextFingerprint);
      setFileName(targetHandle.name);
      setSavedOrganizationSequence(sequence);
      setSaveStatus("saved");
      setErrorMessage(null);
      await storeBrowserFileHandle(targetHandle);
      return true;
    },
    [fingerprint, handle, store],
  );

  const saveAs = useCallback(async (): Promise<boolean> => {
    if (!fileAccessSupported) {
      const sequence = store.organizationChangeSequence;
      downloadBrowserWorkspace(store.createOrgToolsState());
      setSavedOrganizationSequence(sequence);
      setSaveStatus("saved");
      return true;
    }
    try {
      const selectedHandle = await showBrowserWorkspaceSavePicker();
      setSaveStatus("saving");
      return await writeHandle(selectedHandle, true);
    } catch (error) {
      if (isPickerCancellation(error)) {
        setSaveStatus(dirty ? "idle" : "saved");
        return false;
      }
      setErrorMessage(
        error instanceof Error ? error.message : t("The workspace file could not be saved."),
      );
      setSaveStatus("failed");
      return false;
    }
  }, [dirty, fileAccessSupported, store, t, writeHandle]);

  const save = useCallback(async (): Promise<boolean> => {
    return runSingleFlightSave(savePromise, async () => {
      if (!fileAccessSupported || !handle) return saveAs();
      setSaveStatus("saving");
      try {
        return await writeHandle(handle);
      } catch (error) {
        if (error instanceof BrowserWorkspaceFileConflictError) {
          setConflictOpen(true);
        } else {
          setErrorMessage(
            error instanceof Error ? error.message : t("The workspace file could not be saved."),
          );
        }
        setSaveStatus("failed");
        return false;
      }
    });
  }, [fileAccessSupported, handle, saveAs, t, writeHandle]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the sequence restarts the trailing debounce for every organization mutation.
  useEffect(() => {
    if (!autosaveEnabled || !dirty || autosavePaused || saveStatus === "saving" || !handle) return;
    const timeout = window.setTimeout(() => void save(), AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [
    autosaveEnabled,
    autosavePaused,
    dirty,
    handle,
    save,
    saveStatus,
    store.organizationChangeSequence,
  ]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("en-US") === "s") {
        event.preventDefault();
        if (saveStatus !== "saving") void save();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save, saveStatus]);

  const requestPendingWorkspace = useCallback(
    (next: PendingWorkspace) => {
      if (dirty) setPendingWorkspace(next);
      else if (next.kind === "new") startBlank();
      else installWorkspace(next);
    },
    [dirty, installWorkspace, startBlank],
  );

  const openHandle = useCallback(
    async (nextHandle: BrowserWorkspaceFileHandle | null, file?: File) => {
      try {
        const sourceFile = file ?? (await nextHandle?.getFile());
        if (!sourceFile) return;
        const state = await parseBrowserWorkspaceFile(sourceFile);
        requestPendingWorkspace({
          fingerprint: browserFileFingerprint(sourceFile),
          handle: nextHandle,
          kind: "open",
          name: sourceFile.name,
          state,
        });
      } catch (error) {
        if (isPickerCancellation(error)) return;
        setErrorMessage(
          error instanceof Error ? error.message : t("The workspace file could not be opened."),
        );
      }
    },
    [requestPendingWorkspace, t],
  );

  const context = useMemo<BrowserWorkspacePersistence>(
    () => ({
      autosaveEnabled,
      autosaveSupported: fileAccessSupported,
      dirty,
      displayName: fileName ?? t("Untitled workspace"),
      fileAccessSupported,
      mode: "browser",
      newWorkspace: () => requestPendingWorkspace({ kind: "new" }),
      openFallbackFile: (file) => openHandle(null, file),
      openWorkspace: async () => {
        if (!fileAccessSupported) return;
        try {
          await openHandle(await showBrowserWorkspaceOpenPicker());
        } catch (error) {
          if (!isPickerCancellation(error)) {
            setErrorMessage(
              error instanceof Error ? error.message : t("The workspace file could not be opened."),
            );
          }
        }
      },
      save,
      saveAs,
      saveStatus,
      setAutosaveEnabled: async (enabled) => {
        if (!enabled) {
          persistAutosave(false);
          return;
        }
        if (!fileAccessSupported) return;
        if (!handle && !(await saveAs())) return;
        setSaveStatus((current) => (current === "failed" ? "idle" : current));
        persistAutosave(true);
      },
    }),
    [
      autosaveEnabled,
      dirty,
      fileAccessSupported,
      fileName,
      handle,
      openHandle,
      persistAutosave,
      requestPendingWorkspace,
      save,
      saveAs,
      saveStatus,
      t,
    ],
  );

  if (recovery) {
    return (
      <BrowserWorkspaceRecovery
        onReconnect={() => void reconnect()}
        onStartBlank={startBlank}
        recovery={recovery}
      />
    );
  }
  if (!ready) return <BrowserWorkspaceLoading />;

  return (
    <WorkspacePersistenceContext.Provider value={context}>
      {children}
      {errorMessage && (
        <div
          className="fixed bottom-5 right-5 z-[90] max-w-sm rounded-md bg-destructive px-3 py-2 text-sm font-medium text-white"
          data-demo-id="browser-workspace-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPendingWorkspace(null);
        }}
        open={pendingWorkspace !== null}
      >
        <AlertDialogContent data-demo-id="unsaved-browser-workspace-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Unsaved changes")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Save changes before leaving this workspace?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <Button
              onClick={() => {
                const pending = pendingWorkspace;
                setPendingWorkspace(null);
                if (!pending) return;
                if (pending.kind === "new") startBlank();
                else installWorkspace(pending);
              }}
              type="button"
              variant="secondary"
            >
              {t("Discard")}
            </Button>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                const pending = pendingWorkspace;
                void save().then((saved) => {
                  if (!saved || !pending) return;
                  setPendingWorkspace(null);
                  if (pending.kind === "new") startBlank();
                  else installWorkspace(pending);
                });
              }}
            >
              {t("Save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog onOpenChange={setConflictOpen} open={conflictOpen}>
        <AlertDialogContent data-demo-id="browser-file-conflict-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("File conflict")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("The workspace file changed outside Org Tools.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-wrap">
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <Button
              onClick={() => {
                if (!handle) return;
                void loadHandle(handle).then(() => setConflictOpen(false));
              }}
              type="button"
              variant="secondary"
            >
              {t("Load file")}
            </Button>
            <Button
              onClick={() => void saveAs().then((saved) => saved && setConflictOpen(false))}
              type="button"
              variant="secondary"
            >
              {t("Save As")}
            </Button>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (!handle) return;
                setSaveStatus("saving");
                void writeHandle(handle, true).then(() => setConflictOpen(false));
              }}
            >
              {t("Overwrite file")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePersistenceContext.Provider>
  );
});
