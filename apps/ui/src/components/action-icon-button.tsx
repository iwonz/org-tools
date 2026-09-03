import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ActionIconButtonProps = {
  dataDemoId?: string;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  showTooltip?: boolean;
  tooltip?: string;
};

export function ActionIconButton({
  dataDemoId,
  disabled,
  icon,
  label,
  onClick,
  showTooltip = true,
  tooltip,
}: ActionIconButtonProps) {
  const visibleTooltip = showTooltip ? tooltip : undefined;
  return (
    <span className="group relative inline-flex">
      <Button
        aria-label={label}
        data-demo-id={dataDemoId}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        size="icon"
        title={visibleTooltip}
        type="button"
        variant="ghost"
      >
        {icon}
      </Button>
      {visibleTooltip && (
        <span
          className="pointer-events-none absolute right-0 top-9 z-30 hidden w-64 rounded-md bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-[0_8px_20px_-16px_rgb(0_0_0/0.55)] group-hover:block group-focus-within:block"
          role="tooltip"
        >
          {visibleTooltip}
        </span>
      )}
    </span>
  );
}
