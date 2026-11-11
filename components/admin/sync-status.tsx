"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CONFLICTS, DAY_LABEL, FAILS, HISTORY, histPoint, JOBS, jobOk } from "@/lib/sinkron";
import { btn, Chip, cls, mono, TONE, useToast } from "./form-ui";

const Card = ({ children, id }: { children: React.ReactNode; id: string }) => <section aria-labelledby={id} className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">{children}</section>;
const Head = ({ id, title, aside, className }: { id: string; title: string; aside?: React.ReactNode; className?: string }) => (
  <div className={cls("flex items-baseline justify-between gap-3 border-b border-[#F0EEEC] px-5 py-4", className)}><b id={id} className="text-[15px] font-semibold">{title}</b><span className="text-[13px] text-[#716A65]">{aside}</span></div>
);
const Foot = ({ children }: { children: React.ReactNode }) => <div className="border-t border-[#F0EEEC] bg-[#FAFAF9] px-5 py-3.5 text-[13px] text-[#716A65]">{children}</div>;
const Empty = ({ title, sub }: { title: string; sub: string }) => <div className="flex flex-col items-center gap-1 px-5 py-8 text-center"><b className="text-[15px]">{title}</b><span className="text-[13.5px] text-[#716A65]">{sub}</span></div>;
const JOB_GRID = "grid grid-cols-[minmax(220px,1.6fr)_minmax(150px,1fr)_minmax(150px,1fr)_110px_150px] items-center gap-x-4";

