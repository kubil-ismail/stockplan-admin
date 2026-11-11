export const SUSPEND_REASONS = ["Spam atau akun palsu", "Menyalahgunakan form laporan", "Permintaan pengguna sendiri", "Lainnya"]; // same list the backend validates against
export const initials = (name: string) => name.split(/[\s-]/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
