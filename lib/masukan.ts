// shortcut: sample tickets from the design; replace with /admin/api/tickets. "Rina" is the signed-in admin.
export type Kind = "bug" | "data" | "fit" | "etc";
export type TStatus = "new" | "prog" | "wait" | "done" | "spam";
export type Msg = { who: string; t: string; body: string; kind: "user" | "reply" | "note"; att?: string };
export type Ticket = { id: string; k: Kind; s: TStatus; a: string; from: string; tk: string; page: string; subj: string; body: string; sent: string; age: string; late: number; votes?: number; dev: string; att: string; replies?: [string, string, string][]; notes?: [string, string, string][] };

export const ME = "Rina";
// Second item = Badge variant (components/ui/badge.tsx).
export const KIND: Record<Kind, [string, "danger" | "warning" | "info" | "neutral"]> = {
  bug: ["Laporkan masalah", "danger"], data: ["Data salah", "warning"], fit: ["Usulan fitur", "info"], etc: ["Lainnya", "neutral"],
};
export const STATUS: Record<TStatus, [string, "warning" | "info" | "neutral" | "success" | "danger"]> = {
  new: ["Baru", "warning"], prog: ["Ditangani", "info"], wait: ["Menunggu pengguna", "neutral"], done: ["Selesai", "success"], spam: ["Spam", "danger"],
};
export const USERS: Record<string, [string, string]> = {
  "Andi Wijaya": ["andi.w@outlook.com", "#1D4ED8"], "Sari Kusuma": ["sari.k@gmail.com", "#92400E"], "Budi Santoso": ["budi@email.com", "#1C1917"],
  "Hendra Gunawan": ["hendra.g@gmail.com", "#0F766E"], "Rizky Pratama": ["rizky.p@yahoo.co.id", "#6D28D9"], "Larasati Putri": ["laras.p@gmail.com", "#1D4ED8"],
  "Maya Anggraini": ["maya.ang@gmail.com", "#BE185D"], "promo-saham88": ["promo.saham88@mail.com", "#1C1917"],
};
export const STAFF: Record<string, string> = { Rina: "#1C1917", Dimas: "#57534E" };

export const TICKETS: Ticket[] = [
  { id: "SP-2611-0471", k: "data", s: "prog", a: "Rina", from: "Andi Wijaya", tk: "AADI", page: "Halaman emiten", subj: "Porsi jasa logistik AADI kelihatan terlalu besar", body: "Porsi jasa logistik kelihatannya terlalu besar. Di laporan tahunan 2025 kontribusinya sekitar 20%, bukan 28%. Mohon dicek lagi.", sent: "Selasa, 3 Nov 2026 · 14.22", age: "3 hari", late: 1, dev: "Chrome · Windows", att: "tangkapan-layar-AR2025-hlm88.png", notes: [["Rina", "Rabu, 4 Nov · 10.05", "Cek LK 2025 Catatan 30: logistik 28% dari pendapatan konsolidasi, tapi kalau eliminasi antar-segmen dikeluarkan jadi ~21%. Perlu putuskan pakai angka yang mana."]] },
  { id: "SP-2611-0482", k: "data", s: "new", a: "", from: "Budi Santoso", tk: "ADMR", page: "Halaman emiten", subj: "Proyek smelter aluminium ADMR belum ada di anak usaha", body: "Di halaman ADMR, daftar anak usaha belum memuat Kalimantan Aluminium Industry yang sedang membangun smelter. Sumber: keterbukaan informasi BEI 12 Okt 2026.", sent: "Hari ini · 09.41", age: "1 jam", late: 0, dev: "Chrome · Windows", att: "" },
  { id: "SP-2611-0476", k: "data", s: "new", a: "", from: "Sari Kusuma", tk: "AADI", page: "Tema bisnis", subj: "AADI tidak muncul di tahap pembangkit", body: "Anak usaha yang punya PLTU tidak muncul, padahal AADI ada di tahap pembangkit juga?", sent: "Rabu, 4 Nov 2026 · 20.17", age: "2 hari", late: 0, dev: "Aplikasi Android", att: "" },
  { id: "SP-2611-0468", k: "bug", s: "prog", a: "Dimas", from: "Hendra Gunawan", tk: "", page: "Halaman emiten", subj: "Grafik tren keuangan kosong di iPhone", body: "Bagian Tren keuangan di halaman BUMI cuma kotak kosong di Safari iPhone 13. Di laptop normal.", sent: "Senin, 2 Nov 2026 · 07.50", age: "4 hari", late: 2, dev: "Safari · iPhone 13 · iOS 19", att: "grafik-kosong.jpg", replies: [["Dimas", "Senin, 2 Nov · 13.10", "Halo Pak Hendra, terima kasih laporannya. Kami sudah bisa mengulang masalahnya di iPhone dan sedang memperbaikinya. Kami kabari lagi setelah selesai."]] },
  { id: "SP-2611-0479", k: "bug", s: "new", a: "", from: "Larasati Putri", tk: "", page: "Tesis", subj: "Tombol Lanjut di langkah 3 tulis tesis tidak bisa diklik", body: "Sudah isi batas gugur tapi tombol Lanjut tetap abu-abu. Saya isi angka pakai koma (12,5%).", sent: "Kemarin · 21.03", age: "13 jam", late: 0, dev: "Firefox · macOS", att: "" },
  { id: "SP-2611-0455", k: "fit", s: "wait", a: "Rina", from: "Maya Anggraini", tk: "", page: "Watchlist", subj: "Notifikasi saat emiten di watchlist rilis laporan keuangan", body: "Akan sangat membantu kalau ada email atau notifikasi saat emiten di watchlist merilis laporan kuartalan.", sent: "28 Okt 2026", age: "9 hari", late: 0, votes: 14, dev: "Chrome · Android", att: "", replies: [["Rina", "29 Okt · 09.30", "Terima kasih, Bu Maya. Usulan ini sudah masuk daftar kami. Boleh tahu, Ibu lebih suka lewat email atau notifikasi di aplikasi?"]] },
  { id: "SP-2610-0391", k: "fit", s: "done", a: "Dimas", from: "Sari Kusuma", tk: "", page: "Tesis", subj: "Ekspor tesis ke PDF", body: "Saya ingin menyimpan tesis sebagai PDF untuk catatan pribadi.", sent: "20 Okt 2026", age: "17 hari", late: 0, votes: 6, dev: "Chrome · macOS", att: "", replies: [["Dimas", "22 Okt · 11.00", "Terima kasih, Bu Sari. Usulan ekspor PDF sudah masuk daftar dan direncanakan setelah rilis."]] },
  { id: "SP-2611-0480", k: "etc", s: "new", a: "", from: "Rizky Pratama", tk: "", page: "Lainnya", subj: "Email konfirmasi tidak masuk", body: "Sudah daftar dua hari lalu tapi email konfirmasi tidak ada, folder spam juga sudah dicek.", sent: "Kemarin · 18.12", age: "16 jam", late: 0, dev: "Chrome · Android", att: "" },
  { id: "SP-2611-0452", k: "data", s: "done", a: "Rina", from: "Budi Santoso", tk: "BUMI", page: "Halaman emiten", subj: "Porsi penjualan ekspor BUMI", body: "Porsi ekspor BUMI di sumber pendapatan tertulis 60%, di LK 2025 sekitar 52%.", sent: "30 Okt 2026", age: "7 hari", late: 0, dev: "Chrome · Windows", att: "", replies: [["Rina", "3 Nov · 09.40", "Terima kasih, Pak Budi. Anda benar, angkanya sudah kami perbaiki menjadi 52% sesuai Laporan Keuangan 2025."]] },
  { id: "SP-2611-0466", k: "etc", s: "spam", a: "Dimas", from: "promo-saham88", tk: "", page: "Lainnya", subj: "GRUP SINYAL SAHAM PASTI CUAN", body: "Gabung grup sinyal kami, profit 30% per minggu! Hubungi wa.me/…", sent: "2 Nov 2026", age: "4 hari", late: 0, dev: "—", att: "" },
];

