"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { adminLogout, adminMe, type AdminUser } from "@/lib/admin-api";
import { markSignedIn, markSignedOut } from "@/lib/admin-session-flag";
import { persistor } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

const LOGIN = "/admin/masuk";
type State = { status: "loading" } | { status: "authed"; admin: AdminUser } | { status: "error"; message: string };
type Ctx = { admin: AdminUser; logout: () => Promise<void> };
const SessionContext = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminSession>");
  return ctx;
}

/**
 * Second line of defence behind proxy.ts (which only checks the marker cookie): nothing is rendered until GET /admin/api/auth/me confirms a session that passed 2FA;
 * a 401 sends the visitor to /admin/masuk. This only gates the UI. Data is protected by the API (`requireAdmin`).
 * The `asid` cookie is only sent to /admin/api, so the check has to come from the browser, not from a server proxy.
 */
export function AdminSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const seq = useRef(0);

  // Applies a /auth/me answer; only the latest request counts (focus checks can overlap the first one).
  const apply = useCallback((n: number, r: Awaited<ReturnType<typeof adminMe>>) => {
    if (n !== seq.current) return;
    if (r.ok) { markSignedIn(); setState({ status: "authed", admin: r.data.admin }); }
    else if (r.error.status === 401) { markSignedOut(); router.replace(LOGIN); } // clear first: a stale marker would make proxy.ts bounce us back here
    else setState({ status: "error", message: r.error.message });
  }, [router]);
  const check = useCallback(() => { const n = ++seq.current; return adminMe().then((r) => apply(n, r)); }, [apply]);

  useEffect(() => { void check(); }, [check]);

  // Sessions end after 30 minutes idle: re-verify when the tab comes back so an expired session is caught early.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [check]);

  const logout = useCallback(async () => { await adminLogout(); markSignedOut(); await persistor?.purge(); router.replace(LOGIN); }, [router]); // purge: unsaved drafts belong to the admin who is signing out
  const value = useMemo(() => (state.status === "authed" ? { admin: state.admin, logout } : null), [state, logout]);

  if (value) return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;

  if (state.status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Empty>
          <EmptyHeader><EmptyTitle>Panel admin tidak bisa dibuka</EmptyTitle><EmptyDescription>{state.message}</EmptyDescription></EmptyHeader>
          <EmptyContent><Button variant="outline" onClick={() => { setState({ status: "loading" }); void check(); }}><RefreshCw aria-hidden />Coba lagi</Button></EmptyContent>
        </Empty>
      </div>
    );

  // loading, or redirecting to the login page: show a neutral skeleton, never panel content
  return (
    <div role="status" aria-busy="true" aria-label="Memeriksa sesi" className="flex min-h-screen">
      <div className="hidden w-60 flex-none border-r border-border p-4 md:block"><Skeleton className="h-6 w-32" /></div>
      <div className="flex-1 bg-accent"><div className="h-[61px] border-b border-border bg-background" /></div>
    </div>
  );
}
