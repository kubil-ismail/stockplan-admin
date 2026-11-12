"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlignLeft, ChevronRight, Flag, Link2, RefreshCw, Share2, Star, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeError } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { getDashboard, LEVEL_TONE, type DashboardResponse, type QueueKey } from "@/lib/admin-dashboard";
import { runSync } from "@/lib/admin-sync";
import { fmtWhen, longDate } from "@/lib/format";
import { jobBadge } from "@/lib/sinkron";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, PanelCard, ROW, StatCard, StatusBadge } from "./form-ui";

const QUEUE_ICON: Record<QueueKey, LucideIcon> = { bei_changes: RefreshCw, company_review: Flag, theme_review: Share2, no_source: Link2, ipo_new: Star, no_summary: AlignLeft };
const HeadLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className={cn(buttonVariants({ variant: "link" }), "h-auto px-0 text-[13px]")}>{children}</Link>
);
const Nothing = ({ title, sub }: { title: string; sub: string }) => (
  <Empty className="py-8"><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{sub}</EmptyDescription></EmptyHeader></Empty>
);
type State = { data?: DashboardResponse; error?: ApiError };

export function DashboardView() {
  const [state, setState] = useState<State | null>(null);
  const [tick, setTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    let live = true;
    void getDashboard().then((r) => { if (live) setState((s) => (r.ok ? { data: r.data } : { data: s?.data, error: r.error })); });
    return () => { live = false; };
  }, [tick]);

  // The crawler does the work, so this only queues a run; the sync card shows the job as queued/running after the reload.
  const sync = async () => {
    setSyncing(true);
    const r = await runSync();
    setSyncing(false);
    toast(r.ok ? r.data.message : describeError(r.error));
    refresh();
  };

  if (!state) return <div role="status" aria-busy="true" aria-label="Memuat dashboard" className="flex flex-col gap-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  if (!state.data) {
    return (
      <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{state.error ? describeError(state.error) : "Dashboard tidak bisa dimuat."}
        <Button size="sm" variant="destructive-outline" onClick={refresh}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert>
    );
  }

  const { now, lastSyncAt, kpis, queue, sync: syncBlock, coverage, activity } = state.data;
  // Blocks the role may not see come back null: show only what is there.
  const cards = [
    kpis.companies && { href: "/admin/emiten", label: "Emiten tercatat", value: kpis.companies.total.toLocaleString("id-ID"), note: <><em className="font-semibold text-sp-success not-italic">+{kpis.companies.ipoThisMonth}</em> IPO bulan ini</> },
    kpis.ready && { href: "/admin/emiten", label: "Profil siap terbit", value: kpis.ready.count.toLocaleString("id-ID"), note: `${kpis.ready.percent}% dari emiten tercatat` },
    kpis.review && { href: "/admin/emiten", label: "Perlu ditinjau", value: kpis.review.count.toLocaleString("id-ID"), note: kpis.review.fromReports == null ? "menunggu tinjauan tim" : <><em className="font-semibold text-[#B45309] not-italic">{kpis.review.fromReports}</em> dari laporan pengguna</> },
    kpis.users && { href: "/admin/pengguna", label: "Pengguna beta", value: kpis.users.total.toLocaleString("id-ID"), note: <><em className="font-semibold text-sp-success not-italic">+{kpis.users.newThisWeek}</em> minggu ini</> },
  ].filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Dashboard" desc={`${longDate(now)} · Data BEI ${lastSyncAt ? `terakhir disinkron ${fmtWhen(lastSyncAt, new Date(now)).toLowerCase()} WIB` : "belum pernah disinkron"}`} actions={<>
        {syncBlock && <Button variant="outline" onClick={() => void sync()} disabled={syncing}><RefreshCw aria-hidden className={syncing ? "animate-spin" : ""} />{syncing ? "Memasukkan ke antrean…" : "Sinkron ulang"}</Button>}
        <Link href="/admin/emiten" className={buttonVariants()}>Buka data emiten</Link>
      </>} />

      {state.error && <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription>{describeError(state.error)} Data di bawah mungkin sudah usang.</AlertDescription></Alert>}

      {cards.length > 0 && <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">{cards.map((k) => <StatCard key={k.label} {...k} />)}</div>}

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <PanelCard id="q-h" title="Antrian kerja data" aside="Diurutkan dari yang paling berdampak">
          {queue.length ? queue.map(({ key, href, title, sub, level, levelLabel, count }) => {
            const Icon = QUEUE_ICON[key];
            return (
              <Item key={key} className={ROW} render={<Link href={href} />}>
                <ItemMedia className={cn("size-9 rounded-[10px]", level === "high" ? "bg-(--sp-danger-bg) text-(--sp-danger-text)" : "bg-muted text-sp-icon")}><Icon aria-hidden className="size-4" /></ItemMedia>
                <ItemContent className="min-w-0 gap-0.5"><ItemTitle>{title}</ItemTitle><ItemDescription className="text-[13px]">{sub}</ItemDescription></ItemContent>
                <ItemActions className="gap-3.5">
                  <StatusBadge tone={LEVEL_TONE[level]}>{levelLabel}</StatusBadge>
                  <span className="min-w-11 text-right font-mono text-[15px] font-semibold">{count.toLocaleString("id-ID")}</span>
                  <ChevronRight aria-hidden className="size-4 text-sp-faint" />
                </ItemActions>
              </Item>
            );
          }) : <Nothing title="Antrean kosong" sub="Tidak ada pekerjaan data yang menunggu." />}
        </PanelCard>

        {syncBlock && (
          <PanelCard id="s-h" title="Sinkronisasi data BEI" aside={<HeadLink href="/admin/sinkron">Lihat status</HeadLink>}
            footer="Profil, anak usaha, dan manajemen ditimpa otomatis. Ringkasan bisnis dan sumber pendapatan tidak.">
            {syncBlock.jobs.map((j) => {
              const [label, tone] = jobBadge(j.status, j.failed);
              return (
                <Item key={j.key} className={ROW}>
                  <ItemContent className="gap-0.5"><ItemTitle className="font-normal">{j.name}</ItemTitle>{j.failed > 0 && <ItemDescription className="text-[12.5px]">{j.failedTickers.join(", ")}{j.failMessage ? `: ${j.failMessage}` : ""}</ItemDescription>}</ItemContent>
                  <ItemActions className="gap-3.5">
                    <time className="font-mono text-[12.5px] text-muted-foreground">{j.lastFinishedAt ? fmtWhen(j.lastFinishedAt, new Date(now)) : "—"}</time>
                    <StatusBadge tone={tone}>{label}</StatusBadge>
                  </ItemActions>
                </Item>
              );
            })}
          </PanelCard>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        {coverage && (
          <PanelCard id="c-h" title="Kelengkapan data per tema" aside="Emiten siap terbit / total di tema" footer={`Tema hanya bisa dibuka pengguna kalau minimal ${coverage.threshold}% emitennya siap terbit.`}>
            {coverage.items.length ? coverage.items.map((c) => (
              <Item key={c.slug} className={cn(ROW, "flex-nowrap")} render={<Link href={`/admin/tema/${c.slug}`} />}>
                <ItemContent className="gap-0"><ItemTitle>{c.name}</ItemTitle><ItemDescription className="text-[12.5px]">{c.stageCount} tahap · {c.statusLabel.toLowerCase()}</ItemDescription></ItemContent>
                <ItemActions className="gap-3.5">
                  <Progress value={c.percent} aria-label={`${c.name}: ${c.percent}% siap terbit`} className="w-40" indicatorClassName={c.openable ? "bg-foreground" : "bg-primary"} />
                  <span className="w-12 text-right font-mono text-[13px] text-sp-ink-2">{c.ready}/{c.total}</span>
                </ItemActions>
              </Item>
            )) : <Nothing title="Belum ada tema" sub="Tema dengan emiten akan muncul di sini." />}
          </PanelCard>
        )}

        {activity && (
          <PanelCard id="a-h" title="Aktivitas terbaru" aside={<HeadLink href="/admin/riwayat">Lihat semua</HeadLink>}>
            {activity.length ? activity.map((a) => (
              <Item key={a.id} className={cn(ROW, "items-start")}>
                <ItemMedia><Avatar aria-hidden className="size-7"><AvatarFallback className="bg-foreground text-[11.5px] font-semibold text-primary">{a.actor[0]}</AvatarFallback></Avatar></ItemMedia>
                <ItemContent className="gap-0 text-[13.5px] leading-snug">
                  <span><b className="font-semibold">{a.actor}</b> {a.verb} <code className="font-mono text-[13px] font-semibold">{a.target}</code>{a.rest && ` ${a.rest}`}</span>
                  <ItemDescription className="text-xs">{fmtWhen(a.at, new Date(now))}</ItemDescription>
                </ItemContent>
              </Item>
            )) : <Nothing title="Belum ada aktivitas" sub="Perubahan data akan tercatat di sini." />}
          </PanelCard>
        )}
      </div>
    </div>
  );
}
