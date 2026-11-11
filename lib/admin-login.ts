// Client-side checks for the admin login forms. The API repeats them (lib/adminAuth.js in the backend) and stays the source of truth.
export type LoginValues = { email: string; password: string };
export type OtpValues = { code: string; trust: boolean };

export const MSG = {
  workEmail: "Gunakan email kerja @stockplan.id.",
  password: "Isi password Anda.",
  otp: "Kode harus 6 digit angka.",
  backup: "Format kode cadangan: xxxx-xxxx.",
};

export function validateLogin(v: LoginValues) {
  const errors: Partial<Record<keyof LoginValues, string>> = {};
  if (!/^[^\s@]+@stockplan\.id$/i.test(v.email.trim())) errors.email = MSG.workEmail;
  if (!v.password) errors.password = MSG.password;
  return errors;
}

export function validateOtp(v: OtpValues, backup: boolean) {
  const code = v.code.trim();
  const ok = backup ? /^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(code) : /^\d{6}$/.test(code);
  return ok ? {} : { code: backup ? MSG.backup : MSG.otp };
}

/** Keeps typing within the expected shape: 6 digits for TOTP, xxxx-xxxx (max 9 chars) for a backup code. */
export const cleanCode = (raw: string, backup: boolean) => (backup ? raw.slice(0, 9) : raw.replace(/\D/g, "").slice(0, 6));
