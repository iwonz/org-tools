"use client";

import { type ChangeEvent, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray } from "react-icons/hi2";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiText } from "@/i18n/use-ui-text";

const base64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
};

export function BackupRestorePanel() {
  const auth = useAuth();
  const t = useUiText();
  const [currentPassword, setCurrentPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const create = async () => {
    if (!auth.csrfToken) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/backup", {
        body: JSON.stringify({ action: "create", currentPassword, passphrase }),
        headers: { "Content-Type": "application/json", "X-Org-Tools-CSRF": auth.csrfToken },
        method: "POST",
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `org-tools-${new Date().toISOString().slice(0, 10)}.org-tools-backup`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(t("Backup created."));
    } catch {
      setMessage(t("Backup operation failed."));
    } finally {
      setPending(false);
    }
  };

  const restore = async () => {
    if (!auth.csrfToken || !file) return;
    setPending(true);
    setMessage(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const response = await fetch("/api/backup", {
        body: JSON.stringify({
          action: "restore",
          currentPassword,
          fileBase64: base64(bytes),
          passphrase,
        }),
        headers: { "Content-Type": "application/json", "X-Org-Tools-CSRF": auth.csrfToken },
        method: "POST",
      });
      if (!response.ok) throw new Error();
      await auth.logout();
    } catch {
      setMessage(t("Backup operation failed."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid max-w-2xl gap-5">
      <div className="grid gap-4 rounded-lg border border-border p-4">
        <div>
          <h2 className="font-semibold">{t("Encrypted Backup")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Backup contains organization and access data. Sessions and secrets are excluded.")}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="backup-current-password">{t("Current password")}</Label>
          <Input
            id="backup-current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            value={currentPassword}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="backup-passphrase">{t("Backup passphrase")}</Label>
          <Input
            id="backup-passphrase"
            minLength={15}
            onChange={(event) => setPassphrase(event.target.value)}
            type="password"
            value={passphrase}
          />
        </div>
        <Button
          className="w-fit"
          disabled={pending || currentPassword.length < 15 || passphrase.length < 15}
          onClick={() => void create()}
        >
          <HiOutlineArrowDownTray />
          {t("Create Backup")}
        </Button>
      </div>
      <div className="grid gap-4 rounded-lg border border-destructive/30 p-4">
        <div>
          <h2 className="font-semibold">{t("Restore Backup")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Restore replaces all current data and signs out every account.")}
          </p>
        </div>
        <Input
          accept=".org-tools-backup,application/vnd.org-tools.backup"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFile(event.target.files?.[0] ?? null)
          }
          type="file"
        />
        <Button
          className="w-fit"
          disabled={pending || !file || currentPassword.length < 15 || passphrase.length < 15}
          onClick={() => void restore()}
          variant="destructive"
        >
          <HiOutlineArrowUpTray />
          {t("Restore Backup")}
        </Button>
      </div>
      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
