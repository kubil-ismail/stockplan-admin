"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlignLeft, ChevronRight, FileText, Flag, Link2, RefreshCw, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { PageHeader, PanelCard, ROW, StatCard, StatusBadge, type Tone } from "./form-ui";

// shortcut: all numbers/rows below are the design's sample data; replace with /admin/api/dashboard.
const KPIS = [
  { href: "/admin/emiten", label: "Emiten tercatat", value: "958", note: <><em className="font-semibold text-sp-success not-italic">+2</em> IPO bulan ini</> },
  { href: "/admin/emiten", label: "Profil siap terbit", value: "412", note: "43% dari semua emiten" },
  { href: "/admin/emiten", label: "Perlu ditinjau", value: "37", note: <><em className="font-semibold text-[#B45309] not-italic">12</em> dari laporan pengguna</> },
  { href: "/admin/pengguna", label: "Pengguna beta", value: "1.284", note: <><em className="font-semibold text-sp-success not-italic">+86</em> minggu ini</> },
];

type Level = "Tinggi" | "Sedang" | "Rendah";
const LEVEL_TONE: Record<Level, Tone> = { Tinggi: "danger", Sedang: "warning", Rendah: "neutral" };
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
const HeadLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className={cn(buttonVariants({ variant: "link" }), "h-auto px-0 text-[13px]")}>{children}</Link>
);

export function DashboardView() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const sync = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setSynced(true); toast("Sinkronisasi selesai. 958 emiten diperbarui."); }, 1400);
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
      {/* shortcut: static date/time from the design; derive from the last sync run */}
      <PageHeader title="Dashboard" desc="Kamis, 5 November 2026 · Data BEI terakhir disinkron hari ini, 06.00 WIB" actions={<>
        <Button variant="outline" onClick={sync} aria-disabled={syncing}><RefreshCw aria-hidden className={syncing ? "animate-spin" : ""} />{syncing ? "Menyinkronkan…" : "Sinkron ulang"}</Button>
        <Link href="/admin/emiten" className={buttonVariants()}>Buka data emiten</Link>
      </>} />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <PanelCard id="q-h" title="Antrian kerja data" aside="Diurutkan dari yang paling berdampak">
          {QUEUE.map(({ href, icon: Icon, title, sub, level, n }) => (
            <Item key={title} className={ROW} render={<Link href={href} />}>
              <ItemMedia className={cn("size-9 rounded-[10px]", level === "Tinggi" ? "bg-(--sp-danger-bg) text-(--sp-danger-text)" : "bg-muted text-sp-icon")}><Icon aria-hidden className="size-4" /></ItemMedia>
              <ItemContent className="min-w-0 gap-0.5"><ItemTitle>{title}</ItemTitle><ItemDescription className="text-[13px]">{sub}</ItemDescription></ItemContent>
              <ItemActions className="gap-3.5">
                <StatusBadge tone={LEVEL_TONE[level]}>{level}</StatusBadge>
                <span className="min-w-11 text-right font-mono text-[15px] font-semibold">{n}</span>
                <ChevronRight aria-hidden className="size-4 text-sp-faint" />
              </ItemActions>
            </Item>
          ))}
        </PanelCard>

        <PanelCard id="s-h" title="Sinkronisasi data BEI" aside={<HeadLink href="/admin/sinkron">Lihat status</HeadLink>}
          footer="Profil, anak usaha, dan manajemen ditimpa otomatis. Ringkasan bisnis dan sumber pendapatan tidak.">
          {syncRows.map((r) => (
            <Item key={r.name} className={ROW}>
              <ItemContent className="gap-0.5"><ItemTitle className="font-normal">{r.name}</ItemTitle>{!r.ok && <ItemDescription className="text-[12.5px]">{r.note}</ItemDescription>}</ItemContent>
              <ItemActions className="gap-3.5">
                <time className="font-mono text-[12.5px] text-muted-foreground">{r.time}</time>
                <StatusBadge tone={r.ok ? "success" : "warning"}>{r.ok ? "Berhasil" : "3 gagal"}</StatusBadge>
              </ItemActions>
            </Item>
          ))}
        </PanelCard>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <PanelCard id="c-h" title="Kelengkapan data per tema" aside="Emiten siap terbit / total di tema" footer="Tema hanya bisa dibuka pengguna kalau minimal 80% emitennya siap terbit.">
          {COVERAGE.map((c) => {
            const pct = Math.round((c.ok / c.n) * 100);
            return (
              <Item key={c.name} className={cn(ROW, "flex-nowrap")}>
                <ItemContent className="gap-0"><ItemTitle>{c.name}</ItemTitle><ItemDescription className="text-[12.5px]">{c.sub}</ItemDescription></ItemContent>
                <ItemActions className="gap-3.5">
                  <Progress value={pct} aria-label={`${c.name}: ${pct}% siap terbit`} className="w-40" indicatorClassName={pct >= 80 ? "bg-foreground" : "bg-primary"} />
                  <span className="w-12 text-right font-mono text-[13px] text-sp-ink-2">{c.ok}/{c.n}</span>
                </ItemActions>
              </Item>
            );
          })}
        </PanelCard>

        <PanelCard id="a-h" title="Aktivitas terbaru" aside={<HeadLink href="/admin/riwayat">Lihat semua</HeadLink>}>
          {ACTIVITY.map((a) => (
            <Item key={a.code} className={cn(ROW, "items-start")}>
              <ItemMedia><Avatar aria-hidden className="size-7"><AvatarFallback className="bg-foreground text-[11.5px] font-semibold text-primary">{a.who[0]}</AvatarFallback></Avatar></ItemMedia>
              <ItemContent className="gap-0 text-[13.5px] leading-snug">
                <span><b className="font-semibold">{a.who}</b> {a.what} <code className="font-mono text-[13px] font-semibold">{a.code}</code></span>
                <ItemDescription className="text-xs">{a.when}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </PanelCard>
      </div>
    </div>
  );
}
