// Maps the backend company form (lib/admin-companies.ts, Rupiah as whole numbers) to the string-based state the
// admin forms edit (Indonesian number format, Rp triliun for market cap and revenue), and back.
import type { Board, CompanyForm, IpoPart, Level, Trading } from "./admin-companies";

const T = 1e12;
/** 2500000000 -> "2.500.000.000", 44.9 -> "44,9". Divide by `scale` first (Rp -> triliun). */
export const idFmt = (x: number | null | undefined, scale = 1) => (x == null ? "" : (x / scale).toLocaleString("id-ID", { maximumFractionDigits: 6 }));
/** "44,9" -> 44.9 (x scale). Empty or unreadable input is null; dots are thousand separators, comma is the decimal. */
export function idParse(s: string, scale = 1): number | null {
  const t = s.trim();
  if (!t) return null;
  const x = parseFloat(t.replace(/\./g, "").replace(",", "."));
  return !Number.isFinite(x) ? null : scale === 1 ? x : Math.round(x * scale);
}

export type TrKey = "aktif" | "suspend" | "monitor" | "delisted";
export const TR_TO_API: Record<TrKey, Trading> = { aktif: "active", suspend: "suspended", monitor: "monitoring", delisted: "delisted" };
export const TR_FROM_API = Object.fromEntries(Object.entries(TR_TO_API).map(([k, v]) => [v, k])) as Record<Trading, TrKey>;
export type LvKey = "h" | "m" | "l";
const LV_TO_API: Record<LvKey, Level> = { h: "high", m: "medium", l: "low" };
const LV_FROM_API: Record<Level, LvKey> = { high: "h", medium: "m", low: "l" };

export type KeyId = "mc" | "pbv" | "roe" | "gm" | "da";
const KEY_FIELD = { mc: "marketCap", pbv: "pbv", roe: "roePct", gm: "grossMarginPct", da: "debtToAssetPct" } as const;
export const KEY_IDS = Object.keys(KEY_FIELD) as KeyId[];
export type MetricId = "sales" | "profit" | "margin";
const METRIC = { sales: ["revenue", T], profit: ["netIncome", T], margin: ["grossMarginPct", 1] } as const;
const METRIC_IDS = Object.keys(METRIC) as MetricId[];

export type ProfileState = {
  name: string; sektor: string; sub: string;
  tr: TrKey; trSince: string; trSrc: string; trWhy: string;
  priceDate: string; period: string; asSrc: string; keys: Record<KeyId, { v: string; tip: string }>;
  shortSum: string; sum: string; sumSrc: string;
  str: string[]; weak: string[]; mon: string[];
  pers: { p: string; sub: string }[]; tv: Record<MetricId, string[]>; notes: Record<MetricId, string>;
  rev: { name: string; pct: string; src: string }[];
  subs: { name: string; biz: string; p: string; tk: string; show: boolean }[];
  sh: { name: string; p: string }[]; shNote: string;
  mg: { name: string; role: string }[];
  rk: { t: string; d: string; lv: LvKey }[];
  nw: { t: string; src: string; d: string }[];
};

export function profileFromForm(f: CompanyForm): ProfileState {
  const k = f.keyNumbers;
  return {
    name: f.name, sektor: f.sectorSlug, sub: f.subsector,
    tr: TR_FROM_API[f.trading.state], trSince: f.trading.since ?? "", trSrc: f.trading.source, trWhy: f.trading.reason,
    priceDate: k.priceDate ?? "", period: k.financialPeriod, asSrc: k.asOfSource,
    keys: Object.fromEntries(KEY_IDS.map((id) => [id, { v: idFmt(k[KEY_FIELD[id]], id === "mc" ? T : 1), tip: k.tips[KEY_FIELD[id]] }])) as ProfileState["keys"],
    shortSum: f.summary.short, sum: f.summary.overview, sumSrc: f.summary.source,
    str: f.points.strengths, weak: f.points.weaknesses, mon: f.points.watchItems,
    pers: f.trend.periods.map((p) => ({ p: p.label, sub: p.span })),
    tv: Object.fromEntries(METRIC_IDS.map((m) => { const [field, scale] = METRIC[m]; return [m, f.trend.periods.map((_, i) => idFmt(f.trend[field].values[i], scale))]; })) as ProfileState["tv"],
    notes: Object.fromEntries(METRIC_IDS.map((m) => [m, f.trend[METRIC[m][0]].note])) as ProfileState["notes"],
    rev: f.revenueSources.map((r) => ({ name: r.name, pct: idFmt(r.pct), src: r.source })),
    subs: f.group.subsidiaries.map((s) => ({ name: s.name, biz: s.business, p: idFmt(s.ownershipPct), tk: s.ticker, show: s.show })),
    sh: f.shareholders.items.map((s) => ({ name: s.name, p: idFmt(s.pct) })), shNote: f.shareholders.note,
    mg: f.management.people,
    rk: f.risks.map((r) => ({ t: r.title, d: r.description, lv: LV_FROM_API[r.level] })),
    nw: f.news.map((n) => ({ t: n.title, src: n.source, d: n.dateLabel })),
  };
}