export const isOpen = (s: TStatus) => s === "new" || s === "prog" || s === "wait";
/** Late = still on us (not waiting on the user) and past the 2-working-day promise. */
export const isLate = (t: Pick<Ticket, "s" | "late">) => isOpen(t.s) && t.s !== "wait" && t.late > 0;

export type Tab = "open" | "new" | "wait" | "done" | "all";
export const inTab = (s: TStatus, t: Tab) => t === "all" || (t === "open" && isOpen(s)) || (t === "new" && s === "new") || (t === "wait" && s === "wait") || (t === "done" && (s === "done" || s === "spam"));

/** Moving a ticket past "new" claims it for the actor; assigning a "new" ticket starts work on it. */
export const applyStatus = (cur: { s: TStatus; a: string }, s: TStatus, me = ME) => ({ s, a: s !== "new" && !cur.a ? me : cur.a });
export const applyAssign = (cur: { s: TStatus; a: string }, a: string) => ({ a, s: cur.s === "new" && a ? ("prog" as TStatus) : cur.s });

export function templates(t: Pick<Ticket, "k" | "tk" | "from">): [string, string][] {
  const f = t.from.split(" ")[0];
  if (t.k === "data") return [
    ["Sudah diperbaiki", `Terima kasih, ${f}. Anda benar, data ${t.tk} sudah kami perbaiki dan langsung tampil di aplikasi.`],
    ["Data sudah sesuai", `Terima kasih sudah mengecek, ${f}. Setelah kami periksa, angka di aplikasi mengikuti laporan keuangan terbaru (sumbernya tercantum di halaman emiten).`],
    ["Butuh sumber", `Terima kasih, ${f}. Boleh kirimkan sumbernya (nomor keterbukaan informasi BEI atau halaman laporan tahunan)? Kami cek begitu diterima.`],
  ];
  if (t.k === "fit") return [
    ["Masuk daftar usulan", `Terima kasih, ${f}. Usulan ini sudah masuk daftar kami. Kami kabari kalau mulai dikerjakan.`],
    ["Butuh detail", `Terima kasih, ${f}. Boleh ceritakan lebih detail kapan Anda paling butuh fitur ini?`],
  ];
  return [
    ["Sedang diperbaiki", `Halo ${f}, terima kasih laporannya. Kami sudah bisa mengulang masalahnya dan sedang memperbaikinya.`],
    ["Butuh info tambahan", `Halo ${f}, boleh kirimkan tangkapan layar dan langkah sebelum masalahnya muncul?`],
    ["Sudah selesai", `Halo ${f}, masalahnya sudah kami perbaiki. Silakan coba lagi dan kabari kalau masih terjadi.`],
  ];
}

export const initials = (n: string) => n.split(/[\s-]/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
export const MIN_REPLY = 10;
