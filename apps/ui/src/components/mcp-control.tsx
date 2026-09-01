"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineCheck,
  HiOutlineClipboard,
  HiOutlineClock,
  HiOutlineCog6Tooth,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineKey,
  HiOutlinePower,
} from "react-icons/hi2";

import { McpClientIcon } from "@/components/mcp-client-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUiText } from "@/i18n/use-ui-text";
import {
  buildMcpAgentSetupPrompt,
  MCP_CLIENTS,
  type McpClientName,
} from "@/lib/mcp-client-configuration";
import { copyTextToClipboard } from "@/lib/org-file";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

type McpSettings = {
  enabled: boolean;
  hasToken: boolean;
  maskedToken: string | null;
};

type McpActivityItem = {
  actor: string;
  affectedIds: string[];
  changeId: string;
  createdAt: string;
  reason: string;
  resultRevision: number;
  summary: { created: number; deleted: number; updated: number };
};

type McpControlState = {
  activity: { items: McpActivityItem[]; nextCursor: string | null };
  revision: number;
  settings: McpSettings;
};

type McpTab = "activity" | "setup";

type McpConflict = {
  entityId: string;
  entityType: string;
  field: string | null;
  viewId: string | null;
};

type McpUiError = {
  conflicts?: McpConflict[];
  kind: "load" | "undo" | "update";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseControlState = (value: unknown): McpControlState => {
  if (!isRecord(value) || !isRecord(value.settings) || !isRecord(value.activity)) {
    throw new Error("invalid_response");
  }
  return value as McpControlState;
};

export function McpControl() {
  const store = useOrgStore();
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [controlState, setControlState] = useState<McpControlState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [client, setClient] = useState<McpClientName>("Codex");
  const [activeTab, setActiveTab] = useState<McpTab>("setup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<McpUiError | null>(null);
  const [copied, setCopied] = useState<"endpoint" | "prompt" | "token" | null>(null);
  const [rotateConfirmationOpen, setRotateConfirmationOpen] = useState(false);
  const [undoChange, setUndoChange] = useState<McpActivityItem | null>(null);
  const sidebarCollapsed = store.sidebarCollapsed;
  const endpoint = useMemo(
    () =>
      typeof window === "undefined" ? "http://127.0.0.1:3000/mcp" : `${window.location.origin}/mcp`,
    [],
  );
  const sidebarLabelClassName = cn(
    "hidden min-w-0 overflow-hidden truncate whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none lg:inline-block",
    sidebarCollapsed ? "lg:max-w-0 lg:opacity-0" : "lg:max-w-[10rem] lg:opacity-100",
  );

  const load = useCallback(async (includeToken = false) => {
    setError(null);
    if (includeToken) setToken(null);
    try {
      const response = await fetch("/api/mcp", { cache: "no-store" });
      if (!response.ok) throw new Error("request_failed");
      const nextControlState = parseControlState(await response.json());
      let nextToken: string | null = null;
      if (includeToken && nextControlState.settings.enabled) {
        const tokenResponse = await fetch("/api/mcp", {
          body: JSON.stringify({ action: "reveal" }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!tokenResponse.ok) throw new Error("request_failed");
        const value = (await tokenResponse.json()) as Record<string, unknown>;
        if (typeof value.token !== "string") throw new Error("invalid_response");
        nextToken = value.token;
      }
      setControlState(nextControlState);
      if (includeToken || !nextControlState.settings.enabled) {
        setToken(nextToken);
        setTokenVisible(false);
      }
    } catch {
      if (includeToken) setToken(null);
      setError({ kind: "load" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void load(true);
  }, [load, open]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(null), 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const mutate = async (action: "disable" | "enable" | "reveal" | "rotate") => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/mcp", {
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error("request_failed");
      const value = (await response.json()) as Record<string, unknown>;
      if (action === "reveal") {
        if (typeof value.token !== "string") throw new Error("invalid_response");
        setToken(value.token);
        setTokenVisible(true);
      } else {
        const settings = value.settings;
        if (!isRecord(settings)) throw new Error("invalid_response");
        setControlState((current) =>
          current ? { ...current, settings: settings as McpSettings } : current,
        );
        if (action === "enable" || action === "rotate") {
          if (typeof value.token !== "string") throw new Error("invalid_response");
          setToken(value.token);
          setTokenVisible(false);
        }
        if (action === "disable") {
          setToken(null);
          setTokenVisible(false);
        }
      }
    } catch {
      setError({ kind: "update" });
    } finally {
      setBusy(false);
    }
  };

  const copyValue = async (kind: "endpoint" | "prompt" | "token", value: string) => {
    await copyTextToClipboard(value);
    setCopied(kind);
  };

  const undo = async (change: McpActivityItem) => {
    if (!controlState) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/mcp/undo", {
        body: JSON.stringify({
          changeId: change.changeId,
          expectedRevision: controlState.revision,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      let responseError: { conflicts?: McpConflict[] } | undefined;
      try {
        const value = (await response.json()) as {
          error?: { conflicts?: McpConflict[] };
        };
        responseError = value.error;
      } catch {
        // Stable local fallback below.
      }
      if (!response.ok || responseError) {
        const conflicts = responseError?.conflicts;
        setError(conflicts?.length ? { conflicts, kind: "undo" } : { kind: "undo" });
        return;
      }
      setUndoChange(null);
      await load(true);
    } catch {
      setError({ kind: "undo" });
    } finally {
      setBusy(false);
    }
  };

  const displayToken = tokenVisible ? token : (controlState?.settings.maskedToken ?? null);
  const setupPrompt = token ? buildMcpAgentSetupPrompt(client, endpoint, token) : null;

  return (
    <>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button
            aria-label={t("MCP")}
            className="group relative h-10 w-full justify-start gap-3 rounded-md bg-transparent px-3.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/70 focus-visible:ring-offset-0 data-[state=open]:bg-sidebar-active data-[state=open]:text-sidebar-foreground"
            data-demo-id="mcp-control"
            data-mcp-enabled={controlState?.settings.enabled ? "true" : "false"}
            title={t("MCP")}
            type="button"
            variant="ghost"
          >
            <HiOutlineBolt
              className={cn("!size-5 shrink-0", controlState?.settings.enabled && "text-success")}
            />
            <span className={sidebarLabelClassName} data-sidebar-label="">
              {t("MCP")}
            </span>
            <span
              className={cn(
                "pointer-events-none absolute left-[calc(100%+0.625rem)] top-1/2 z-[70] hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100",
                sidebarCollapsed && "lg:block",
              )}
              role="tooltip"
            >
              {t("MCP")}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent
          className={cn(
            "max-h-[calc(100dvh-2rem)] max-w-3xl",
            controlState?.settings.enabled && activeTab === "setup"
              ? "h-[min(40rem,calc(100dvh-2rem))]"
              : "h-auto",
          )}
          data-demo-id="mcp-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("MCP")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("Manage local MCP access and agent setup.")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {!controlState && !error && (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                {t("Loading MCP settings…")}
              </div>
            )}
            {error && !error.conflicts?.length && (
              <div
                className="mb-3 flex items-center justify-between gap-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                <span>
                  {t(
                    error.kind === "load"
                      ? "MCP settings could not be loaded."
                      : error.kind === "undo"
                        ? "MCP change could not be undone."
                        : "MCP settings could not be updated.",
                  )}
                </span>
                <Button onClick={() => void load(open)} size="sm" type="button" variant="secondary">
                  {t("Retry")}
                </Button>
              </div>
            )}
            {error?.conflicts?.length ? (
              <div
                className="mb-3 rounded-md bg-warning/10 px-3 py-2 text-xs text-muted-foreground"
                data-demo-id="mcp-undo-conflict"
              >
                <div className="font-semibold text-foreground">
                  {t("Undo conflicts with {count} later values.", {
                    count: error.conflicts.length,
                  })}
                </div>
                <div className="mt-1 truncate font-mono">
                  {error.conflicts
                    .map(
                      (conflict) =>
                        `${conflict.entityType}:${conflict.entityId}${conflict.field ? `/${conflict.field}` : ""}`,
                    )
                    .join(", ")}
                </div>
              </div>
            ) : null}
            {controlState && !controlState.settings.enabled && (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-5 text-center"
                data-demo-id="mcp-disabled-consent"
              >
                <div className="grid size-14 place-items-center rounded-xl bg-signal/10 text-signal">
                  <HiOutlineKey className="size-7" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-lg font-semibold">{t("MCP is disabled")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "An enabled local MCP client can read and modify Employees, Units, and Views.",
                    )}
                  </p>
                </div>
                <Button disabled={busy} onClick={() => void mutate("enable")} type="button">
                  <HiOutlinePower aria-hidden className="size-4" />
                  {t("Enable MCP")}
                </Button>
              </div>
            )}
            {controlState?.settings.enabled && (
              <Tabs
                className="min-h-0 flex-1"
                onValueChange={(value) => setActiveTab(value as McpTab)}
                value={activeTab}
              >
                <div className="flex items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="setup">
                      <HiOutlineCog6Tooth aria-hidden className="size-4" />
                      {t("Setup")}
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                      <HiOutlineClock aria-hidden className="size-4" />
                      {t("Activity")}
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    disabled={busy}
                    onClick={() => void mutate("disable")}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <HiOutlinePower aria-hidden className="size-4" />
                    {t("Disable MCP")}
                  </Button>
                </div>
                <TabsContent className="min-h-0 pt-4" value="setup">
                  <ScrollArea className="h-full pr-3">
                    <div className="space-y-5 pb-2" data-demo-id="mcp-credentials">
                      <section className="grid gap-2">
                        <div className="text-sm font-semibold">{t("Endpoint")}</div>
                        <div className="flex gap-2">
                          <code
                            className="min-w-0 flex-1 truncate rounded-md bg-muted/70 px-3 py-2 text-xs"
                            data-demo-id="mcp-endpoint"
                          >
                            {endpoint}
                          </code>
                          <Button
                            aria-label={t("Copy endpoint")}
                            onClick={() => void copyValue("endpoint", endpoint)}
                            size="icon"
                            type="button"
                            variant="secondary"
                          >
                            {copied === "endpoint" ? <HiOutlineCheck /> : <HiOutlineClipboard />}
                          </Button>
                        </div>
                      </section>
                      <section className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{t("Access token")}</div>
                          <Button
                            onClick={() => setRotateConfirmationOpen(true)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <HiOutlineArrowPath aria-hidden className="size-4" />
                            {t("Rotate token")}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <code
                            className="min-w-0 flex-1 truncate rounded-md bg-muted/70 px-3 py-2 text-xs"
                            data-demo-id="mcp-token"
                          >
                            {displayToken}
                          </code>
                          <Button
                            aria-label={t(tokenVisible ? "Hide" : "Reveal")}
                            onClick={() => {
                              if (tokenVisible) {
                                setTokenVisible(false);
                              } else {
                                void mutate("reveal");
                              }
                            }}
                            size="icon"
                            type="button"
                            variant="secondary"
                          >
                            {tokenVisible ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                          </Button>
                          <Button
                            aria-label={t("Copy token")}
                            disabled={!token}
                            onClick={() => token && void copyValue("token", token)}
                            size="icon"
                            type="button"
                            variant="secondary"
                          >
                            {copied === "token" ? <HiOutlineCheck /> : <HiOutlineClipboard />}
                          </Button>
                        </div>
                      </section>
                      <section className="space-y-3">
                        <div className="text-sm font-semibold">{t("Client setup")}</div>
                        <fieldset className="flex flex-wrap gap-1.5">
                          <legend className="sr-only">{t("Client")}</legend>
                          {MCP_CLIENTS.map(({ name, skillsAgentId }) => (
                            <Button
                              className="h-8"
                              data-mcp-client={skillsAgentId}
                              key={name}
                              onClick={() => setClient(name)}
                              size="sm"
                              type="button"
                              variant={client === name ? "secondary" : "ghost"}
                            >
                              <McpClientIcon client={name} />
                              {name}
                            </Button>
                          ))}
                        </fieldset>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{t("Agent setup prompt")}</div>
                          <Button
                            aria-label={t("Copy setup prompt")}
                            disabled={!setupPrompt}
                            onClick={() => setupPrompt && void copyValue("prompt", setupPrompt)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            {copied === "prompt" ? <HiOutlineCheck /> : <HiOutlineClipboard />}
                            {t("Copy")}
                          </Button>
                        </div>
                        <pre
                          className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted/70 p-3 text-xs"
                          data-demo-id="mcp-setup-prompt"
                        >
                          <code>{setupPrompt ?? t("Loading MCP settings…")}</code>
                        </pre>
                      </section>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent className="min-h-0 pt-4" value="activity">
                  <ScrollArea className="h-full pr-3">
                    <div className="space-y-2 pb-2" data-demo-id="mcp-activity">
                      {controlState.activity.items.length === 0 && (
                        <div className="rounded-md bg-muted/45 px-4 py-8 text-center text-sm text-muted-foreground">
                          {t("No agent changes yet.")}
                        </div>
                      )}
                      {controlState.activity.items.map((change) => (
                        <article className="rounded-md bg-muted/45 p-3" key={change.changeId}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{change.reason}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {t("Applied by {actor}", { actor: change.actor })} ·{" "}
                                {t("Revision {revision}", { revision: change.resultRevision })}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {t(
                                  "Created {created}, updated {updated}, deleted {deleted}.",
                                  change.summary,
                                )}
                              </div>
                            </div>
                            <Button
                              disabled={busy}
                              onClick={() => setUndoChange(change)}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              {t("Undo")}
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
      <AlertDialog onOpenChange={setRotateConfirmationOpen} open={rotateConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Rotate access token?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Rotating the token disconnects existing clients and invalidates pending previews.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void mutate("rotate")}>
              {t("Rotate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(nextOpen) => !nextOpen && setUndoChange(null)}
        open={undoChange !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Undo this agent change?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Undo only succeeds when later changes do not overlap the affected values.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => undoChange && void undo(undoChange)}>
              {t("Undo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
