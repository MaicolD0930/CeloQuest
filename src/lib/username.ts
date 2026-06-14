export const USERNAME_MIN = 3;
export const USERNAME_MAX = 16;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export type UsernameError =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_CHARS"
  | "TAKEN";

export function validateUsernameFormat(username: string): UsernameError | null {
  const trimmed = username.trim();
  if (trimmed.length < USERNAME_MIN) return "TOO_SHORT";
  if (trimmed.length > USERNAME_MAX) return "TOO_LONG";
  if (!USERNAME_REGEX.test(trimmed)) return "INVALID_CHARS";
  return null;
}

export function normalizeUsername(username: string): string {
  return username.trim();
}
