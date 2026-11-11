"use client";

import Link from "next/link";
import { useState } from "react";
import { AlignLeft, FileText, Flag, Link2, RefreshCw, Star, type LucideIcon } from "lucide-react";

// shortcut: all numbers/rows below are the design's sample data; replace with /admin/api/dashboard.
const KPIS = [
  { href: "/admin/emiten", label: "Emiten tercatat", value: "958", note: <><em className="font-semibold not-italic text-[#15803D]">+2</em> IPO bulan ini</> },
  { href: "/admin/emiten", label: "Profil siap terbit", value: "412", note: "43% dari semua emiten" },
  { href: "/admin/emiten", label: "Perlu ditinjau", value: "37", note: <><em className="font-semibold not-italic text-[#B45309]">12</em> dari laporan pengguna</> },
  { href: "/admin/pengguna", label: "Pengguna beta", value: "1.284", note: <><em className="font-semibold not-italic text-[#15803D]">+86</em> minggu ini</> },
];

type Level = "Tinggi" | "Sedang" | "Rendah";
const LEVEL_CLS: Record<Level, string> = { Tinggi: "bg-[#FEE2E2] text-[#991B1B]", Sedang: "bg-[#FEF3C7] text-[#92400E]", Rendah: "bg-[#F5F5F4] text-[#57534E]" };
const QUEUE: { href: string; icon: LucideIcon; title: string; sub: string; level: Level; n: number }[] = [
  { href: "/admin/masukan", icon: Flag, title: "Laporan “Data salah” dari pengguna", sub: "Dikirim dari form Bantuan. Paling lama: 3 hari lalu (BUMI)", level: "Tinggi", n: 12 },
  { href: "/admin/emiten", icon: FileText, title: "Laporan keuangan Q3 2026 belum diproses", sub: "Sumber pendapatan mungkin sudah berubah", level: "Sedang", n: 23 },
  { href: "/admin/emiten", icon: Link2, title: "Sumber pendapatan tanpa dokumen sumber", sub: "Pengguna tidak bisa menelusuri asal angkanya", level: "Sedang", n: 41 },
  { href: "/admin/emiten", icon: Star, title: "IPO baru belum diprofilkan", sub: "CDIA dan 1 emiten lain bulan ini", level: "Rendah", n: 2 },
  { href: "/admin/emiten", icon: AlignLeft, title: "Belum ada ringkasan bisnis", sub: "Emiten masih tampil dengan deskripsi resmi BEI saja", level: "Rendah", n: 318 },
];

const COVERAGE = [
  { name: "Batubara", sub: "5 tahap · terbuka untuk pengguna", ok: 19, n: 21 },
  { name: "Perbankan", sub: "4 tahap · terbuka untuk pengguna", ok: 15, n: 18 },
  { name: "Nikel & baterai EV", sub: "4 tahap · draf", ok: 6, n: 11 },
  { name: "Gas bumi", sub: "3 tahap · draf", ok: 3, n: 7 },
];

const ACTIVITY = [
  { who: "Rina", what: "memperbarui tren keuangan", code: "BUMI", when: "10 menit lalu" },
  { who: "Dimas", what: "menerbitkan profil", code: "PTBA", when: "2 jam lalu" },
  { who: "Dimas", what: "menandai laporan selesai di", code: "ITMG", when: "Kemarin, 16.20" },
  { who: "Rina", what: "menambahkan ringkasan bisnis", code: "INCO", when: "Kemarin, 11.05" },
  { who: "Sistem", what: "menemukan IPO baru", code: "CDIA", when: "3 Nov, 06.00" },
];

