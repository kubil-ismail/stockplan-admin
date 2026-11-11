// Typed client for /admin/api/history (backend: controllers/adminHistoryController.js, lib/adminHistory.js).
import { adminBlob, adminGet, adminPost } from "./admin-api";

export type Kind = "data" | "pub" | "sec";
export type Tab = "all" | Kind;
export type Range = "1" | "7" | "30";
export type Entry = {
  id: string; at: string;
  actor: { kind: "admin" | "system"; id: string | null; name: string; email: string | null };
  kind: Kind; module: { key: string; name: string };
  verb: string; target: string; rest: string; meta: string;
  changes: { field: string; label: string; before: unknown; after: unknown }[];
  revertable: boolean; reverted: boolean; revertedAt: string | null; canRevert: boolean;
};
export type HistoryResponse = {
  tabs: Record<Tab, number>; total: number; page: number; pageSize: number;
  days: { date: string; items: Entry[] }[];
  modules: { key: string; name: string }[];
  actors: { id: string; name: string }[];
  retentionDays: number;
};
export type HistoryParams = { q?: string; module?: string; who?: string; range?: Range; tab?: Tab; page?: number; pageSize?: number };

const filters = (p: HistoryParams) => {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.module) qs.set("module", p.module);
  if (p.who) qs.set("who", p.who);
  if (p.range) qs.set("range", p.range);
  if (p.tab && p.tab !== "all") qs.set("tab", p.tab);
  return qs;
};

export const listHistory = (p: HistoryParams = {}) => {
  const qs = filters(p);
  if (p.page && p.page > 1) qs.set("page", String(p.page));
  if (p.pageSize) qs.set("pageSize", String(p.pageSize));
  return adminGet<HistoryResponse>(`/history?${qs}`);
};
export const exportHistoryCsv = (p: Omit<HistoryParams, "page" | "pageSize"> = {}) => adminBlob(`/history/export.csv?${filters(p)}`);
export const revertEntry = (id: string) => adminPost<{ message: string; entry: Entry }>(`/history/${encodeURIComponent(id)}/revert`);
