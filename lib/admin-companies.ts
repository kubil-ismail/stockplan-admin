// Typed client for /admin/api/companies (backend: routes/adminCompanies.js, lib/adminCompanies.js).
import { adminBlob, adminDelete, adminGet, adminPatch, adminPost, type ApiError, type Result } from "./admin-api";

export type Trading = "active" | "suspended" | "monitoring" | "delisted";
export type Level = "high" | "medium" | "low";
export type Board = "utama" | "pengembangan" | "akselerasi" | "baru";
export type TipKey = "marketCap" | "pbv" | "roePct" | "grossMarginPct" | "debtToAssetPct";
export type Series = { values: (number | null)[]; note: string };

export type IpoPart = {
  board: Board;
  schedule: Record<"bookbuildingStart" | "bookbuildingEnd" | "effective" | "offerStart" | "offerEnd" | "allotment" | "listing", string | null>;
  priceLow: number | null; priceHigh: number | null; priceFinal: number | null; sharesOffered: number | null; publicPct: number | null;
  underwriters: string[];
  warrant: { enabled: boolean; ratio: string; price: number | null };
  useOfProceeds: { label: string; pct: number | null }[];
  showUpcoming: boolean; autoConvert: boolean;
};

export type CompanyForm = {
  name: string; sectorSlug: string; subsector: string;
  trading: { state: Trading; since: string | null; source: string; reason: string };
  keyNumbers: { marketCap: number | null; pbv: number | null; roePct: number | null; grossMarginPct: number | null; debtToAssetPct: number | null; tips: Record<TipKey, string>; priceDate: string | null; financialPeriod: string; asOfSource: string };
  summary: { short: string; overview: string; source: string };
  points: { strengths: string[]; weaknesses: string[]; watchItems: string[] };
  trend: { periods: { label: string; span: string }[]; revenue: Series; netIncome: Series; grossMarginPct: Series };
  revenueSources: { name: string; pct: number | null; source: string }[];
  group: { name: string; subsidiaries: { name: string; business: string; ownershipPct: number | null; ticker: string; show: boolean }[] };
  shareholders: { items: { name: string; pct: number | null }[]; note: string };
  management: { people: { name: string; role: string }[] };
  risks: { title: string; description: string; level: Level }[];
  news: { title: string; source: string; dateLabel: string }[];
  ipo: IpoPart | null;
};

export type Section = { key: string; label: string; ok: boolean; note: string };
export type PublishKey = "draft" | "review" | "published";
export type EditView = {
  company: { ticker: string; status: string; logoUrl: string | null };
  publishStatus: { key: PublishKey; label: string };
  published: boolean; hasDraft: boolean;
  form: CompanyForm; sections: Section[]; canPublish: boolean;
  themes: { slug: string; name: string; stageCount: number }[];
  updatedAt: string; updatedBy: string;
};

export type ListTab = "all" | "review" | "incomplete" | "ready";
export type ListItem = {
  ticker: string; name: string; logoUrl: string | null; sector: { slug: string; name: string } | null;
  completeness: { done: number; total: number; missing: string[] };
  theme: string; status: "ok" | "review" | "draft" | "new"; statusLabel: string; reportCount: number; hasDraft: boolean; updatedAt: string; updatedBy: string;
};
export type CompanySector = { slug: string; name: string; subsectors: { id: string; name: string }[] };
export type ListResponse = { total: number; page: number; pageSize: number; tabs: Record<ListTab, number>; sectors: CompanySector[]; items: ListItem[] };
export type ListParams = { q?: string; tab?: ListTab; sector?: string; page?: number; pageSize?: number };

export const listCompanies = (p: ListParams = {}) => {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.tab && p.tab !== "all") qs.set("tab", p.tab);
  if (p.sector) qs.set("sector", p.sector);
  if (p.page && p.page > 1) qs.set("page", String(p.page));
  qs.set("pageSize", String(p.pageSize ?? 14));
  return adminGet<ListResponse>(`/companies?${qs}`);
};
export const getCompany = (ticker: string) => adminGet<EditView>(`/companies/${encodeURIComponent(ticker)}`);
export const createCompany = (body: Partial<CompanyForm> & { ticker: string }) => adminPost<EditView>("/companies", body);
export const saveCompany = (ticker: string, form: Partial<CompanyForm>) => adminPatch<EditView>(`/companies/${encodeURIComponent(ticker)}`, form);
export const deleteCompany = (ticker: string) => adminDelete(`/companies/${encodeURIComponent(ticker)}`);
export const publishCompany = (ticker: string) => adminPost<EditView>(`/companies/${encodeURIComponent(ticker)}/publish`);
export const bulkReview = (tickers: string[]) => adminPost<{ updated: number }>("/companies/bulk-review", { tickers });
export const exportCompaniesCsv = (tickers?: string[]) => adminBlob(`/companies/export.csv${tickers?.length ? `?tickers=${tickers.join(",")}` : ""}`);

/** One readable line for a failed save: the API message plus its first field error (paths like `trend.revenue.values[0]`). */
export function describeError(e: ApiError): string {
  const first = e.fields ? Object.entries(e.fields)[0] : undefined;
  return first && e.code === "VALIDATION" ? `${e.message} (${first[0]}: ${first[1]})` : e.message;
}

/** Downloads a Blob as a file (CSV export). */
export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type { Result };
