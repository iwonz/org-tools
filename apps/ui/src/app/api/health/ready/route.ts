import { assertSchemaReady } from "@/server/schema-readiness";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<Response> => {
  try {
    await assertSchemaReady();
    return Response.json(
      { status: "ready" },
      { headers: { "Cache-Control": "no-store" }, status: 200 },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }
};