/** `base` is the form last loaded from the API: sections the UI does not edit (group name, ipo) are carried over. */
export function profileToForm(s: ProfileState, base: CompanyForm): CompanyForm {
  const series = (m: MetricId) => { const [, scale] = METRIC[m]; return { values: s.pers.map((_, i) => idParse(s.tv[m][i] ?? "", scale)), note: s.notes[m] }; };
  return {
    ...base,
    name: s.name.trim(), sectorSlug: s.sektor, subsector: s.sub.trim(),
    trading: { state: TR_TO_API[s.tr], since: s.trSince || null, source: s.trSrc.trim(), reason: s.trWhy.trim() },
    keyNumbers: {
      ...Object.fromEntries(KEY_IDS.map((id) => [KEY_FIELD[id], idParse(s.keys[id].v, id === "mc" ? T : 1)])) as Pick<CompanyForm["keyNumbers"], (typeof KEY_FIELD)[KeyId]>,
      tips: Object.fromEntries(KEY_IDS.map((id) => [KEY_FIELD[id], s.keys[id].tip])) as CompanyForm["keyNumbers"]["tips"],
      priceDate: s.priceDate || null, financialPeriod: s.period.trim(), asOfSource: s.asSrc.trim(),
    },
    summary: { short: s.shortSum.trim(), overview: s.sum.trim(), source: s.sumSrc.trim() },
    points: { strengths: s.str, weaknesses: s.weak, watchItems: s.mon },
    trend: { periods: s.pers.map((p) => ({ label: p.p.trim(), span: p.sub.trim() })), revenue: series("sales"), netIncome: series("profit"), grossMarginPct: series("margin") },
    revenueSources: s.rev.map((r) => ({ name: r.name.trim(), pct: idParse(r.pct), source: r.src.trim() })),
    group: { ...base.group, subsidiaries: s.subs.map((x) => ({ name: x.name.trim(), business: x.biz.trim(), ownershipPct: idParse(x.p), ticker: x.tk.trim().toUpperCase(), show: x.show })) },
    shareholders: { items: s.sh.map((x) => ({ name: x.name.trim(), pct: idParse(x.p) })), note: s.shNote },
    management: { people: s.mg.map((x) => ({ name: x.name.trim(), role: x.role.trim() })) },
    risks: s.rk.map((r) => ({ title: r.t.trim(), description: r.d.trim(), level: LV_TO_API[r.lv] })),
    news: s.nw.map((n) => ({ title: n.t.trim(), source: n.src.trim(), dateLabel: n.d.trim() })),
  };
}

// ---- IPO ----
export type IpoDates = { bbS: string; bbE: string; ojk: string; puS: string; puE: string; jt: string; ls: string };
const DATE_FIELD = { bbS: "bookbuildingStart", bbE: "bookbuildingEnd", ojk: "effective", puS: "offerStart", puE: "offerEnd", jt: "allotment", ls: "listing" } as const;
const DATE_IDS = Object.keys(DATE_FIELD) as (keyof IpoDates)[];

export type IpoState = {
  name: string; tk: string; sektor: string; sub: string; papan: Board; shortSum: string; longSum: string;
  dt: IpoDates; pLo: string; pHi: string; pFin: string; shares: string; porsi: string;
  uw: string[]; wr: boolean; wrRatio: string; wrPrice: string; ud: { t: string; p: string }[]; soon: boolean; auto: boolean;
};

export const emptyIpoState = (): IpoState => ({
  name: "", tk: "", sektor: "", sub: "", papan: "utama", shortSum: "", longSum: "",
  dt: { bbS: "", bbE: "", ojk: "", puS: "", puE: "", jt: "", ls: "" }, pLo: "", pHi: "", pFin: "", shares: "", porsi: "",
  uw: [""], wr: false, wrRatio: "", wrPrice: "", ud: [{ t: "", p: "" }], soon: true, auto: true,
});

export function ipoFromForm(ticker: string, f: CompanyForm): IpoState {
  const i = f.ipo;
  const base = emptyIpoState();
  return {
    ...base, name: f.name, tk: ticker, sektor: f.sectorSlug, sub: f.subsector, shortSum: f.summary.short, longSum: f.summary.overview,
    ...(i && {
      papan: i.board, dt: Object.fromEntries(DATE_IDS.map((d) => [d, i.schedule[DATE_FIELD[d]] ?? ""])) as IpoDates,
      pLo: idFmt(i.priceLow), pHi: idFmt(i.priceHigh), pFin: idFmt(i.priceFinal), shares: idFmt(i.sharesOffered), porsi: idFmt(i.publicPct),
      uw: i.underwriters.length ? i.underwriters : [""], wr: i.warrant.enabled, wrRatio: i.warrant.ratio, wrPrice: idFmt(i.warrant.price),
      ud: i.useOfProceeds.length ? i.useOfProceeds.map((u) => ({ t: u.label, p: idFmt(u.pct) })) : base.ud, soon: i.showUpcoming, auto: i.autoConvert,
    }),
  };
}

/** Sections an IPO form owns. `base` (when editing) keeps summary.source, which the IPO form has no field for. */
export function ipoToForm(s: IpoState, base?: CompanyForm): Pick<CompanyForm, "name" | "sectorSlug" | "subsector" | "summary" | "ipo"> {
  const ipo: IpoPart = {
    board: s.papan,
    schedule: Object.fromEntries(DATE_IDS.map((d) => [DATE_FIELD[d], s.dt[d] || null])) as IpoPart["schedule"],
    priceLow: idParse(s.pLo), priceHigh: idParse(s.pHi), priceFinal: idParse(s.pFin), sharesOffered: idParse(s.shares), publicPct: idParse(s.porsi),
    underwriters: s.uw.map((u) => u.trim()).filter(Boolean),
    warrant: { enabled: s.wr, ratio: s.wr ? s.wrRatio.trim() : "", price: s.wr ? idParse(s.wrPrice) : null },
    useOfProceeds: s.ud.filter((u) => u.t.trim() || u.p.trim()).map((u) => ({ label: u.t.trim(), pct: idParse(u.p) })),
    showUpcoming: s.soon, autoConvert: s.auto,
  };
  return { name: s.name.trim(), sectorSlug: s.sektor, subsector: s.sub.trim(), summary: { short: s.shortSum.trim(), overview: s.longSum.trim(), source: base?.summary.source ?? "" }, ipo };
}
