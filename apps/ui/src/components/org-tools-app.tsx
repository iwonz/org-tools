"use client";

import { OrgToolsWorkspace } from "@/components/org-tools-workspace";
import { ProjectWorkspaceController } from "@/components/project-workspace-controller";
import { OrgStoreProvider } from "@/stores/org-store-context";

function ProjectApp({ projectId }: { projectId: string }) {
  return (
    <ProjectWorkspaceController projectId={projectId}>
      <OrgToolsWorkspace />
    </ProjectWorkspaceController>
  );
}

export function OrgToolsApp({ projectId }: { projectId: string }) {
  return (
    <OrgStoreProvider>
      <ProjectApp projectId={projectId} />
    </OrgStoreProvider>
  );
}
