import { OrgToolsApp } from "@/components/org-tools-app";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrgToolsApp projectId={id} />;
}
