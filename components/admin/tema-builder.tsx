"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, GripVertical, MoreHorizontal, MousePointer2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoOf } from "@/lib/emiten-data";
import { checklist, moveEmiten, moveStage, removeEmiten, stagesOf, type Group, type Result, type Row, type Stage } from "@/lib/tema";
import { ICONS, PALETTE, POOL, SECTORS, THEMES } from "@/lib/tema-data";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AffixInput, Counter, EntityAvatar, FormField, Help, SearchInput, Section } from "./form-ui";

type Drag = { kind: "em"; tk: string; from: number | null } | { kind: "st"; id: number } | null;
const AVATAR = ["#15803D", "#1D4ED8", "#0F766E", "#92400E", "#6D28D9", "#1C1917", "#BE185D", "#B45309"];
const pal = (g?: Group) => { const p = PALETTE[g?.c ?? "stone"]; return { bg: p[1], bar: p[2], soft: p[3], ink: p[4] }; };
const KEYS = Object.keys(POOL);
const ICON_D = Object.fromEntries(ICONS.map((i) => [i[0], i[2]]));
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const Avatar = ({ tk }: { tk: string }) => <EntityAvatar code={tk} logo={logoOf(tk)} size={32} color={AVATAR[KEYS.indexOf(tk) % AVATAR.length]} />;

