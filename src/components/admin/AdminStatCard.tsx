type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
};

export function AdminStatCard({ label, value, hint, icon }: Props) {
  return (
    <div className="relative flex min-h-[5.5rem] flex-col rounded-2xl bg-surface p-3.5 ring-1 ring-h-border card-depth-sm">
      {icon ? (
        <span
          className="absolute right-2.5 top-2.5 text-base leading-none opacity-90"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <p className="pr-7 text-[10px] font-bold uppercase leading-snug tracking-wide text-h-muted">
        {label}
      </p>
      <p className="mt-auto pt-2 font-display text-xl font-extrabold leading-none text-h-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[10px] leading-snug text-h-muted">{hint}</p>
      ) : null}
    </div>
  );
}
