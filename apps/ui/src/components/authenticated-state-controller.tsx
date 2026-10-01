"use client";

import type {
  AuthorizedOrganizationProjection,
  OrgToolsState,
  SessionBootstrap,
} from "@org-tools/types";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useAppLocale } from "@/components/locale-provider";
import { StateRuntimeContext } from "@/components/state-runtime-context";
import { hydrateAuthorizedEmployee } from "@/lib/authorized-projection-client";
import { installAuthorizedTemplateValues } from "@/lib/custom-employee-fields";
import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import { useOrgStore } from "@/stores/org-store-context";

const hydrateState = (bootstrap: SessionBootstrap): OrgToolsState => {
  const blank = createBlankOrgToolsState(bootstrap.ui.theme, bootstrap.ui.locale);
  const projection: AuthorizedOrganizationProjection = bootstrap.projection;
  const blankSystemView = blank.organization.views.find((view) => view.kind === "system");
  if (!blankSystemView) throw new Error("Blank state is missing the system View.");
  const views = projection.views.some((view) => view.kind === "system")
    ? projection.views
    : [...projection.views, blankSystemView];
  const organization: OrgToolsState["organization"] = {
    ...projection,
    employees: projection.employees.map(hydrateAuthorizedEmployee),
    views,
  };
  try {
    return parseOrgToolsState({ organization, ui: bootstrap.ui });
  } catch {
    const ui = {
      ...blank.ui,
      locale: bootstrap.ui.locale,
      sidebarCollapsed: bootstrap.ui.sidebarCollapsed,
      theme: bootstrap.ui.theme,
    };
    return parseOrgToolsState({ organization, ui });
  }
};

const commandHeaders = (csrfToken: string): HeadersInit => ({
  "Content-Type": "application/json",
  "X-Org-Tools-CSRF": csrfToken,
});

const readSessionBootstrap = async (): Promise<SessionBootstrap> => {
  const response = await fetch("/api/session", { cache: "no-store" });
  if (!response.ok) throw new Error("session_read_failed");
  return (await response.json()) as SessionBootstrap;
};

const committedOrganizationJsonByStore = new WeakMap<object, string>();
const activeControllerByStore = new WeakMap<object, symbol>();

