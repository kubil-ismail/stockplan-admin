"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Lock, RefreshCw, TriangleAlert, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportHistoryCsv, listHistory, revertEntry, type Entry, type HistoryResponse, type Range, type Tab } from "@/lib/admin-history";
import { describeError, saveBlob } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { cell, dayLabel, RANGES, TABS, timeOf } from "@/lib/riwayat";
import { initials } from "@/lib/pengguna";
import { useDebounced } from "@/hooks/use-debounced";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemActions, ItemContent, ItemMedia } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyResult, FilterTabs, PageHeader, Pager, SearchInput, StatusBadge } from "./form-ui";

const PAGE_SIZE = 50;
type Loaded = { key: string; data?: HistoryResponse; error?: ApiError };

function EventRow({ x, open, onOpen, busy, onRevert }: { x: Entry; open: boolean; onOpen: (o: boolean) => void; busy: boolean; onRevert: () => void }) {
  const name = x.actor.name;
  const sys = x.actor.kind === "system";
  return (
    <Collapsible open={open && x.changes.length > 0} onOpenChange={onOpen} render={<Item className="items-start rounded-none border-0 border-b border-sp-line-soft px-5 py-3.5 last:border-b-0" />}>
      <ItemMedia>
        <Avatar aria-hidden className="size-8"><AvatarFallback className={cn("text-[13px] font-semibold", sys ? "border border-border bg-muted text-sp-icon" : "bg-[#1C1917] text-primary")}>{sys ? "S" : initials(name)}</AvatarFallback></Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <div className="text-[14.5px] leading-snug"><b className="font-semibold">{name}</b> {x.verb} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12.5px] font-semibold">{x.target}</code>{x.rest && ` ${x.rest}`}</div>
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
          <Badge variant={x.kind === "sec" ? "danger" : "neutral"} className="rounded">{x.module.name}</Badge>
          <span>{x.meta}</span>
          {x.changes.length > 0 && <CollapsibleTrigger render={<Button variant="link" className="h-auto px-0 text-[12.5px]" />}>{open ? "Sembunyikan perubahan" : "Lihat perubahan"}</CollapsibleTrigger>}
        </div>
        <CollapsibleContent>
          <Card size="sm" className="mt-1.5 gap-0 py-0 shadow-none">
            <Table className="text-[13.5px]">
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="h-8 w-[170px] text-[11px]">Bagian</TableHead><TableHead className="h-8 text-[11px]">Sebelum</TableHead><TableHead className="h-8 text-[11px]">Sesudah</TableHead></TableRow></TableHeader>
              <TableBody>
                {x.changes.map((c) => (
                  <TableRow key={c.field} className="hover:bg-transparent">
                    <TableCell className="py-2">{c.label}</TableCell>
                    <TableCell className="bg-(--sp-danger-bg) py-2 text-[#991B1B] line-through">{cell(c.before)}</TableCell>
                    <TableCell className="bg-(--sp-success-bg) py-2 text-[#166534]">{cell(c.after)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </CollapsibleContent>
      </ItemContent>
      <ItemActions className="flex-col items-end gap-2">
        <time dateTime={x.at} className="font-mono text-xs text-muted-foreground">{timeOf(x.at)}</time>
        {x.canRevert && !x.reverted && <Button variant="outline" size="sm" disabled={busy} onClick={onRevert}><Undo2 aria-hidden />Kembalikan</Button>}
        {x.reverted && <StatusBadge tone="neutral">Dikembalikan</StatusBadge>}
      </ItemActions>
    </Collapsible>
  );
}

export function AuditLog() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("");
  const [who, setWho] = useState("");
  const [range, setRange] = useState<Range>("7");
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const dq = useDebounced(q.trim(), 300);

  // Results are keyed by the inputs that produced them, so "loading" is derived (key mismatch), not stored.
  const key = `${dq}|${mod}|${who}|${range}|${tab}|${page}|${reload}`;
  useEffect(() => {
    let live = true;
    void listHistory({ q: dq, module: mod, who, range, tab, page, pageSize: PAGE_SIZE }).then((r) => { if (live) setLoaded(r.ok ? { key, data: r.data } : { key, error: r.error }); });
    return () => { live = false; };
  }, [key, dq, mod, who, range, tab, page]);

  const loading = !loaded || loaded.key !== key;
  const data = loaded?.data;
  const refresh = () => setReload((n) => n + 1);
  const filter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const empty = !loading && !!data && data.days.length === 0;
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const shown = data ? data.days.reduce((n, d) => n + d.items.length, 0) : 0;

  const revert = async (x: Entry) => {
    setBusy(true);
    const r = await revertEntry(x.id);
    setBusy(false);
    toast(r.ok ? r.data.message : describeError(r.error));
    refresh(); // a 409 means the list is stale too
  };
  const download = async () => {
    const r = await exportHistoryCsv({ q: dq, module: mod, who, range, tab });
    if (r.ok) saveBlob(r.data, "riwayat.csv"); else toast(describeError(r.error));
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Riwayat perubahan" desc="Semua yang dilakukan admin dan sistem: perubahan data, terbit, akses, dan percobaan masuk. Tidak bisa diubah atau dihapus."
        actions={<Button variant="outline" onClick={() => void download()}><Download aria-hidden />Ekspor CSV</Button>} />

      <Card aria-label="Riwayat" className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput label="Cari riwayat" placeholder="Cari emiten, tema, email, atau isi perubahan" value={q} onChange={filter(setQ)} />
          <NativeSelect size="sm" aria-label="Modul" value={mod} onChange={(e) => filter(setMod)(e.target.value)} className="w-[180px]"><NativeSelectOption value="">Semua modul</NativeSelectOption>{data?.modules.map((m) => <NativeSelectOption key={m.key} value={m.key}>{m.name}</NativeSelectOption>)}</NativeSelect>
          <NativeSelect size="sm" aria-label="Pelaku" value={who} onChange={(e) => filter(setWho)(e.target.value)} className="w-[180px]"><NativeSelectOption value="">Semua pelaku</NativeSelectOption>{data?.actors.map((a) => <NativeSelectOption key={a.id} value={a.id}>{a.name}</NativeSelectOption>)}</NativeSelect>
          <NativeSelect size="sm" aria-label="Rentang waktu" value={range} onChange={(e) => filter(setRange)(e.target.value as Range)} className="w-[180px]">{RANGES.map(([v, l]) => <NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}</NativeSelect>
        </div>
        <div className="border-y border-sp-line-soft px-4 py-3">
          <FilterTabs label="Jenis" value={tab} onChange={filter(setTab)} tabs={TABS.map(([v, label]) => ({ v, label, n: data?.tabs[v] }))} />
        </div>

        {loaded?.error && !loading ? (
          <div className="p-5">
            <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{describeError(loaded.error)}<Button size="sm" variant="destructive-outline" onClick={refresh}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert>
          </div>
        ) : !loaded ? (
          <div className="flex flex-col gap-3 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : empty ? (
          <EmptyResult title="Tidak ada riwayat yang cocok" desc="Coba kata lain atau perluas rentang waktu." onReset={() => { setQ(""); setMod(""); setWho(""); setRange("30"); setTab("all"); setPage(1); }} />
        ) : (
          <div aria-busy={loading} className={cn(loading && "opacity-50")}>
            {loaded.data?.days.map((d) => (
              <section key={d.date} aria-label={dayLabel(d.date)}>
                <h2 className="border-b border-sp-line-soft bg-accent px-5 py-2.5 text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase">{dayLabel(d.date)}</h2>
                {d.items.map((x) => (
                  <EventRow key={x.id} x={x} open={!!open[x.id]} onOpen={(o) => setOpen({ ...open, [x.id]: o })} busy={busy} onRevert={() => void revert(x)} />
                ))}
              </section>
            ))}
          </div>
        )}
        {data && !empty && <Pager text={`Menampilkan ${from}–${from + shown - 1} dari ${data.total.toLocaleString("id-ID")} entri`} canPrev={page > 1} canNext={page * PAGE_SIZE < data.total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
        <CardFooter className="gap-2 text-[12.5px]"><Lock aria-hidden className="size-3.5 flex-none" />Riwayat disimpan 2 tahun. “Kembalikan” membuat perubahan baru yang tercatat di sini; riwayat aslinya tidak dihapus.</CardFooter>
      </Card>
    </div>
  );
}
