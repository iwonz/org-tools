import { getDatabasePool } from "@/server/database";
import { authenticateRequest, withApi } from "@/server/http-api";

export const dynamic = "force-dynamic";

export const GET = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request);
    const encoder = new TextEncoder();
    const requestedCursor = request.headers.get("last-event-id");
    const initialCursor =
      requestedCursor && /^\d+$/u.test(requestedCursor)
        ? Number(requestedCursor)
        : Number(
            (
              await getDatabasePool().query<{ id: string }>(
                "SELECT COALESCE(max(id), 0)::text AS id FROM server_events",
              )
            ).rows[0]?.id ?? 0,
          );
    let cursor = Number.isSafeInteger(initialCursor) && initialCursor >= 0 ? initialCursor : 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    let closed = false;
    const stream = new ReadableStream({
      async start(controller) {
        const close = () => {
          if (closed) return;
          closed = true;
          if (timer) clearInterval(timer);
          controller.close();
        };
        const send = async () => {
          if (closed) return;
          try {
            const active = await getDatabasePool().query(
              `SELECT 1 FROM sessions
               WHERE id = $1 AND revoked_at IS NULL
                 AND idle_expires_at > clock_timestamp()
                 AND absolute_expires_at > clock_timestamp()`,
              [session.sessionId],
            );
            if (active.rowCount === 0) {
              controller.enqueue(encoder.encode('event: session\ndata: {"expired":true}\n\n'));
              close();
              return;
            }
            const result = await getDatabasePool().query<{
              account_id: string | null;
              event_kind: string;
              id: string;
              organization_revision: string;
              security_revision: string;
            }>(
              `SELECT id::text, organization_revision::text, security_revision::text, event_kind, account_id::text
               FROM server_events WHERE id > $1 ORDER BY id ASC LIMIT 100`,
              [cursor],
            );
            for (const event of result.rows) {
              cursor = Number(event.id);
              if (event.event_kind === "ui" && event.account_id !== session.account.id) continue;
              controller.enqueue(
                encoder.encode(
                  `id: ${event.id}\nevent: ${event.event_kind}\ndata: ${JSON.stringify({ organizationRevision: Number(event.organization_revision), securityRevision: Number(event.security_revision) })}\n\n`,
                ),
              );
            }
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
          } catch {
            close();
          }
        };
        await send();
        if (!closed) timer = setInterval(() => void send(), 3_000);
      },
      cancel() {
        closed = true;
        if (timer) clearInterval(timer);
      },
    });
    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  }, request);
