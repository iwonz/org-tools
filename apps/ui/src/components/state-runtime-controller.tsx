"use client";

import type { OrgToolsState } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCircleStack } from "react-icons/hi2";

import { useAppLocale } from "@/components/locale-provider";
import {
  StateRuntimeContext,
  type StateRuntimeContextValue,
  type StateRuntimeMode,
} from "@/components/state-runtime-context";
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
import { useUiText } from "@/i18n/use-ui-text";
import { AutomaticStateWriter } from "@/lib/automatic-state-writer";
import { createBlankOrgToolsState } from "@/lib/org-file";
import {
  compareStateStamps,
  nextStateStamp,
  parseStateChannelMessage,
  STATE_CHANNEL_NAME,
  type StateChannelMessage,
  type StateStamp,
} from "@/lib/state-channel";
import type { StateApiErrorCode, StateDocument, StatePutRequest } from "@/lib/state-runtime";
import { mergeOrgToolsStates, type StateThreeWayMerge } from "@/lib/state-three-way";
import { useOrgStore } from "@/stores/org-store-context";

type StateRuntimeTransport = {
  load: () => Promise<StateDocument>;
  subscribe?: (listener: (event: { revision: number; source: "mcp" | "ui" }) => void) => () => void;
  write: (request: StatePutRequest) => Promise<StateDocument>;
};

type StateConflict = StateThreeWayMerge & {
  local: OrgToolsState;
  remote: StateDocument;
};

const errorCodeFrom = (error: unknown): StateApiErrorCode => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "database_unavailable";
  }
  const code = error.code;
  return code === "corrupt_stored_state" ||
    code === "database_unavailable" ||
    code === "invalid_input" ||
    code === "invalid_state" ||
    code === "revision_conflict"
    ? code
    : "database_unavailable";
};

function StateLoading() {
  const t = useUiText();
  return (
    <main
      aria-busy="true"
      className="flex h-dvh items-center justify-center bg-shell"
      data-demo-id="state-loading"
    >
      <div aria-label={t("Loading")} className="size-8" role="status">
        <svg
          aria-hidden="true"
          className="size-full text-signal motion-safe:animate-spin"
          data-demo-id="state-loading-indicator"
          viewBox="0 0 32 32"
        >
          <circle
            className="opacity-20"
            cx="16"
            cy="16"
            fill="none"
            r="13"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M16 3a13 13 0 0 1 13 13"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </div>
    </main>
  );
}

