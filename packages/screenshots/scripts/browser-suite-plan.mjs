export function createBrowserSuiteBatches(suites, forwardedArguments) {
  const combinedRun = forwardedArguments.some(
    (argument) =>
      argument.startsWith("--shard") || argument === "--grep" || argument.startsWith("--grep="),
  );
  return combinedRun ? [[...suites]] : suites.map((suite) => [suite]);
}
