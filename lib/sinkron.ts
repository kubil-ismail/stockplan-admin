// shortcut: sample sync data from the design; replace with GET /admin/api/sync (jobs, failures, conflicts).
export type Job = { key: string; name: string; desc: string; sched: string; next: string; last: string; dur: string; note: string };
export type Fail = { tk: string; msg: string; log: string };
export type Conflict = { id: string; tk: string; field: string; why: string; a: string; b: string; when: string };

export const JOBS: Job[] = (
  [
    ["prof", "Profil perusahaan", "Nama, alamat, papan, sektor IDX-IC", "Harian 06.00", "besok 06.00", "Hari ini 06.00", "958 emiten · 1 mnt 12 dtk", ""],
    ["px", "Harga penutupan", "Dipakai untuk nilai portofolio, bukan real time", "Hari bursa 17.30", "hari ini 17.30", "Kemarin 17.31", "958 emiten · 38 dtk", ""],
    ["sub", "Anak usaha", "Daftar dan persentase kepemilikan", "Harian 06.00", "besok 06.00", "Hari ini 06.01", "958 emiten · 1 mnt 40 dtk", "2 perubahan perlu ditinjau"],
    ["mgmt", "Manajemen", "Direksi dan komisaris", "Harian 06.00", "besok 06.00", "Hari ini 06.03", "955 dari 958 · 41 dtk", "1 perubahan perlu ditinjau"],
    ["idx", "Category index", "Klasifikasi IDX-IC dan indeks", "Mingguan, Senin 06.00", "Senin 9 Nov", "Senin 2 Nov 06.00", "958 emiten · 12 dtk", ""],
    ["kip", "Keterbukaan informasi", "Pengumuman emiten untuk “Perubahan bisnis”", "Tiap 30 menit, jam bursa", "12.00", "Hari ini 11.30", "14 dokumen baru", ""],
    ["lk", "Laporan keuangan (XBRL)", "Laporan kuartalan dan tahunan", "Harian 07.00", "besok 07.00", "Hari ini 07.02", "23 laporan Q3 baru", "23 laporan belum diproses tim"],
    ["ipo", "Pencatatan & IPO", "Emiten baru dan jadwal penawaran umum", "Harian 06.00", "besok 06.00", "Hari ini 06.00", "1 jadwal IPO aktif", ""],
  ] as const
).map(([key, name, desc, sched, next, last, dur, note]) => ({ key, name, desc, sched, next, last, dur, note }));

export const FAILS: Fail[] = [
  { tk: "BUMI", msg: "Halaman profil BEI tidak bisa dibaca", log: "GET /profil-perusahaan-tercatat/BUMI → 503 (3x)" },
  { tk: "DEWA", msg: "Halaman profil BEI tidak bisa dibaca", log: "GET /profil-perusahaan-tercatat/DEWA → timeout 30 dtk" },
  { tk: "PTRO", msg: "Format tabel manajemen berubah", log: 'Parser: kolom "Jabatan" tidak ditemukan' },
];
export const CONFLICTS: Conflict[] = [
  { id: "c1", tk: "ADMR", field: "Anak usaha baru", why: "BEI menambahkan anak usaha. Bagian ini sudah pernah diatur tim, jadi tidak ditimpa otomatis.", a: "3 anak usaha ditampilkan", b: "+ PT Kalimantan Aluminium Industry (65%)", when: "hari ini 06.01" },
  { id: "c2", tk: "BUMI", field: "Direktur utama", why: "Data manajemen dipakai di halaman emiten.", a: "[Nama direktur utama saat ini]", b: "[Nama dari pengumuman BEI 4 Nov]", when: "hari ini 06.03" },
  { id: "c3", tk: "PTBA", field: "Kepemilikan anak usaha", why: "Persentase berubah dari laporan tahunan terbaru.", a: "Bukit Asam Prima 99,99%", b: "Bukit Asam Prima 100%", when: "hari ini 06.01" },
];
/** Failed emiten per day, 24 Okt … 6 Nov; the last bar follows the live failure list. */
export const HISTORY = [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 3];
export const DAY_LABEL = ["24 Okt", "25 Okt", "26 Okt", "27 Okt", "28 Okt", "29 Okt", "30 Okt", "31 Okt", "1 Nov", "2 Nov", "3 Nov", "4 Nov", "5 Nov", "6 Nov"];

export const histPoint = (fails: number, label: string) => ({ f: fails * 6, o: 100 - fails * 6, t: `${label}: ${fails ? `${fails} emiten gagal` : "semua berhasil"}` });

/** Management is "ok" once nothing is failing or it was just re-run. */
export const jobOk = (key: string, openFails: number, rerun: boolean) => key !== "mgmt" || openFails === 0 || rerun;
