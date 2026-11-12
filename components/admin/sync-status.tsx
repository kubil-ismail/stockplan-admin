"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Circle, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeError } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { getSync, resolveConflict, retryFailure, runSync, type SyncStatusResponse } from "@/lib/admin-sync";
import { fmtWhen } from "@/lib/format";
import { cell, timeOf } from "@/lib/riwayat";
import { histPoint, isBusy, jobBadge, shortDay } from "@/lib/sinkron";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, PanelCard, ROW, StatCard, StatusBadge } from "./form-ui";

const POLL_MS = 5000; // while a job is queued or running, the crawler reports in the background
const Nothing = ({ title, sub }: { title: string; sub: string }) => (
  <Empty className="py-8"><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{sub}</EmptyDescription></EmptyHeader></Empty>
);
const Ticker = ({ children }: { children: React.ReactNode }) => <code className="w-14 pt-0.5 font-mono text-[13px] font-semibold">{children}</code>;
type State = { data?: SyncStatusResponse; error?: ApiError };

export function SyncStatus() {
  const [state, setState] = useState<State | null>(null);
  const [tick, setTick] = useState(0);
  const [pending, setPending] = useState(""); // id/key of the action in flight
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    let live = true;
    void getSync().then((r) => { if (live) setState((s) => (r.ok ? { data: r.data } : { data: s?.data, error: r.error })); });
    return () => { live = false; };
  }, [tick]);

  const data = state?.data;
  const busy = !!data?.jobs.some((j) => isBusy(j.status));
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [busy]);

  // Every action only queues work or records a decision; the page then reloads from the server.
  const act = async (id: string, call: () => ReturnType<typeof runSync>) => {
    setPending(id);
    const r = await call();
    setPending("");
    toast(r.ok ? r.data.message : describeError(r.error));
    refresh();
  };

  if (!state) return <div role="status" aria-busy="true" aria-label="Memuat status sinkron" className="flex flex-col gap-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-16" /><Skeleton className="h-64" /></div>;
  if (!data) {
    return (
      <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{state.error ? describeError(state.error) : "Status sinkron tidak bisa dimuat."}
        <Button size="sm" variant="destructive-outline" onClick={refresh}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert>
    );
  }

  const { stats, jobs, failures, conflicts, history } = data;
  const warn = failures.length > 0;
  const never = jobs.every((j) => j.status === "never");
  const failedWho = [...new Set(failures.map((f) => f.ticker ?? f.jobName))];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Sinkron data BEI" desc="Data otomatis dari situs BEI. Isian tim (ringkasan, sumber pendapatan, tema) tidak pernah ditimpa." actions={
        <Button variant="secondary" disabled={busy || pending === "all"} onClick={() => void act("all", () => runSync())}>
          <RefreshCw aria-hidden className={busy ? "animate-spin" : ""} />{busy ? "Sedang berjalan…" : "Sinkron semua sekarang"}
        </Button>} />

      {state.error && <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription>{describeError(state.error)} Data di bawah mungkin sudah usang.</AlertDescription></Alert>}

      {/* COPY: perlu review (judul dan isi banner status) */}
      <Alert role="status" variant={never ? undefined : warn ? "warning" : "success"} className="items-center px-5 py-4 text-sm">
        <Circle aria-hidden className={cn("size-3! rounded-full", never ? "fill-muted-foreground text-muted-foreground!" : warn ? "fill-primary text-primary! shadow-[0_0_0_4px_rgba(254,167,34,.25)]" : "fill-[#22C55E] text-[#22C55E]! shadow-[0_0_0_4px_rgba(34,197,94,.25)]")} />
        <AlertTitle className="font-semibold text-foreground">{never ? "Belum ada data sinkron" : warn ? `${failures.length} kegagalan sinkron terbuka` : "Semua sumber BEI normal"}</AlertTitle>
        <AlertDescription className="text-sm text-foreground">
          {never ? "Crawler belum melapor ke backend. Jadwal di bawah mulai terisi setelah sinkron pertama." : warn ? "Data lama tetap dipakai di aplikasi sampai sinkron berikutnya berhasil." : stats.lastFullSyncAt ? `Sinkron penuh terakhir ${fmtWhen(stats.lastFullSyncAt).toLowerCase()} tanpa kegagalan.` : "Tidak ada kegagalan terbuka."}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Emiten tercakup" value={stats.companies.toLocaleString("id-ID")} note="semua emiten tercatat di BEI" />
        <StatCard label="Sinkron penuh terakhir" value={stats.lastFullSyncAt ? timeOf(stats.lastFullSyncAt) : "—"} note={stats.lastFullSyncAt ? fmtWhen(stats.lastFullSyncAt) : "belum pernah"} />
        <StatCard label="Kegagalan terbuka" value={failures.length} note={failedWho.length ? failedWho.slice(0, 4).join(", ") : "semua berhasil"} />
        <StatCard label="Perubahan menunggu tinjauan" value={conflicts.length} note="data BEI berbeda dari isian tim" />
      </div>

      <PanelCard id="h-jb" title="Jadwal sinkron" aside="Waktu dalam WIB">
        <Table className="min-w-[860px]">
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Data</TableHead><TableHead>Jadwal</TableHead><TableHead>Terakhir</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {jobs.map((j) => {
              const [label, tone] = jobBadge(j.status, j.failed);
              return (
                <TableRow key={j.key}>
                  <TableCell className="leading-snug"><b className="block font-semibold">{j.name}</b><small className="block text-[12.5px] text-muted-foreground">{j.description}</small>{j.note && <em className="block text-[12.5px] text-[#B45309] not-italic">{j.note}</em>}</TableCell>
                  <TableCell className="text-[13px] leading-snug">{j.schedule}{j.nextRunAt && <small className="block text-xs text-muted-foreground">berikutnya {fmtWhen(j.nextRunAt)}</small>}</TableCell>
                  <TableCell className="text-[13px] leading-snug">{j.lastFinishedAt ? fmtWhen(j.lastFinishedAt) : "—"}{j.summary && <small className="block text-xs text-muted-foreground">{j.summary}</small>}</TableCell>
                  <TableCell>{j.status === "running" ? <Badge variant="info" className="h-[22px]"><Spinner aria-hidden className="size-3" />{label}</Badge> : <StatusBadge tone={tone}>{label}</StatusBadge>}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" disabled={isBusy(j.status) || pending === j.key} onClick={() => void act(j.key, () => runSync(j.key))}>Jalankan sekarang</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </PanelCard>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <PanelCard id="h-cf" title="Perubahan dari BEI yang perlu ditinjau" aside={`${conflicts.length} menunggu`}>
          {conflicts.length ? conflicts.map((c) => (
            <Item key={c.id} className={cn(ROW, "flex-nowrap items-start py-4")}>
              <ItemMedia><Ticker>{c.ticker}</Ticker></ItemMedia>
              <ItemContent className="min-w-0 gap-1">
                <ItemTitle>{c.field}</ItemTitle>
                <ItemDescription className="line-clamp-none text-[12.5px]">{c.reason}</ItemDescription>
                <div className="mt-1.5 grid gap-2.5 sm:grid-cols-2">
                  <Card size="sm" className="gap-1 border-0 bg-muted px-3 py-2.5 text-sm shadow-none"><small className="text-[11px] font-semibold tracking-[.05em] text-muted-foreground uppercase">Di StockPlan</small>{c.changes.map((x) => <span key={x.field}>{c.changes.length > 1 && <b className="font-medium">{x.label}: </b>}{cell(x.before)}</span>)}</Card>
                  <Card size="sm" className="gap-1 border-0 bg-sp-info-bg px-3 py-2.5 text-sm text-[#1E3A8A] shadow-none"><small className="text-[11px] font-semibold tracking-[.05em] text-sp-info uppercase">Dari BEI · {fmtWhen(c.at).toLowerCase()}</small>{c.changes.map((x) => <span key={x.field}>{c.changes.length > 1 && <b className="font-medium">{x.label}: </b>}{cell(x.after)}</span>)}</Card>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" disabled={pending === c.id} onClick={() => void act(c.id, () => resolveConflict(c.id, "bei"))}>Pakai data BEI</Button>
                  <Button variant="outline" size="sm" disabled={pending === c.id} onClick={() => void act(c.id, () => resolveConflict(c.id, "team"))}>Pertahankan isian tim</Button>
                </div>
              </ItemContent>
            </Item>
          )) : <Nothing title="Semua sudah ditinjau" sub="Perubahan baru dari BEI akan muncul di sini." />}
        </PanelCard>

        <div className="flex min-w-0 flex-col gap-4">
          <PanelCard id="h-fl" title="Gagal di sinkron terakhir" aside={`${failures.length} terbuka`} footer="Yang gagal dicoba ulang otomatis di jadwal berikutnya. Data lama tetap tampil di aplikasi.">
            {failures.length ? failures.map((f) => (
              <Item key={f.id} className={cn(ROW, "flex-nowrap items-start")}>
                <ItemMedia><Ticker>{f.ticker ?? "Semua"}</Ticker></ItemMedia>
                <ItemContent className="min-w-0 gap-1.5 text-[13.5px]">{f.message} <small className="text-xs text-muted-foreground">· {f.jobName}</small><pre className="overflow-x-auto rounded-lg bg-(--sp-danger-bg) px-2.5 py-1.5 font-mono text-xs whitespace-pre-wrap text-[#991B1B]">{f.log}</pre></ItemContent>
                <ItemActions><Button variant="outline" size="sm" disabled={f.retrying || pending === f.id} onClick={() => void act(f.id, () => retryFailure(f.id))}>{f.retrying ? "Menunggu…" : "Coba lagi"}</Button></ItemActions>
              </Item>
            )) : <Nothing title="Tidak ada yang gagal" sub="Semua emiten berhasil disinkron." />}
          </PanelCard>

          <PanelCard id="h-hb" title="14 hari terakhir" aside={<span className="flex gap-3 text-xs"><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#86EFAC]" />Berhasil</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#FCA5A5]" />Gagal</span></span>}>
            <CardContent>
              <div role="img" aria-label={`Riwayat sinkron ${history.length} hari: ${history.filter((h) => h.failed).length} hari ada emiten gagal`} className="flex h-24 items-stretch gap-1 pt-3.5">
                {history.map((h) => {
                  const p = histPoint(h.failed, shortDay(h.date));
                  return <span key={h.date} title={p.t} className="flex flex-1 flex-col overflow-hidden rounded"><i className="bg-[#FCA5A5]" style={{ height: `${p.f}%` }} /><i className="bg-[#86EFAC]" style={{ height: `${p.o}%` }} /></span>;
                })}
              </div>
              {history.length > 1 && <div className="flex justify-between pt-2 pb-4 font-mono text-[11px] text-muted-foreground"><span>{shortDay(history[0].date)}</span><span>{shortDay(history[Math.floor(history.length / 2)].date)}</span><span>Hari ini</span></div>}
            </CardContent>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
