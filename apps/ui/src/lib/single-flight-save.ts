export type SingleFlightSaveState = {
  current: Promise<boolean> | null;
};

export const runSingleFlightSave = async (
  state: SingleFlightSaveState,
  operation: () => Promise<boolean>,
): Promise<boolean> => {
  if (state.current) return state.current;
  const current = Promise.resolve().then(operation);
  state.current = current;
  try {
    return await current;
  } finally {
    if (state.current === current) state.current = null;
  }
};
