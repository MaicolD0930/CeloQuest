import { APP_DISPLAY_VERSION } from "@/lib/app-version";

type Props = {
  label?: string;
  className?: string;
};

export function AppVersionBadge({ label, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-h-muted ring-1 ring-h-border ${className}`}
      title={label ? `${label} ${APP_DISPLAY_VERSION}` : `v${APP_DISPLAY_VERSION}`}
    >
      {label ? `${label} ` : "v"}
      {APP_DISPLAY_VERSION}
    </span>
  );
}
