// shortcut: sample data from the design; replace with /admin/api/themes and /admin/api/companies.
export const SECTORS = ["Energi", "Barang Baku", "Keuangan", "Barang Konsumen Primer", "Infrastruktur", "Properti & Real Estat", "Teknologi", "Kesehatan"];

export type ThemeStatus = "open" | "review" | "draft";
export type ThemeRow = { name: string; sec: string; chain: string; n: number; ok: number; status: ThemeStatus; tesis: number; when: string; by: string };
export const THEMES: ThemeRow[] = (
  [
    ["Batubara", "Energi", "HHHTL", 21, 19, "open", 412, "Hari ini, 09.12", "Rina"],
    ["Perbankan", "Keuangan", "HTTL", 18, 15, "open", 388, "3 Nov 2026", "Dimas"],
    ["Minyak sawit (CPO)", "Barang Konsumen Primer", "HHTL", 16, 14, "open", 156, "2 Nov 2026", "Dimas"],
    ["Telekomunikasi & menara", "Infrastruktur", "HTL", 9, 8, "open", 131, "31 Okt 2026", "Rina"],
    ["Emas", "Barang Baku", "HHL", 8, 7, "open", 97, "30 Okt 2026", "Dimas"],
    ["Semen & bahan bangunan", "Barang Baku", "HTL", 6, 5, "open", 44, "28 Okt 2026", "Rina"],
    ["Properti residensial", "Properti & Real Estat", "HTL", 14, 9, "review", 63, "1 Nov 2026", "Sistem"],
    ["Nikel & baterai EV", "Barang Baku", "HHTL", 11, 6, "draft", 0, "Kemarin, 15.40", "Rina"],
    ["Gas bumi", "Energi", "HTL", 7, 3, "draft", 0, "27 Okt 2026", "Dimas"],
    ["Data center", "Teknologi", "HTL", 6, 2, "draft", 0, "22 Okt 2026", "Rina"],
    ["Rumah sakit", "Kesehatan", "TL", 7, 4, "draft", 0, "20 Okt 2026", "Dimas"],
  ] as const
).map(([name, sec, chain, n, ok, status, tesis, when, by]) => ({ name, sec, chain, n, ok, status, tesis, when, by }));

export const UNMAPPED = [
  { tk: "TLKM", name: "Telkom Indonesia Tbk", color: "#1D4ED8", note: "Usulan sistem dari sektor dan anak usaha: Telekomunikasi & menara", pick: "Telekomunikasi & menara" },
  { tk: "ABNU", name: "Andalan Baterai Nusantara Tbk", color: "#1C1917", note: "IPO, tercatat 12 Nov. Usulan dari prospektus: Nikel & baterai EV", pick: "Nikel & baterai EV" },
  { tk: "CDIA", name: "Chandra Daya Investasi Tbk", color: "#0F766E", note: "Belum ada tema yang cocok. Bisa jadi perlu tema baru (infrastruktur energi).", pick: "" },
];

export const POOL: Record<string, [string, string]> = {
  PGEO: ["Pertamina Geothermal Energy Tbk", "Energi"], BREN: ["Barito Renewables Energy Tbk", "Energi"], ARKO: ["Arkora Hydro Tbk", "Energi"],
  KEEN: ["Kencana Energi Lestari Tbk", "Energi"], JSKY: ["Sky Energy Indonesia Tbk", "Perindustrian"], MEDC: ["Medco Energi Internasional Tbk", "Energi"],
  TOBA: ["TBS Energi Utama Tbk", "Energi"], INDY: ["Indika Energy Tbk", "Energi"], PGAS: ["Perusahaan Gas Negara Tbk", "Energi"],
  PTPP: ["PP (Persero) Tbk", "Infrastruktur"], WIKA: ["Wijaya Karya (Persero) Tbk", "Infrastruktur"], ADHI: ["Adhi Karya (Persero) Tbk", "Infrastruktur"],
};

export const ICONS: [string, string, string][] = [
  ["mine", "Tambang", "M3 20l6-10 4 6 3-4 5 8z M14 7a2 2 0 100-4 2 2 0 000 4z"],
  ["truck", "Angkutan", "M2 7h12v9H2z M14 10h4l3 3v3h-7 M6 19a2 2 0 100-4 2 2 0 000 4z M17 19a2 2 0 100-4 2 2 0 000 4z"],
  ["bolt", "Listrik", "M13 2 3 14h8l-1 8 10-12h-8l1-8z"],
  ["factory", "Pabrik", "M3 21V10l6 4V10l6 4V5h6v16z"],
  ["ship", "Kapal", "M3 16h18l-2 5H5z M6 16v-6h12v6 M12 10V4 M9 6h6"],
  ["leaf", "Alam", "M5 19C5 10 11 5 20 5c0 9-6 14-15 14z M5 19l8-8"],
  ["drop", "Minyak & gas", "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"],
  ["store", "Penjualan", "M3 9l2-5h14l2 5 M4 9v11h16V9 M3 9h18 M9 20v-6h6v6"],
  ["coin", "Keuangan", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M15 9.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1.3 1.7 3 2.1 3 1 3 2.3-1.3 2.1-3 2.1-3-.8-3-2.1 M12 5.5v13"],
];
// [label, background, bar, soft, ink, line]
export const PALETTE: Record<string, [string, string, string, string, string, string]> = {
  amber: ["Oranye", "#FFFAF1", "#FEA722", "#FFF4E2", "#92400E", "#FCDDA8"],
  blue: ["Biru", "#F5F9FF", "#3B82F6", "#EFF6FF", "#1D4ED8", "#BFDBFE"],
  green: ["Hijau", "#F3FCF6", "#22C55E", "#F0FDF4", "#15803D", "#BBF7D0"],
  violet: ["Ungu", "#F8F5FF", "#8B5CF6", "#F3EEFF", "#6D28D9", "#DDD6FE"],
  rose: ["Merah muda", "#FFF5F7", "#F43F5E", "#FFE4E9", "#BE123C", "#FECDD3"],
  teal: ["Toska", "#F0FBFA", "#14B8A6", "#E6F7F5", "#0F766E", "#99F6E4"],
  stone: ["Abu-abu", "#FAFAF9", "#78716C", "#F5F5F4", "#44403C", "#E7E5E4"],
};
