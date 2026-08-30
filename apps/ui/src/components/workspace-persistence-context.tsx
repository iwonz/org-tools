"use client";

import { createContext, useContext } from "react";

import type { ProjectDocument, ProjectSummary } from "@/lib/project-workspace";

export type WorkspaceSaveStatus = "failed" | "idle" | "saved" | "saving";

type CommonWorkspacePersistence = {
  autosaveEnabled: boolean;
  autosaveSupported: boolean;
  dirty: boolean;
  displayName: string;
  save: () => Promise<boolean>;
  saveStatus: WorkspaceSaveStatus;
  setAutosaveEnabled: (enabled: boolean) => Promise<void>;
};

export type SqliteWorkspacePersistence = CommonWorkspacePersistence & {
  copyProjectLink: () => Promise<void>;
  createProject: (name: string) => Promise<void>;
  deleteProject: () => Promise<void>;
  mode: "sqlite";
  notice: "link-copied" | null;
  project: ProjectDocument;
  projects: ProjectSummary[];
  refreshProjects: () => Promise<void>;
  renameProject: (name: string) => Promise<void>;
  switchProject: (id: string) => void;
};

export type BrowserWorkspacePersistence = CommonWorkspacePersistence & {
  fileAccessSupported: boolean;
  mode: "browser";
  newWorkspace: () => void;
  openFallbackFile: (file: File) => Promise<void>;
  openWorkspace: () => Promise<void>;
  saveAs: () => Promise<boolean>;
};

export type WorkspacePersistence = BrowserWorkspacePersistence | SqliteWorkspacePersistence;

export const WorkspacePersistenceContext = createContext<WorkspacePersistence | null>(null);

export const useWorkspacePersistence = () => {
  const context = useContext(WorkspacePersistenceContext);
  if (!context) throw new Error("Workspace persistence controller is missing.");
  return context;
};

export const useProjectWorkspace = () => {
  const context = useWorkspacePersistence();
  if (context.mode !== "sqlite") throw new Error("SQLite project workspace is unavailable.");
  return context;
};

export const useBrowserWorkspace = () => {
  const context = useWorkspacePersistence();
  if (context.mode !== "browser") throw new Error("Browser file workspace is unavailable.");
  return context;
};
