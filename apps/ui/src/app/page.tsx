import { redirect } from "next/navigation";

import { RootDatabaseUnavailable } from "@/components/root-database-unavailable";
import { getProjectRepository } from "@/server/project-repository";

export const dynamic = "force-dynamic";

export default function HomePage() {
  let projectId: string;
  try {
    const list = getProjectRepository().ensureProjectList();
    if (!list.currentProjectId) throw new Error("Current project is unavailable.");
    projectId = list.currentProjectId;
  } catch {
    return <RootDatabaseUnavailable />;
  }
  redirect(`/projects/${projectId}`);
}
