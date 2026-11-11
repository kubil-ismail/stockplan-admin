"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Flag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MISSING, ROWS, SECTORS, TOTALS, logoOf, type Row, type Status } from "@/lib/emiten-data";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyResult, EntityAvatar, FilterTabs, PageHeader, Pager, SearchInput, StatusBadge, type Tone } from "./form-ui";

type Tab = "all" | "review" | "inc" | "ok";
const TABS: [Tab, string][] = [["all", "Semua"], ["review", "Perlu ditinjau"], ["inc", "Belum lengkap"], ["ok", "Siap terbit"]];
const STATUS: Record<Status, [string, Tone]> = { ok: ["Siap terbit", "success"], review: ["Perlu ditinjau", "warning"], draft: ["Draf", "neutral"], new: ["IPO baru", "info"] };
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const done = (r: Row) => r.parts.reduce((a, b) => a + b, 0);

export function EmitenTable() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sec, setSec] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());

  const all = ROWS.map((r) => (review.has(r.code) ? { ...r, status: "review" as Status } : r));
  const needle = q.trim().toLowerCase();
  const base = all.filter((r) => (!needle || `${r.code} ${r.name}`.toLowerCase().includes(needle)) && (!sec || r.secKey === sec));
  const inTab = (r: Row, t: Tab) => t === "all" || (t === "review" && r.status === "review") || (t === "inc" && done(r) < 5) || (t === "ok" && r.status === "ok");
  const filtered = !needle && !sec;
  const rows = base.filter((r) => inTab(r, tab));
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.code));
  const total = filtered ? TOTALS[tab] : rows.length;
  const toggle = (c: string) => setSel((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Data emiten" desc="958 emiten dari BEI. Profil, anak usaha, dan manajemen disinkron otomatis; ringkasan bisnis dan sumber pendapatan diisi tim data." actions={<>
        <Button variant="outline" onClick={() => toast("CSV semua emiten sedang disiapkan")}><Download aria-hidden />Ekspor CSV</Button>
        <Link href="/admin/emiten/ipo/baru" className={buttonVariants({ variant: "secondary" })}><Plus aria-hidden />Tambah emiten IPO</Link>
      </>} />

      <Card aria-label="Daftar emiten" className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-sp-line-soft p-4">
          <SearchInput label="Cari emiten" placeholder="Cari kode atau nama emiten" value={q} onChange={setQ} className="max-w-[360px]" />
          <FilterTabs label="Filter status" value={tab} onChange={setTab} tabs={TABS.map(([v, label]) => ({ v, label, n: (filtered ? TOTALS[v] : base.filter((r) => inTab(r, v)).length).toLocaleString("id-ID") }))} />
          <NativeSelect size="sm" aria-label="Sektor" value={sec} onChange={(e) => setSec(e.target.value)} className="ml-auto w-[200px]">
            {SECTORS.map(([v, l]) => <NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}
          </NativeSelect>
        </div>

        {sel.size > 0 && (
          <div role="region" aria-label="Aksi massal" className="flex items-center gap-3 bg-foreground px-4 py-2.5 text-[13.5px] text-border">
            <b className="text-white">{sel.size} dipilih</b>
            <Button size="sm" variant="outline" className="border-sp-ink-2 bg-transparent text-border hover:bg-[#292524] hover:text-white" onClick={() => { setReview((r) => new Set([...r, ...sel])); toast(`${sel.size} emiten ditandai perlu ditinjau`); setSel(new Set()); }}>Tandai perlu ditinjau</Button>
            <Button size="sm" variant="outline" className="border-sp-ink-2 bg-transparent text-border hover:bg-[#292524] hover:text-white" onClick={() => toast(`CSV untuk ${sel.size} emiten sedang disiapkan`)}>Ekspor yang dipilih</Button>
            <Button size="sm" variant="link" className="ml-auto px-0 text-border" onClick={() => setSel(new Set())}>Batal pilih</Button>
          </div>
        )}

        {rows.length > 0 ? (
          <>
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[52px]"><Checkbox aria-label="Pilih semua di halaman ini" checked={allOn} onCheckedChange={() => setSel(allOn ? new Set() : new Set(rows.map((r) => r.code)))} /></TableHead>
                  <TableHead>Emiten</TableHead><TableHead>Sektor BEI</TableHead><TableHead className="w-[150px]">Kelengkapan</TableHead><TableHead>Tema</TableHead>
                  <TableHead>Status</TableHead><TableHead>Laporan</TableHead><TableHead>Diperbarui</TableHead><TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const n = done(r), on = sel.has(r.code);
                  return (
                    <TableRow key={r.code} data-state={on ? "selected" : undefined} className="data-[state=selected]:bg-[#FFFBF2]">
                      <TableCell><Checkbox aria-label={`Pilih ${r.code}`} checked={on} onCheckedChange={() => toggle(r.code)} /></TableCell>
                      <TableCell>
                        <Link href={`/admin/emiten/${r.code}`} className="group flex min-w-0 items-center gap-2.5">
                          <EntityAvatar code={r.code} logo={logoOf(r.code)} size={32} color={AVATAR[ROWS.findIndex((x) => x.code === r.code) % AVATAR.length]} />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="font-mono text-[13.5px] group-hover:underline">{r.code}</b><em className="max-w-[220px] truncate text-[12.5px] text-muted-foreground not-italic">{r.name}</em></span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-[13px] text-sp-icon">{r.sector}</TableCell>
                      <TableCell title={n === 5 ? "Semua bagian lengkap" : `Belum: ${r.parts.map((v, k) => (v ? null : MISSING[k])).filter(Boolean).join(", ")}`}>
                        <span className="flex items-center gap-2">
                          <Progress value={n * 20} aria-label={`Kelengkapan ${r.code}`} className="flex-1" indicatorClassName={n === 5 ? "bg-foreground" : "bg-primary"} />
                          <span className="font-mono text-[12.5px] text-sp-ink-2">{n}/5</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-sp-icon">{r.tema}</TableCell>
                      <TableCell><StatusBadge tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</StatusBadge></TableCell>
                      <TableCell>{r.reports > 0 ? <Badge variant="danger" className="h-[22px] font-mono"><Flag aria-hidden />{r.reports}</Badge> : <span className="font-mono text-[12.5px] text-sp-faint">—</span>}</TableCell>
                      <TableCell className="text-[13px] leading-snug">{r.when}<small className="block text-xs text-muted-foreground">{r.by}</small></TableCell>
                      <TableCell className="text-right"><Link href={`/admin/emiten/${r.code}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Edit</Link></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pager text={`Menampilkan 1–${rows.length} dari ${total.toLocaleString("id-ID")} emiten`} onNext={() => toast("Halaman berikutnya belum tersedia (data contoh)")} />
          </>
        ) : (
          <EmptyResult title="Tidak ada emiten yang cocok" desc="Coba kode lain, atau hapus filter status dan sektor." onReset={() => { setQ(""); setSec(""); setTab("all"); }} />
        )}
      </Card>
    </div>
  );
}
