import { once } from "node:events";
import { createServer } from "node:http";
import { connect } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { startLoopbackProxy } from "../packages/screenshots/scripts/loopback-proxy.mjs";

const servers = new Set();
const sockets = new Set();

const listen = async (server, port = 0) => {
  servers.add(server);
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP server address.");
  return address.port;
};

const findAvailablePort = async () => {
  const server = createServer();
  const port = await listen(server);
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  servers.delete(server);
  return port;
};

const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out waiting for ${label}.`)), 2_000),
    ),
  ]);

afterEach(async () => {
  for (const socket of sockets) socket.destroy();
  sockets.clear();
  await Promise.all(
    [...servers].map(
      (server) =>
        new Promise((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        }),
    ),
  );
  servers.clear();
});

describe("loopback proxy lifecycle", () => {
  it("closes both sides of upgraded connections and reuses its shutdown promise", async () => {
    let upstreamSocket;
    const upstreamServer = createServer();
    upstreamServer.on("upgrade", (_request, socket) => {
      upstreamSocket = socket;
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
      socket.write(
        "HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n",
      );
    });
    const upstreamPort = await listen(upstreamServer);
    const proxyPort = await findAvailablePort();
    const closeProxy = await startLoopbackProxy(`http://127.0.0.1:${upstreamPort}`, proxyPort);

    const browserSocket = connect(proxyPort, "127.0.0.1");
    sockets.add(browserSocket);
    browserSocket.once("close", () => sockets.delete(browserSocket));
    await once(browserSocket, "connect");
    browserSocket.write(
      "GET /_next/webpack-hmr HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n",
    );
    const [response] = await withTimeout(once(browserSocket, "data"), "upgrade response");
    expect(response.toString()).toContain("101 Switching Protocols");
    expect(upstreamSocket).toBeDefined();

    const browserClosed = once(browserSocket, "close");
    const upstreamEnded = once(upstreamSocket, "end");
    const firstShutdown = closeProxy();
    const repeatedShutdown = closeProxy();

    expect(repeatedShutdown).toBe(firstShutdown);
    await withTimeout(firstShutdown, "listening server shutdown");
    await withTimeout(browserClosed, "browser socket close");
    await withTimeout(upstreamEnded, "upstream socket end");
    await expect(closeProxy()).resolves.toBeUndefined();
  });
});
