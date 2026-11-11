// Typed client for /admin/api/themes (backend: controllers/adminThemeController.js, lib/adminThemes.js).
import { adminDelete, adminGet, adminPatch, adminPost } from "./admin-api";

export type ThemeStatus = "open" | "review" | "draft" | "map";
export type ThemeKind = "chain" | "map";
export type DataStatus = "soon" | "ready";
export type SectorMap = { subsectorId: string; icon: string; dataStatus: DataStatus; updateNote: string };
export type ThemeSector = { slug: string; name: string; subsectors: { id: string; name: string }[] };
type Readiness = { ready: number; total: number; percent: number };
export type ApiGroup = { key: string; title: string; description: string; icon: string; color: string };
export type ApiRow = { ticker: string; pct: number | null; source: string };
export type ApiStage = { name: string; groupKey: string; description: string; rows: ApiRow[] };
export type ThemeForm = { name: string; sectorSlug: string; description: string; drivers: string[]; groups: ApiGroup[]; stages: ApiStage[]; sectorMap: SectorMap };

export type ThemeItem = {
  slug: string; name: string; sector: { slug: string; name: string } | null;
  chain: { group: string | null; color: string }[]; stageCount: number;
  dataStatus: { key: "soon" | "ok" | "new"; label: string; updatedAt: string | null }; // as users see it on the sector page (published version)
  icon: string | null; // sector-page icon key (Peta sektor)
  kind: ThemeKind; readiness: Readiness | null; // null for kind "map" (no chain, no emiten)
  status: ThemeStatus; statusLabel: string; hasDraft: boolean; published: boolean;
  theses: number | null; updatedAt: string; updatedBy: string;
};
export type Unmapped = { ticker: string; name: string; logoUrl: string | null; status: string; suggestion: { slug: string; name: string } | null; note: string };
export type ThemeList = {
  summary: { open: number; draft: number; mappedCompanies: { count: number; of: number }; missingShares: { count: number; inOpenThemes: number } };
  tabs: Record<"all" | ThemeStatus, number>; total: number; items: ThemeItem[];
  sectors: ThemeSector[];
  unmapped: { total: number; items: Unmapped[] };
};
export type ThemeCheck = { key: string; label: string; ok: boolean; note: string };
export type ThemeView = {
  theme: { slug: string; status: string; statusLabel: string; published: boolean; hasDraft: boolean; kind: ThemeKind; onSectorMap: boolean };
  sectors: ThemeSector[];
  form: ThemeForm;
  companies: { ticker: string; name: string; logoUrl: string | null; ready: boolean; statusLabel: string; reason: string }[];
  readiness: Readiness | null;
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
export const deleteTheme = (slug: string) => adminDelete(`/themes/${encodeURIComponent(slug)}`);
export const mapCompany = (slug: string, ticker: string) => adminPost<null>(`/themes/${encodeURIComponent(slug)}/companies`, { ticker });
