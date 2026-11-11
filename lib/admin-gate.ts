// Shared by proxy.ts (server) and the client session code. The backend's httpOnly `asid` cookie is scoped to /admin/api,
// so the browser never sends it for page requests. This plain `admin_session` marker (path /admin) is set by the client
// after a login and cleared on logout or a 401 from /auth/me. It only decides where to send the visitor:
// the API still validates the real session, so a forged marker shows an empty shell at most.
export const SESSION_FLAG = "admin_session";
export const LOGIN_PATH = "/admin/masuk";

/** Where an /admin page request must be redirected, or null to let it through. */
export function gate(pathname: string, signedIn: boolean): string | null {
  const onLogin = pathname === LOGIN_PATH;
  if (onLogin && signedIn) return "/admin";
  if (!onLogin && !signedIn) return LOGIN_PATH;
  return null;
}
