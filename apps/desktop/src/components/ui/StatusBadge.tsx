import type { ReactNode } from "react";

export function StatusBadge({
  state,
  children,
}: {
  state?: "pending" | "applying" | "applied" | "paused" | "fallback" | "error";
  children: ReactNode;
}) {
  return (
    <span className="status-badge" data-state={state}>
      {children}
    </span>
  );
}
