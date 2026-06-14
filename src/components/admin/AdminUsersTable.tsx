type UserRow = {
  wallet: string;
  username: string;
  xpTotal: number;
  rank: number;
  lastActivity: string;
};

type Props = {
  users: UserRow[];
  title: string;
  columns: {
    wallet: string;
    username: string;
    xp: string;
    rank: string;
    activity: string;
  };
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminUsersTable({ users, title, columns }: Props) {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-h-border card-depth-sm">
      <div className="border-b border-h-border px-4 py-3">
        <h3 className="font-display text-base font-extrabold text-h-foreground">
          {title}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-h-border text-xs uppercase tracking-wide text-h-muted">
              <th className="px-4 py-2 font-bold">{columns.wallet}</th>
              <th className="px-4 py-2 font-bold">{columns.username}</th>
              <th className="px-4 py-2 font-bold">{columns.xp}</th>
              <th className="px-4 py-2 font-bold">{columns.rank}</th>
              <th className="px-4 py-2 font-bold">{columns.activity}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-h-muted">
                  —
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.wallet}
                  className="border-b border-h-border/60 last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-h-foreground">
                    {shortWallet(user.wallet)}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-h-foreground">
                    {user.username}
                  </td>
                  <td className="px-4 py-2.5 text-h-foreground">
                    {user.xpTotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-h-foreground">#{user.rank}</td>
                  <td className="px-4 py-2.5 text-xs text-h-muted">
                    {formatDate(user.lastActivity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
