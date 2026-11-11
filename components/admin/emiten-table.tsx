"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Flag, Plus, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { bulkReview, describeError, exportCompaniesCsv, listCompanies, saveBlob, type ListItem, type ListResponse, type ListTab } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { fmtWhen } from "@/lib/format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyResult, EntityAvatar, FilterTabs, PageHeader, Pager, SearchInput, StatusBadge, type Tone } from "./form-ui";

const PAGE_SIZE = 14;
const TABS: [ListTab, string][] = [["all", "Semua"], ["review", "Perlu ditinjau"], ["incomplete", "Belum lengkap"], ["ready", "Siap terbit"]];
const STATUS: Record<ListItem["status"], Tone> = { ok: "success", review: "warning", draft: "neutral", new: "info" };
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const colorOf = (t: string) => AVATAR[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]; // stable per ticker

function useDebounced<T>(value: T, ms: number) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return d;
}

type Loaded = { key: string; data?: ListResponse; error?: ApiError };

export function EmitenTable() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<ListTab>("all");
  const [sec, setSec] = useState("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const dq = useDebounced(q.trim(), 300);

  // Results are keyed by the filters that produced them, so "loading" is derived (key mismatch), not stored.
  const key = `${dq}|${tab}|${sec}|${page}|${reload}`;
  useEffect(() => {
    let live = true;
    void listCompanies({ q: dq, tab, sector: sec, page, pageSize: PAGE_SIZE }).then((r) => { if (live) setLoaded(r.ok ? { key, data: r.data } : { key, error: r.error }); });
    return () => { live = false; };
  }, [key, dq, tab, sec, page]);

  const loading = !loaded || loaded.key !== key;
  const data = loaded?.data;
  const rows = data?.items ?? [];
  const filtered = !dq && !sec;
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.ticker));
  const refresh = () => setReload((n) => n + 1);
  const filter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); setSel(new Set()); };
  const toggle = (c: string) => setSel((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  const download = async (tickers?: string[]) => {
    const r = await exportCompaniesCsv(tickers);
    if (r.ok) saveBlob(r.data, "emiten.csv"); else toast(describeError(r.error));
  };
  const markReview = async () => {
    const r = await bulkReview([...sel]);
    if (!r.ok) return toast(describeError(r.error));
    toast(`${r.data.updated} emiten ditandai perlu ditinjau`);
    setSel(new Set());
    refresh();
  };

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? from + rows.length - 1 : 0;
  const darkBtn = "border-sp-ink-2 bg-transparent text-border hover:bg-[#292524] hover:text-white";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Data emiten" desc="958 emiten dari BEI. Profil, anak usaha, dan manajemen disinkron otomatis; ringkasan bisnis dan sumber pendapatan diisi tim data." actions={<>
        <Button variant="outline" onClick={() => void download()}><Download aria-hidden />Ekspor CSV</Button>
        <Link href="/admin/emiten/ipo/baru" className={buttonVariants({ variant: "secondary" })}><Plus aria-hidden />Tambah emiten IPO</Link>
      </>} />

      <Card aria-label="Daftar emiten" className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-sp-line-soft p-4">
          <SearchInput label="Cari emiten" placeholder="Cari kode atau nama emiten" value={q} onChange={filter(setQ)} className="max-w-[360px]" />
          <FilterTabs label="Filter status" value={tab} onChange={filter(setTab)} tabs={TABS.map(([v, label]) => ({ v, label, n: data ? data.tabs[v].toLocaleString("id-ID") : undefined }))} />
          <NativeSelect size="sm" aria-label="Sektor" value={sec} onChange={(e) => filter(setSec)(e.target.value)} className="ml-auto w-[200px]">
            <NativeSelectOption value="">Semua sektor</NativeSelectOption>
            {(data?.sectors ?? []).map((s) => <NativeSelectOption key={s.slug} value={s.slug}>{s.name}</NativeSelectOption>)}
          </NativeSelect>
        </div>

        {sel.size > 0 && (
          <div role="region" aria-label="Aksi massal" className="flex items-center gap-3 bg-foreground px-4 py-2.5 text-[13.5px] text-border">
            <b className="text-white">{sel.size} dipilih</b>
            <Button size="sm" variant="outline" className={darkBtn} onClick={() => void markReview()}>Tandai perlu ditinjau</Button>
            <Button size="sm" variant="outline" className={darkBtn} onClick={() => void download([...sel])}>Ekspor yang dipilih</Button>
            <Button size="sm" variant="link" className="ml-auto px-0 text-border" onClick={() => setSel(new Set())}>Batal pilih</Button>
          </div>
        )}

        {loaded?.error && loading === false ? (
          <div className="p-5">
            <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{describeError(loaded.error)}<Button size="sm" variant="destructive-outline" onClick={refresh}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert>
          </div>
        ) : !loading && rows.length === 0 ? (
          <EmptyResult title="Tidak ada emiten yang cocok" desc="Coba kode lain, atau hapus filter status dan sektor." onReset={() => { setQ(""); setSec(""); setTab("all"); setPage(1); }} />
        ) : (
          <>
            <Table className="min-w-[1080px]" aria-busy={loading}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[52px]"><Checkbox aria-label="Pilih semua di halaman ini" checked={allOn} onCheckedChange={() => setSel(allOn ? new Set() : new Set(rows.map((r) => r.ticker)))} /></TableHead>
                  <TableHead>Emiten</TableHead><TableHead>Sektor BEI</TableHead><TableHead className="w-[150px]">Kelengkapan</TableHead><TableHead>Tema</TableHead>
                  <TableHead>Status</TableHead><TableHead>Laporan</TableHead><TableHead>Diperbarui</TableHead><TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={cn(loading && loaded && "opacity-50")}>
                {!loaded ? Array.from({ length: 8 }, (_, i) => (
                  <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={9}><Skeleton className="h-8" /></TableCell></TableRow>
                )) : rows.map((r) => {
                  const on = sel.has(r.ticker), { done, total, missing } = r.completeness;
                  return (
                    <TableRow key={r.ticker} data-state={on ? "selected" : undefined} className="data-[state=selected]:bg-[#FFFBF2]">
                      <TableCell><Checkbox aria-label={`Pilih ${r.ticker}`} checked={on} onCheckedChange={() => toggle(r.ticker)} /></TableCell>
                      <TableCell>
                        <Link href={`/admin/emiten/${r.ticker}`} className="group flex min-w-0 items-center gap-2.5">
                          <EntityAvatar code={r.ticker} logo={r.logoUrl ?? undefined} size={32} color={colorOf(r.ticker)} />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="font-mono text-[13.5px] group-hover:underline">{r.ticker}</b><em className="max-w-[220px] truncate text-[12.5px] text-muted-foreground not-italic">{r.name}</em></span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-[13px] text-sp-icon">{r.sector?.name ?? "—"}</TableCell>
                      <TableCell title={missing.length ? `Belum: ${missing.join(", ")}` : "Semua bagian lengkap"}>
                        <span className="flex items-center gap-2">
                          <Progress value={(done / total) * 100} aria-label={`Kelengkapan ${r.ticker}`} className="flex-1" indicatorClassName={done === total ? "bg-foreground" : "bg-primary"} />
                          <span className="font-mono text-[12.5px] text-sp-ink-2">{done}/{total}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-sp-icon">{r.theme}</TableCell>
                      <TableCell><StatusBadge tone={STATUS[r.status]}>{r.statusLabel}</StatusBadge></TableCell>
                      <TableCell>{r.reportCount > 0 ? <Badge variant="danger" className="h-[22px] font-mono"><Flag aria-hidden />{r.reportCount}</Badge> : <span className="font-mono text-[12.5px] text-sp-faint">—</span>}</TableCell>
                      <TableCell className="text-[13px] leading-snug">{fmtWhen(r.updatedAt)}<small className="block text-xs text-muted-foreground">{r.updatedBy}</small></TableCell>
                      <TableCell className="text-right"><Link href={`/admin/emiten/${r.ticker}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pager text={data ? `Menampilkan ${from}–${to} dari ${data.total.toLocaleString("id-ID")} emiten${filtered ? "" : " (hasil filter)"}` : "Memuat…"}
              canPrev={page > 1} canNext={!!data && page * PAGE_SIZE < data.total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
          </>
        )}
      </Card>
    </div>
  );
}
