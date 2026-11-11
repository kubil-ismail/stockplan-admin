// Pure helpers for the IPO form (number parsing, Indonesian formatting, schedule stage).
export const num = (v: string) => {
  const x = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
export const dec = (x: number, d: number) => {
  const s = x.toFixed(d).replace(".", ",");
  return s.includes(",") ? s.replace(/0+$/, "").replace(/,$/, "") : s;
};
export const rp = (x: number) =>
  x >= 1e12 ? `Rp${dec(x / 1e12, 2)} T` : x >= 1e9 ? `Rp${dec(x / 1e9, 1)} M` : `Rp${Math.round(x).toLocaleString("id-ID")}`;
export const lembar = (x: number) =>
  x >= 1e9 ? `${dec(x / 1e9, 2)} miliar lembar` : x >= 1e6 ? `${dec(x / 1e6, 1)} juta lembar` : `${Math.round(x).toLocaleString("id-ID")} lembar`;

const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const parts = (s: string) => /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
export const fdShort = (s: string) => { const m = parts(s); return m ? `${+m[3]} ${BLN[+m[2] - 1]}` : "belum diisi"; };

export type Dates = { bbS: string; bbE: string; ojk: string; puS: string; puE: string; jt: string; ls: string };
export const ORDER: [keyof Dates, string][] = [
  ["bbS", "mulai bookbuilding"], ["bbE", "akhir bookbuilding"], ["ojk", "tanggal efektif"], ["puS", "mulai penawaran umum"],
  ["puE", "akhir penawaran umum"], ["jt", "penjatahan"], ["ls", "pencatatan"],
];
export function scheduleError(d: Dates) {
  let prev: [keyof Dates, string] | null = null;
  for (const o of ORDER) {
    const v = d[o[0]];
    if (!v) continue;
    if (prev && v < d[prev[0]]) return `Tanggal ${o[1]} tidak boleh sebelum ${prev[1]}.`;
    prev = o;
  }
  return "";
}

/** Index of the active stage (x.5 = between stages), -1 = not started. `today` is ISO yyyy-mm-dd. */
export function stageIndex(stages: [string, string, string][], today: string) {
  let cur = -1;
  stages.forEach((s, i) => { if (s[1] && s[1] <= today) cur = i; });
  if (cur >= 0 && cur < stages.length - 1 && stages[cur][2] && stages[cur][2] < today && stages[cur + 1][1] > today) cur += 0.5;
  return cur;
}
