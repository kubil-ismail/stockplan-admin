// shortcut: sample users from the design; replace with GET /admin/api/users.
export type Activity = "act" | "new" | "idle";
export type Plan = "y" | "m" | "n";
export type Status = Activity | "sus";
export type User = { id: string; name: string; email: string; joined: string; last: string; activity: Activity; tesis: number; evals: number; ems: number; temas: number; plan: Plan; login: "Email" | "Google"; verified: boolean };

export const USERS: User[] = (
  [
    ["u1", "Budi Santoso", "budi@email.com", "3 Okt 2026", "Hari ini, 09.58", "act", 3, 2, 14, 6, "y", "Email", true],
    ["u2", "Sari Kusuma", "sari.k@gmail.com", "12 Sep 2026", "Hari ini, 08.31", "act", 5, 4, 22, 9, "y", "Google", true],
    ["u3", "Andi Wijaya", "andi.w@outlook.com", "28 Agu 2026", "Kemarin, 21.12", "act", 2, 1, 9, 4, "m", "Email", true],
    ["u4", "Dewi Lestari", "dewi.lestari@gmail.com", "2 Nov 2026", "Kemarin, 19.40", "act", 1, 0, 4, 2, "n", "Google", true],
    ["u5", "Rizky Pratama", "rizky.p@yahoo.co.id", "5 Nov 2026", "Belum pernah masuk", "new", 0, 0, 0, 0, "n", "Email", false],
    ["u6", "Maya Anggraini", "maya.ang@gmail.com", "19 Sep 2026", "3 Nov 2026", "act", 4, 3, 17, 7, "y", "Google", true],
    ["u7", "Hendra Gunawan", "hendra.g@gmail.com", "14 Agu 2026", "22 Sep 2026", "idle", 1, 0, 6, 3, "m", "Google", true],
    ["u8", "Putri Ramadhani", "putri.r@email.com", "4 Nov 2026", "Belum pernah masuk", "new", 0, 0, 0, 0, "n", "Email", false],
    ["u9", "promo-saham88", "promo.saham88@mail.com", "1 Nov 2026", "2 Nov 2026", "act", 0, 0, 0, 1, "n", "Email", true],
    ["u10", "Fajar Nugroho", "fajar.n@gmail.com", "30 Agu 2026", "1 Okt 2026", "idle", 2, 1, 8, 5, "n", "Google", true],
    ["u11", "Larasati Putri", "laras.p@gmail.com", "7 Okt 2026", "Hari ini, 07.05", "act", 3, 1, 11, 5, "m", "Email", true],
    ["u12", "Yoga Prasetyo", "yoga.pras@outlook.com", "21 Sep 2026", "4 Nov 2026", "act", 2, 2, 7, 3, "y", "Email", true],
  ] as const
).map(([id, name, email, joined, last, activity, tesis, evals, ems, temas, plan, login, verified]) => ({ id, name, email, joined, last, activity, tesis, evals, ems, temas, plan, login, verified }));

export const TOTALS: Record<"all" | Status, number> = { all: 1284, act: 918, new: 74, idle: 289, sus: 3 };
export const SUSPENDED_INIT: Record<string, [string, string]> = { u9: ["3 Nov 2026", "Spam atau akun palsu"] };
export const FEEDBACK: Record<string, { t: string; m: string }[]> = {
  u1: [{ t: "Data salah · BUMI", m: "Sumber pendapatan · 3 Nov 2026 · selesai" }],
  u2: [{ t: "Data salah · AADI", m: "Anak usaha · 4 Nov 2026 · belum ditangani" }, { t: "Masukan fitur", m: "Ekspor tesis ke PDF · 20 Okt 2026" }],
  u3: [{ t: "Data salah · AADI", m: "Sumber pendapatan · 3 Nov 2026 · belum ditangani" }],
};
export const LOGINS: Record<Activity, [string, string][]> = {
  act: [["Chrome · Windows", "Hari ini, 09.58"], ["Aplikasi Android", "Kemarin, 20.14"], ["Chrome · Windows", "4 Nov 2026"]],
  idle: [["Safari · iPhone", "22 Sep 2026"], ["Safari · iPhone", "14 Sep 2026"]],
  new: [],
};
export const PLAN_LABEL: Record<Plan, [string, string]> = { y: ["Tahunan", "Tahunan · Rp790.000/tahun"], m: ["Bulanan", "Bulanan · Rp79.000/bulan"], n: ["—", "Belum memilih"] };
export const SUSPEND_REASONS = ["Spam atau akun palsu", "Menyalahgunakan form laporan", "Permintaan pengguna sendiri", "Lainnya"];

/** Suspended wins over everything; otherwise the activity bucket (unconfirmed accounts are "new"). */
export const statusOf = (u: Pick<User, "activity">, suspended: boolean): Status => (suspended ? "sus" : u.activity);
export const initials = (name: string) => name.split(/[\s-]/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
