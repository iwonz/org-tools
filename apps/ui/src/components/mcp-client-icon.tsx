import type { IconType } from "react-icons";
import { SiClaudecode, SiCursor, SiHermes, SiOpencode, SiPi } from "react-icons/si";

import type { McpClientName } from "@/lib/mcp-client-configuration";
import { cn } from "@/lib/utils";

type ClientIconProps = {
  className?: string;
  client: McpClientName;
};

type BundledClientName = Exclude<McpClientName, "Codex" | "OpenClaw">;

const bundledClientIcons: Record<BundledClientName, IconType> = {
  "Claude Code": SiClaudecode,
  Cursor: SiCursor,
  Hermes: SiHermes,
  OpenCode: SiOpencode,
  Pi: SiPi,
};

const iconClassName = (className?: string) => cn("size-4 shrink-0", className);

export function McpClientIcon({ client, className }: ClientIconProps) {
  if (client === "Codex") {
    return (
      <svg
        aria-hidden
        className={iconClassName(className)}
        data-mcp-client-icon={client}
        fill="none"
        viewBox="0 0 24 24"
      >
        <title>{client}</title>
        <path
          d="M12 3.25 16.2 5.7v4.85L12 13l-4.2-2.45V5.7L12 3.25Zm4.2 7.3 4.2 2.45v4.85l-4.2 2.45L12 17.85V13l4.2-2.45Zm-8.4 0L12 13v4.85L7.8 20.3l-4.2-2.45V13l4.2-2.45Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (client === "OpenClaw") {
    return (
      <svg
        aria-hidden
        className={iconClassName(className)}
        data-mcp-client-icon={client}
        fill="none"
        viewBox="0 0 24 24"
      >
        <title>{client}</title>
        <path
          d="M5 18.5c0-4.8 1.1-9.2 3.2-12.7.8 2.4 1 4.7.5 6.9M12 18.5v-13c.9 2.3 1.5 4.7 1.7 7.2m5.3 5.8c0-4.8-1.1-9.2-3.2-12.7-.8 2.4-1 4.7-.5 6.9M5 18.5c2.2-1.8 4.5-2.7 7-2.7s4.8.9 7 2.7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  const Icon = bundledClientIcons[client];
  return <Icon aria-hidden className={iconClassName(className)} data-mcp-client-icon={client} />;
}
