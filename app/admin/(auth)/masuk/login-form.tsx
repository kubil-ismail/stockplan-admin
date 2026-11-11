"use client";

import { useState } from "react";
import Link from "next/link";
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

const MAX_FAILS = 5;

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

// shortcut: credential/OTP checks are client-side stubs mirroring the design (any password >= 10 chars,
// any valid-format code except 000000); replace with /admin/api auth + server-side lockout before real use.
export function LoginForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [fails, setFails] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [err2, setErr2] = useState("");
  const [backup, setBackup] = useState(false);
  const [trust, setTrust] = useState(true);

  const locked = fails >= MAX_FAILS;
  const workEmail = /@stockplan\.id$/i.test(email.trim());

  const proceed = (next: 2 | 3) => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep(next); setErr(""); }, 700);
  };

  const submit1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || busy) return;
    if (!workEmail) return setErr("Gunakan email kerja @stockplan.id.");
    if (pw.length < 10) {
      const f = fails + 1;
      setFails(f);
      return setErr(f >= MAX_FAILS ? "" : `Email atau password salah. Sisa ${MAX_FAILS - f} percobaan sebelum akun dikunci.`);
    }
    proceed(2);
  };

  const submit2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const v = otp.trim();
    const ok = backup ? /^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(v) : /^\d{6}$/.test(v);
    if (!ok) return setErr2(backup ? "Format kode cadangan: xxxx-xxxx." : "Kode harus 6 digit angka.");
    if (!backup && v === "000000") return setErr2("Kode salah atau sudah kedaluwarsa. Coba kode terbaru.");
    proceed(3);
  };

  return (
    <Card role="main" aria-labelledby="h1" className="w-full max-w-[420px] rounded-2xl py-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,.35)]">
      <CardContent className="px-7">
        {step === 1 && (
          <form onSubmit={submit1} noValidate>
            <FieldGroup className="gap-[18px]">
              <Steps n={1} />
              <Heading title="Masuk ke panel admin" sub="Khusus tim StockPlan. Gunakan email kerja Anda." />
              {(err || locked) && <ErrorAlert>{locked ? "Terlalu banyak percobaan. Akun dikunci 15 menit dan super admin sudah diberi tahu." : err}</ErrorAlert>}
              <Field>
                <FieldLabel htmlFor="em">Email kerja</FieldLabel>
                <Input id="em" type="email" autoComplete="username" placeholder="nama@stockplan.id" value={email} aria-invalid={!!err && !workEmail}
                  onChange={(e) => { setEmail(e.target.value); setErr(""); }} />
              </Field>
              <Field>
                <FieldLabel htmlFor="pw">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="pw" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Minimal 10 karakter" value={pw} aria-invalid={!!err && workEmail}
                    onChange={(e) => { setPw(e.target.value); setErr(""); }} />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton size="sm" className="h-8 px-2.5 text-[13px] font-semibold text-sp-icon" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
                      {show ? "Sembunyi" : "Lihat"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Button type="submit" variant="secondary" size="lg" aria-disabled={locked} className="w-full">
                {busy && <Spinner aria-hidden />}
                {locked ? "Akun dikunci sementara" : busy ? "Memeriksa…" : "Lanjut"}
              </Button>
              <FieldDescription className="text-[13px]">Lupa password? Admin tidak bisa mengatur ulang sendiri. Minta super admin mengirim tautan atur ulang.</FieldDescription>
            </FieldGroup>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submit2} noValidate>
            <FieldGroup className="gap-[18px]">
              <Steps n={2} />
              <Heading title="Verifikasi dua langkah" sub="Masukkan 6 digit kode dari aplikasi autentikator Anda." />
              <div className="flex items-center gap-2.5 rounded-[10px] border border-border px-2.5 py-2 text-[13.5px]">
                <Avatar aria-hidden className="size-[30px]"><AvatarFallback className="bg-foreground text-xs font-semibold text-primary">{email.trim()[0]?.toUpperCase()}</AvatarFallback></Avatar>
                <b className="min-w-0 truncate font-semibold">{email}</b>
                <Button type="button" variant="link" className="ml-auto h-auto px-0 text-[13px]" onClick={() => { setStep(1); setOtp(""); setErr2(""); setPw(""); }}>Ganti akun</Button>
              </div>
              {err2 && <ErrorAlert>{err2}</ErrorAlert>}
              <Field>
                <FieldLabel htmlFor="otp">{backup ? "Kode cadangan" : "Kode verifikasi"}</FieldLabel>
                <Input id="otp" inputMode={backup ? "text" : "numeric"} autoComplete="one-time-code" value={otp} aria-invalid={!!err2}
                  placeholder={backup ? "xxxx-xxxx" : "000000"}
                  onChange={(e) => { setOtp(backup ? e.target.value.slice(0, 9) : e.target.value.replace(/\D/g, "").slice(0, 6)); setErr2(""); }}
                  className={backup ? "" : "h-14 pr-0 pl-[.5em] text-center font-mono text-[26px] tracking-[.5em]"} />
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="trust" checked={trust} onCheckedChange={(v) => setTrust(v === true)} />
                <FieldLabel htmlFor="trust" className="font-normal text-sp-ink-2">Percayai perangkat ini selama 7 hari</FieldLabel>
              </Field>
              <Button type="submit" variant="secondary" size="lg" className="w-full">{busy && <Spinner aria-hidden />}Verifikasi &amp; masuk</Button>
              <div className="flex items-center justify-between gap-2.5">
                <Button type="button" variant="link" className="h-auto px-0 text-[13.5px]" onClick={() => { setBackup(!backup); setOtp(""); setErr2(""); }}>
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
