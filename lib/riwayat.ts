import type { Range, Tab } from "./admin-history";

export const TABS: [Tab, string][] = [["all", "Semua"], ["data", "Perubahan data"], ["pub", "Terbit"], ["sec", "Akses & keamanan"]];
export const RANGES: [Range, string][] = [["7", "7 hari terakhir"], ["1", "Hari ini"], ["30", "30 hari terakhir"]];

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const jakarta = (d: Date, opt: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", ...opt }).format(d);

/** "2026-11-06" -> "Hari ini · Jumat, 6 Nov 2026" (calendar days in Asia/Jakarta, like the backend grouping). */
export function dayLabel(date: string, now = new Date()): string {
  const [y, m, d] = date.split("-").map(Number);
  const text = `${HARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${BLN[m - 1]} ${y}`;
  const today = jakarta(now, { year: "numeric", month: "2-digit", day: "2-digit" });
  const yesterday = jakarta(new Date(now.getTime() - 86400000), { year: "numeric", month: "2-digit", day: "2-digit" });
  return date === today ? `Hari ini · ${text}` : date === yesterday ? `Kemarin · ${text}` : text;
}

/** ISO timestamp -> "10.42" in Asia/Jakarta. */
export const timeOf = (iso: string) => jakarta(new Date(iso), { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".");

/** Change cells are string/number or null; the backend sends "—" for empty. */
export const cell = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "string" ? v : JSON.stringify(v));