const card = "min-w-0 rounded-xl border border-[#E7E5E4] bg-white";
const row = "border-t border-[#F0EEEC] first:border-t-0";
const mono = "font-mono";

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-2 text-xs font-semibold leading-[22px] before:size-1.5 before:rounded-full before:bg-current ${cls}`}>
      {children}
    </span>
  );
}

function CardHead({ id, title, aside, href }: { id: string; title: string; aside?: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#F0EEEC] px-5 py-4">
      <b id={id} className="text-[15px] font-semibold">{title}</b>
      {href ? <Link href={href} className="text-[13px] font-semibold underline underline-offset-2">{aside}</Link> : <span className="text-[13px] text-[#716A65]">{aside}</span>}
    </div>
  );
}

export function DashboardView() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [toast, setToast] = useState("");

  const sync = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setToast("Sinkronisasi selesai. 958 emiten diperbarui.");
      setTimeout(() => setToast(""), 2600);
    }, 1400);
  };

  const t = synced ? "baru saja" : "06.00";
  const syncRows = [
    { name: "Profil perusahaan", time: t, ok: true },
    { name: "Kinerja saham (penutupan)", time: t, ok: true },
    { name: "Anak usaha", time: t, ok: true },
    { name: "Manajemen", time: t, ok: synced, note: "BUMI, DEWA, PTRO: halaman profil BEI tidak bisa dibaca. Dicoba lagi besok." },
    { name: "Category index", time: "1 Nov", ok: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Dashboard</h1>
          {/* shortcut: static date/time from the design; derive from the last sync run */}
          <p className="text-[#716A65]">Kamis, 5 November 2026 · Data BEI terakhir disinkron hari ini, 06.00 WIB</p>
        </div>
        <div className="flex gap-2.5">
          <button type="button" onClick={sync} aria-disabled={syncing}
            className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold ${syncing ? "cursor-not-allowed border-transparent bg-[#F5F5F4] text-[#A8A29E]" : "border-[#E7E5E4] bg-white hover:bg-[#F5F5F4]"}`}>
            <RefreshCw aria-hidden size={16} strokeWidth={1.8} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Menyinkronkan…" : "Sinkron ulang"}
          </button>
          <Link href="/admin/emiten" className="inline-flex min-h-10 items-center whitespace-nowrap rounded-lg bg-[#FEA722] px-4 text-sm font-semibold text-[#1C1917] hover:bg-[#F59E0B]">
            Buka data emiten
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Link key={k.label} href={k.href} className="flex flex-col gap-1 rounded-xl border border-[#E7E5E4] bg-white px-[18px] py-4 hover:border-[#D6D3D1]">
            <span className="text-[13px] font-medium text-[#716A65]">{k.label}</span>
            <b className={`${mono} text-[28px] font-semibold leading-tight tracking-tight`}>{k.value}</b>
            <small className="text-[12.5px] text-[#716A65]">{k.note}</small>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className={card} aria-labelledby="q-h">
          <CardHead id="q-h" title="Antrian kerja data" aside="Diurutkan dari yang paling berdampak" />
          {QUEUE.map(({ href, icon: Icon, title, sub, level, n }) => (
            <Link key={title} href={href} className={`${row} flex items-center gap-3.5 px-5 py-[13px] hover:bg-[#FAFAF9]`}>
              <span aria-hidden className={`inline-flex size-9 flex-none items-center justify-center rounded-[10px] ${level === "Tinggi" ? "bg-[#FEF2F2] text-[#B91C1C]" : "bg-[#F5F5F4] text-[#57534E]"}`}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
                <b className="text-sm font-semibold">{title}</b>
                <span className="text-[13px] text-[#716A65]">{sub}</span>
              </span>
              <Badge cls={LEVEL_CLS[level]}>{level}</Badge>
              <span className={`${mono} min-w-11 text-right text-[15px] font-semibold`}>{n}</span>
              <span aria-hidden className="text-base text-[#A8A29E]">›</span>
            </Link>
          ))}
        </section>

        <section className={card} aria-labelledby="s-h">
          <CardHead id="s-h" title="Sinkronisasi data BEI" aside="Lihat status" href="/admin/sinkron" />
          {syncRows.map((r) => {
            const warn = !r.ok;
            return (
              <div key={r.name} className={`${row} grid grid-cols-[1fr_auto_auto] items-center gap-x-3.5 gap-y-1 px-5 py-3 text-sm`}>
                <span>{r.name}</span>
                <time className={`${mono} text-[12.5px] text-[#716A65]`}>{r.time}</time>
                <Badge cls={warn ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#DCFCE7] text-[#166534]"}>{warn ? "3 gagal" : "Berhasil"}</Badge>
                {warn && <small className="col-span-full text-[12.5px] text-[#716A65]">{r.note}</small>}
              </div>
            );
          })}
          <div className="rounded-b-xl border-t border-[#F0EEEC] bg-[#FAFAF9] px-5 py-3.5 text-[13px] text-[#716A65]">
            Profil, anak usaha, dan manajemen ditimpa otomatis. Ringkasan bisnis dan sumber pendapatan tidak.
          </div>
        </section>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className={card} aria-labelledby="c-h">
          <CardHead id="c-h" title="Kelengkapan data per tema" aside="Emiten siap terbit / total di tema" />
          {COVERAGE.map((c) => {
            const pct = Math.round((c.ok / c.n) * 100);
            return (
              <div key={c.name} className={`${row} grid grid-cols-[1fr_160px_64px] items-center gap-3.5 px-5 py-3 text-sm`}>
                <span>
                  <b className="font-semibold">{c.name}</b>
                  <small className="block text-[12.5px] text-[#716A65]">{c.sub}</small>
                </span>
                <span className="h-1.5 min-w-[60px] overflow-hidden rounded-full bg-[#F0EEEC]" role="img" aria-label={`${pct}% siap terbit`}>
                  <i className={`block h-full rounded-full ${pct >= 80 ? "bg-[#1C1917]" : "bg-[#FEA722]"}`} style={{ width: `${pct}%` }} />
                </span>
                <span className={`${mono} text-right text-[13px] text-[#44403C]`}>{c.ok}/{c.n}</span>
              </div>
            );
          })}
          <div className="rounded-b-xl border-t border-[#F0EEEC] bg-[#FAFAF9] px-5 py-3.5 text-[13px] text-[#716A65]">
            Tema hanya bisa dibuka pengguna kalau minimal 80% emitennya siap terbit.
          </div>
        </section>

        <section className={card} aria-labelledby="a-h">
          <CardHead id="a-h" title="Aktivitas terbaru" aside="Lihat semua" href="/admin/riwayat" />
          {ACTIVITY.map((a) => (
            <div key={a.code} className={`${row} flex gap-3 px-5 py-3 text-[13.5px] leading-snug`}>
              <span aria-hidden className="inline-flex size-7 flex-none items-center justify-center rounded-full bg-[#1C1917] text-[11.5px] font-semibold text-[#FEA722]">{a.who[0]}</span>
              <div>
                <b className="font-semibold">{a.who}</b> {a.what} <code className={`${mono} text-[13px] font-semibold`}>{a.code}</code>
                <time className="block text-xs text-[#716A65]">{a.when}</time>
              </div>
            </div>
          ))}
        </section>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1C1917] px-4 py-[9px] text-[13.5px] text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
