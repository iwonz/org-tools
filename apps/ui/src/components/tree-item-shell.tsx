import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type TreeItemShellProps = {
  children: ReactNode;
  depth?: number;
  isLast?: boolean;
};

export function TreeItemShell({ children, depth = 0, isLast = true }: TreeItemShellProps) {
  const hasConnector = depth > 0;

  return (
    <li className={cn("relative", hasConnector && "pl-3")}>
      {hasConnector && (
        <>
          <span aria-hidden="true" className="absolute left-0 top-8 h-px w-3 bg-border" />
          <span aria-hidden="true" className="absolute -top-2 left-0 h-10 w-px bg-border" />
          {!isLast && (
            <span
              aria-hidden="true"
              className="absolute bottom-[-0.5rem] left-0 top-8 w-px bg-border"
            />
          )}
        </>
      )}
      {children}
    </li>
  );
}
