// shortcut: sample rows from the design; replace with GET /admin/api/companies.
export type Status = "ok" | "review" | "draft" | "new";
export type Row = { code: string; name: string; sector: string; secKey: string; parts: number[]; tema: string; status: Status; reports: number; when: string; by: string };

export const LOGO: Record<string, string> = {
  UNTR: "untr.svg", BUMI: "bumi.png", ITMG: "itmg.svg", PTBA: "ptba.svg", AADI: "aadi.svg", INDY: "indy.svg", ADMR: "admr.svg",
};
export const logoOf = (code: string) => (LOGO[code] ? `/logos/emiten/logo-${LOGO[code]}` : "");

export const MISSING = ["Profil BEI", "Ringkasan bisnis", "Sumber pendapatan", "Anak usaha", "Pemetaan tema"];
export const SECTORS = [
  ["", "Semua sektor"], ["energi", "Energi"], ["baku", "Barang Baku"], ["industri", "Perindustrian"], ["infra", "Infrastruktur"], ["keuangan", "Keuangan"],
] as const;
export const TOTALS = { all: 958, review: 37, inc: 546, ok: 412 };

export const ROWS: Row[] = [
  ["AADI", "Adaro Andalan Indonesia Tbk", "Energi", "energi", [1, 1, 1, 1, 0], "Batubara · 2 tahap", "review", 0, "4 Nov 2026", "Rina"],
  ["PTBA", "Bukit Asam Tbk", "Energi", "energi", [1, 1, 1, 1, 1], "Batubara · 2 tahap", "ok", 0, "Hari ini, 07.12", "Dimas"],
  ["BUMI", "Bumi Resources Tbk", "Energi", "energi", [1, 1, 0, 1, 1], "Batubara", "review", 2, "Hari ini, 09.40", "Rina"],
  ["ADMR", "Alamtri Minerals Indonesia Tbk", "Energi", "energi", [1, 1, 1, 0, 1], "Batubara", "review", 1, "2 Nov 2026", "Dimas"],
  ["INDY", "Indika Energy Tbk", "Energi", "energi", [1, 1, 0, 1, 1], "Batubara · 2 tahap", "review", 0, "1 Nov 2026", "Sistem"],
  ["ITMG", "Indo Tambangraya Megah Tbk", "Energi", "energi", [1, 1, 1, 1, 1], "Batubara", "ok", 0, "4 Nov 2026", "Dimas"],
  ["UNTR", "United Tractors Tbk", "Perindustrian", "industri", [1, 1, 1, 1, 1], "Batubara", "ok", 0, "30 Okt 2026", "Rina"],
  ["TCPI", "Transcoal Pacific Tbk", "Infrastruktur", "infra", [1, 0, 0, 1, 1], "Batubara", "draft", 0, "28 Okt 2026", "Sistem"],
  ["INCO", "Vale Indonesia Tbk", "Barang Baku", "baku", [1, 1, 0, 1, 1], "Nikel & baterai EV", "draft", 0, "Kemarin, 11.05", "Rina"],
  ["PGAS", "Perusahaan Gas Negara Tbk", "Energi", "energi", [1, 1, 1, 1, 0], "Gas bumi", "review", 1, "29 Okt 2026", "Dimas"],
  ["BBRI", "Bank Rakyat Indonesia Tbk", "Keuangan", "keuangan", [1, 1, 1, 1, 1], "Perbankan", "ok", 0, "27 Okt 2026", "Dimas"],
  ["BMRI", "Bank Mandiri Tbk", "Keuangan", "keuangan", [1, 1, 1, 1, 1], "Perbankan", "ok", 0, "27 Okt 2026", "Dimas"],
  ["TLKM", "Telkom Indonesia Tbk", "Infrastruktur", "infra", [1, 0, 1, 1, 0], "Belum dipetakan", "draft", 0, "20 Okt 2026", "Sistem"],
  ["CDIA", "Chandra Daya Investasi Tbk", "Infrastruktur", "infra", [1, 0, 0, 0, 0], "Belum dipetakan", "new", 0, "3 Nov 2026", "Sistem"],
].map(([code, name, sector, secKey, parts, tema, status, reports, when, by]) => ({ code, name, sector, secKey, parts, tema, status, reports, when, by }) as Row);

export const existingCodes = ROWS.map((r) => r.code);
