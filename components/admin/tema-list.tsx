"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { readiness, READY_MIN } from "@/lib/tema";
import { SECTORS, THEMES, UNMAPPED, type ThemeStatus } from "@/lib/tema-data";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyResult, EntityAvatar, FilterTabs, PageHeader, PanelCard, ROW, SearchInput, StatCard, StatusBadge, type Tone } from "./form-ui";

type Tab = "all" | ThemeStatus;
const TABS: [Tab, string][] = [["all", "Semua"], ["open", "Terbuka"], ["draft", "Draf"], ["review", "Perlu ditinjau"]];
const ST: Record<ThemeStatus, [string, Tone]> = { open: ["Terbuka", "success"], review: ["Perlu ditinjau", "warning"], draft: ["Draf", "neutral"] };
const DOT = { H: "bg-primary", T: "bg-[#60A5FA]", L: "bg-[#4ADE80]" } as const;
const NAME = { H: "Hulu", T: "Tengah", L: "Hilir" } as const;

export function TemaList() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sec, setSec] = useState("");
  const [mapped, setMapped] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>(Object.fromEntries(UNMAPPED.map((u) => [u.tk, u.pick])));

  const needle = q.trim().toLowerCase();
  const base = THEMES.filter((t) => (!needle || t.name.toLowerCase().includes(needle)) && (!sec || t.sec === sec));
  const rows = base.filter((t) => tab === "all" || t.status === tab);
  const um = UNMAPPED.filter((u) => !mapped.includes(u.tk));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Tema & rantai nilai" desc="Peta emiten per tahap rantai nilai, lengkap dengan porsi pendapatannya."
        actions={<Link href="/admin/tema/baru" className={buttonVariants({ variant: "secondary" })}><Plus aria-hidden />Tambah tema</Link>} />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Tema terbuka" value={THEMES.filter((t) => t.status === "open").length} note="bisa dibuka pengguna" />
        <StatCard label="Tema draf" value={THEMES.filter((t) => t.status === "draft").length} note="belum lolos syarat 80%" />
        <StatCard label="Emiten terpetakan" value="214" note="dari 958 emiten BEI" />
        <StatCard label="Pemetaan tanpa porsi" value="23" note={<><em className="font-semibold text-[#B45309] not-italic">7</em> di tema yang sudah terbuka</>} />
      </div>

      <Card aria-label="Daftar tema" className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-sp-line-soft p-4">
          <SearchInput label="Cari tema" placeholder="Cari tema" value={q} onChange={setQ} className="max-w-[360px]" />
          <FilterTabs label="Filter status" value={tab} onChange={setTab} tabs={TABS.map(([v, label]) => ({ v, label, n: base.filter((t) => v === "all" || t.status === v).length }))} />
          <NativeSelect size="sm" aria-label="Sektor" value={sec} onChange={(e) => setSec(e.target.value)} className="ml-auto w-[220px]">
            <NativeSelectOption value="">Semua sektor</NativeSelectOption>
            {SECTORS.map((s) => <NativeSelectOption key={s}>{s}</NativeSelectOption>)}
          </NativeSelect>
        </div>

        {rows.length ? (
          <>
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {["Tema", "Tahap", "Emiten", "Kesiapan emiten", "Status", "Tesis", "Diperbarui"].map((h) => <TableHead key={h}>{h}</TableHead>)}
                  <TableHead><span className="sr-only">Aksi</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => {
                  const pct = readiness(t.ok, t.n);
                  return (
                    <TableRow key={t.name}>
                      <TableCell>
                        <Link href="/admin/tema/batubara" className="group flex items-center gap-2.5">
                          <span aria-hidden className="inline-flex size-8 flex-none items-center justify-center rounded-lg bg-sp-amber-bg text-sp-amber-text"><Share2 className="size-4" /></span>
                          <span className="flex flex-col leading-tight"><b className="font-semibold group-hover:underline">{t.name}</b><em className="text-[12.5px] text-muted-foreground not-italic">{t.sec}</em></span>
                        </Link>
                      </TableCell>
                      <TableCell title={t.chain.split("").map((c) => NAME[c as "H"]).join(" → ")}>
                        <span className="flex items-center gap-[3px]">{t.chain.split("").map((c, i) => <i key={i} className={cn("h-1.5 w-3.5 rounded-full", DOT[c as "H"])} />)}<small className="ml-1.5 font-mono text-[12.5px] text-sp-ink-2">{t.chain.length} tahap</small></span>
                      </TableCell>
                      <TableCell className="font-mono text-[13px] text-sp-ink-2">{t.n}</TableCell>
                      <TableCell className="w-[190px]" title="Garis abu-abu = batas 80%">
                        <span className="flex flex-col gap-1">
                          <span className="flex justify-between font-mono text-xs text-sp-ink-2"><span>{t.ok}/{t.n}</span><span>{pct}%</span></span>
                          <Progress value={pct} aria-label={`Kesiapan ${t.name}`} trackClassName="relative after:absolute after:left-[80%] after:h-full after:w-px after:bg-sp-icon" indicatorClassName={pct >= READY_MIN ? "bg-foreground" : "bg-primary"} />
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge tone={ST[t.status][1]}>{ST[t.status][0]}</StatusBadge></TableCell>
                      <TableCell className="font-mono text-[13px] text-sp-ink-2">{t.tesis ? t.tesis.toLocaleString("id-ID") : "—"}</TableCell>
                      <TableCell className="text-[13px] leading-snug">{t.when}<small className="block text-xs text-muted-foreground">{t.by}</small></TableCell>
                      <TableCell className="text-right"><Link href="/admin/tema/batubara" className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sp-line-soft px-4 py-3 text-[13px] text-muted-foreground">
              <span>Menampilkan {rows.length} dari {THEMES.length} tema</span>
              <span>Kesiapan = emiten siap terbit dibagi emiten di tema. Tema baru bisa dibuka kalau minimal 80%.</span>
            </div>
          </>
        ) : (
          <EmptyResult title="Tidak ada tema yang cocok" desc="Coba kata lain, atau hapus filter status dan sektor." onReset={() => { setQ(""); setSec(""); setTab("all"); }} />
        )}
      </Card>

      <PanelCard id="um-h" title="Emiten belum masuk tema mana pun" aside={`${744 - mapped.length} emiten · ${um.length} teratas dari antrian`}
        footer="Emiten baru masuk tema sebagai draf. Porsi pendapatannya diisi dari halaman tema.">
        {um.map((u) => {
          const pick = picks[u.tk] ?? "";
          return (
            <Item key={u.tk} className={ROW}>
              <ItemMedia><EntityAvatar code={u.tk} size={32} color={u.color} /></ItemMedia>
              <ItemContent className="gap-0"><ItemTitle className="font-mono"><Link href={`/admin/emiten/${u.tk}`} className="hover:underline">{u.tk}</Link></ItemTitle><ItemDescription className="text-[12.5px]">{u.name}</ItemDescription></ItemContent>
              <ItemActions>
                <NativeSelect size="sm" aria-label={`Tema untuk ${u.tk}`} className="w-[260px]" value={pick} onChange={(e) => setPicks({ ...picks, [u.tk]: e.target.value })}>
                  <NativeSelectOption value="">Pilih tema…</NativeSelectOption>
                  {THEMES.map((t) => <NativeSelectOption key={t.name}>{t.name}</NativeSelectOption>)}
                </NativeSelect>
                <Button variant="secondary" size="sm" aria-disabled={!pick} onClick={() => { if (!pick) return; setMapped([...mapped, u.tk]); toast(`${u.tk} masuk ${pick} sebagai draf. Isi porsi pendapatannya di halaman tema.`); }}>Petakan</Button>
              </ItemActions>
              <ItemFooter><ItemDescription className="text-[12.5px]">{u.note}</ItemDescription></ItemFooter>
            </Item>
          );
        })}
      </PanelCard>
    </div>
  );
}
