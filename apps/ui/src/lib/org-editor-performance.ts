export type OrgEditorPerformanceCounters = {
  canvasElementRenders: number;
  fontInvalidations: number;
  richTextLayoutComputations: number;
  textMeasureHits: number;
  textMeasureMisses: number;
  unitRenders: number;
  viewportFrames: number;
  viewportWindowInvalidations: number;
};

const createCounters = (): OrgEditorPerformanceCounters => ({
  canvasElementRenders: 0,
  fontInvalidations: 0,
  richTextLayoutComputations: 0,
  textMeasureHits: 0,
  textMeasureMisses: 0,
  unitRenders: 0,
  viewportFrames: 0,
  viewportWindowInvalidations: 0,
});

let enabled = false;
let counters = createCounters();

export const setOrgEditorPerformanceDiagnosticsEnabled = (nextEnabled: boolean) => {
  enabled = nextEnabled;
};

export const resetOrgEditorPerformanceDiagnostics = () => {
  counters = createCounters();
};

export const recordOrgEditorPerformance = (counter: keyof OrgEditorPerformanceCounters) => {
  if (enabled) counters[counter] += 1;
};

export const getOrgEditorPerformanceDiagnostics = (): OrgEditorPerformanceCounters => ({
  ...counters,
});
