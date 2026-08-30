"use client";

import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCircleStack } from "react-icons/hi2";

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
  type SqliteWorkspacePersistence,
  WorkspacePersistenceContext,
  type WorkspaceSaveStatus,
} from "@/components/workspace-persistence-context";
import { useUiText } from "@/i18n/use-ui-text";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/autosave-preference";
import { copyTextToClipboard } from "@/lib/org-file";
import {
  applyProjectUiState,
  type ProjectApiError,
  type ProjectApiErrorCode,
  type ProjectDocument,
  type ProjectListResponse,
  type ProjectSummary,
} from "@/lib/project-workspace";
import { runSingleFlightSave } from "@/lib/single-flight-save";
import { useOrgStore } from "@/stores/org-store-context";

type PendingNavigation = { id: string; kind: "project" } | { kind: "create"; name: string };

class ProjectClientError extends Error {
  readonly code: ProjectApiErrorCode;
  readonly currentRevision?: number;

  constructor(error: ProjectApiError["error"]) {
    super(error.message);
    this.name = "ProjectClientError";
    this.code = error.code;
    if (error.currentRevision !== undefined) this.currentRevision = error.currentRevision;
  }
}

const projectRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers,
  });
  const value = (await response.json()) as T | ProjectApiError;
  if (!response.ok) throw new ProjectClientError((value as ProjectApiError).error);
  return value as T;
};

function WorkspaceLoading() {
  const t = useUiText();
  return (
    <main className="flex h-dvh items-center justify-center bg-shell text-foreground">
      <div
        className="flex items-center gap-3 text-sm font-medium text-muted-foreground"
        role="status"
      >
        <HiOutlineCircleStack className="size-5 animate-pulse" />
        {t("Reading project…")}
      </div>
    </main>
  );
}