export const StateRuntimeController = observer(
  ({
    children,
    mode,
    transport,
  }: {
    children: ReactNode;
    mode: StateRuntimeMode;
    transport?: StateRuntimeTransport;
  }) => {
    const store = useOrgStore();
    const t = useUiText();
    const { locale, setLocale } = useAppLocale();
    const { setTheme } = useTheme();
    const [ready, setReady] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<StateRuntimeContextValue["error"]>(null);
    const [conflict, setConflict] = useState<StateConflict | null>(null);
    const originIdRef = useRef(crypto.randomUUID());
    const stampRef = useRef<StateStamp>({ counter: -1, originId: "" });
    const channelRef = useRef<BroadcastChannel | null>(null);
    const applyingRef = useRef(false);
    const organizationSequenceRef = useRef(store.organizationChangeSequence);
    const uiSequenceRef = useRef(store.uiChangeSequence);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<number | null>(null);
    const uiWriteTimerRef = useRef<number | null>(null);
    const writerRef = useRef<AutomaticStateWriter | null>(null);
    const baseStateRef = useRef<OrgToolsState | null>(null);
    const revisionRef = useRef(0);
    const reconcilingRef = useRef(false);
    const deferredConflictRef = useRef<StateConflict | null>(null);
    const initialLocaleRef = useRef(locale);
    const initialThemeRef = useRef(store.theme);
    const setLocaleRef = useRef(setLocale);
    const setThemeRef = useRef(setTheme);
    setLocaleRef.current = setLocale;
    setThemeRef.current = setTheme;

    const syncEnvironment = useCallback((state: OrgToolsState) => {
      setThemeRef.current(state.ui.theme);
      setLocaleRef.current(state.ui.locale);
    }, []);

    const installState = useCallback(
      (state: OrgToolsState, stamp: StateStamp) => {
        applyingRef.current = true;
        store.loadOrgToolsState(state, null, null);
        store.resetChangeTracking();
        organizationSequenceRef.current = store.organizationChangeSequence;
        uiSequenceRef.current = store.uiChangeSequence;
        stampRef.current = stamp;
        syncEnvironment(state);
        applyingRef.current = false;
      },
      [store, syncEnvironment],
    );

    const installUi = useCallback(
      (ui: OrgToolsState["ui"], stamp: StateStamp) => {
        applyingRef.current = true;
        store.applyDurableUiState(ui);
        organizationSequenceRef.current = store.organizationChangeSequence;
        uiSequenceRef.current = store.uiChangeSequence;
        stampRef.current = stamp;
        setThemeRef.current(ui.theme);
        setLocaleRef.current(ui.locale);
        applyingRef.current = false;
      },
      [store],
    );

    const reconcileExternal = useCallback(async () => {
      if (mode !== "sqlite" || !transport || reconcilingRef.current) return;
      const base = baseStateRef.current;
      if (!base) return;
      reconcilingRef.current = true;
      try {
        const local = store.createOrgToolsState();
        const remote = await transport.load();
        if (remote.revision <= revisionRef.current) return;
        revisionRef.current = remote.revision;
        const merge = mergeOrgToolsStates(base, local, remote.state);
        if (merge.conflicts.length > 0) {
          setConflict({ ...merge, local, remote });
          setPending(true);
          return;
        }
        const merged = merge.useRemote;
        baseStateRef.current = remote.state;
        installState(merged, { counter: remote.revision, originId: "server" });
        if (JSON.stringify(merged) === JSON.stringify(remote.state)) {
          writerRef.current?.discardPending();
          setPending(false);
        } else {
          writerRef.current?.enqueue({ scope: "all", state: merged });
          writerRef.current?.retry();
        }
        setError(null);
      } catch (mergeError) {
        const code = errorCodeFrom(mergeError);
        setError(code === "invalid_input" ? "invalid_state" : code);
      } finally {
        reconcilingRef.current = false;
      }
    }, [installState, mode, store, transport]);

    const post = useCallback((message: StateChannelMessage) => {
      channelRef.current?.postMessage(message);
    }, []);

    useEffect(() => {
      const channel = new BroadcastChannel(STATE_CHANNEL_NAME);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<unknown>) => {
        let message: StateChannelMessage;
        try {
          message = parseStateChannelMessage(event.data);
        } catch {
          return;
        }
        if (message.type === "request") {
          if (!ready || message.originId === originIdRef.current) return;
          post({ stamp: stampRef.current, state: store.createOrgToolsState(), type: "state" });
          return;
        }
        if (message.stamp.originId === originIdRef.current) return;
        if (compareStateStamps(message.stamp, stampRef.current) <= 0) return;
        if (message.type === "state") installState(message.state, message.stamp);
        else installUi(message.ui, message.stamp);
      };
      post({ originId: originIdRef.current, type: "request" });
      return () => {
        channel.close();
        channelRef.current = null;
      };
    }, [installState, installUi, post, ready, store]);

    useEffect(() => {
      if (mode !== "sqlite") return;
      writerRef.current = new AutomaticStateWriter({
        onError: (writeError) => {
          const code = errorCodeFrom(writeError);
          if (code === "revision_conflict") {
            void reconcileExternal();
            return;
          }
          setError(code === "invalid_input" ? "invalid_state" : code);
          retryCountRef.current += 1;
          if (retryCountRef.current <= 3) {
            retryTimerRef.current = window.setTimeout(
              () => writerRef.current?.retry(),
              Math.min(4_000, 500 * 2 ** (retryCountRef.current - 1)),
            );
          }
        },
        onPendingChange: setPending,
        onSuccess: (document) => {
          retryCountRef.current = 0;
          setError(null);
          baseStateRef.current = document.state;
          revisionRef.current = document.revision;
          const stamp = { counter: document.revision, originId: "server" } satisfies StateStamp;
          if (compareStateStamps(stamp, stampRef.current) > 0) stampRef.current = stamp;
        },
        write: (request) => {
          if (!transport) throw new Error("State runtime transport is missing.");
          return transport.write(request);
        },
      });
      return () => {
        writerRef.current = null;
        if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
      };
    }, [mode, reconcileExternal, transport]);

    useEffect(() => {
      let active = true;
      const initialize = async () => {
        if (mode === "browser") {
          const blank = createBlankOrgToolsState(initialThemeRef.current, initialLocaleRef.current);
          installState(blank, { counter: -1, originId: "" });
          window.setTimeout(() => {
            if (!active) return;
            if (stampRef.current.counter < 0) {
              stampRef.current = { counter: 0, originId: originIdRef.current };
            }
            setReady(true);
          }, 120);
          return;
        }
        try {
          if (!transport) throw new Error("State runtime transport is missing.");
          const document = await transport.load();
          if (!active) return;
          baseStateRef.current = document.state;
          revisionRef.current = document.revision;
          installState(document.state, { counter: document.revision, originId: "server" });
          setReady(true);
        } catch (loadError) {
          if (!active) return;
          const code = errorCodeFrom(loadError);
          setError(code === "invalid_input" ? "invalid_state" : code);
        }
      };
      void initialize();
      return () => {
        active = false;
      };
    }, [installState, mode, transport]);

    useEffect(() => {
      if (!ready || mode !== "sqlite" || !transport?.subscribe) return;
      return transport.subscribe((event) => {
        if (event.source !== "mcp" || event.revision <= revisionRef.current) return;
        void reconcileExternal();
      });
    }, [mode, ready, reconcileExternal, transport]);

    useEffect(() => {
      if (!ready || applyingRef.current || store.locale === locale) return;
      store.setLocale(locale);
    }, [locale, ready, store]);

    useEffect(() => {
      if (!ready || applyingRef.current) return;
      if (store.organizationChangeSequence === organizationSequenceRef.current) return;
      organizationSequenceRef.current = store.organizationChangeSequence;
      uiSequenceRef.current = store.uiChangeSequence;
      const state = store.createOrgToolsState();
      if (uiWriteTimerRef.current !== null) {
        window.clearTimeout(uiWriteTimerRef.current);
        uiWriteTimerRef.current = null;
      }
      const stamp = nextStateStamp(stampRef.current, originIdRef.current);
      stampRef.current = stamp;
      post({ stamp, state, type: "state" });
      writerRef.current?.enqueue({ scope: "all", state });
    }, [post, ready, store, store.organizationChangeSequence]);

    useEffect(() => {
      if (!ready || applyingRef.current) return;
      if (store.uiChangeSequence === uiSequenceRef.current) return;
      uiSequenceRef.current = store.uiChangeSequence;
      const ui = store.createDurableUiState();
      const stamp = nextStateStamp(stampRef.current, originIdRef.current);
      stampRef.current = stamp;
      post({ stamp, type: "ui", ui });
      if (uiWriteTimerRef.current !== null) window.clearTimeout(uiWriteTimerRef.current);
      uiWriteTimerRef.current = window.setTimeout(() => {
        writerRef.current?.enqueue({ scope: "ui", ui: store.createDurableUiState() });
        uiWriteTimerRef.current = null;
      }, 300);
    }, [post, ready, store, store.uiChangeSequence]);

    useEffect(
      () => () => {
        if (uiWriteTimerRef.current !== null) window.clearTimeout(uiWriteTimerRef.current);
      },
      [],
    );

    useEffect(() => {
      if (!pending) return;
      const beforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", beforeUnload);
      return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [pending]);

    const retry = useCallback(() => {
      retryCountRef.current = 0;
      if (deferredConflictRef.current) {
        setConflict(deferredConflictRef.current);
        deferredConflictRef.current = null;
        setError(null);
        return;
      }
      if (mode === "sqlite" && !ready) {
        if (!transport) return;
        void transport
          .load()
          .then((document) => {
            baseStateRef.current = document.state;
            revisionRef.current = document.revision;
            installState(document.state, { counter: document.revision, originId: "server" });
            setError(null);
            setReady(true);
          })
          .catch((loadError) => {
            const code = errorCodeFrom(loadError);
            setError(code === "invalid_input" ? "invalid_state" : code);
          });
        return;
      }
      writerRef.current?.retry();
    }, [installState, mode, ready, transport]);

    const resolveConflict = useCallback(
      (choice: "local" | "remote") => {
        if (!conflict) return;
        const state = choice === "local" ? conflict.keepLocal : conflict.useRemote;
        baseStateRef.current = conflict.remote.state;
        revisionRef.current = conflict.remote.revision;
        installState(state, { counter: conflict.remote.revision, originId: "server" });
        setConflict(null);
        deferredConflictRef.current = null;
        setError(null);
        if (JSON.stringify(state) === JSON.stringify(conflict.remote.state)) {
          writerRef.current?.discardPending();
          setPending(false);
        } else {
          writerRef.current?.enqueue({ scope: "all", state });
          writerRef.current?.retry();
        }
      },
      [conflict, installState],
    );

    const deferConflict = useCallback(() => {
      deferredConflictRef.current = conflict;
      setConflict(null);
      setError("revision_conflict");
      setPending(true);
    }, [conflict]);

    const context = useMemo<StateRuntimeContextValue>(
      () => ({ error, mode, pending, retry }),
      [error, mode, pending, retry],
    );

    if (!ready && mode === "sqlite" && error) {
      return (
        <main className="flex h-dvh items-center justify-center bg-shell p-6 text-foreground">
          <section className="w-full max-w-md rounded-xl bg-card p-6">
            <HiOutlineCircleStack className="mb-5 size-8 text-muted-foreground" />
            <h1 className="text-lg font-semibold">
              {error === "corrupt_stored_state"
                ? t("Stored state is corrupt")
                : t("Database unavailable")}
            </h1>
            <Button className="mt-6" onClick={retry} type="button">
              {t("Retry")}
            </Button>
          </section>
        </main>
      );
    }
    if (!ready) return <StateLoading />;
    return (
      <StateRuntimeContext.Provider value={context}>
        {children}
        <AlertDialog
          onOpenChange={(open) => {
            if (!open && conflict) deferConflict();
          }}
          open={conflict !== null}
        >
          <AlertDialogContent data-demo-id="state-merge-conflict">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Concurrent changes need review")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "Org Tools and MCP changed the same {count} values. Independent changes are preserved.",
                  { count: conflict?.conflicts.length ?? 0 },
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={deferConflict}>{t("Cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => resolveConflict("remote")}>
                {t("Use MCP")}
              </AlertDialogAction>
              <AlertDialogAction onClick={() => resolveConflict("local")}>
                {t("Keep local")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </StateRuntimeContext.Provider>
    );
  },
);
