"use client";

import { useState } from "react";

const MAX_FAILS = 5;
const inputCls = (err: boolean) =>
  `h-11 w-full rounded-lg border bg-white px-3 text-[15px] outline-none focus:border-[#1C1917] focus:ring-[3px] focus:ring-[#1C1917]/10 ${err ? "border-[#DC2626]" : "border-[#D6D3D1]"}`;
const btnCls = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-semibold";
const linkCls = "text-[13.5px] font-semibold underline underline-offset-2";

const Spinner = () => <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[13.5px] leading-snug text-[#991B1B]">
      <svg aria-hidden className="mt-0.5 flex-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 2 20h20z" />
        <path d="M12 10v4M12 17h.01" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function Steps({ n }: { n: 1 | 2 }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[1, 2].map((i) => (
        <i key={i} className={`h-1 flex-1 rounded-full ${i <= n ? "bg-[#1C1917]" : "bg-[#E7E5E4]"}`} />
      ))}
    </div>
  );
}

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
    setTimeout(() => {
      setBusy(false);
      setStep(next);
      setErr("");
    }, 700);
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
    <main className="flex w-full max-w-[420px] flex-col gap-[18px] rounded-2xl border border-[#E7E5E4] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,.35)]" aria-labelledby="h1">
      {step === 1 && (
        <form onSubmit={submit1} className="contents" noValidate>
          <Steps n={1} />
          <div className="flex flex-col gap-1">
            <h1 id="h1" className="text-[22px] font-bold tracking-tight">Masuk ke panel admin</h1>
            <p className="text-sm text-[#716A65]">Khusus tim StockPlan. Gunakan email kerja Anda.</p>
          </div>
          {(err || locked) && (
            <Alert>{locked ? "Terlalu banyak percobaan. Akun dikunci 15 menit dan super admin sudah diberi tahu." : err}</Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="em" className="text-[13.5px] font-semibold">Email kerja</label>
            <input id="em" type="email" autoComplete="username" placeholder="nama@stockplan.id" value={email}
              onChange={(e) => { setEmail(e.target.value); setErr(""); }} className={inputCls(!!err && !workEmail)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pw" className="text-[13.5px] font-semibold">Password</label>
            <div className="relative flex items-center">
              <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Minimal 10 karakter" value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(""); }} className={`${inputCls(!!err && workEmail)} pr-[76px]`} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-1.5 h-8 rounded-[7px] px-2.5 text-[13px] font-semibold text-[#57534E] hover:bg-[#F5F5F4]">
                {show ? "Sembunyi" : "Lihat"}
              </button>
            </div>
          </div>
          <button type="submit" aria-disabled={locked} className={`${btnCls} ${locked ? "cursor-not-allowed bg-[#F5F5F4] text-[#A8A29E]" : "bg-[#1C1917] text-white hover:bg-[#292524]"}`}>
            {busy && <Spinner />}
            {locked ? "Akun dikunci sementara" : busy ? "Memeriksa…" : "Lanjut"}
          </button>
          <p className="text-[13px] text-[#716A65]">
            Lupa password? Admin tidak bisa mengatur ulang sendiri. Minta super admin mengirim tautan atur ulang.
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submit2} className="contents" noValidate>
          <Steps n={2} />
          <div className="flex flex-col gap-1">
            <h1 id="h1" className="text-[22px] font-bold tracking-tight">Verifikasi dua langkah</h1>
            <p className="text-sm text-[#716A65]">Masukkan 6 digit kode dari aplikasi autentikator Anda.</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-[10px] border border-[#E7E5E4] px-2.5 py-2 text-[13.5px]">
            <span aria-hidden className="inline-flex size-[30px] items-center justify-center rounded-full bg-[#1C1917] text-xs font-semibold text-[#FEA722]">
              {email.trim()[0]?.toUpperCase()}
            </span>
            <b className="font-semibold">{email}</b>
            <button type="button" className={`${linkCls} ml-auto text-[13px]`} onClick={() => { setStep(1); setOtp(""); setErr2(""); setPw(""); }}>
              Ganti akun
            </button>
          </div>
          {err2 && <Alert>{err2}</Alert>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp" className="text-[13.5px] font-semibold">{backup ? "Kode cadangan" : "Kode verifikasi"}</label>
            <input id="otp" inputMode={backup ? "text" : "numeric"} autoComplete="one-time-code" value={otp}
              placeholder={backup ? "xxxx-xxxx" : "000000"}
              onChange={(e) => { setOtp(backup ? e.target.value.slice(0, 9) : e.target.value.replace(/\D/g, "").slice(0, 6)); setErr2(""); }}
              className={`${inputCls(!!err2)} ${backup ? "" : "h-14 pl-[.5em] pr-0 text-center font-mono text-[26px] tracking-[.5em]"}`} />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13.5px] text-[#44403C]">
            <input type="checkbox" checked={trust} onChange={() => setTrust(!trust)} />
            Percayai perangkat ini selama 7 hari
          </label>
          <button type="submit" className={`${btnCls} bg-[#1C1917] text-white hover:bg-[#292524]`}>
            {busy && <Spinner />}
            Verifikasi &amp; masuk
          </button>
          <div className="flex items-center justify-between gap-2.5">
            <button type="button" className={linkCls} onClick={() => { setBackup(!backup); setOtp(""); setErr2(""); }}>
              {backup ? "Pakai aplikasi autentikator" : "Pakai kode cadangan"}
            </button>
            <span className="text-[13px] text-[#716A65]">Kode berganti tiap 30 detik</span>
          </div>
        </form>
      )}

      {step === 3 && (
        <>
          <div className="flex flex-col items-center gap-2.5 py-2 text-center">
            <span aria-hidden className="inline-flex size-[52px] items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>
            </span>
            <h1 id="h1" className="text-xl font-bold">Berhasil masuk</h1>
            <p className="text-[13px] text-[#716A65]">Masuk sebagai {email}. Sesi berakhir otomatis setelah 30 menit tidak aktif.</p>
          </div>
          <a href="/admin" className={`${btnCls} bg-[#1C1917] text-white hover:bg-[#292524]`}>Buka dashboard</a>
        </>
      )}
    </main>
  );
}
