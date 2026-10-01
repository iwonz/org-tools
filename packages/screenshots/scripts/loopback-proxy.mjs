import { createServer, request as httpRequest } from "node:http";
import { connect } from "node:net";

const parseUpstream = (value) => {
  const upstream = new URL(value);
  if (upstream.protocol !== "http:" || upstream.username || upstream.password) {
    throw new Error("The browser-test upstream must be an unauthenticated HTTP origin.");
  }
  return upstream;
};

export async function startLoopbackProxy(value, port = 3000) {
  const upstream = parseUpstream(value);
  const sockets = new Set();
  const server = createServer((incoming, outgoing) => {
    const target = new URL(incoming.url ?? "/", upstream);
    const upstreamRequest = httpRequest(
      target,
      {
        headers: { ...incoming.headers, host: upstream.host },
        method: incoming.method,
      },
      (upstreamResponse) => {
        outgoing.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
        upstreamResponse.pipe(outgoing);
      },
    );
    upstreamRequest.on("error", (error) => outgoing.destroy(error));
    outgoing.on("error", () => upstreamRequest.destroy());
    incoming.pipe(upstreamRequest);
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });

  server.on("upgrade", (request, socket, head) => {
    const upstreamSocket = connect(Number(upstream.port || 80), upstream.hostname, () => {
      const headers = Object.entries({ ...request.headers, host: upstream.host })
        .flatMap(([name, value]) =>
          Array.isArray(value) ? value.map((entry) => `${name}: ${entry}`) : [`${name}: ${value}`],
        )
        .join("\r\n");
      upstreamSocket.write(
        `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers}\r\n\r\n`,
      );
      if (head.length > 0) upstreamSocket.write(head);
      socket.pipe(upstreamSocket).pipe(socket);
    });
    upstreamSocket.on("error", () => socket.destroy());
    socket.on("error", () => upstreamSocket.destroy());
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });
  return async () => {
    server.close();
    server.closeAllConnections();
    for (const socket of sockets) socket.destroy();
  };
}
