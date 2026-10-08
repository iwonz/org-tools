export type ScreenshotSelectionScenario = {
  id: string;
  module: string;
};

export function createScreenshotSelection(
  manifest: readonly ScreenshotSelectionScenario[],
  input: { ids?: string | undefined; modules?: string | undefined },
): Set<string> {
  const modules = new Set(
    (input.modules ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const ids = new Set(
    (input.ids ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const availableModules = new Set(manifest.map((scenario) => scenario.module));
  const availableIds = new Set(manifest.map((scenario) => scenario.id));
  const unknownModules = [...modules].filter((module) => !availableModules.has(module));
  const unknownIds = [...ids].filter((id) => !availableIds.has(id));
  if (unknownModules.length || unknownIds.length) {
    throw new Error(
      `Unknown screenshot selection: modules=${unknownModules.join(",")}; ids=${unknownIds.join(",")}`,
    );
  }
  if (modules.size === 0 && ids.size === 0) {
    return new Set(manifest.map((scenario) => scenario.id));
  }
  return new Set(
    manifest
      .filter((scenario) => modules.has(scenario.module) || ids.has(scenario.id))
      .map((scenario) => scenario.id),
  );
}
