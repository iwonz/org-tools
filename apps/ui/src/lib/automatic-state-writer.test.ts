import { describe, expect, it, vi } from "vitest";

import { AutomaticStateWriter } from "@/lib/automatic-state-writer";
import { createBlankOrgToolsState } from "@/lib/org-file";
import type { StateDocument, StatePutRequest } from "@/lib/state-runtime";

const flushTasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("automatic state writer", () => {
  it("keeps one write active and replaces pending snapshots with the latest state", async () => {
    const state = createBlankOrgToolsState();
    const requests: StatePutRequest[] = [];
    let resolveWrite: ((document: StateDocument) => void) | null = null;
    const write = vi.fn(
      (request: StatePutRequest) =>
        new Promise<StateDocument>((resolve) => {
          requests.push(request);
          resolveWrite = resolve;
        }),
    );
    const writer = new AutomaticStateWriter({ onError: vi.fn(), write });

    writer.enqueue({ scope: "all", state });
    writer.enqueue({ scope: "ui", ui: { ...state.ui, sidebarCollapsed: false } });
    writer.enqueue({ scope: "ui", ui: { ...state.ui, locale: "ru" } });
    expect(write).toHaveBeenCalledTimes(1);

    expect(resolveWrite).not.toBeNull();
    (resolveWrite as unknown as (document: StateDocument) => void)({ revision: 2, state });
    await flushTasks();
    expect(write).toHaveBeenCalledTimes(2);
    expect(requests[1]).toMatchObject({ scope: "ui", ui: { locale: "ru" } });
  });

  it("pauses after an error and retries the same latest snapshot", async () => {
    const state = createBlankOrgToolsState();
    const onError = vi.fn();
    const write = vi
      .fn<(request: StatePutRequest) => Promise<StateDocument>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ revision: 2, state });
    const writer = new AutomaticStateWriter({ onError, write });

    writer.enqueue({ scope: "all", state });
    await flushTasks();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(writer.hasPending).toBe(true);

    writer.retry();
    await flushTasks();
    expect(write).toHaveBeenCalledTimes(2);
    expect(writer.hasPending).toBe(false);
  });

  it("ignores the late outcome of an explicitly discarded active write", async () => {
    const state = createBlankOrgToolsState();
    const onError = vi.fn();
    const onSuccess = vi.fn();
    let rejectWrite: ((error: Error) => void) | undefined;
    const write = vi.fn(
      () =>
        new Promise<StateDocument>((_resolve, reject) => {
          rejectWrite = reject;
        }),
    );
    const writer = new AutomaticStateWriter({ onError, onSuccess, write });

    writer.enqueue({ scope: "all", state });
    writer.discardPending();
    rejectWrite?.(new Error("stale conflict"));
    await flushTasks();

    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(writer.hasPending).toBe(false);
  });
});
