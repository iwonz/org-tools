import { assertStateApiRequest } from "@/server/state-api";
import { subscribeToStateRevisions } from "@/server/state-events";

export const dynamic = "force-dynamic";

export const GET = (request: Request): Response => {
  try {
    assertStateApiRequest(request);
  } catch {
    return new Response(null, { headers: { "Cache-Control": "no-store" }, status: 403 });
  }
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const close = () => {
    unsubscribe();
    if (heartbeat) clearInterval(heartbeat);
  };
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      close();
    },
    start(controller) {
      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: revision\ndata: ${JSON.stringify(event)}\n\n`));
        } catch {
          close();
        }
      };
      unsubscribe = subscribeToStateRevisions(send);
      request.signal.addEventListener("abort", close, { once: true });
      controller.enqueue(encoder.encode(": connected\n\n"));
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          close();
        }
      }, 15_000);
    },
  });
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
};