export function SyncStatus() {
  const { flash, toast } = useToast();
  const [run, setRun] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [fixed, setFixed] = useState<string[]>([]);
  const [resolved, setResolved] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => { const t = timers.current; return () => t.forEach(clearTimeout); }, []);

  const fails = FAILS.filter((f) => !fixed.includes(f.tk));
  const conf = CONFLICTS.filter((c) => !resolved.includes(c.id));
  const anyRun = run.length > 0;
  const warn = fails.length > 0;

  const runJob = (key: string, name: string) => {
    if (run.includes(key)) return;
    setRun((r) => (r.includes(key) ? r : [...r, key]));
    timers.current.push(setTimeout(() => {
      setRun((r) => r.filter((k) => k !== key));
      setDone((d) => [...d, key]);
      if (key === "mgmt") setFixed(FAILS.map((f) => f.tk)); // a fresh management run retries every failed emiten
      flash(`${name} selesai disinkron`);
    }, 1600));
  };
  const resolve = (id: string, tk: string, useBei: boolean) => { setResolved([...resolved, id]); flash(useBei ? `${tk}: data BEI dipakai dan tercatat di Riwayat perubahan` : `${tk}: isian tim dipertahankan`); };

  const KPIS = [
    { l: "Emiten tercakup", v: "958", s: "semua emiten tercatat di BEI", w: false },
    { l: "Sinkron penuh terakhir", v: "06.04", s: "hari ini · 4 menit 31 detik", w: false },
    { l: "Gagal 24 jam terakhir", v: String(fails.length), s: fails.length ? `${fails.map((f) => f.tk).join(", ")} · manajemen` : "semua berhasil", w: true },
    { l: "Perubahan menunggu tinjauan", v: String(conf.length), s: "data BEI berbeda dari isian tim", w: false },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Sinkron data BEI</h1>
          <p className="text-[#716A65]">Data otomatis dari situs BEI. Isian tim (ringkasan, sumber pendapatan, tema) tidak pernah ditimpa.</p>
        </div>
        <button type="button" aria-disabled={anyRun} className={cls(btn.base, anyRun ? btn.disabled : btn.dark)} onClick={() => { if (!anyRun) JOBS.forEach((j) => runJob(j.key, j.name)); }}>
          <RefreshCw aria-hidden size={16} strokeWidth={1.8} className={anyRun ? "animate-spin" : ""} />{anyRun ? "Sedang berjalan…" : "Sinkron semua sekarang"}
        </button>
      </div>

      <div role="status" className={cls("flex items-center gap-3.5 rounded-xl border px-5 py-4 text-sm", warn ? "border-[#FDE68A] bg-[#FFFBEB]" : "border-[#BBF7D0] bg-[#F0FDF4]")}>
        <i aria-hidden className={cls("size-3 flex-none rounded-full", warn ? "bg-[#FEA722] shadow-[0_0_0_4px_rgba(254,167,34,.25)]" : "bg-[#22C55E] shadow-[0_0_0_4px_rgba(34,197,94,.25)]")} />
        <div className="flex flex-col"><b className="font-semibold">{warn ? "BEI bisa diakses · sebagian data gagal" : "Semua sumber BEI normal"}</b>
          <span>{warn ? `Sinkron harian selesai 06.04 dengan ${fails.length} emiten gagal di data manajemen. Data lama tetap dipakai.` : "Sinkron harian selesai 06.04 tanpa kegagalan."}</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-[#E7E5E4] bg-white px-[18px] py-4">
            <span className="text-[13px] font-medium text-[#716A65]">{k.l}</span><b className={cls(mono, "text-[28px] font-semibold leading-tight tracking-tight")}>{k.v}</b><small className="text-[12.5px] text-[#716A65]">{k.s}</small>
          </div>
        ))}
      </div>

      <Card id="h-jb">
        <Head id="h-jb" title="Jadwal sinkron" aside="Waktu dalam WIB" />
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className={cls(JOB_GRID, "border-b border-[#E7E5E4] bg-[#FAFAF9] px-5 py-3 text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}><span>Data</span><span>Jadwal</span><span>Terakhir</span><span>Status</span><span /></div>
            {JOBS.map((j) => {
              const running = run.includes(j.key), ok = jobOk(j.key, fails.length, done.includes(j.key));
              return (
                <div key={j.key} className={cls(JOB_GRID, "border-b border-[#F0EEEC] px-5 py-3.5 text-sm last:border-b-0")}>
                  <span className="flex flex-col leading-snug"><b className="font-semibold">{j.name}</b><small className="text-[12.5px] text-[#716A65]">{j.desc}</small>{j.note && <em className="text-[12.5px] not-italic text-[#B45309]">{j.note}</em>}</span>
                  <span className="flex flex-col text-[13px] leading-snug">{j.sched}<small className="text-xs text-[#716A65]">berikutnya {j.next}</small></span>
                  <span className="flex flex-col text-[13px] leading-snug">{done.includes(j.key) ? "Baru saja" : j.last}<small className="text-xs text-[#716A65]">{j.dur}</small></span>
                  <span>{running ? <Chip cls={TONE.info}><span aria-hidden className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Berjalan…</Chip> : <Chip cls={ok ? TONE.ok : TONE.warn}>{ok ? "Berhasil" : `${fails.length} gagal`}</Chip>}</span>
                  <button type="button" aria-disabled={running} className={cls(btn.base, btn.small, running ? btn.disabled : btn.outline)} onClick={() => runJob(j.key, j.name)}>Jalankan sekarang</button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card id="h-cf">
          <Head id="h-cf" title="Perubahan dari BEI yang perlu ditinjau" aside={`${conf.length} menunggu`} />
          {conf.length ? conf.map((c) => (
            <div key={c.id} className="grid grid-cols-[56px_1fr] gap-3.5 border-b border-[#F0EEEC] px-5 py-4 last:border-b-0">
              <code className="pt-0.5 font-mono text-[13px] font-semibold">{c.tk}</code>
              <div className="min-w-0">
                <b className="text-sm font-semibold">{c.field}</b>
                <div className="text-[12.5px] text-[#716A65]">{c.why}</div>
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-[10px] bg-[#F5F5F4] px-3 py-2.5 text-sm"><small className="block text-[11px] font-semibold uppercase tracking-[.05em] text-[#716A65]">Di StockPlan</small>{c.a}</div>
                  <div className="rounded-[10px] bg-[#EFF6FF] px-3 py-2.5 text-sm text-[#1E3A8A]"><small className="block text-[11px] font-semibold uppercase tracking-[.05em] text-[#1D4ED8]">Dari BEI · {c.when}</small>{c.b}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={cls(btn.base, btn.dark, btn.small)} onClick={() => resolve(c.id, c.tk, true)}>Pakai data BEI</button>
                  <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => resolve(c.id, c.tk, false)}>Pertahankan isian tim</button>
                </div>
              </div>
            </div>
          )) : <Empty title="Semua sudah ditinjau" sub="Perubahan baru dari BEI akan muncul di sini." />}
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card id="h-fl">
            <Head id="h-fl" title="Gagal di sinkron terakhir" aside="Manajemen · 06.04" />
            {fails.length ? fails.map((f) => (
              <div key={f.tk} className="grid grid-cols-[56px_1fr_auto] items-start gap-3.5 border-b border-[#F0EEEC] px-5 py-3.5 last:border-b-0">
                <code className="pt-0.5 font-mono text-[13px] font-semibold">{f.tk}</code>
                <div className="min-w-0 text-[13.5px]">{f.msg}<pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#FEF2F2] px-2.5 py-1.5 font-mono text-xs text-[#991B1B]">{f.log}</pre></div>
                <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { setFixed([...fixed, f.tk]); flash(`${f.tk} berhasil disinkron ulang`); }}>Coba lagi</button>
              </div>
            )) : <Empty title="Tidak ada yang gagal" sub="Semua emiten berhasil disinkron." />}
            <Foot>Yang gagal dicoba ulang otomatis besok 06.00. Data lama tetap tampil di aplikasi.</Foot>
          </Card>

          <Card id="h-hb">
            <div className="flex items-baseline justify-between gap-3 border-b border-[#F0EEEC] px-5 py-4">
              <b id="h-hb" className="text-[15px] font-semibold">14 hari terakhir</b>
              <span className="flex gap-3 text-xs text-[#716A65]"><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#86EFAC]" />Berhasil</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#FCA5A5]" />Gagal</span></span>
            </div>
            <div role="img" aria-label={`Riwayat sinkron 14 hari: semua hari berhasil di atas 99 persen, kegagalan terbesar ${HISTORY[13]} emiten hari ini`} className="flex h-24 items-stretch gap-1 px-5 pt-3.5">
              {HISTORY.map((n, i) => {
                const p = histPoint(i === 13 ? fails.length : n, DAY_LABEL[i]);
                return <span key={i} title={p.t} className="flex flex-1 flex-col overflow-hidden rounded"><i className="bg-[#FCA5A5]" style={{ height: `${p.f}%` }} /><i className="bg-[#86EFAC]" style={{ height: `${p.o}%` }} /></span>;
              })}
            </div>
            <div className="flex justify-between px-5 pb-4 pt-2 font-mono text-[11px] text-[#716A65]"><span>24 Okt</span><span>30 Okt</span><span>Hari ini</span></div>
          </Card>
        </div>
      </div>
      {toast}
    </div>
  );
}
