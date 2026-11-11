// Typed client for /admin/api/themes (backend: controllers/adminThemeController.js, lib/adminThemes.js).
import { adminGet, adminPatch, adminPost } from "./admin-api";

export type ThemeStatus = "open" | "review" | "draft";
export type ApiGroup = { key: string; title: string; description: string; icon: string; color: string };
export type ApiRow = { ticker: string; pct: number | null; source: string };
export type ApiStage = { name: string; groupKey: string; description: string; rows: ApiRow[] };
export type ThemeForm = { name: string; sectorSlug: string; description: string; drivers: string[]; groups: ApiGroup[]; stages: ApiStage[] };

export type ThemeItem = {
  slug: string; name: string; sector: { slug: string; name: string } | null;
  chain: { group: string | null; color: string }[]; stageCount: number;
  readiness: { ready: number; total: number; percent: number };
  status: ThemeStatus; statusLabel: string; hasDraft: boolean; published: boolean;
  theses: number | null; updatedAt: string; updatedBy: string;
};
export type Unmapped = { ticker: string; name: string; logoUrl: string | null; status: string; suggestion: { slug: string; name: string } | null; note: string };
export type ThemeList = {
  summary: { open: number; draft: number; mappedCompanies: { count: number; of: number }; missingShares: { count: number; inOpenThemes: number } };
  tabs: Record<"all" | ThemeStatus, number>; total: number; items: ThemeItem[];
  sectors: { slug: string; name: string }[];
  unmapped: { total: number; items: Unmapped[] };
};
export type ThemeCheck = { key: string; label: string; ok: boolean; note: string };
export type ThemeView = {
  theme: { slug: string; status: string; statusLabel: string; published: boolean; hasDraft: boolean };
  form: ThemeForm;
  companies: { ticker: string; name: string; logoUrl: string | null; ready: boolean; statusLabel: string; reason: string }[];
  readiness: { ready: number; total: number; percent: number };
  checks: ThemeCheck[]; canPublish: boolean;
  updatedAt: string; updatedBy: string;
};

export const listThemes = (p: { q?: string; tab?: "all" | ThemeStatus; sector?: string } = {}) => {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.tab && p.tab !== "all") qs.set("tab", p.tab);
  if (p.sector) qs.set("sector", p.sector);
  return adminGet<ThemeList>(`/themes?${qs}`);
};
export const getTheme = (slug: string) => adminGet<ThemeView>(`/themes/${encodeURIComponent(slug)}`);
export const createTheme = (form: Partial<ThemeForm>) => adminPost<ThemeView>("/themes", form);
export const saveTheme = (slug: string, form: Partial<ThemeForm>) => adminPatch<ThemeView>(`/themes/${encodeURIComponent(slug)}`, form);
export const publishTheme = (slug: string) => adminPost<ThemeView>(`/themes/${encodeURIComponent(slug)}/publish`);
export const mapCompany = (slug: string, ticker: string) => adminPost<null>(`/themes/${encodeURIComponent(slug)}/companies`, { ticker });