// shortcut: starts from the design's "Energi terbarukan" example; start empty and POST /admin/api/themes on save.
export function TemaBuilder() {
  const [name, setName] = useState("Energi terbarukan");
  const [sektor, setSektor] = useState("Energi");
  const [desc, setDesc] = useState("Perusahaan yang membangun dan menjual listrik dari panas bumi, air, dan matahari.");
  const [groups, setGroups] = useState<Group[]>([
    { id: "g1", t: "Pembangkit", d: "Menghasilkan listrik dari panas bumi, air, dan matahari.", ic: "leaf", c: "green" },
    { id: "g2", t: "Peralatan", d: "Membuat dan memasang panel surya serta turbin.", ic: "factory", c: "blue" },
    { id: "g3", t: "Konstruksi", d: "Membangun pembangkit untuk pemilik proyek.", ic: "store", c: "amber" },
  ]);
  const [gOpen, setGOpen] = useState<Record<string, boolean>>({ g2: true });
  const [stages, setStages] = useState<Stage[]>([
    { id: 1, name: "Pengembang panas bumi", g: "g1", desc: "Mengebor uap panas bumi dan menjual listriknya ke PLN.", rows: [{ tk: "PGEO", p: "100" }, { tk: "BREN", p: "" }] },
    { id: 2, name: "Pembangkit air (PLTA & PLTM)", g: "g1", desc: "Membangun bendungan atau PLTM dan menjual listriknya.", rows: [{ tk: "ARKO", p: "" }, { tk: "KEEN", p: "" }, { tk: "JSKY", p: "" }] },
    { id: 3, name: "Panel & PLTS atap", g: "g2", desc: "", rows: [] },
  ]);
  const [nid, setNid] = useState(4);
  const [gid, setGid] = useState(4);
  const [pq, setPq] = useState("");
  const [psec, setPsec] = useState("");
  const [drag, setDrag] = useState<Drag>(null);
  const [over, setOver] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const gById = Object.fromEntries(groups.map((g) => [g.id, g]));
  const endDrag = () => { setDrag(null); setOver(null); };
  const apply = (r: Result) => { if ("error" in r) { if (r.error) toast(r.error); return; } setStages(r.stages); toast(r.msg); };

  const nG = groups.length;
  const updG = (id: string, o: Partial<Group>) => setGroups(groups.map((g) => (g.id === id ? { ...g, ...o } : g)));
  const moveG = (i: number, d: number) => { const a = groups.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setGroups(a); };
  const updS = (id: number, o: Partial<Stage>) => setStages(stages.map((s) => (s.id === id ? { ...s, ...o } : s)));
  const updRow = (sid: number, tk: string, p: string) => setStages(stages.map((s) => (s.id === sid ? { ...s, rows: s.rows.map((r) => (r.tk === tk ? { ...r, p } : r)) } : s)));

  const groupsOk = groups.length > 0 && groups.every((g) => g.t.trim() && g.d.trim() && g.t.length <= 20 && g.d.length <= 80);
  const dup = THEMES.some((t) => t.name.toLowerCase() === name.trim().toLowerCase());
  const checks = checklist({ name, dup, stages, groupsOk });
  const ok = checks.every((c) => c[1]) && desc.length <= 160;
  const used = new Set(stages.flatMap((s) => s.rows.map((r) => r.tk)));

  const needle = pq.trim().toLowerCase();
  const pool = KEYS.filter((k) => (!needle || `${k} ${POOL[k][0]}`.toLowerCase().includes(needle)) && (!psec || POOL[k][1] === psec));
  const poolDz = drag?.kind === "em" && drag.from !== null;

  const dragProps = (d: Drag) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", d && d.kind === "em" ? d.tk : "tahap"); } catch {} setDrag(d); setOver(null); },
    onDragEnd: endDrag,
  });
  const dropProps = (key: string, accept: boolean, onDrop: () => void) => ({
    onDragOver: (e: React.DragEvent) => { if (!drag || !accept) return; e.preventDefault(); if (over !== key) setOver(key); },
    onDragLeave: (e: React.DragEvent) => { if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return; if (over === key) setOver(null); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (drag && accept) onDrop(); endDrag(); },
  });

  const save = () => {
    if (!ok) return toast(`Belum bisa disimpan: ${(checks.find((c) => !c[1])?.[0] ?? "deskripsi terlalu panjang").toLowerCase()}`);
    setCreated(true);
    toast(`Draf tema ${name.trim()} tersimpan`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-tight">Tambah tema</h1>
          <p className="text-muted-foreground">Isi identitasnya, lalu susun rantai nilai dengan menarik emiten ke tiap tahap.</p>
        </div>
        <Link href="/admin/tema" className={buttonVariants({ variant: "outline" })}>Batal</Link>
      </div>

      {created && (
        <Alert role="status" variant="success">
          <Check aria-hidden />
          <AlertDescription className="pr-44"><b>{name}</b> tersimpan sebagai draf. Lanjutkan isi porsi dan sumber pendapatan di halaman tema.</AlertDescription>
          <AlertAction><Link href="/admin/tema/batubara" className={buttonVariants({ variant: "secondary", size: "sm" })}>Buka halaman tema</Link></AlertAction>
        </Alert>
      )}

      <Section id="t-id" title="1 · Identitas tema" desc="Tampil di kartu tema dan di atas peta rantai nilai.">
        <div className="grid gap-3.5 sm:grid-cols-[1fr_260px]">
          <FormField label="Nama tema" htmlFor="n-n">
            <Input id="n-n" aria-invalid={dup} value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Energi terbarukan" />
            {dup && <Help className="text-(--sp-danger-text)">Tema dengan nama ini sudah ada.</Help>}
          </FormField>
          <FormField label="Sektor IDX-IC" htmlFor="n-s"><NativeSelect id="n-s" value={sektor} onChange={(e) => setSektor(e.target.value)}>{SECTORS.map((s) => <NativeSelectOption key={s}>{s}</NativeSelectOption>)}</NativeSelect></FormField>
        </div>
        <FormField label="Deskripsi singkat" htmlFor="n-d">
          <Textarea id="n-d" aria-invalid={desc.length > 160} className="min-h-16" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Satu kalimat: bisnis apa saja yang masuk tema ini." />
          <div className="flex justify-between gap-3"><Help>Bisa diubah lagi setelah draf dibuat.</Help><Counter n={desc.length} max={160} /></div>
        </FormField>
      </Section>

      <Section id="t-ms" title="2 · Tahap utama" desc="Kelompok besar di peta rantai nilai. Ikon, warna, judul, dan deskripsinya tampil di aplikasi persis seperti pratinjau ini.">
        <div className="flex flex-col gap-2.5">
          {groups.map((g, i) => {
            const p = pal(g), open = !!gOpen[g.id], used_ = stages.filter((s) => s.g === g.id).length, nm = g.t.trim() || `tahap utama ${i + 1}`;
            return (
              <Collapsible key={g.id} open={open} onOpenChange={(o) => setGOpen({ ...gOpen, [g.id]: o })} render={<Card className="gap-0 py-0" />}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ background: p.bg, boxShadow: `inset 3px 0 0 ${p.bar}` }}>
                  <span aria-hidden className="inline-flex size-7 flex-none items-center justify-center rounded-lg" style={{ background: p.soft, color: p.ink }}><Icon d={ICON_D[g.ic]} /></span>
                  <span className="text-[11.5px] font-bold tracking-[.08em] uppercase" style={{ color: p.ink }}>{g.t.trim() || "Tanpa judul"}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-sp-icon">{g.d.trim() || "Belum ada deskripsi"}</span>
                  <span className="text-xs text-muted-foreground">{used_ ? `${used_} tahap` : "Belum dipakai"}</span>
                  <span className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" aria-label={`Naikkan ${nm}`} aria-disabled={i === 0} onClick={() => moveG(i, -1)}><ChevronUp /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Turunkan ${nm}`} aria-disabled={i === nG - 1} onClick={() => moveG(i, 1)}><ChevronDown /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${nm}`} className="hover:text-(--sp-danger-text)" onClick={() => { if (used_) return toast(`Pindahkan dulu ${used_} tahap yang memakai ${nm}`); if (nG <= 1) return toast("Minimal satu tahap utama"); setGroups(groups.filter((x) => x.id !== g.id)); toast(`${nm} dihapus`); }}><Trash2 /></Button>
                    <Button variant="outline" size="sm" className="ml-1" aria-expanded={open} onClick={() => setGOpen({ ...gOpen, [g.id]: !open })}>{open ? "Selesai" : "Ubah"}</Button>
                  </span>
                </div>
                <CollapsibleContent>
                  <CardContent className="flex flex-col gap-3.5 border-t border-border py-4">
                    <div className="grid gap-3.5 sm:grid-cols-[240px_1fr]">
                      <FormField label="Judul" htmlFor={`gt-${g.id}`}><Input id={`gt-${g.id}`} aria-invalid={!g.t.trim() || g.t.length > 20} value={g.t} onChange={(e) => updG(g.id, { t: e.target.value })} placeholder="mis. Hulu" /><div className="flex justify-end"><Counter n={g.t.length} max={20} /></div></FormField>
                      <FormField label="Deskripsi" htmlFor={`gd-${g.id}`}><Input id={`gd-${g.id}`} aria-invalid={!g.d.trim() || g.d.length > 80} value={g.d} onChange={(e) => updG(g.id, { d: e.target.value })} placeholder="mis. Menggali batu bara dari dalam tanah." /><div className="flex justify-end"><Counter n={g.d.length} max={80} /></div></FormField>
                    </div>
                    <div className="flex flex-wrap justify-between gap-4">
                      <FormField label="Ikon" className="w-auto">
                        <ToggleGroup aria-label="Pilih ikon" variant="outline" spacing={1.5} value={[g.ic]} onValueChange={(v) => v[0] && updG(g.id, { ic: v[0] })} className="flex-wrap">
                          {ICONS.map(([k, l, d]) => <ToggleGroupItem key={k} value={k} aria-label={l} title={l} className="size-10 data-pressed:border-foreground data-pressed:bg-background data-pressed:shadow-[inset_0_0_0_1px_var(--foreground)]"><Icon d={d} size={18} /></ToggleGroupItem>)}
                        </ToggleGroup>
                      </FormField>
                      <FormField label="Warna" className="w-auto">
                        <ToggleGroup aria-label="Pilih warna" spacing={2} value={[g.c]} onValueChange={(v) => v[0] && updG(g.id, { c: v[0] })}>
                          {Object.entries(PALETTE).map(([k, v]) => <ToggleGroupItem key={k} value={k} aria-label={v[0]} title={v[0]} className="size-7 min-w-7 rounded-full border-2 border-background p-0 ring-1 ring-border data-pressed:ring-2 data-pressed:ring-foreground" style={{ background: v[2] }} />)}
                        </ToggleGroup>
                      </FormField>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
        <Button variant="outline" className="h-11 w-full border-dashed" onClick={() => { const id = `g${gid}`; setGroups([...groups, { id, t: "", d: "", ic: "factory", c: "violet" }]); setGid(gid + 1); setGOpen({ ...gOpen, [id]: true }); }}><Plus aria-hidden />Tambah tahap utama</Button>
      </Section>

      <Section id="t-rn" title="3 · Susun rantai nilai" desc="Tiap tahap butuh nama, deskripsi singkat, dan tahap utamanya. Satu emiten boleh ada di lebih dari satu tahap.">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MousePointer2 aria-hidden className="size-3.5" />Tarik dari daftar kiri ke tahap untuk menambah</span>
          <span>Tarik antar tahap untuk memindahkan</span>
          <span>Tarik ke daftar kiri untuk mengeluarkan</span>
          <span className="inline-flex items-center gap-1.5"><GripVertical aria-hidden className="size-3.5" />Tarik pegangan tahap untuk mengubah urutan</span>
          <span>Tanpa mouse: tombol <Kbd>⋯</Kbd> di kartu</span>
        </div>

        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          <Card size="sm" aria-label="Daftar emiten" {...dropProps("pool", poolDz, () => { if (drag?.kind === "em" && drag.from !== null) apply(removeEmiten(stages, drag.tk, drag.from)); })}
            className={cn("sticky left-0 w-[260px] flex-none gap-2.5 bg-accent shadow-none", poolDz && (over === "pool" ? "border-foreground bg-[#FFFBF2]" : "border-dashed border-sp-faint"))}>
            <CardHeader className="gap-2.5">
              <b className="text-sm font-semibold">Emiten</b>
              <SearchInput label="Cari emiten" placeholder="Cari kode atau nama" value={pq} onChange={setPq} className="min-w-0" />
              <NativeSelect size="sm" aria-label="Filter sektor emiten" value={psec} onChange={(e) => setPsec(e.target.value)}><NativeSelectOption value="">Semua sektor</NativeSelectOption><NativeSelectOption>Energi</NativeSelectOption><NativeSelectOption>Infrastruktur</NativeSelectOption><NativeSelectOption>Perindustrian</NativeSelectOption></NativeSelect>
            </CardHeader>
            <CardContent className="flex max-h-[560px] flex-col gap-1.5 overflow-y-auto">
              {pool.map((k) => {
                const at = stagesOf(stages, k);
                return (
                  <Card key={k} size="sm" {...dragProps({ kind: "em", tk: k, from: null })} title={at.length ? `${k} sudah di tahap ${at.join(", ")}. Tarik lagi untuk menambah ke tahap lain.` : `Tarik ${k} ke salah satu tahap`}
                    className={cn("cursor-grab flex-row items-center gap-2 px-1.5 py-1.5 active:cursor-grabbing", drag?.kind === "em" && drag.tk === k && drag.from === null && "opacity-40")}>
                    <GripVertical aria-hidden className="size-3.5 flex-none text-sp-faint" />
                    <Avatar tk={k} />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight"><b className="font-mono text-[12.5px]">{k}</b><em className="truncate text-xs text-muted-foreground not-italic">{POOL[k][0]}</em></span>
                    <span className={cn("text-[11px] whitespace-nowrap", at.length ? "font-semibold text-sp-ink-2" : "text-sp-faint")}>{at.length ? `Tahap ${at.join(", ")}` : "Belum"}</span>
                  </Card>
                );
              })}
              {!pool.length && <Help>Tidak ada emiten yang cocok.</Help>}
            </CardContent>
            <CardFooter className="bg-transparent px-3 py-2 text-xs">{poolDz ? "Lepas di sini untuk mengeluarkan dari tahap" : `${used.size} emiten dipakai · ${KEYS.length} di daftar`}</CardFooter>
          </Card>

          <div className="flex items-start gap-4">
            {stages.map((s, i) => {
              const key = `s${s.id}`;
              const dzEm = drag?.kind === "em" && drag.from !== s.id && !s.rows.some((r) => r.tk === drag.tk);
              const dzSt = drag?.kind === "st" && drag.id !== s.id;
              const dz = dzEm || dzSt;
              const miss = s.rows.filter((r) => !r.p.trim()).length;
              return (
                <Card key={s.id} size="sm" aria-label={`Tahap ${i + 1}${s.name ? `: ${s.name}` : ""}`}
                  {...dropProps(key, !!dz, () => { if (drag?.kind === "em") apply(moveEmiten(stages, drag.tk, drag.from, s.id)); else if (drag?.kind === "st") { const n = moveStage(stages, drag.id, s.id); if (n) setStages(n); } })}
                  className={cn("w-[250px] flex-none gap-3 bg-accent shadow-none", dz && (over === key ? "border-foreground bg-[#FFFBF2]" : "border-dashed border-sp-faint"), drag?.kind === "st" && drag.id === s.id && "opacity-50")}
                  style={{ boxShadow: `inset 0 3px 0 ${pal(gById[s.g]).bar}` }}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span {...dragProps({ kind: "st", id: s.id })} title="Tarik untuk mengubah urutan" aria-hidden className="cursor-grab text-sp-faint"><GripVertical className="size-3.5" /></span>
                      <span className="inline-flex size-5 items-center justify-center rounded bg-foreground font-mono text-[11px] font-semibold text-white">{i + 1}</span>
                      <span className="text-[11px] font-semibold tracking-[.06em] text-muted-foreground uppercase">Tahap</span>
                      <Button variant="ghost" size="icon-xs" aria-label={`Hapus tahap ${i + 1}`} className="ml-auto text-muted-foreground hover:text-(--sp-danger-text)" onClick={() => { setStages(stages.filter((x) => x.id !== s.id)); toast(`Tahap ${i + 1} dihapus${s.rows.length ? `. ${s.rows.length} emiten kembali ke daftar.` : ""}`); }}><Trash2 /></Button>
                    </div>
                    <Input aria-invalid={!s.name.trim()} className="h-10 text-sm font-medium" aria-label={`Nama tahap ${i + 1}`} value={s.name} onChange={(e) => updS(s.id, { name: e.target.value })} placeholder="Nama tahap" />
                    <div className="flex flex-col gap-1">
                      <Textarea aria-invalid={!s.desc.trim() || s.desc.length > 90} className="min-h-[72px] text-[13px]" aria-label={`Deskripsi singkat tahap ${i + 1}`} value={s.desc} onChange={(e) => updS(s.id, { desc: e.target.value })} placeholder="Deskripsi singkat, mis. Mengebor uap panas bumi dan menjual listriknya." />
                      <span className="flex justify-end"><Counter n={s.desc.length} max={90} /></span>
                    </div>
                    <NativeSelect size="sm" aria-label={`Posisi tahap ${i + 1}`} value={s.g} onChange={(e) => updS(s.id, { g: e.target.value })}>{groups.map((g, j) => <NativeSelectOption key={g.id} value={g.id}>{g.t.trim() || `Tahap utama ${j + 1}`}</NativeSelectOption>)}</NativeSelect>

                    <div className="flex min-h-[120px] flex-col gap-2">
                      {s.rows.map((r) => <EmitenCard key={r.tk} row={r} stage={s} stageIdx={i} stages={stages} dragging={drag?.kind === "em" && drag.tk === r.tk && drag.from === s.id}
                        dragProps={dragProps({ kind: "em", tk: r.tk, from: s.id })} onPortion={(p) => updRow(s.id, r.tk, p)}
                        onMove={(to) => apply(moveEmiten(stages, r.tk, s.id, to))} onRemove={() => apply(removeEmiten(stages, r.tk, s.id))} />)}
                      {!s.rows.length && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-input px-3 py-6 text-center text-[13px] text-muted-foreground"><MousePointer2 aria-hidden className="size-4" />{dzEm ? "Lepas di sini" : "Tarik emiten ke sini"}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{s.rows.length} emiten</span>{miss > 0 && <span className="font-semibold text-[#B45309]">{miss} tanpa porsi</span>}</div>
                  </CardContent>
                </Card>
              );
            })}
            <Button variant="outline" className="h-auto min-h-[200px] w-[150px] flex-none flex-col border-dashed" onClick={() => { setStages([...stages, { id: nid, name: "", g: groups[groups.length - 1]?.id ?? "", desc: "", rows: [] }]); setNid(nid + 1); }}><Plus aria-hidden />Tambah tahap</Button>
          </div>
        </div>
      </Section>

      <Card role="region" aria-label="Simpan tema" className="sticky bottom-4 z-10 flex-row flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)]">
        <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {checks.map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><i aria-hidden className={cn("inline-flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold not-italic", c ? "bg-[#DCFCE7] text-sp-success" : "bg-[#FEF3C7] text-[#92400E]")}>{c ? "✓" : "!"}</i>{l}</span>)}
        </div>
        <span className="text-[13px] text-muted-foreground">Porsi boleh diisi nanti</span>
        <Button variant="secondary" aria-disabled={!ok} onClick={save}>Simpan sebagai draf</Button>
      </Card>
    </div>
  );
}

function EmitenCard({ row, stage, stageIdx, stages, dragging, dragProps, onPortion, onMove, onRemove }: {
  row: Row; stage: Stage; stageIdx: number; stages: Stage[]; dragging: boolean; dragProps: object;
  onPortion: (p: string) => void; onMove: (to: number) => void; onRemove: () => void;
}) {
  return (
    <Card size="sm" {...dragProps} className={cn("cursor-grab gap-2 px-2 py-2 active:cursor-grabbing", dragging && "opacity-40")}>
      <div className="flex items-center gap-2">
        <GripVertical aria-hidden className="size-3.5 flex-none text-sp-faint" />
        <Avatar tk={row.tk} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight"><b className="font-mono text-[12.5px]">{row.tk}</b><em className="truncate text-xs text-muted-foreground not-italic">{POOL[row.tk]?.[0]}</em></span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Pindahkan ${row.tk}`} />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Pindah ke</DropdownMenuLabel>
              {stages.filter((x) => x.id !== stage.id).map((x) => <DropdownMenuItem key={x.id} onClick={() => onMove(x.id)}>Tahap {stages.findIndex((y) => y.id === x.id) + 1}{x.name ? ` · ${x.name}` : ""}</DropdownMenuItem>)}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>Keluarkan dari tahap</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Label className="justify-end text-xs font-normal text-muted-foreground">Porsi
        <AffixInput suffix="%" className="h-8 w-24" inputMode="decimal" aria-label={`Porsi ${row.tk} di tahap ${stageIdx + 1}`} placeholder="—" value={row.p} onChange={(e) => onPortion(e.target.value)} />
      </Label>
    </Card>
  );
}
