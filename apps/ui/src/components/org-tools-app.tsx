"use client";

import { AuthProvider } from "@/components/auth-context";
import { AuthGate } from "@/components/auth-gate";
import { AuthenticatedStateController } from "@/components/authenticated-state-controller";
import { OrgToolsShell } from "@/components/org-tools-shell";
import { OrgStoreProvider } from "@/stores/org-store-context";

function StateApp() {
  return (
    <AuthenticatedStateController>
      <OrgToolsShell />
    </AuthenticatedStateController>
  );
}

export function OrgToolsApp() {
  return (
    <OrgStoreProvider>
      <AuthProvider>
        <AuthGate>
          <StateApp />
        </AuthGate>
      </AuthProvider>
    </OrgStoreProvider>
  );
}
