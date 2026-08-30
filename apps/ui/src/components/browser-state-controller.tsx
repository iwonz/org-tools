"use client";

import type { ReactNode } from "react";

import { StateRuntimeController } from "@/components/state-runtime-controller";

export function BrowserStateController({ children }: { children: ReactNode }) {
  return <StateRuntimeController mode="browser">{children}</StateRuntimeController>;
}
