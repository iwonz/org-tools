import { describe, expect, it, vi } from "vitest";

import {
  createSaveFeedbackController,
  SAVE_FEEDBACK_DURATION_MS,
  type SaveFeedback,
} from "@/lib/save-feedback";

describe("save feedback", () => {
  it("clears unsaved and saved feedback after two seconds", () => {
    vi.useFakeTimers();
    const feedback: SaveFeedback[] = [];
    const controller = createSaveFeedbackController({
      onChange: (value) => feedback.push(value),
    });

    controller.changed();
    expect(feedback.at(-1)).toBe("unsaved");
    vi.advanceTimersByTime(SAVE_FEEDBACK_DURATION_MS);
    expect(feedback.at(-1)).toBeNull();

    controller.started();
    controller.succeeded();
    expect(feedback.at(-1)).toBe("saved");
    vi.advanceTimersByTime(SAVE_FEEDBACK_DURATION_MS);
    expect(feedback.at(-1)).toBeNull();
    vi.useRealTimers();
  });

  it("keeps failures visible until another change or save attempt", () => {
    vi.useFakeTimers();
    const feedback: SaveFeedback[] = [];
    const controller = createSaveFeedbackController({
      onChange: (value) => feedback.push(value),
    });

    controller.failed();
    vi.advanceTimersByTime(SAVE_FEEDBACK_DURATION_MS * 2);
    expect(feedback.at(-1)).toBe("failed");

    controller.started();
    expect(feedback.at(-1)).toBe("saving");
    controller.failed();
    controller.changed();
    expect(feedback.at(-1)).toBe("unsaved");
    vi.useRealTimers();
  });
});
