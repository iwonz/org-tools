import { cn } from "@/lib/utils";

export function MiddleDot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("mx-1 shrink-0 text-muted-foreground/70", className)}>
      ·
    </span>
  );
}
