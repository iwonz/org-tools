"use client";

import { useEffect, useRef, useState } from "react";

import type { WorkspaceSaveStatus } from "@/components/workspace-persistence-context";
import { createSaveFeedbackController, type SaveFeedback } from "@/lib/save-feedback";

export function useSaveFeedback({
  changeSequence,
  dirty,
  saveStatus,
}: {
  changeSequence: number;
  dirty: boolean;
  saveStatus: WorkspaceSaveStatus;
}) {
  const [feedback, setFeedback] = useState<SaveFeedback>(null);
  const controllerRef = useRef<ReturnType<typeof createSaveFeedbackController> | null>(null);
  const previousSequenceRef = useRef(changeSequence);
  const previousStatusRef = useRef(saveStatus);

  if (controllerRef.current === null) {
    controllerRef.current = createSaveFeedbackController({ onChange: setFeedback });
  }

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || previousSequenceRef.current === changeSequence) return;
    previousSequenceRef.current = changeSequence;
    if (dirty && saveStatus !== "saving") controller.changed();
  }, [changeSequence, dirty, saveStatus]);

  useEffect(() => {
    const controller = controllerRef.current;
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = saveStatus;
    if (!controller || previousStatus === saveStatus) return;

    if (saveStatus === "saving") controller.started();
    else if (saveStatus === "failed") controller.failed();
    else if (saveStatus === "saved" && previousStatus === "saving") controller.succeeded();
  }, [saveStatus]);

  useEffect(() => () => controllerRef.current?.dispose(), []);

  return feedback;
}
