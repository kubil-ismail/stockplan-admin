"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, GripVertical, MoreHorizontal, MousePointer2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounced } from "@/hooks/use-debounced";
import { describeError, listCompanies, type ListResponse } from "@/lib/admin-companies";
import { createTheme, publishTheme, saveTheme, type ThemeView } from "@/lib/admin-themes";
import { checklist, fromForm, moveEmiten, moveStage, READY_MIN, removeEmiten, stagesOf, toForm, validateTema, type Draft, type Group, type Result, type Row, type Stage } from "@/lib/tema";
import { ICONS, PALETTE } from "@/lib/tema-data";
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
import { AffixInput, Counter, EntityAvatar, FormField, Help, SearchInput, Section, StatusBadge } from "./form-ui";

type Drag = { kind: "em"; tk: string; from: number | null } | { kind: "st"; id: number } | null;
const AVATAR = ["#15803D", "#1D4ED8", "#0F766E", "#92400E", "#6D28D9", "#1C1917", "#BE185D", "#B45309"];
const pal = (g?: Group) => { const p = PALETTE[g?.c ?? "stone"]; return { bg: p[1], bar: p[2], soft: p[3], ink: p[4] }; };
const colorOf = (t: string) => AVATAR[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]; // stable per ticker
type Info = Record<string, { name: string; logo?: string }>;
// Same defaults as the API's DEFAULT_GROUPS (lib/themes.js); descriptions are required before publishing.
const NEW_DRAFT: Draft = {
  name: "", sectorSlug: "", description: "", drivers: [""], stages: [],
  groups: [
    { id: "hulu", t: "Hulu", d: "", ic: "mine", c: "amber" },
    { id: "tengah", t: "Tengah", d: "", ic: "truck", c: "blue" },
    { id: "hilir", t: "Hilir", d: "", ic: "bolt", c: "green" },
  ],
};
const ICON_D = Object.fromEntries(ICONS.map((i) => [i[0], i[2]]));
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const Avatar = ({ tk, logo }: { tk: string; logo?: string }) => <EntityAvatar code={tk} logo={logo} size={32} color={colorOf(tk)} />;

type Pool = { key: string; data?: ListResponse; error?: string };

