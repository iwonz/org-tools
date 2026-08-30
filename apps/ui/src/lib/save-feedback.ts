export const SAVE_FEEDBACK_DURATION_MS = 2_000;

export type SaveFeedback = "failed" | "saved" | "saving" | "unsaved" | null;

type TimerHandle = ReturnType<typeof setTimeout>;

export function createSaveFeedbackController({
  clearTimer = clearTimeout,
  onChange,
  setTimer = setTimeout,
}: {
  clearTimer?: (timer: TimerHandle) => void;
  onChange: (feedback: SaveFeedback) => void;
  setTimer?: (callback: () => void, delay: number) => TimerHandle;
}) {
  let timer: TimerHandle | null = null;

  const cancelTimer = () => {
    if (timer === null) return;
    clearTimer(timer);
    timer = null;
  };

  const showTransient = (feedback: "saved" | "unsaved") => {
    cancelTimer();
    onChange(feedback);
    timer = setTimer(() => {
      timer = null;
      onChange(null);
    }, SAVE_FEEDBACK_DURATION_MS);
  };

  return {
    changed: () => showTransient("unsaved"),
    dispose: cancelTimer,
    failed: () => {
      cancelTimer();
      onChange("failed");
    },
    started: () => {
      cancelTimer();
      onChange("saving");
    },
    succeeded: () => showTransient("saved"),
  };
}
