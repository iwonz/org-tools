export const dynamic = "force-dynamic";

export const GET = (): Response =>
  Response.json({ status: "live" }, { headers: { "Cache-Control": "no-store" }, status: 200 });