function WorkspaceRecovery({
  availableProjectId,
  code,
  onDelete,
  onRetry,
}: {
  availableProjectId: string | null;
  code: ProjectApiErrorCode;
  onDelete: (() => void) | null;
  onRetry: () => void;
}) {
  const t = useUiText();
  const unavailable = code === "database_unavailable";
  const corrupt = code === "corrupt_stored_state";
  return (
    <main className="flex h-dvh items-center justify-center bg-shell p-6 text-foreground">
      <section className="w-full max-w-md rounded-xl bg-card p-6 shadow-[0_18px_48px_-38px_rgb(0_0_0/0.45)]">
        <HiOutlineCircleStack className="mb-5 size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">
          {t(unavailable ? "Database unavailable" : "Project unavailable")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t(
            unavailable
              ? "Org Tools could not open the local SQLite database."
              : corrupt
                ? "Stored project data is corrupt."
                : "This project does not exist.",
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={onRetry} type="button">
            {t("Retry")}
          </Button>
          {availableProjectId && (
            <Button
              onClick={() => window.location.assign(`/projects/${availableProjectId}`)}
              type="button"
              variant="secondary"
            >
              {t("Open available project")}
            </Button>
          )}
          {onDelete && (
            <Button onClick={onDelete} type="button" variant="destructive">
              {t("Delete project")}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

export const ProjectWorkspaceController = observer(
  ({ children, projectId }: { children: ReactNode; projectId: string }) => {
    const store = useOrgStore();
    const { setTheme } = useTheme();
    const t = useUiText();
    const [autosaveEnabled, persistAutosave] = useAutosavePreference();
    const [project, setProject] = useState<ProjectDocument | null>(null);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [savedOrganizationSequence, setSavedOrganizationSequence] = useState(0);
    const [saveStatus, setSaveStatus] = useState<WorkspaceSaveStatus>("idle");
    const [errorCode, setErrorCode] = useState<ProjectApiErrorCode | null>(null);
    const [conflictRevision, setConflictRevision] = useState<number | null>(null);
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
    const [notice, setNotice] = useState<"link-copied" | null>(null);
    const lastSavedUiSequence = useRef(0);
    const loadingToken = useRef(0);
    const allowUnload = useRef(false);
    const savePromise = useRef<Promise<boolean> | null>(null);
    const setThemeRef = useRef(setTheme);
    setThemeRef.current = setTheme;
    const dirty =
      project !== null && store.organizationChangeSequence !== savedOrganizationSequence;

    const refreshProjects = useCallback(async () => {
      const list = await projectRequest<ProjectListResponse>("/api/projects");
      setProjects(list.projects);
      return list;
    }, []);

    const loadProject = useCallback(async () => {
      const token = loadingToken.current + 1;
      loadingToken.current = token;
      setProject(null);
      setErrorCode(null);
      setSaveStatus("idle");
      try {
        const [document, list] = await Promise.all([
          projectRequest<ProjectDocument>(`/api/projects/${projectId}`),
          projectRequest<ProjectListResponse>("/api/projects"),
        ]);
        if (loadingToken.current !== token) return false;
        const state = applyProjectUiState(document.state, document.ui);
        store.loadOrgToolsState(state, null, null);
        store.resetProjectChangeTracking();
        lastSavedUiSequence.current = store.uiChangeSequence;
        setSavedOrganizationSequence(store.organizationChangeSequence);
        setThemeRef.current(state.ui.theme);
        setProjects(list.projects);
        setProject(document);
        return true;
      } catch (error) {
        if (loadingToken.current !== token) return false;
        setErrorCode(error instanceof ProjectClientError ? error.code : "database_unavailable");
        try {
          const list = await projectRequest<ProjectListResponse>("/api/projects");
          setProjects(list.projects);
        } catch {
          setProjects([]);
        }
        return false;
      }
    }, [projectId, store]);

    useEffect(() => {
      void loadProject();
    }, [loadProject]);

    const saveAtRevision = useCallback(
      async (expectedRevision: number): Promise<boolean> => {
        if (!project) return false;
        return runSingleFlightSave(savePromise, async () => {
          const sequence = store.organizationChangeSequence;
          setSaveStatus("saving");
          try {
            const saved = await projectRequest<ProjectDocument>(
              `/api/projects/${project.id}/state`,
              {
                body: JSON.stringify({
                  expectedRevision,
                  state: store.createOrgToolsState(),
                }),
                method: "PUT",
              },
            );
            setProject((current) =>
              current
                ? {
                    ...current,
                    stateRevision: saved.stateRevision,
                    updatedAt: saved.updatedAt,
                  }
                : current,
            );
            setProjects((current) =>
              current.map((item) =>
                item.id === saved.id
                  ? {
                      ...item,
                      stateRevision: saved.stateRevision,
                      updatedAt: saved.updatedAt,
                    }
                  : item,
              ),
            );
            setSavedOrganizationSequence(sequence);
            setSaveStatus("saved");
            return true;
          } catch (error) {
            if (error instanceof ProjectClientError && error.code === "revision_conflict") {
              setConflictRevision(error.currentRevision ?? null);
            }
            setSaveStatus("failed");
            return false;
          }
        });
      },
      [project, store],
    );

    const save = useCallback(
      () => (project ? saveAtRevision(project.stateRevision) : Promise.resolve(false)),
      [project, saveAtRevision],
    );

    const executeNavigation = useCallback(async (navigation: PendingNavigation) => {
      if (navigation.kind === "project") {
        allowUnload.current = true;
        window.location.assign(`/projects/${navigation.id}`);
        return;
      }
      const created = await projectRequest<ProjectDocument>("/api/projects", {
        body: JSON.stringify({ name: navigation.name }),
        method: "POST",
      });
      allowUnload.current = true;
      window.location.assign(`/projects/${created.id}`);
    }, []);

    const requestNavigation = useCallback(
      async (navigation: PendingNavigation) => {
        if (navigation.kind === "project" && navigation.id === project?.id) return;
        if (dirty) {
          setPendingNavigation(navigation);
          return;
        }
        await executeNavigation(navigation);
      },
      [dirty, executeNavigation, project?.id],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: the sequence restarts the trailing debounce for every organization mutation.
    useEffect(() => {
      if (
        !autosaveEnabled ||
        !dirty ||
        saveStatus === "saving" ||
        saveStatus === "failed" ||
        conflictRevision !== null
      ) {
        return;
      }
      const timeout = window.setTimeout(() => void save(), AUTOSAVE_DEBOUNCE_MS);
      return () => window.clearTimeout(timeout);
    }, [
      autosaveEnabled,
      conflictRevision,
      dirty,
      save,
      saveStatus,
      store.organizationChangeSequence,
    ]);

    useEffect(() => {
      if (!dirty) return;
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (allowUnload.current) return;
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
          if (dirty && saveStatus !== "saving") void save();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dirty, save, saveStatus]);

    useEffect(() => {
      if (!project || store.uiChangeSequence === lastSavedUiSequence.current) return;
      const sequence = store.uiChangeSequence;
      const timeout = window.setTimeout(() => {
        const ui = store.createProjectUiState();
        void projectRequest(`/api/projects/${project.id}/ui`, {
          body: JSON.stringify({ ui }),
          method: "PUT",
        }).then(
          () => {
            lastSavedUiSequence.current = sequence;
          },
          () => undefined,
        );
      }, 300);
      return () => window.clearTimeout(timeout);
    }, [project, store, store.uiChangeSequence]);

    const context = useMemo<SqliteWorkspacePersistence | null>(
      () =>
        project
          ? {
              autosaveEnabled,
              autosaveSupported: true,
              copyProjectLink: async () => {
                await copyTextToClipboard(`${window.location.origin}/projects/${project.id}`);
                setNotice("link-copied");
                window.setTimeout(() => setNotice(null), 1800);
              },
              createProject: (name) => requestNavigation({ kind: "create", name }),
              deleteProject: async () => {
                const result = await projectRequest<{ nextProject: ProjectDocument }>(
                  `/api/projects/${project.id}`,
                  { body: "{}", method: "DELETE" },
                );
                allowUnload.current = true;
                window.location.assign(`/projects/${result.nextProject.id}`);
              },
              dirty,
              displayName: project.name,
              mode: "sqlite",
              notice,
              project,
              projects,
              refreshProjects: async () => {
                await refreshProjects();
              },
              renameProject: async (name) => {
                const renamed = await projectRequest<ProjectSummary>(
                  `/api/projects/${project.id}`,
                  { body: JSON.stringify({ name }), method: "PATCH" },
                );
                setProject((current) => (current ? { ...current, ...renamed } : current));
                await refreshProjects();
              },
              save,
              saveStatus,
              setAutosaveEnabled: async (enabled) => {
                if (enabled && saveStatus === "failed") setSaveStatus("idle");
                persistAutosave(enabled);
              },
              switchProject: (id) => {
                void requestNavigation({ id, kind: "project" });
              },
            }
          : null,
      [
        autosaveEnabled,
        dirty,
        notice,
        persistAutosave,
        project,
        projects,
        refreshProjects,
        requestNavigation,
        save,
        saveStatus,
      ],
    );

    if (errorCode) {
      const availableProjectId = projects.find((item) => item.id !== projectId)?.id ?? null;
      return (
        <WorkspaceRecovery
          availableProjectId={availableProjectId}
          code={errorCode}
          onDelete={
            errorCode === "corrupt_stored_state"
              ? () => {
                  void projectRequest<{ nextProject: ProjectDocument }>(
                    `/api/projects/${projectId}`,
                    {
                      body: "{}",
                      method: "DELETE",
                    },
                  ).then((result) => {
                    allowUnload.current = true;
                    window.location.replace(`/projects/${result.nextProject.id}`);
                  });
                }
              : null
          }
          onRetry={() => void loadProject()}
        />
      );
    }
    if (!project || !context) return <WorkspaceLoading />;

    return (
      <WorkspacePersistenceContext.Provider value={context}>
        {children}
        <AlertDialog
          onOpenChange={(open) => {
            if (!open) setPendingNavigation(null);
          }}
          open={pendingNavigation !== null}
        >
          <AlertDialogContent data-demo-id="unsaved-project-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Unsaved changes")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("Save changes before leaving this project?")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
              <Button
                onClick={() => {
                  const navigation = pendingNavigation;
                  setPendingNavigation(null);
                  if (navigation) void executeNavigation(navigation);
                }}
                type="button"
                variant="secondary"
              >
                {t("Discard")}
              </Button>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  const navigation = pendingNavigation;
                  void save().then((saved) => {
                    if (!saved || !navigation) return;
                    setPendingNavigation(null);
                    void executeNavigation(navigation);
                  });
                }}
              >
                {t("Save")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          onOpenChange={(open) => {
            if (!open) setConflictRevision(null);
          }}
          open={conflictRevision !== null}
        >
          <AlertDialogContent data-demo-id="revision-conflict-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Conflict")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("The project changed in another tab.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
              <Button
                onClick={() => {
                  const navigation = pendingNavigation;
                  setConflictRevision(null);
                  void loadProject().then((loaded) => {
                    if (!loaded || !navigation) return;
                    setPendingNavigation(null);
                    void executeNavigation(navigation);
                  });
                }}
                type="button"
                variant="secondary"
              >
                {t("Load saved version")}
              </Button>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  if (conflictRevision === null) return;
                  const navigation = pendingNavigation;
                  void saveAtRevision(conflictRevision).then((saved) => {
                    if (!saved) return;
                    setConflictRevision(null);
                    if (navigation) {
                      setPendingNavigation(null);
                      void executeNavigation(navigation);
                    }
                  });
                }}
              >
                {t("Overwrite saved version")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </WorkspacePersistenceContext.Provider>
    );
  },
);
