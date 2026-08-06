"use client";

import type { ReactNode } from "react";

type EmptyStateContentProps = {
  action?: ReactNode;
  description?: ReactNode;
  icon: ReactNode;
  title: ReactNode;
};

function EmptyStateContent({ action, description, icon, title }: EmptyStateContentProps) {
  return (
    <div className="grid max-w-sm justify-items-center gap-3 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="grid gap-1.5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function TopLevelEmptyState(props: EmptyStateContentProps) {
  return (
    <section
      className="grid min-h-0 flex-1 place-items-center bg-transparent p-8"
      data-demo-id="top-level-empty-state"
    >
      <EmptyStateContent {...props} />
    </section>
  );
}

export function SourceEmptyState({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="grid h-full min-h-[160px] place-items-center p-8 text-center text-sm text-muted-foreground">
      <SourceEmptyBody icon={icon}>{children}</SourceEmptyBody>
    </div>
  );
}

export function SourceEmptyBody({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 text-center text-sm text-muted-foreground">
      <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div>{children}</div>
    </div>
  );
}
