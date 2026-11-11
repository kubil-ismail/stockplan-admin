"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { adminLogin, adminLogout, adminMe, adminVerify } from "@/lib/admin-api";
import { markSignedIn } from "@/lib/admin-session-flag";
import { cleanCode, validateLogin, validateOtp, type LoginValues, type OtpValues } from "@/lib/admin-login";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="destructive">
      <TriangleAlert aria-hidden />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

function Steps({ n }: { n: 1 | 2 }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[1, 2].map((i) => <i key={i} className={cn("h-1 flex-1 rounded-full", i <= n ? "bg-foreground" : "bg-border")} />)}
    </div>
  );
}

const Heading = ({ title, sub }: { title: string; sub: string }) => (
  <div className="flex flex-col gap-1">
    <h1 id="h1" className="text-[22px] font-bold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground">{sub}</p>
  </div>
);

const LOCKED_MSG = "Terlalu banyak percobaan. Akun dikunci 15 menit dan super admin sudah diberi tahu.";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [show, setShow] = useState(false);
  const [locked, setLocked] = useState(false);
  const [backup, setBackup] = useState(false);

  // Already signed in (and past 2FA)? Skip the form. A pending 2FA session makes /auth/me answer 401, so it stays here.
  useEffect(() => {
    let live = true;
    void adminMe().then((r) => { if (live && r.ok) { markSignedIn(); router.replace("/admin"); } });
    return () => { live = false; };
  }, [router]);

  // Both forms show one alert (design): a server message in `status`, else the first field error after a submit.
  // Errors clear on the next keystroke, like the design. Validation only runs on submit.
  const form1 = useFormik<LoginValues>({
    initialValues: { email: "", password: "" },
    validateOnChange: false,
    validateOnBlur: false,
    validate: validateLogin,
    onSubmit: async (v, { setStatus, setFieldValue }) => {
      if (locked) return;
      const r = await adminLogin(v.email.trim(), v.password);
      if (!r.ok) {
        if (r.error.code === "ACCOUNT_LOCKED") { setLocked(true); return setStatus(undefined); }
        return setStatus(r.error.fields?.email ?? r.error.fields?.password ?? r.error.message);
      }
      setStatus(undefined);
      void setFieldValue("password", "");
      if ("step" in r.data) setStep(2);
      else { markSignedIn(); setStep(3); } // trusted device: the API already returned the admin, no 2FA needed
    },
  });

  const form2 = useFormik<OtpValues>({
    initialValues: { code: "", trust: true },
    validateOnChange: false,
    validateOnBlur: false,
    validate: (v) => validateOtp(v, backup),
    onSubmit: async (v, { setStatus, resetForm }) => {
      const r = await adminVerify(v.code.trim(), backup ? "backup" : "totp", v.trust);
      if (!r.ok) {
        if (r.error.code === "ACCOUNT_LOCKED") { resetForm(); setStep(1); setLocked(true); return; }
        return setStatus(r.error.fields?.code ?? r.error.message);
      }
      markSignedIn();
      setStep(3);
    },
  });

  const email = form1.values.email.trim();
  const alert1 = locked ? LOCKED_MSG : (form1.status as string | undefined) ?? form1.errors.email ?? form1.errors.password;
  const alert2 = (form2.status as string | undefined) ?? form2.errors.code;
  const touch1 = () => { if (form1.status) form1.setStatus(undefined); if (form1.errors.email || form1.errors.password) form1.setErrors({}); };
  const touch2 = () => { if (form2.status) form2.setStatus(undefined); if (form2.errors.code) form2.setErrors({}); };
  // One handler per field keeps the Formik value, the alert reset and any sanitising in the same place.
  const on1 = (e: React.ChangeEvent<HTMLInputElement>) => { touch1(); form1.handleChange(e); };

  // "Ganti akun": drop the half-open 2FA session on the server too (logout is idempotent for it).
  const switchAccount = async () => { await adminLogout(); form2.resetForm(); form1.setFieldValue("password", ""); setStep(1); };

  return (
    <Card role="main" aria-labelledby="h1" className="w-full max-w-[420px] rounded-2xl py-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,.35)]">
      <CardContent className="px-7">
        {step === 1 && (
          <form onSubmit={form1.handleSubmit} noValidate>
            <FieldGroup className="gap-[18px]">
              <Steps n={1} />
              <Heading title="Masuk ke panel admin" sub="Khusus tim StockPlan. Gunakan email kerja Anda." />
              {alert1 && <ErrorAlert>{alert1}</ErrorAlert>}
              <Field>
                <FieldLabel htmlFor="email">Email kerja</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="username" placeholder="nama@stockplan.id" value={form1.values.email} aria-invalid={!!form1.errors.email || undefined}
                  onChange={on1} onBlur={form1.handleBlur} />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Minimal 10 karakter" value={form1.values.password}
                    aria-invalid={!!form1.errors.password || !!form1.status || undefined} onChange={on1} onBlur={form1.handleBlur} />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton size="sm" className="h-8 px-2.5 text-[13px] font-semibold text-sp-icon" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
                      {show ? "Sembunyi" : "Lihat"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Button type="submit" variant="secondary" size="lg" aria-disabled={locked} disabled={form1.isSubmitting} className="w-full">
                {form1.isSubmitting && <Spinner aria-hidden />}
                {locked ? "Akun dikunci sementara" : form1.isSubmitting ? "Memeriksa…" : "Lanjut"}
              </Button>
              <FieldDescription className="text-[13px]">Lupa password? Admin tidak bisa mengatur ulang sendiri. Minta super admin mengirim tautan atur ulang.</FieldDescription>
            </FieldGroup>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit} noValidate>
            <FieldGroup className="gap-[18px]">
              <Steps n={2} />
              <Heading title="Verifikasi dua langkah" sub="Masukkan 6 digit kode dari aplikasi autentikator Anda." />
              <div className="flex items-center gap-2.5 rounded-[10px] border border-border px-2.5 py-2 text-[13.5px]">
                <Avatar aria-hidden className="size-[30px]"><AvatarFallback className="bg-foreground text-xs font-semibold text-primary">{email[0]?.toUpperCase()}</AvatarFallback></Avatar>
                <b className="min-w-0 truncate font-semibold">{email}</b>
                <Button type="button" variant="link" className="ml-auto h-auto px-0 text-[13px]" onClick={() => void switchAccount()}>Ganti akun</Button>
              </div>
              {alert2 && <ErrorAlert>{alert2}</ErrorAlert>}
              <Field>
                <FieldLabel htmlFor="code">{backup ? "Kode cadangan" : "Kode verifikasi"}</FieldLabel>
                <Input id="code" name="code" inputMode={backup ? "text" : "numeric"} autoComplete="one-time-code" value={form2.values.code} aria-invalid={!!form2.errors.code || !!form2.status || undefined}
                  placeholder={backup ? "xxxx-xxxx" : "000000"} onBlur={form2.handleBlur}
                  onChange={(e) => { touch2(); void form2.setFieldValue("code", cleanCode(e.target.value, backup), false); }}
                  className={backup ? "" : "h-14 pr-0 pl-[.5em] text-center font-mono text-[26px] tracking-[.5em]"} />
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="trust" name="trust" checked={form2.values.trust} onCheckedChange={(v) => void form2.setFieldValue("trust", v === true)} />
                <FieldLabel htmlFor="trust" className="font-normal text-sp-ink-2">Percayai perangkat ini selama 7 hari</FieldLabel>
              </Field>
              <Button type="submit" variant="secondary" size="lg" disabled={form2.isSubmitting} className="w-full">{form2.isSubmitting && <Spinner aria-hidden />}Verifikasi &amp; masuk</Button>
              <div className="flex items-center justify-between gap-2.5">
                <Button type="button" variant="link" className="h-auto px-0 text-[13.5px]" onClick={() => { setBackup(!backup); form2.resetForm({ values: { code: "", trust: form2.values.trust } }); }}>
                  {backup ? "Pakai aplikasi autentikator" : "Pakai kode cadangan"}
                </Button>
                <FieldDescription className="w-auto text-[13px]">Kode berganti tiap 30 detik</FieldDescription>
              </div>
            </FieldGroup>
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col items-center gap-2.5 py-2 text-center">
              <span aria-hidden className="inline-flex size-[52px] items-center justify-center rounded-full bg-[#DCFCE7] text-sp-success"><Check size={24} strokeWidth={2.2} /></span>
              <h1 id="h1" className="text-xl font-bold">Berhasil masuk</h1>
              <p className="text-[13px] text-muted-foreground">Masuk sebagai {email}. Sesi berakhir otomatis setelah 30 menit tidak aktif.</p>
            </div>
            <Link href="/admin" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}>Buka dashboard</Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
