import { describe, expect, test } from "vitest";

import { createAnalyticsWidget } from "@/lib/analytics-dashboard";
import { AnalyticsLruCache } from "@/lib/analytics-lru";
import type { AnalyticsRow } from "@/lib/analytics-query";
import { AnalyticsWorkerClient } from "@/lib/analytics-worker-client";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

describe("Analytics Worker transport", () => {
  test("bounds and promotes LRU entries", () => {
    const cache = new AnalyticsLruCache<number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    cache.set("c", 3);
    expect(cache.size).toBe(2);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  test("deduplicates matching requests and invalidates by revision key", async () => {
    const client = new AnalyticsWorkerClient();
    const widget = createAnalyticsWidget("kpi", uuid(100), "Employees");
    const firstRows: AnalyticsRow[] = [{ employeeId: uuid(1), rowId: "one", values: {} }];
    const secondRows: AnalyticsRow[] = [
      ...firstRows,
      { employeeId: uuid(2), rowId: "two", values: {} },
    ];
    const first = client.query("revision-1", widget, firstRows, []);
    const duplicate = client.query("revision-1", widget, firstRows, []);
    expect(duplicate).toBe(first);
    expect((await first).rows[0]?.measures[widget.query.measures[0]?.id ?? ""]).toBe(1);
    expect(
      (await client.query("revision-2", widget, secondRows, [])).rows[0]?.measures[
        widget.query.measures[0]?.id ?? ""
      ],
    ).toBe(2);
    client.dispose();
  });

  test("rejects an obsolete fallback consumer", async () => {
    const client = new AnalyticsWorkerClient();
    const widget = createAnalyticsWidget("kpi", uuid(100), "Employees");
    const request = client.query("old", widget, [], []);
    client.cancelObsolete();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    client.dispose();
  });
});
