import type { ReactNode } from "react";

interface ErrorStateProps {
  readonly title?: string;
  readonly message: string;
  readonly action?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
}: ErrorStateProps) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
