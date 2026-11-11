// Typed client for /admin/api/users (backend: controllers/adminUserController.js, lib/adminUsers.js).
import { adminBlob, adminGet, adminPost } from "./admin-api";

export type Status = "act" | "new" | "idle" | "sus";
export type Plan = "y" | "m" | "n";
export type Tab = "all" | Status;

export type UserRow = {
  id: string; name: string; email: string; status: Status; statusLabel: string;
  lastActiveAt: string | null; theses: number; plan: { key: Plan; label: string }; joinedAt: string;
};
export type Summary = {
  total: number; newThisWeek: number;
  active7Days: { count: number; percent: number };
  thesisWriters: { count: number; avgPerWriter: number | null };
  subscriptionInterest: { count: number; yearlyPercent: number };
};
export type ListResponse = { summary: Summary; tabs: Record<Tab, number>; total: number; page: number; pageSize: number; items: UserRow[] };
export type ListParams = { q?: string; tab?: Tab; plan?: Plan | ""; page?: number; pageSize?: number };

export type UserDetail = UserRow & {
  account: { joinedAt: string; loginMethod: string; emailVerified: boolean; subscription: string; planInterest: string };
  usage: { theses: number; evaluations: number; watchlist: number; themesOpened: number | null };
  recentLogins: { device: string; at: string }[];
  suspension: { at: string; reason: string; note: string; by: string | null } | null;
  actions: { resendConfirmation: boolean; resetPassword: boolean; suspend: boolean; restore: boolean };
};

const filters = (p: ListParams) => {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.plan) qs.set("plan", p.plan);
  return qs;
};

export const listUsers = (p: ListParams = {}) => {
  const qs = filters(p);
  if (p.tab && p.tab !== "all") qs.set("tab", p.tab);
  if (p.page && p.page > 1) qs.set("page", String(p.page));
  qs.set("pageSize", String(p.pageSize ?? 12));
  return adminGet<ListResponse>(`/users?${qs}`);
};
export const exportUsersCsv = (p: Pick<ListParams, "q" | "plan"> = {}) => adminBlob(`/users/export.csv?${filters(p)}`);
const one = (id: string) => `/users/${encodeURIComponent(id)}`;
export const getUser = (id: string) => adminGet<{ user: UserDetail }>(one(id));
export const suspendUser = (id: string, reason: string, note?: string) => adminPost<{ user: UserDetail }>(`${one(id)}/suspend`, { reason, note: note || undefined });
export const restoreUser = (id: string) => adminPost<{ user: UserDetail }>(`${one(id)}/restore`);
export const resendConfirmation = (id: string) => adminPost<null>(`${one(id)}/resend-confirmation`);
export const sendPasswordReset = (id: string) => adminPost<null>(`${one(id)}/password-reset`);
export const inviteUser = (email: string) => adminPost<null>("/users/invite", { email });
