export const IDLE_COOKIE = "ft_last_activity";
export const MAX_IDLE_MS = 10 * 60 * 1000;
export const MAX_IDLE_SECONDS = Math.floor(MAX_IDLE_MS / 1000);

export function createIdleCookieOptions(isSecure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

