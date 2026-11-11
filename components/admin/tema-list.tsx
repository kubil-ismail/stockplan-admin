"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, Share2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounced } from "@/hooks/use-debounced";
import { describeError } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { listThemes, mapCompany, type ThemeList, type ThemeStatus } from "@/lib/admin-themes";
import { fmtWhen } from "@/lib/format";
import { READY_MIN } from "@/lib/tema";
import { SECTOR_ICON } from "@/lib/sector-icons";
import { PALETTE } from "@/lib/tema-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyResult, EntityAvatar, FilterTabs, PageHeader, PanelCard, ROW, SearchInput, StatCard, StatusBadge, type Tone } from "./form-ui";

type Tab = "all" | ThemeStatus;
const TABS: [Tab, string][] = [["all", "Semua"], ["open", "Terbuka"], ["map", "Peta sektor"], ["draft", "Draf"], ["review", "Perlu ditinjau"]]; // COPY: perlu review (label tab Peta sektor)
const ST: Record<ThemeStatus, [string, Tone]> = { open: ["Terbuka", "success"], review: ["Perlu ditinjau", "warning"], draft: ["Draf", "neutral"], map: ["Peta sektor", "info"] };
const DS: Record<"soon" | "ok" | "new", Tone> = { soon: "neutral", ok: "success", new: "info" };
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const colorOf = (t: string) => AVATAR[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length];
type Loaded = { key: string; data?: ThemeList; error?: ApiError };

