type Props = {
  title: string;
  hint: string;
  items: string[];
};

export function AdminFutureSection({ title, hint, items }: Props) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-h-border card-depth-sm">
      <h3 className="font-display text-base font-extrabold text-h-foreground">
        {title}
      </h3>
      <p className="mt-1 text-xs text-h-muted">{hint}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-h-muted"
          >
            <span className="text-lemon">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
