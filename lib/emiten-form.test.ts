import assert from "node:assert/strict";
import { emptyIpoState, idFmt, idParse, ipoFromForm, ipoToForm, profileFromForm, profileToForm } from "./emiten-form.ts";
import type { CompanyForm } from "./admin-companies.ts";

assert.equal(idFmt(2_500_000_000), "2.500.000.000");
assert.equal(idFmt(44.9e12, 1e12), "44,9");
assert.equal(idFmt(null), "");
assert.equal(idParse("2.500.000.000"), 2.5e9);
assert.equal(idParse("44,9", 1e12), 44_900_000_000_000); // Rp triliun -> whole rupiah, no float drift
assert.equal(idParse("  "), null);
assert.equal(idParse("abc"), null);

const T = 1e12;
const sample: CompanyForm = {
  name: "Bumi Resources Tbk", sectorSlug: "energi", subsector: "Batu bara",
  trading: { state: "suspended", since: "2026-11-04", source: "Peng-1", reason: "Belum lapor" },
  keyNumbers: { marketCap: 44.9 * T, pbv: 1.5, roePct: 7, grossMarginPct: 17, debtToAssetPct: 36, tips: { marketCap: "a", pbv: "b", roePct: "c", grossMarginPct: "d", debtToAssetPct: "e" }, priceDate: "2026-10-29", financialPeriod: "H1-2026", asOfSource: "BEI" },
  summary: { short: "s", overview: "o", source: "LT 2025" },
  points: { strengths: ["x"], weaknesses: ["y"], watchItems: ["z"] },
  trend: { periods: [{ label: "2025", span: "setahun" }, { label: "H1-2026", span: "6 bulan" }], revenue: { values: [24.1 * T, 15.5 * T], note: "n1" }, netIncome: { values: [1.4 * T, 1.1 * T], note: "n2" }, grossMarginPct: { values: [17, 17], note: "n3" } },
  revenueSources: [{ name: "Ekspor", pct: 52, source: "LK" }, { name: "Domestik", pct: 48, source: "" }],
  group: { name: "Grup Bakrie", subsidiaries: [{ name: "KPC", business: "Tambang", ownershipPct: 50.99, ticker: "", show: true }, { name: "Darma", business: "Kontraktor", ownershipPct: 12.44, ticker: "DEWA", show: false }] },
  shareholders: { items: [{ name: "Mach", pct: 45.78 }], note: "cat" },
  management: { people: [{ name: "A", role: "Presdir" }] },
  risks: [{ title: "t", description: "d", level: "high" }, { title: "t2", description: "d2", level: "low" }],
  news: [{ title: "n", source: "s", dateLabel: "30 Okt 2026" }],
  ipo: null,
};
// Round trip: nothing is lost or rescaled on the way through the form state (Rupiah values come back exact).
assert.deepEqual(profileToForm(profileFromForm(sample), sample), sample);
assert.equal(profileFromForm(sample).keys.mc.v, "44,9");
assert.equal(profileFromForm(sample).tv.sales[0], "24,1");
assert.equal(profileFromForm(sample).tr, "suspend");
// An emptied number input becomes null, never 0.
const cleared = profileFromForm(sample); cleared.keys.pbv.v = "";
assert.equal(profileToForm(cleared, sample).keyNumbers.pbv, null);

const ipoForm: CompanyForm = { ...sample, ipo: { board: "pengembangan", schedule: { bookbuildingStart: "2026-10-20", bookbuildingEnd: null, effective: null, offerStart: null, offerEnd: null, allotment: null, listing: "2026-11-12" }, priceLow: 420, priceHigh: 480, priceFinal: null, sharesOffered: 2.5e9, publicPct: 20, underwriters: ["PT A"], warrant: { enabled: true, ratio: "5:2", price: 500 }, useOfProceeds: [{ label: "Smelter", pct: 100 }], showUpcoming: true, autoConvert: false } };
const out = ipoToForm(ipoFromForm("ABNU", ipoForm), ipoForm);
assert.deepEqual(out.ipo, ipoForm.ipo);
assert.equal(out.summary.source, "LT 2025"); // preserved from the loaded form
// Blank create form: empty rows are dropped, the API gets real nulls.
const blank = ipoToForm(emptyIpoState());
assert.deepEqual([blank.ipo?.underwriters, blank.ipo?.useOfProceeds, blank.ipo?.priceLow, blank.ipo?.schedule.listing], [[], [], null, null]);
assert.equal(ipoToForm({ ...emptyIpoState(), wr: false, wrRatio: "x", wrPrice: "9" }).ipo?.warrant.price, null); // warrant details only count when enabled
console.log("emiten-form ok");