/** No `view` = new theme (POST on first save, then the edit page); with `view` = edit (PATCH, publish). */
export function TemaBuilder({ view: loaded, sectors }: { view?: ThemeView; sectors: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [d0] = useState<Draft>(() => (loaded ? fromForm(loaded.form) : NEW_DRAFT));
  const [view, setView] = useState(loaded);
  const [gOpen, setGOpen] = useState<Record<string, boolean>>({});
  const [nid, setNid] = useState(d0.stages.length + 1);
  const [info, setInfo] = useState<Info>(() => Object.fromEntries((loaded?.companies ?? []).map((c) => [c.ticker, { name: c.name, logo: c.logoUrl ?? undefined }])));
  const [pq, setPq] = useState("");
  const [psec, setPsec] = useState("");
  const [pool, setPool] = useState<Pool | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [over, setOver] = useState<string | null>(null);
  const slug = view?.theme.slug;
  const intent = useRef<"draft" | "publish">("draft");

  // Form state lives in Formik; validation runs on submit only and a field's error clears on its next edit (like the login form).
  const form = useFormik<Draft>({
    initialValues: { ...d0, drivers: d0.drivers.length ? d0.drivers : [""] },
    validateOnChange: false,
    validateOnBlur: false,
    validate: validateTema,
    onSubmit: async (v, { setFieldError }) => {
      const publishing = intent.current === "publish";
      intent.current = "draft";
      const body = toForm(v);
      const r = slug ? await saveTheme(slug, body) : await createTheme(body);
      if (!r.ok) {
        if (r.error.fields?.name) setFieldError("name", r.error.fields.name);
        return void toast(describeError(r.error));
      }
      setView(r.data);
      if (!publishing) toast(`Draf tema ${r.data.form.name} tersimpan`);
      else { // publish uses the saved draft
        const p = await publishTheme(r.data.theme.slug);
        if (p.ok) { setView(p.data); toast(`Tema ${p.data.form.name} diterbitkan`); } else toast(describeError(p.error)); // COPY: perlu review
      }
      if (!slug) router.replace(`/admin/tema/${r.data.theme.slug}`);
    },
  });
  const { groups, stages, drivers } = form.values;
  const errs = form.errors as Record<string, string | undefined>;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { if (errs[k]) form.setFieldError(k, undefined); void form.setFieldValue(k, v, false); };
  const setGroups = (v: Group[]) => set("groups", v);
  const setStages = (v: Stage[]) => set("stages", v);
  const setDrivers = (v: string[]) => set("drivers", v);
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { if (errs[e.target.name]) form.setFieldError(e.target.name, undefined); form.handleChange(e); };

  // Emiten pool = Data emiten search, keyed by its filters so "loading" is derived.
  const dpq = useDebounced(pq.trim(), 300);
  const pkey = `${dpq}|${psec}`;
  useEffect(() => {
    let live = true;
    void listCompanies({ q: dpq, sector: psec, pageSize: 30 }).then((r) => { if (live) setPool({ key: pkey, data: r.ok ? r.data : undefined, error: r.ok ? undefined : r.error.message }); });
    return () => { live = false; };
  }, [pkey, dpq, psec]);
  const poolItems = pool?.data?.items ?? [];

  const gById = Object.fromEntries(groups.map((g) => [g.id, g]));
  const endDrag = () => { setDrag(null); setOver(null); };
  const learn = (tk: string) => { const c = poolItems.find((x) => x.ticker === tk); if (c) setInfo((i) => ({ ...i, [tk]: { name: c.name, logo: c.logoUrl ?? undefined } })); };
  const apply = (r: Result) => { if ("error" in r) { if (r.error) toast(r.error); return; } setStages(r.stages); toast(r.msg); };

  const nG = groups.length;
  const updG = (id: string, o: Partial<Group>) => setGroups(groups.map((g) => (g.id === id ? { ...g, ...o } : g)));
  const moveG = (i: number, d: number) => { const a = groups.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setGroups(a); };
  const updS = (id: number, o: Partial<Stage>) => setStages(stages.map((s) => (s.id === id ? { ...s, ...o } : s)));
  const updRow = (sid: number, tk: string, o: Partial<Row>) => setStages(stages.map((s) => (s.id === sid ? { ...s, rows: s.rows.map((r) => (r.tk === tk ? { ...r, ...o } : r)) } : s)));
  const newKey = () => { let i = groups.length + 1; while (groups.some((g) => g.id === `g${i}`)) i += 1; return `g${i}`; };

  const checks = [...checklist(form.values), ...(view ? [[`Kesiapan emiten ≥ ${READY_MIN}%`, view.readiness.percent >= READY_MIN] as [string, boolean]] : [])];
  const used = new Set(stages.flatMap((s) => s.rows.map((r) => r.tk)));
  const poolLoading = !pool || pool.key !== pkey;
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

  return (
    <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-3 text-[26px] leading-tight font-bold tracking-tight">{slug ? "Edit tema" : "Tambah tema"}{view && <StatusBadge tone={view.theme.published ? "success" : "neutral"}>{view.theme.statusLabel}</StatusBadge>}</h1>
          <p className="text-muted-foreground">Isi identitasnya, lalu susun rantai nilai dengan menarik emiten ke tiap tahap.</p>
        </div>
        <Link href="/admin/tema" className={buttonVariants({ variant: "outline" })}>{slug ? "Kembali" : "Batal"}</Link>
      </div>

      <Section id="t-id" title="1 · Identitas tema" desc="Tampil di kartu tema dan di atas peta rantai nilai.">
        <div className="grid gap-3.5 sm:grid-cols-[1fr_260px]">
          <FormField label="Nama tema" htmlFor="n-n">
            <Input id="n-n" name="name" aria-invalid={!!errs.name} value={form.values.name} onChange={change} placeholder="mis. Energi terbarukan" />
            {errs.name && <Help className="text-(--sp-danger-text)">{errs.name}</Help>}
          </FormField>
          <FormField label="Sektor IDX-IC" htmlFor="n-s"><NativeSelect id="n-s" name="sectorSlug" aria-invalid={!!errs.sectorSlug} value={form.values.sectorSlug} onChange={change}><NativeSelectOption value="">Pilih sektor…</NativeSelectOption>{sectors.map((s) => <NativeSelectOption key={s.slug} value={s.slug}>{s.name}</NativeSelectOption>)}</NativeSelect>{errs.sectorSlug && <Help className="text-(--sp-danger-text)">{errs.sectorSlug}</Help>}</FormField>
        </div>
        <FormField label="Deskripsi singkat" htmlFor="n-d">
          <Textarea id="n-d" name="description" aria-invalid={form.values.description.length > 160} className="min-h-16" value={form.values.description} onChange={change} placeholder="Satu kalimat: bisnis apa saja yang masuk tema ini." />
          <div className="flex justify-between gap-3"><Help>Bisa diubah lagi setelah draf dibuat.</Help><Counter n={form.values.description.length} max={160} /></div>
        </FormField>
        {/* COPY: perlu review (label, petunjuk, tombol): "Pendorong utama" ada di API tapi belum di desain. */}
        <FormField label="Pendorong utama">
          <Help>Faktor yang menggerakkan tema ini. Minimal satu sebelum diterbitkan.</Help>
          {drivers.map((x, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input aria-label={`Pendorong ${i + 1}`} aria-invalid={x.length > 100} value={x} onChange={(e) => setDrivers(drivers.map((v, j) => (j === i ? e.target.value : v)))} placeholder="mis. Harga batu bara acuan" />
              <Counter n={x.length} max={100} />
              <Button variant="ghost" size="icon-sm" aria-label={`Hapus pendorong ${i + 1}`} onClick={() => setDrivers(drivers.length > 1 ? drivers.filter((_, j) => j !== i) : [""])}><Trash2 /></Button>
            </div>
          ))}
          {drivers.length < 10 && <Button variant="outline" size="sm" className="self-start" onClick={() => setDrivers([...drivers, ""])}><Plus aria-hidden />Tambah pendorong</Button>}
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
        <Button variant="outline" className="h-11 w-full border-dashed" onClick={() => { const id = newKey(); setGroups([...groups, { id, t: "", d: "", ic: "factory", c: "violet" }]); setGOpen({ ...gOpen, [id]: true }); }}><Plus aria-hidden />Tambah tahap utama</Button>
      </Section>

      <Section id="t-rn" title="3 · Susun rantai nilai" desc="Tiap tahap butuh nama, deskripsi singkat, dan tahap utamanya. Satu emiten boleh ada di lebih dari satu tahap.">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MousePointer2 aria-hidden className="size-3.5" />Tarik dari daftar kiri ke tahap untuk menambah</span>
          <span>Tarik antar tahap untuk memindahkan</span>
          <span>Tarik ke daftar kiri untuk mengeluarkan</span>
          <span className="inline-flex items-center gap-1.5"><GripVertical aria-hidden className="size-3.5" />Tarik pegangan tahap untuk mengubah urutan</span>
          <span>Tanpa mouse: tombol <Kbd>⋯</Kbd> di kartu</span>
        </div>

        {errs.stages && <Help className="text-(--sp-danger-text)">{errs.stages}</Help>}
        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          <Card size="sm" aria-label="Daftar emiten" {...dropProps("pool", poolDz, () => { if (drag?.kind === "em" && drag.from !== null) apply(removeEmiten(stages, drag.tk, drag.from)); })}
            className={cn("sticky left-0 w-[260px] flex-none gap-2.5 bg-accent shadow-none", poolDz && (over === "pool" ? "border-foreground bg-[#FFFBF2]" : "border-dashed border-sp-faint"))}>
            <CardHeader className="gap-2.5">
              <b className="text-sm font-semibold">Emiten</b>
              <SearchInput label="Cari emiten" placeholder="Cari kode atau nama" value={pq} onChange={setPq} className="min-w-0" />
              <NativeSelect size="sm" aria-label="Filter sektor emiten" value={psec} onChange={(e) => setPsec(e.target.value)}><NativeSelectOption value="">Semua sektor</NativeSelectOption>{sectors.map((x) => <NativeSelectOption key={x.slug} value={x.slug}>{x.name}</NativeSelectOption>)}</NativeSelect>
            </CardHeader>
            <CardContent aria-busy={poolLoading} className={cn("flex max-h-[min(560px,65vh)] flex-col gap-1.5 overflow-y-auto overscroll-contain", poolLoading && pool && "opacity-50")}>
              {poolItems.map((c) => {
                const k = c.ticker, at = stagesOf(stages, k);
                return (
                  <Card key={k} size="sm" {...dragProps({ kind: "em", tk: k, from: null })} title={at.length ? `${k} sudah di tahap ${at.join(", ")}. Tarik lagi untuk menambah ke tahap lain.` : `Tarik ${k} ke salah satu tahap`}
                    className={cn("shrink-0 cursor-grab flex-row items-center gap-2 px-1.5 py-1.5 active:cursor-grabbing", drag?.kind === "em" && drag.tk === k && drag.from === null && "opacity-40")}>
                    <GripVertical aria-hidden className="size-3.5 flex-none text-sp-faint" />
                    <Avatar tk={k} logo={c.logoUrl ?? undefined} />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight"><b className="font-mono text-[12.5px]">{k}</b><em className="truncate text-xs text-muted-foreground not-italic">{c.name}</em></span>
                    <span className={cn("max-w-16 truncate text-[11px] whitespace-nowrap", at.length ? "font-semibold text-sp-ink-2" : "text-sp-faint")}>{at.length ? `Tahap ${at.join(", ")}` : "Belum"}</span>
                  </Card>
                );
              })}
              {/* COPY: perlu review */}
              {!poolLoading && pool?.data && pool.data.total > poolItems.length && <Help className="shrink-0 px-1 text-center">Menampilkan {poolItems.length} dari {pool.data.total.toLocaleString("id-ID")}. Cari kode atau pilih sektor untuk mempersempit.</Help>}
              {pool?.error && <Help className="text-(--sp-danger-text)">{pool.error}</Help>}
              {!poolLoading && !pool?.error && !poolItems.length && <Help>Tidak ada emiten yang cocok.</Help>}
              {poolLoading && !pool?.error && <Help>Memuat emiten…</Help>}
            </CardContent>
            <CardFooter className="bg-transparent px-3 py-2 text-xs">{poolDz ? "Lepas di sini untuk mengeluarkan dari tahap" : `${used.size} emiten dipakai${pool?.data ? ` · ${pool.data.total.toLocaleString("id-ID")} di daftar` : ""}`}</CardFooter>
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
                  {...dropProps(key, !!dz, () => { if (drag?.kind === "em") { if (drag.from === null) learn(drag.tk); apply(moveEmiten(stages, drag.tk, drag.from, s.id)); } else if (drag?.kind === "st") { const n = moveStage(stages, drag.id, s.id); if (n) setStages(n); } })}
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
                        dragProps={dragProps({ kind: "em", tk: r.tk, from: s.id })} info={info[r.tk]} onRow={(o) => updRow(s.id, r.tk, o)}
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
        <Button type="submit" variant="outline" disabled={form.isSubmitting}>Simpan sebagai draf</Button>
        {slug && <Button variant="secondary" disabled={form.isSubmitting} onClick={() => { intent.current = "publish"; void form.submitForm(); }}>Terbitkan</Button>}
      </Card>
    </form>
  );
}

function EmitenCard({ row, stage, stageIdx, stages, dragging, dragProps, info, onRow, onMove, onRemove }: {
  row: Row; stage: Stage; stageIdx: number; stages: Stage[]; dragging: boolean; dragProps: object; info?: Info[string];
  onRow: (o: Partial<Row>) => void; onMove: (to: number) => void; onRemove: () => void;
}) {
  return (
    <Card size="sm" {...dragProps} className={cn("cursor-grab gap-2 px-2 py-2 active:cursor-grabbing", dragging && "opacity-40")}>
      <div className="flex items-center gap-2">
        <GripVertical aria-hidden className="size-3.5 flex-none text-sp-faint" />
        <Avatar tk={row.tk} logo={info?.logo} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight"><b className="font-mono text-[12.5px]">{row.tk}</b><em className="truncate text-xs text-muted-foreground not-italic">{info?.name}</em></span>
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
        <AffixInput suffix="%" className="h-8 w-24" inputMode="decimal" aria-label={`Porsi ${row.tk} di tahap ${stageIdx + 1}`} placeholder="—" value={row.p} onChange={(e) => onRow({ p: e.target.value })} />
      </Label>
      {/* COPY: perlu review: placeholder sumber porsi (API mewajibkan sumber sebelum terbit). */}
      <Input className="h-8 text-xs" aria-label={`Sumber porsi ${row.tk} di tahap ${stageIdx + 1}`} placeholder="Sumber, mis. laporan tahunan 2025" maxLength={200} value={row.src ?? ""} onChange={(e) => onRow({ src: e.target.value })} />
    </Card>
  );
}
