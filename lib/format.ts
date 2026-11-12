const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();

/** ISO timestamp -> "Hari ini, 09.40" / "Kemarin, 11.05" / "4 Nov 2026" (design copy, local time). `now` is injectable for tests. */
export function fmtWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = `${pad(d.getHours())}.${pad(d.getMinutes())}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return `Hari ini, ${time}`;
  if (dayKey(d) === dayKey(yesterday)) return `Kemarin, ${time}`;
  return `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Kamis, 5 November 2026" in Asia/Jakarta (dashboard header, from the server clock). */
export const longDate = (iso: string) => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(iso));
