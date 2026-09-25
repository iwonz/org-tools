/// <reference lib="webworker" />

import type { AnalyticsWidget } from "@org-tools/types";
import { AnalyticsLruCache } from "@/lib/analytics-lru";
import {
  type AnalyticsAppliedFilter,
  type AnalyticsRow,
  executeAnalyticsQuery,
  getAnalyticsFilterOptions,
} from "@/lib/analytics-query";

type WorkerRequest =
  | {
      filters: AnalyticsAppliedFilter[];
      id: number;
      key: string;
      kind: "query";
      rows: AnalyticsRow[];
      widget: AnalyticsWidget;
    }
  | { field: string; id: number; key: string; kind: "options"; rows: AnalyticsRow[] };

const MAX_CACHE_ENTRIES = 96;
const resultCache = new AnalyticsLruCache<unknown>(MAX_CACHE_ENTRIES);

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    let result = resultCache.get(request.key);
    if (result === undefined) {
      result =
        request.kind === "query"
          ? executeAnalyticsQuery(request.widget, request.rows, request.filters)
          : getAnalyticsFilterOptions(request.field, request.rows);
      resultCache.set(request.key, result);
    }
    self.postMessage({ id: request.id, result });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
      id: request.id,
    });
  }
});
