import type { JobStatus } from "./admin-sync";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
/** "2026-11-06" -> "6 Nov" (a plain date, no timezone). */
export const shortDay = (date: string) => { const [, m, d] = date.split("-").map(Number); return m && d ? `${d} ${BLN[m - 1]}` : date; };

/** One bar of the 14-day chart: share of failed vs ok, 6% of the bar per failed emiten (capped at the full bar). */
export const histPoint = (fails: number, label: string) => { const f = Math.min(100, fails * 6); return { f, o: 100 - f, t: `${label}: ${fails ? `${fails} emiten gagal` : "semua berhasil"}` }; };

/** Job status badge: label + tone. `failed` carries the open failure count. */
export const jobBadge = (status: JobStatus, failed: number): [string, Tone] => ({
  running: ["Berjalan…", "info"], queued: ["Dalam antrean", "info"], failed: [`${failed} gagal`, "warning"], ok: ["Berhasil", "success"], never: ["Belum pernah", "neutral"],
} as Record<JobStatus, [string, Tone]>)[status]; // COPY: perlu review ("Dalam antrean", "Belum pernah")

/** A job waiting for or inside a crawler run: the page polls while any exists. */
export const isBusy = (status: JobStatus) => status === "running" || status === "queued";