export const AuthenticatedStateController = observer(function AuthenticatedStateController({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useAuth();
  const updateAuthBootstrap = auth.updateBootstrap;
  const store = useOrgStore();
  const controllerIdRef = useRef(Symbol("authenticated-state-controller"));
  const isActiveController = useCallback(
    () => activeControllerByStore.get(store) === controllerIdRef.current,
    [store],
  );
  const { setLocale } = useAppLocale();
  const { setTheme } = useTheme();
  const setLocaleRef = useRef(setLocale);
  const setThemeRef = useRef(setTheme);
  setLocaleRef.current = setLocale;
  setThemeRef.current = setTheme;
  const [initialized, setInitialized] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"database_unavailable" | "invalid_state" | null>(null);
  const applyingRef = useRef(false);
  const revisionRef = useRef(auth.bootstrap?.organizationRevision ?? 0);
  const securityRevisionRef = useRef(auth.bootstrap?.securityRevision ?? 0);
  const uiTimerRef = useRef<number | null>(null);
  const deferredUiSyncRef = useRef(false);
  const deferredUiEventIdsRef = useRef(new Set<string>());
  const ownUiEventIdsRef = useRef(new Set<string>());
  const organizationWriteActiveRef = useRef(false);
  const organizationWriteQueuedRef = useRef(false);
  const uiWriteActiveRef = useRef(false);
  const uiWriteQueuedRef = useRef(false);
  const deferredRevisionRef = useRef({ organization: 0, security: 0 });
  const organizationSequenceRef = useRef(store.organizationChangeSequence);
  const uiSequenceRef = useRef(store.uiChangeSequence);
  const locallyCommittedBootstrapRef = useRef<SessionBootstrap | null>(null);
  const latestBootstrapRef = useRef<SessionBootstrap | null>(auth.bootstrap);

  useLayoutEffect(() => {
    const controllerId = controllerIdRef.current;
    activeControllerByStore.set(store, controllerId);
    return () => {
      if (activeControllerByStore.get(store) === controllerId) {
        activeControllerByStore.delete(store);
        installAuthorizedTemplateValues([]);
      }
    };
  }, [store]);

  const install = useCallback(
    (bootstrap: SessionBootstrap) => {
      if (!isActiveController()) return;
      installAuthorizedTemplateValues(bootstrap.projection.employees);
      const state = hydrateState(bootstrap);
      applyingRef.current = true;
      store.loadOrgToolsState(state, null, null);
      store.resetChangeTracking();
      committedOrganizationJsonByStore.set(store, JSON.stringify(state.organization));
      organizationSequenceRef.current = store.organizationChangeSequence;
      uiSequenceRef.current = store.uiChangeSequence;
      revisionRef.current = bootstrap.organizationRevision;
      securityRevisionRef.current = bootstrap.securityRevision;
      latestBootstrapRef.current = bootstrap;
      setLocaleRef.current(state.ui.locale);
      setThemeRef.current(state.ui.theme);
      applyingRef.current = false;
      setError(null);
    },
    [isActiveController, store],
  );

  useLayoutEffect(() => {
    if (auth.bootstrap) {
      if (auth.bootstrap === locallyCommittedBootstrapRef.current) {
        latestBootstrapRef.current = auth.bootstrap;
        installAuthorizedTemplateValues(auth.bootstrap.projection.employees);
      } else {
        install(auth.bootstrap);
      }
      setInitialized(true);
    }
  }, [auth.bootstrap, install]);

  const applyRefreshedBootstrap = useCallback(
    (bootstrap: SessionBootstrap, preserveUi: boolean) => {
      const nextBootstrap = preserveUi
        ? { ...bootstrap, ui: store.createDurableUiState() }
        : bootstrap;
      locallyCommittedBootstrapRef.current = nextBootstrap;
      install(nextBootstrap);
      updateAuthBootstrap(nextBootstrap);
      return nextBootstrap;
    },
    [install, store, updateAuthBootstrap],
  );

  const refresh = useCallback(async () => {
    try {
      applyRefreshedBootstrap(await readSessionBootstrap(), false);
    } catch {
      setError("database_unavailable");
    }
  }, [applyRefreshedBootstrap]);

  const refreshOrganization = useCallback(async () => {
    try {
      const bootstrap = await readSessionBootstrap();
      if (
        bootstrap.organizationRevision <= revisionRef.current &&
        bootstrap.securityRevision <= securityRevisionRef.current
      ) {
        return;
      }
      applyRefreshedBootstrap(bootstrap, true);
    } catch {
      setError("database_unavailable");
    }
  }, [applyRefreshedBootstrap]);

  const synchronizeUi = useCallback(async () => {
    if (
      organizationWriteActiveRef.current ||
      uiWriteActiveRef.current ||
      uiTimerRef.current !== null
    ) {
      deferredUiSyncRef.current = true;
      return;
    }
    try {
      const serverBootstrap = await readSessionBootstrap();
      const serverUi = JSON.stringify(serverBootstrap.ui);
      const localUi = JSON.stringify(store.createDurableUiState());
      if (serverUi !== localUi) {
        const currentBootstrap = latestBootstrapRef.current;
        const bootstrapIsNewer =
          serverBootstrap.organizationRevision > revisionRef.current ||
          serverBootstrap.securityRevision > securityRevisionRef.current;
        applyRefreshedBootstrap(
          bootstrapIsNewer || !currentBootstrap
            ? serverBootstrap
            : { ...currentBootstrap, ui: serverBootstrap.ui },
          false,
        );
      }
    } catch {
      setError("database_unavailable");
    }
  }, [applyRefreshedBootstrap, store]);

  const writeOrganization = useCallback(async () => {
    if (!isActiveController()) return;
    if (organizationWriteActiveRef.current) {
      organizationWriteQueuedRef.current = true;
      return;
    }
    organizationWriteActiveRef.current = true;
    organizationWriteQueuedRef.current = true;
    setPending(true);
    try {
      while (organizationWriteQueuedRef.current) {
        if (!isActiveController()) return;
        organizationWriteQueuedRef.current = false;
        const bootstrap = latestBootstrapRef.current;
        if (!bootstrap) return;
        const organization = store.createOrgToolsState().organization;
        const organizationJson = JSON.stringify(organization);
        if (organizationJson === committedOrganizationJsonByStore.get(store)) continue;
        const response = await fetch("/api/commands", {
          body: JSON.stringify({
            expectedOrganizationRevision: revisionRef.current,
            expectedSecurityRevision: securityRevisionRef.current,
            organization,
            type: bootstrap.access.isSuperAdmin ? "organization.replace" : "organization.patch",
          }),
          headers: commandHeaders(bootstrap.csrfToken),
          method: "POST",
        });
        if (!response.ok) {
          organizationWriteQueuedRef.current = false;
          await refreshOrganization();
          throw new Error("write_failed");
        }
        const result = (await response.json()) as Pick<
          SessionBootstrap,
          "access" | "organizationRevision" | "projection" | "securityRevision"
        >;
        revisionRef.current = result.organizationRevision;
        securityRevisionRef.current = result.securityRevision;
        committedOrganizationJsonByStore.set(store, organizationJson);
        const nextBootstrap = { ...bootstrap, ...result, ui: store.createDurableUiState() };
        latestBootstrapRef.current = nextBootstrap;
        installAuthorizedTemplateValues(result.projection.employees);
        locallyCommittedBootstrapRef.current = nextBootstrap;
        updateAuthBootstrap(nextBootstrap);
      }
    } catch {
      setError("database_unavailable");
    } finally {
      organizationWriteActiveRef.current = false;
      setPending(uiWriteActiveRef.current);
      if (deferredUiSyncRef.current) {
        deferredUiSyncRef.current = false;
        void synchronizeUi();
      }
      const deferred = deferredRevisionRef.current;
      deferredRevisionRef.current = { organization: 0, security: 0 };
      if (
        deferred.organization > revisionRef.current ||
        deferred.security > securityRevisionRef.current
      ) {
        void refreshOrganization();
      }
    }
  }, [isActiveController, refreshOrganization, store, synchronizeUi, updateAuthBootstrap]);

  const writeUi = useCallback(async () => {
    if (!isActiveController()) return;
    if (uiWriteActiveRef.current) {
      uiWriteQueuedRef.current = true;
      return;
    }
    uiWriteActiveRef.current = true;
    uiWriteQueuedRef.current = true;
    setPending(true);
    try {
      while (uiWriteQueuedRef.current) {
        if (!isActiveController()) return;
        uiWriteQueuedRef.current = false;
        const bootstrap = latestBootstrapRef.current;
        if (!bootstrap) return;
        const ui = store.createDurableUiState();
        const response = await fetch("/api/ui", {
          body: JSON.stringify(ui),
          headers: commandHeaders(bootstrap.csrfToken),
          method: "PUT",
        });
        if (!response.ok) {
          uiWriteQueuedRef.current = false;
          throw new Error("write_failed");
        }
        const result = (await response.json()) as {
          eventId: string;
          ui: SessionBootstrap["ui"];
        };
        ownUiEventIdsRef.current.add(result.eventId);
        while (ownUiEventIdsRef.current.size > 100) {
          const oldest = ownUiEventIdsRef.current.values().next().value;
          if (typeof oldest !== "string") break;
          ownUiEventIdsRef.current.delete(oldest);
        }
        if (deferredUiEventIdsRef.current.delete(result.eventId)) {
          ownUiEventIdsRef.current.delete(result.eventId);
        }
        if (deferredUiEventIdsRef.current.size > 0) {
          deferredUiEventIdsRef.current.clear();
          deferredUiSyncRef.current = true;
        }
        latestBootstrapRef.current = { ...bootstrap, ui: result.ui };
      }
    } catch {
      setError("database_unavailable");
    } finally {
      uiWriteActiveRef.current = false;
      setPending(organizationWriteActiveRef.current);
      if (deferredUiSyncRef.current) {
        deferredUiSyncRef.current = false;
        void synchronizeUi();
      }
    }
  }, [isActiveController, store, synchronizeUi]);

  useLayoutEffect(() => {
    const disposeOrganization = reaction(
      () => store.organizationChangeSequence,
      (sequence) => {
        if (applyingRef.current || sequence === organizationSequenceRef.current) return;
        organizationSequenceRef.current = sequence;
        void writeOrganization();
      },
    );
    const disposeUi = reaction(
      () => store.uiChangeSequence,
      (sequence) => {
        if (applyingRef.current || sequence === uiSequenceRef.current) return;
        uiSequenceRef.current = sequence;
        if (uiTimerRef.current !== null) window.clearTimeout(uiTimerRef.current);
        uiTimerRef.current = window.setTimeout(() => {
          uiTimerRef.current = null;
          void writeUi();
        }, 300);
      },
    );
    return () => {
      disposeOrganization();
      disposeUi();
      if (uiTimerRef.current !== null) window.clearTimeout(uiTimerRef.current);
    };
  }, [store, writeOrganization, writeUi]);

  useEffect(() => {
    const events = new EventSource("/api/events");
    const handle = (event: MessageEvent<string>) => {
      if (!isActiveController()) return;
      try {
        const value = JSON.parse(event.data) as {
          organizationRevision: number;
          securityRevision: number;
        };
        if (organizationWriteActiveRef.current) {
          deferredRevisionRef.current = {
            organization: Math.max(
              deferredRevisionRef.current.organization,
              value.organizationRevision,
            ),
            security: Math.max(deferredRevisionRef.current.security, value.securityRevision),
          };
        } else if (
          value.organizationRevision > revisionRef.current ||
          value.securityRevision > securityRevisionRef.current
        ) {
          void refreshOrganization();
        }
      } catch {
        // A malformed event is ignored; the next valid revision or reload repairs the client.
      }
    };
    events.addEventListener("organization", handle as EventListener);
    events.addEventListener("security", handle as EventListener);
    events.addEventListener("restore", () => {
      if (isActiveController()) void refresh();
    });
    events.addEventListener("ui", (event) => {
      if (!isActiveController()) return;
      const eventId = (event as MessageEvent<string>).lastEventId;
      if (ownUiEventIdsRef.current.delete(eventId)) return;
      if (uiWriteActiveRef.current) {
        deferredUiEventIdsRef.current.add(eventId);
        return;
      }
      void synchronizeUi();
    });
    events.addEventListener("session", () => {
      if (isActiveController()) void auth.refresh().catch(() => undefined);
    });
    return () => events.close();
  }, [auth.refresh, isActiveController, refresh, refreshOrganization, synchronizeUi]);

  useEffect(() => {
    if (!pending) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [pending]);

  const context = useMemo(
    () => ({ error, mode: "server" as const, pending, retry: refresh }),
    [error, pending, refresh],
  );
  if (!initialized) {
    return <main aria-busy="true" className="h-dvh w-dvw bg-shell" />;
  }
  return <StateRuntimeContext.Provider value={context}>{children}</StateRuntimeContext.Provider>;
});
