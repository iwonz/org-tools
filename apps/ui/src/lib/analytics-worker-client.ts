import type { AnalyticsFilterScalar, AnalyticsWidget } from "@org-tools/types";

import {
  type AnalyticsAppliedFilter,
  type AnalyticsQueryResult,
  type AnalyticsRow,
  executeAnalyticsQuery,
  getAnalyticsFilterOptions,
} from "@/lib/analytics-query";

type Pending = { reject: (error: Error) => void; resolve: (value: unknown) => void };

export class AnalyticsWorkerClient {
  private generation = 0;
  private inFlight = new Map<string, Promise<unknown>>();
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private worker: Worker | null = null;

  constructor() {
    if (typeof Worker === "undefined") return;
    this.worker = new Worker(new URL("./analytics-worker.ts", import.meta.url), { type: "module" });
    this.worker.addEventListener(
      "message",
      (event: MessageEvent<{ error?: string; id: number; result?: unknown }>) => {
        const pending = this.pending.get(event.data.id);
        if (!pending) return;
        this.pending.delete(event.data.id);
        if (event.data.error) pending.reject(new Error(event.data.error));
        else pending.resolve(event.data.result);
      },
    );
    this.worker.addEventListener("error", (event) => {
      const error = new Error(event.message || "Analytics Worker failed.");
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });
  }

  cancelObsolete(): void {
    this.generation += 1;
    for (const pending of this.pending.values())
      pending.reject(new DOMException("Analytics request superseded.", "AbortError"));
    this.pending.clear();
    this.inFlight.clear();
  }

  dispose(): void {
    this.cancelObsolete();
    this.worker?.terminate();
    this.worker = null;
  }

  private request<T>(
    key: string,
    payload: Record<string, unknown>,
    fallback: () => T | Promise<T>,
  ): Promise<T> {
    const current = this.inFlight.get(key);
    if (current) return current as Promise<T>;
    const generation = this.generation;
    const request = this.worker
      ? this.workerRequest<T>(payload)
      : Promise.resolve()
          .then(fallback)
          .then((value) => {
            if (generation !== this.generation) {
              throw new DOMException("Analytics request superseded.", "AbortError");
            }
            return value;
          });
    this.inFlight.set(key, request);
    const clear = () => {
      if (this.inFlight.get(key) === request) this.inFlight.delete(key);
    };
    void request.then(clear, clear);
    return request;
  }

  private workerRequest<T>(payload: Record<string, unknown>): Promise<T> {
    const id = this.nextId++;
    const generation = this.generation;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        reject,
        resolve: (value) =>
          generation === this.generation
            ? resolve(value as T)
            : reject(new DOMException("Analytics request superseded.", "AbortError")),
      });
      this.worker?.postMessage({ ...payload, id });
    });
  }

  query(
    key: string,
    widget: AnalyticsWidget,
    rows: AnalyticsRow[],
    filters: AnalyticsAppliedFilter[],
  ): Promise<AnalyticsQueryResult> {
    return this.request(key, { filters, key, kind: "query", rows, widget }, () =>
      executeAnalyticsQuery(widget, rows, filters),
    );
  }

  options(key: string, field: string, rows: AnalyticsRow[]): Promise<AnalyticsFilterScalar[]> {
    return this.request(key, { field, key, kind: "options", rows }, () =>
      getAnalyticsFilterOptions(field, rows),
    );
  }
}
