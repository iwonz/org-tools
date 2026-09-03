"use client";

import { HiOutlineArrowUturnLeft, HiOutlineArrowUturnRight } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { useUiText } from "@/i18n/use-ui-text";

const ACTION_CLASS_NAME =
  "size-9 rounded-md border-0 bg-transparent shadow-none hover:bg-accent focus-visible:ring-inset";

export function OrgEditorHistoryToolbar({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onUndo: () => void;
}) {
  const t = useUiText();
  return (
    <div className="flex items-center gap-1" data-demo-id="org-editor-history-toolbar">
      <Button
        aria-label={t("Undo")}
        className={ACTION_CLASS_NAME}
        data-demo-id="org-editor-undo-button"
        disabled={!canUndo}
        onClick={onUndo}
        size="icon"
        title={t("Undo")}
        variant="ghost"
      >
        <HiOutlineArrowUturnLeft />
      </Button>
      <Button
        aria-label={t("Redo")}
        className={ACTION_CLASS_NAME}
        data-demo-id="org-editor-redo-button"
        disabled={!canRedo}
        onClick={onRedo}
        size="icon"
        title={t("Redo")}
        variant="ghost"
      >
        <HiOutlineArrowUturnRight />
      </Button>
    </div>
  );
}
