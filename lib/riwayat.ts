// shortcut: sample audit events from the design; replace with GET /admin/api/audit (append-only).
export type Kind = "data" | "pub" | "sec";
export type Diff = [string, string, string];
export type Ev = { id: string; day: number; time: string; who: string; kind: Kind; mod: string; verb: string; target: string; rest: string; meta: string; diff: Diff[]; revertable: boolean };

export const PEOPLE: Record<string, [string, string]> = { Rina: ["Rina Putri", "#1C1917"], Dimas: ["Dimas Arya", "#57534E"], Arief: ["Arief Santoso", "#92400E"], Sistem: ["Sistem", ""] };
export const MODULES = ["Data emiten", "Tema & rantai nilai", "Pengguna", "Masukan & laporan", "Sinkron BEI", "Pengaturan aplikasi", "Akses & peran", "Keamanan"];
export const DAY_LABEL: Record<number, string> = { 0: "Hari ini · Jumat, 6 Nov 2026", 1: "Kemarin · Kamis, 5 Nov 2026", 2: "Rabu, 4 Nov 2026", 3: "Selasa, 3 Nov 2026" };

const e = (id: string, day: number, time: string, who: string, kind: Kind, mod: string, verb: string, target: string, rest: string, meta: string, diff: Diff[], revertable: boolean): Ev =>
  ({ id, day, time, who, kind, mod, verb, target, rest, meta, diff, revertable });

export const EVENTS: Ev[] = [
  e("e1", 0, "10.42", "Rina", "data", "Data emiten", "memperbarui tren keuangan", "BUMI", "(draf)", "Chrome · Jakarta", [["Laba bersih H1-2026", "Rp1,92 T", "Rp2,04 T"], ["Sumber", "LK H1-2026 (tidak diaudit)", "LK H1-2026, Catatan 28"]], true),
  e("e2", 0, "09.58", "Arief", "sec", "Akses & peran", "mengubah peran", "kevin@stockplan.id", "dari Viewer menjadi Editor tema", "Chrome · Jakarta", [["Peran", "Viewer", "Editor tema"]], true),
  e("e3", 0, "09.41", "Sistem", "data", "Masukan & laporan", "menerima tiket baru", "SP-2611-0482", "dari budi@email.com", "Form Bantuan", [], false),
  e("e4", 0, "09.12", "Rina", "data", "Tema & rantai nilai", "menambahkan DEWA ke tahap", "Kontraktor tambang", "· Batubara (draf)", "Chrome · Jakarta", [["Emiten di tahap 1", "UNTR, DOID, PTRO, ABMM", "UNTR, DOID, PTRO, DEWA, ABMM"]], true),
  e("e5", 0, "08.47", "Sistem", "sec", "Keamanan", "mencatat 3 kali gagal masuk untuk", "dimas@stockplan.id", "", "IP 182.253.x.x · Firefox · Bandung", [], false),
  e("e6", 0, "08.31", "Dimas", "pub", "Data emiten", "menerbitkan profil", "PTBA", "", "Chrome · Surabaya", [["Status", "Perlu ditinjau", "Terbit"], ["Ringkasan bisnis", "—", "Ditulis ulang (212 karakter)"]], false),
  e("e7", 0, "06.04", "Sistem", "data", "Sinkron BEI", "menyelesaikan sinkron harian", "958 emiten", "· 3 gagal (BUMI, DEWA, PTRO)", "4 menit 31 detik", [], false),
  e("e8", 1, "16.20", "Dimas", "data", "Masukan & laporan", "menandai laporan selesai di", "ITMG", "", "Chrome · Surabaya", [["Status tiket", "Ditangani", "Selesai"]], false),
  e("e9", 1, "11.05", "Rina", "data", "Data emiten", "menambahkan ringkasan bisnis", "INCO", "", "Chrome · Jakarta", [["Ringkasan bisnis", "—", "Penambang dan pengolah nikel di Sulawesi…"]], true),
  e("e10", 1, "10.30", "Arief", "sec", "Pengaturan aplikasi", "mengubah teks banner pengumuman", "Beranda", "", "Safari · Jakarta", [["Banner", "Beta diperpanjang sampai 31 Des", "Langganan dibuka Januari 2027"]], true),
  e("e11", 1, "09.15", "Rina", "pub", "Tema & rantai nilai", "menerbitkan tema", "Telekomunikasi & menara", "", "Chrome · Jakarta", [["Status", "Draf", "Terbuka"], ["Kesiapan", "8/9", "8/9 (89%)"]], false),
  e("e12", 3, "14.02", "Dimas", "sec", "Pengguna", "menangguhkan akun", "promo-saham88", "· alasan: Spam atau akun palsu", "Chrome · Surabaya", [["Status akun", "Aktif", "Ditangguhkan"]], true),
  e("e13", 3, "09.40", "Rina", "data", "Data emiten", "memperbarui porsi ekspor", "BUMI", "dari laporan pengguna SP-2611-0452", "Chrome · Jakarta", [["Penjualan ekspor", "60%", "52%"], ["Penjualan domestik", "40%", "48%"]], true),
  e("e14", 3, "06.00", "Sistem", "data", "Sinkron BEI", "menemukan IPO baru", "CDIA", "", "Pengumuman pencatatan BEI", [], false),
];

export type Filters = { q: string; mod: string; who: string; range: "1" | "7" | "30"; tab: "all" | Kind };

/** Range filter, module, actor and free-text search; the tab is applied separately so tab counts reflect the rest. */
export function filterEvents(list: Ev[], f: Omit<Filters, "tab">) {
  const q = f.q.trim().toLowerCase();
  return list.filter((x) =>
    (f.range === "1" ? x.day === 0 : true) && (!f.mod || x.mod === f.mod) && (!f.who || x.who === f.who) &&
    (!q || `${x.verb} ${x.target} ${x.rest} ${PEOPLE[x.who]?.[0] ?? x.who} ${x.diff.map((d) => d.join(" ")).join(" ")}`.toLowerCase().includes(q)));
}

/** A revert never edits history: it appends a new event whose diff is the original one swapped. */
export function revertEvent(src: Ev, actor: string, id: string): Ev {
  return { id, day: 0, time: "Baru saja", who: actor, kind: src.kind, mod: src.mod, verb: "mengembalikan perubahan", target: src.target, rest: `(dari ${src.id})`, meta: "Chrome · Jakarta", diff: src.diff.map(([k, a, b]) => [k, b, a] as Diff), revertable: false };
}
