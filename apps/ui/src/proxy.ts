import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveProjectRuntimeConfig } from "@/server/project-config";
import { ProjectRepository } from "@/server/project-repository";

export function proxy(request: NextRequest) {
  let repository: ProjectRepository | null = null;
  try {
    repository = new ProjectRepository(resolveProjectRuntimeConfig().databasePath);
    const projectId = repository.ensureProjectList().currentProjectId;
    if (!projectId) return NextResponse.next();
    return NextResponse.redirect(new URL(`/projects/${projectId}`, request.url));
  } catch {
    return NextResponse.next();
  } finally {
    repository?.close();
  }
}

export const config = {
  matcher: "/",
};
