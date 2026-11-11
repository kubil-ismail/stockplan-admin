// shortcut: initial values are the design's sample settings; load from GET /admin/api/settings and PUT on publish.
export type SectionKey = "masalah" | "cara" | "rantai" | "harga" | "faq" | "penutup";
export type Settings = {
  appName: string; tagline: string; accent: string;
  heroT: string; heroS: string; cta: string; ctaDest: "reg" | "wait"; secs: [SectionKey, boolean][]; seoT: string; seoD: string;
  reg: "open" | "wait" | "closed"; beta: boolean; betaEnd: string; ban: boolean; banText: string; banKind: "info" | "warn"; banUntil: string;
  mt: boolean; mtMsg: string; fromName: string; replyTo: string;
};

export const BASE: Settings = {
  appName: "StockPlan", tagline: "Rencanakan investasi dari bisnisnya", accent: "#FEA722",
  heroT: "Pahami bisnisnya dulu, baru beli sahamnya",
  heroS: "Lihat siapa saja yang bermain di satu tema, dari hulu sampai hilir, lalu susun portofolio dari tesis yang Anda yakini.",
  cta: "Gabung beta gratis", ctaDest: "reg",
  secs: [["masalah", true], ["cara", true], ["rantai", true], ["harga", false], ["faq", true], ["penutup", true]],
  seoT: "StockPlan — Rencana investasi saham berbasis bisnis",
  seoD: "Peta rantai nilai emiten BEI, tesis investasi, dan portofolio yang punya alasan. Untuk investor jangka panjang.",
  reg: "open", beta: true, betaEnd: "2026-12-31", ban: true,
  banText: "Langganan dibuka Januari 2027. Akses beta tetap gratis sampai 31 Desember.", banKind: "info", banUntil: "2026-12-31",
  mt: false, mtMsg: "StockPlan sedang diperbarui dan kembali sekitar pukul 23.00 WIB.", fromName: "StockPlan", replyTo: "bantuan@stockplan.id",
};

export const SECTION_INFO: Record<SectionKey, [string, string]> = {
  masalah: ["Masalah", "Kenapa memilih saham dari nama sektor itu menyesatkan"],
  cara: ["Cara kerja", "Tema → rantai nilai → tesis → portofolio"],
  rantai: ["Contoh rantai nilai", "Peta interaktif tema Batubara"],
  harga: ["Harga", "Rp79.000/bulan · Rp790.000/tahun (sementara)"],
  faq: ["Pertanyaan umum", "6 pertanyaan dari halaman Bantuan"],
  penutup: ["Ajakan penutup", "Tombol daftar terakhir di bawah halaman"],
};
export const FIELD_LABEL: Record<keyof Settings, string> = {
  appName: "nama", tagline: "tagline", accent: "warna utama", heroT: "judul landing", heroS: "subjudul landing", cta: "tombol landing", ctaDest: "tujuan tombol",
  secs: "bagian landing", seoT: "judul SEO", seoD: "deskripsi SEO", reg: "pendaftaran", beta: "mode beta", betaEnd: "akhir beta", ban: "banner", banText: "teks banner",
  banKind: "jenis banner", banUntil: "masa banner", mt: "mode pemeliharaan", mtMsg: "pesan pemeliharaan", fromName: "nama pengirim", replyTo: "alamat balasan",
};

export const changedKeys = (base: Settings, cur: Settings) => (Object.keys(base) as (keyof Settings)[]).filter((k) => JSON.stringify(base[k]) !== JSON.stringify(cur[k]));

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h: string) => { const [r, g, b] = rgb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** Picks dark or white text for a button background and reports the WCAG contrast of that pair (>= 4.5 passes AA). */
export function onAccent(hex: string) {
  const L = lum(hex), dark = (L + 0.05) / (lum("#1C1917") + 0.05), white = 1.05 / (L + 0.05);
  return { text: dark >= white ? "#1C1917" : "#FFFFFF", dark: dark >= white, ratio: Math.max(dark, white) };
}
export const tint = (h: string, a: number) => "#" + rgb(h).map((v) => Math.round(v * a + 255 * (1 - a)).toString(16).padStart(2, "0")).join("");
export const ink = (h: string) => "#" + rgb(h).map((v) => Math.round(v * 0.45).toString(16).padStart(2, "0")).join("");
