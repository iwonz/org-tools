export type PerformanceTimingMetrics = {
  inputMaximumMs: number;
  inputMedianP95Ms: number;
  inputP95Samples: number[];
  mode: "full" | "structural";
  panMaximumMs: number;
  panMedianP95Ms: number;
  panP95Samples: number[];
};

export const percentile95 = (samples: number[]) => {
  const sorted = [...samples].sort((first, second) => first - second);
  return sorted[Math.floor((sorted.length - 1) * 0.95)] ?? 0;
};

export const median = (samples: number[]) => {
  const sorted = [...samples].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

export function evaluateTimingPolicy(metrics: PerformanceTimingMetrics): string[] {
  if (metrics.mode === "structural") return [];
  const violations: string[] = [];
  if (metrics.panP95Samples.length !== 3 || metrics.inputP95Samples.length !== 3) {
    violations.push("Full timing requires exactly three pan and input samples.");
  }
  if (metrics.panMedianP95Ms > 100) violations.push("Median pan p95 exceeds 100 ms.");
  if (metrics.inputMedianP95Ms > 200) violations.push("Median input p95 exceeds 200 ms.");
  if (Math.max(metrics.panMaximumMs, metrics.inputMaximumMs) > 1_000) {
    violations.push("A measured latency exceeds 1000 ms.");
  }
  return violations;
}
