"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Circle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONFLICTS, DAY_LABEL, FAILS, HISTORY, histPoint, JOBS, jobOk } from "@/lib/sinkron";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, PanelCard, ROW, StatCard, StatusBadge } from "./form-ui";

const Nothing = ({ title, sub }: { title: string; sub: string }) => (
  <Empty className="py-8"><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{sub}</EmptyDescription></EmptyHeader></Empty>
);
const Ticker = ({ children }: { children: React.ReactNode }) => <code className="w-14 pt-0.5 font-mono text-[13px] font-semibold">{children}</code>;

export function SyncStatus() {
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
      toast(`${name} selesai disinkron`);
    }, 1600));
  };
  const resolve = (id: string, tk: string, useBei: boolean) => { setResolved([...resolved, id]); toast(useBei ? `${tk}: data BEI dipakai dan tercatat di Riwayat perubahan` : `${tk}: isian tim dipertahankan`); };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Sinkron data BEI" desc="Data otomatis dari situs BEI. Isian tim (ringkasan, sumber pendapatan, tema) tidak pernah ditimpa." actions={
        <Button variant="secondary" aria-disabled={anyRun} onClick={() => { if (!anyRun) JOBS.forEach((j) => runJob(j.key, j.name)); }}>
          <RefreshCw aria-hidden className={anyRun ? "animate-spin" : ""} />{anyRun ? "Sedang berjalan…" : "Sinkron semua sekarang"}
        </Button>} />

      <Alert role="status" variant={warn ? "warning" : "success"} className="items-center px-5 py-4 text-sm">
        <Circle aria-hidden className={cn("size-3! rounded-full", warn ? "fill-primary text-primary! shadow-[0_0_0_4px_rgba(254,167,34,.25)]" : "fill-[#22C55E] text-[#22C55E]! shadow-[0_0_0_4px_rgba(34,197,94,.25)]")} />
        <AlertTitle className="font-semibold text-foreground">{warn ? "BEI bisa diakses · sebagian data gagal" : "Semua sumber BEI normal"}</AlertTitle>
        <AlertDescription className="text-sm text-foreground">{warn ? `Sinkron harian selesai 06.04 dengan ${fails.length} emiten gagal di data manajemen. Data lama tetap dipakai.` : "Sinkron harian selesai 06.04 tanpa kegagalan."}</AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Emiten tercakup" value="958" note="semua emiten tercatat di BEI" />
        <StatCard label="Sinkron penuh terakhir" value="06.04" note="hari ini · 4 menit 31 detik" />
        <StatCard label="Gagal 24 jam terakhir" value={fails.length} note={fails.length ? `${fails.map((f) => f.tk).join(", ")} · manajemen` : "semua berhasil"} />
        <StatCard label="Perubahan menunggu tinjauan" value={conf.length} note="data BEI berbeda dari isian tim" />
      </div>

      <PanelCard id="h-jb" title="Jadwal sinkron" aside="Waktu dalam WIB">
        <Table className="min-w-[860px]">
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Data</TableHead><TableHead>Jadwal</TableHead><TableHead>Terakhir</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {JOBS.map((j) => {
              const running = run.includes(j.key), ok = jobOk(j.key, fails.length, done.includes(j.key));
              return (
                <TableRow key={j.key}>
                  <TableCell className="leading-snug"><b className="block font-semibold">{j.name}</b><small className="block text-[12.5px] text-muted-foreground">{j.desc}</small>{j.note && <em className="block text-[12.5px] text-[#B45309] not-italic">{j.note}</em>}</TableCell>
                  <TableCell className="text-[13px] leading-snug">{j.sched}<small className="block text-xs text-muted-foreground">berikutnya {j.next}</small></TableCell>
                  <TableCell className="text-[13px] leading-snug">{done.includes(j.key) ? "Baru saja" : j.last}<small className="block text-xs text-muted-foreground">{j.dur}</small></TableCell>
                  <TableCell>{running ? <Badge variant="info" className="h-[22px]"><Spinner aria-hidden className="size-3" />Berjalan…</Badge> : <StatusBadge tone={ok ? "success" : "warning"}>{ok ? "Berhasil" : `${fails.length} gagal`}</StatusBadge>}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" aria-disabled={running} onClick={() => runJob(j.key, j.name)}>Jalankan sekarang</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </PanelCard>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <PanelCard id="h-cf" title="Perubahan dari BEI yang perlu ditinjau" aside={`${conf.length} menunggu`}>
          {conf.length ? conf.map((c) => (
            <Item key={c.id} className={cn(ROW, "flex-nowrap items-start py-4")}>
              <ItemMedia><Ticker>{c.tk}</Ticker></ItemMedia>
              <ItemContent className="min-w-0 gap-1">
                <ItemTitle>{c.field}</ItemTitle>
                <ItemDescription className="line-clamp-none text-[12.5px]">{c.why}</ItemDescription>
                <div className="mt-1.5 grid gap-2.5 sm:grid-cols-2">
                  <Card size="sm" className="gap-1 border-0 bg-muted px-3 py-2.5 text-sm shadow-none"><small className="text-[11px] font-semibold tracking-[.05em] text-muted-foreground uppercase">Di StockPlan</small>{c.a}</Card>
                  <Card size="sm" className="gap-1 border-0 bg-sp-info-bg px-3 py-2.5 text-sm text-[#1E3A8A] shadow-none"><small className="text-[11px] font-semibold tracking-[.05em] text-sp-info uppercase">Dari BEI · {c.when}</small>{c.b}</Card>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => resolve(c.id, c.tk, true)}>Pakai data BEI</Button>
                  <Button variant="outline" size="sm" onClick={() => resolve(c.id, c.tk, false)}>Pertahankan isian tim</Button>
                </div>
              </ItemContent>
            </Item>
          )) : <Nothing title="Semua sudah ditinjau" sub="Perubahan baru dari BEI akan muncul di sini." />}
        </PanelCard>

        <div className="flex min-w-0 flex-col gap-4">
          <PanelCard id="h-fl" title="Gagal di sinkron terakhir" aside="Manajemen · 06.04" footer="Yang gagal dicoba ulang otomatis besok 06.00. Data lama tetap tampil di aplikasi.">
            {fails.length ? fails.map((f) => (
              <Item key={f.tk} className={cn(ROW, "flex-nowrap items-start")}>
                <ItemMedia><Ticker>{f.tk}</Ticker></ItemMedia>
                <ItemContent className="min-w-0 gap-1.5 text-[13.5px]">{f.msg}<pre className="overflow-x-auto rounded-lg bg-(--sp-danger-bg) px-2.5 py-1.5 font-mono text-xs whitespace-pre-wrap text-[#991B1B]">{f.log}</pre></ItemContent>
                <ItemActions><Button variant="outline" size="sm" onClick={() => { setFixed([...fixed, f.tk]); toast(`${f.tk} berhasil disinkron ulang`); }}>Coba lagi</Button></ItemActions>
              </Item>
            )) : <Nothing title="Tidak ada yang gagal" sub="Semua emiten berhasil disinkron." />}
          </PanelCard>

          <PanelCard id="h-hb" title="14 hari terakhir" aside={<span className="flex gap-3 text-xs"><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#86EFAC]" />Berhasil</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#FCA5A5]" />Gagal</span></span>}>
            <CardContent>
              <div role="img" aria-label={`Riwayat sinkron 14 hari: semua hari berhasil di atas 99 persen, kegagalan terbesar ${HISTORY[13]} emiten hari ini`} className="flex h-24 items-stretch gap-1 pt-3.5">
                {HISTORY.map((n, i) => {
                  const p = histPoint(i === 13 ? fails.length : n, DAY_LABEL[i]);
                  return <span key={i} title={p.t} className="flex flex-1 flex-col overflow-hidden rounded"><i className="bg-[#FCA5A5]" style={{ height: `${p.f}%` }} /><i className="bg-[#86EFAC]" style={{ height: `${p.o}%` }} /></span>;
                })}
              </div>
              <div className="flex justify-between pt-2 pb-4 font-mono text-[11px] text-muted-foreground"><span>24 Okt</span><span>30 Okt</span><span>Hari ini</span></div>
            </CardContent>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