export function TemaList() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sec, setSec] = useState("");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const dq = useDebounced(q.trim(), 300);

  // Keyed by the filters that produced the result, so "loading" is derived, not stored.
  const key = `${dq}|${tab}|${sec}|${reload}`;
  useEffect(() => {
    let live = true;
    void listThemes({ q: dq, tab, sector: sec }).then((r) => { if (live) setLoaded(r.ok ? { key, data: r.data } : { key, error: r.error }); });
    return () => { live = false; };
  }, [key, dq, tab, sec]);

  const loading = !loaded || loaded.key !== key;
  const data = loaded?.data;
  const rows = data?.items ?? [];
  const refresh = () => setReload((n) => n + 1);
  // shortcut: "Petakan" can only pick from themes in the current (filtered) list plus the suggestion; upgrade: fetch the unfiltered theme names.
  const options = (suggestion: { slug: string; name: string } | null) => {
    const o = rows.map((t) => ({ slug: t.slug, name: t.name }));
    return suggestion && !o.some((x) => x.slug === suggestion.slug) ? [...o, suggestion] : o;
  };

  const map = async (tk: string, slug: string, name: string) => {
    setBusy(tk);
    const r = await mapCompany(slug, tk);
    setBusy("");
    if (!r.ok) return toast(describeError(r.error));
    toast(`${tk} masuk ${name} sebagai draf. Isi porsi pendapatannya di halaman tema.`);
    refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Tema & Industri" desc="Peta emiten per tahap rantai nilai, lengkap dengan porsi pendapatannya."
        actions={<Link href="/admin/tema/baru" className={buttonVariants({ variant: "secondary" })}><Plus aria-hidden />Tambah tema</Link>} />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Tema terbuka" value={data?.summary.open ?? "—"} note="bisa dibuka pengguna" />
        <StatCard label="Tema draf" value={data?.summary.draft ?? "—"} note="belum lolos syarat 80%" />
        <StatCard label="Emiten terpetakan" value={data?.summary.mappedCompanies.count.toLocaleString("id-ID") ?? "—"} note={data ? `dari ${data.summary.mappedCompanies.of.toLocaleString("id-ID")} emiten BEI` : ""} />
        <StatCard label="Pemetaan tanpa porsi" value={data?.summary.missingShares.count ?? "—"} note={data && <><em className="font-semibold text-[#B45309] not-italic">{data.summary.missingShares.inOpenThemes}</em> di tema yang sudah terbuka</>} />
      </div>

      <Card aria-label="Daftar tema" className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-sp-line-soft p-4">
          <SearchInput label="Cari tema" placeholder="Cari tema" value={q} onChange={setQ} className="max-w-[360px]" />
          <FilterTabs label="Filter status" value={tab} onChange={setTab} tabs={TABS.map(([v, label]) => ({ v, label, n: data?.tabs[v] }))} />
          <NativeSelect size="sm" aria-label="Sektor" value={sec} onChange={(e) => setSec(e.target.value)} className="ml-auto w-[220px]">
            <NativeSelectOption value="">Semua sektor</NativeSelectOption>
            {(data?.sectors ?? []).map((s) => <NativeSelectOption key={s.slug} value={s.slug}>{s.name}</NativeSelectOption>)}
          </NativeSelect>
        </div>

        {loaded?.error && !loading ? (
          <div className="p-5">
            <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{describeError(loaded.error)}<Button size="sm" variant="destructive-outline" onClick={refresh}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert>
          </div>
        ) : !loading && !rows.length ? (
          <EmptyResult title="Tidak ada tema yang cocok" desc="Coba kata lain, atau hapus filter status dan sektor." onReset={() => { setQ(""); setSec(""); setTab("all"); }} />
        ) : (
          <>
            <Table className="min-w-[1100px]" aria-busy={loading}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {["Tema", "Tahap", "Emiten", "Kesiapan emiten", "Status", "Status data", "Tesis", "Diperbarui"].map((h) => <TableHead key={h}>{h}</TableHead>)}
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={cn(loading && loaded && "opacity-50")}>
                {!loaded ? Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={9}><Skeleton className="h-8" /></TableCell></TableRow>
                )) : rows.map((t) => {
                  const rd = t.readiness; // null for "map" rows (sector-page line only, no chain)
                  const pct = rd?.percent ?? 0;
                  console.log(rows);
                  return (
                    <TableRow key={t.slug}>
                      <TableCell>
                        <Link href={`/admin/tema/${t.slug}`} className="group flex items-center gap-2.5">
                          <span aria-hidden className="inline-flex size-8 flex-none items-center justify-center rounded-lg bg-sp-amber-bg text-sp-amber-text">{(() => { const I = (t.icon && SECTOR_ICON[t.icon]) || Share2; return <I className="size-4" />; })()}</span>
                          <span className="flex flex-col leading-tight"><b className="font-semibold group-hover:underline">{t.name}</b><em className="text-[12.5px] text-muted-foreground not-italic">{t.sector?.name ?? "—"}</em></span>
                        </Link>
                      </TableCell>
                      <TableCell title={t.chain.map((c) => c.group ?? "—").join(" → ")}>
                        <span className="flex items-center gap-[3px]">{t.chain.map((c, i) => <i key={i} className="h-1.5 w-3.5 rounded-full" style={{ background: (PALETTE[c.color] ?? PALETTE.stone)[2] }} />)}<small className="ml-1.5 font-mono text-[12.5px] text-sp-ink-2">{t.stageCount} tahap</small></span>
                      </TableCell>
                      <TableCell className="font-mono text-[13px] text-sp-ink-2">{rd ? rd.total : "—"}</TableCell>
                      <TableCell className="w-[190px]" title="Garis abu-abu = batas 80%">
                        {rd ? (
                          <span className="flex flex-col gap-1">
                            <span className="flex justify-between font-mono text-xs text-sp-ink-2"><span>{rd.ready}/{rd.total}</span><span>{pct}%</span></span>
                            <Progress value={pct} aria-label={`Kesiapan ${t.name}`} trackClassName="relative after:absolute after:left-[80%] after:h-full after:w-px after:bg-sp-icon" indicatorClassName={pct >= READY_MIN ? "bg-foreground" : "bg-primary"} />
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><StatusBadge tone={ST[t.status][1]}>{t.statusLabel}</StatusBadge></TableCell>
                      <TableCell className="text-[13px] leading-snug"><StatusBadge tone={DS[t.dataStatus.key]}>{t.dataStatus.label}</StatusBadge>{t.dataStatus.updatedAt && <small className="block text-xs text-muted-foreground">{fmtWhen(t.dataStatus.updatedAt)}</small>}</TableCell>
                      <TableCell className="font-mono text-[13px] text-sp-ink-2">{t.theses ? t.theses.toLocaleString("id-ID") : "—"}</TableCell>
                      <TableCell className="text-[13px] leading-snug">{fmtWhen(t.updatedAt)}<small className="block text-xs text-muted-foreground">{t.updatedBy}</small></TableCell>
                      <TableCell className="text-right"><Link href={`/admin/tema/${t.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sp-line-soft px-4 py-3 text-[13px] text-muted-foreground">
              <span>Menampilkan {rows.length} tema{dq || sec ? " (hasil filter)" : ""}</span>
              <span>Kesiapan = emiten siap terbit dibagi emiten di tema. Tema baru bisa dibuka kalau minimal 80%.</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
