// Client for the backend admin API (docs/HANDOFF.md §5). Requests go to the same origin; next.config.ts rewrites
// /admin/api/* to the backend, so the httpOnly `asid` cookie (path /admin/api) is attached by the browser.
export type AdminUser = { id: number | string; name: string; email: string; role: string };
export type ApiError = { status: number; code: string; message: string; fields?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export const NETWORK_ERROR: ApiError = { status: 0, code: "NETWORK", message: "Tidak bisa terhubung ke server. Coba lagi sebentar lagi." }; // COPY: perlu review

/** Backend errors are always `{ error: { code, message, fields? } }`; anything else becomes SERVER_ERROR. */
export function toApiError(status: number, body: unknown): ApiError {
  const e = (body as { error?: Partial<ApiError> } | null)?.error;
  return {
    status,
    code: typeof e?.code === "string" ? e.code : "SERVER_ERROR",
    message: typeof e?.message === "string" ? e.message : "Terjadi kesalahan di server. Coba lagi.", // COPY: perlu review
    fields: e?.fields,
  };
}

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(`/admin/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    return res.ok ? { ok: true, data: body as T } : { ok: false, error: toApiError(res.status, body) };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

const post = <T>(path: string, body?: unknown) => call<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export type LoginResponse = { step: "two_factor" } | { admin: AdminUser };
export const adminLogin = (email: string, password: string) => post<LoginResponse>("/auth/login", { email, password });
export const adminVerify = (code: string, method: "totp" | "backup", trustDevice: boolean) => post<{ admin: AdminUser }>("/auth/verify", { code, method, trustDevice });
export const adminLogout = () => post<unknown>("/auth/logout");
export const adminMe = () => call<{ admin: AdminUser }>("/auth/me");
