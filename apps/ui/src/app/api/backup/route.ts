import { BackupService } from "@/server/backup-service";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import { exactRecord, readJson } from "@/server/request-security";

export const dynamic = "force-dynamic";

export const POST = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, { mutation: true });
    const value = await readJson(request, 700 * 1024 * 1024);
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new SyntaxError();
    const action = (value as { action?: unknown }).action;
    if (action === "create") {
      const input = exactRecord(value, ["action", "currentPassword", "passphrase"]);
      if (typeof input.currentPassword !== "string" || typeof input.passphrase !== "string") {
        throw new SyntaxError();
      }
      const file = await new BackupService().create(
        session,
        input.currentPassword,
        input.passphrase,
      );
      return new Response(new Uint8Array(file), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="org-tools-${new Date().toISOString().slice(0, 10)}.org-tools-backup"`,
          "Content-Type": "application/vnd.org-tools.backup",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (action === "restore") {
      const input = exactRecord(value, ["action", "currentPassword", "fileBase64", "passphrase"]);
      if (
        typeof input.currentPassword !== "string" ||
        typeof input.passphrase !== "string" ||
        typeof input.fileBase64 !== "string"
      ) {
        throw new SyntaxError();
      }
      await new BackupService().restore(
        session,
        input.currentPassword,
        input.passphrase,
        Buffer.from(input.fileBase64, "base64"),
      );
      return json({ ok: true });
    }
    throw new SyntaxError();
  }, request);
