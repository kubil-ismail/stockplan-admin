"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CircleHelp, Clock, ExternalLink, Image as ImageIcon, Lock, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyAssign, applyStatus, initials, inTab, isLate, isOpen, KIND, ME, MIN_REPLY, STAFF, STATUS, templates, TICKETS, USERS,
  type Kind, type Msg, type Tab, type TStatus,
} from "@/lib/masukan";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Item, ItemContent, ItemDescription, ItemFooter, ItemHeader, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyResult, FilterTabs, FormField, Help, PageHeader, Pager, SearchInput, StatCard, StatusBadge } from "./form-ui";

const TABS: [Tab, string][] = [["open", "Terbuka"], ["new", "Baru"], ["wait", "Menunggu pengguna"], ["done", "Selesai"], ["all", "Semua"]];
const TkBadge = ({ children }: { children: React.ReactNode }) => <Badge variant="outline" className="h-[18px] rounded border-sp-info-bg bg-sp-info-bg px-1.5 font-mono text-[11px] font-bold text-sp-info">{children}</Badge>;
const KindBadge = ({ k }: { k: Kind }) => <Badge variant={KIND[k][1]} className="rounded-md">{KIND[k][0]}</Badge>;

type Override = { s?: TStatus; a?: string };

export function Inbox() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [tab, setTab] = useState<Tab>("open");
  const [mine, setMine] = useState(false);
  const [sel, setSel] = useState("SP-2611-0471");
  const [over, setOver] = useState<Record<string, Override>>({});
  const [extra, setExtra] = useState<Record<string, Msg[]>>({});
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [txt, setTxt] = useState("");

  const all = TICKETS.map((t) => ({ ...t, ...over[t.id] }));
  const needle = q.trim().toLowerCase();
  const base = all.filter((t) =>
    (!needle || `${t.id} ${t.from} ${USERS[t.from]?.[0] ?? ""} ${t.subj} ${t.body} ${t.tk}`.toLowerCase().includes(needle)) && (!kind || t.k === kind) && (!mine || t.a === ME));
  const list = base.filter((t) => inTab(t.s, tab));
  const t = all.find((x) => x.id === sel);
  const ok = txt.trim().length >= MIN_REPLY;
  const nOpen = all.filter((x) => isOpen(x.s)).length, nLate = all.filter(isLate).length;

  const patch = (o: Override) => t && setOver({ ...over, [t.id]: { ...over[t.id], ...o } });
  const pick = (id: string) => { setSel(id); setTxt(""); setMode("reply"); };
  const post = (kindM: "reply" | "note", o?: Override) => {
    if (!t) return false;
    if (!ok) { toast(`Tulis minimal ${MIN_REPLY} karakter`); return false; }
    setExtra({ ...extra, [t.id]: [...(extra[t.id] ?? []), { who: ME, t: "Baru saja", body: txt.trim(), kind: kindM }] });
    if (o) patch({ ...applyStatus(t, o.s!), s: o.s });
    setTxt("");
    return true;
  };

  const thread: Msg[] = t ? [
    { who: t.from, t: t.sent, body: t.body, kind: "user", att: t.att },
    ...(t.replies ?? []).map(([who, tm, body]) => ({ who, t: tm, body, kind: "reply" as const })),
    ...(t.notes ?? []).map(([who, tm, body]) => ({ who, t: tm, body, kind: "note" as const })),
    ...(extra[t.id] ?? []),
  ] : [];
  const user = t ? USERS[t.from] ?? ["", "#1C1917"] : ["", ""];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Masukan & laporan" desc="Semua kiriman dari form Bantuan di aplikasi. Pengguna dijanjikan balasan lewat email dalam 1–2 hari kerja." />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Terbuka" value={nOpen + 11} note={<><em className="font-semibold text-[#B45309] not-italic">{nLate + 3}</em> lewat batas 2 hari kerja</>} />
        <StatCard label="Data salah terbuka" value="12" note="paling banyak: AADI, BUMI" />
        <StatCard label="Balasan pertama" value="9 jam" note="rata-rata 30 hari terakhir" />
        <StatCard label="Selesai minggu ini" value="41" note={<><em className="font-semibold text-sp-success not-italic">+6</em> dari minggu lalu</>} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card aria-label="Daftar masukan" className="min-w-0 gap-0 py-0">
          <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
            <SearchInput label="Cari masukan" placeholder="Cari tiket, email, atau isi" value={q} onChange={setQ} className="min-w-52" />
            <NativeSelect size="sm" aria-label="Jenis" value={kind} onChange={(e) => setKind(e.target.value)} className="w-[170px]">
              <NativeSelectOption value="">Semua jenis</NativeSelectOption>{(Object.keys(KIND) as Kind[]).map((k) => <NativeSelectOption key={k} value={k}>{KIND[k][0]}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 px-4 pb-3">
            <FilterTabs label="Status" value={tab} onChange={setTab} tabs={TABS.map(([v, label]) => ({ v, label, n: base.filter((x) => inTab(x.s, v)).length }))} />
            <Field orientation="horizontal" className="ml-auto w-auto">
              <Checkbox id="mine" checked={mine} onCheckedChange={(v) => setMine(v === true)} />
              <FieldLabel htmlFor="mine" className="text-[13px] font-normal text-sp-ink-2">Milik saya</FieldLabel>
            </Field>
          </div>

          {list.length ? (
            <>
              <div role="list" className="border-t border-sp-line-soft">
                {list.map((r) => (
                  <Item key={r.id} role="listitem" onClick={() => pick(r.id)} className={cn("cursor-pointer gap-1.5 rounded-none border-0 border-b border-sp-line-soft px-4 py-3.5", sel === r.id ? "bg-[#FFFBF2] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-[#FCFCFB]")}>
                    <ItemHeader className="justify-start">
                      <code className="font-mono text-xs text-muted-foreground">{r.id}</code><KindBadge k={r.k} /><StatusBadge tone={STATUS[r.s][1]}>{STATUS[r.s][0]}</StatusBadge>
                      <time className="ml-auto text-xs text-muted-foreground">{r.age}</time>
                    </ItemHeader>
                    <ItemContent className="min-w-0 gap-0.5">
                      <ItemTitle className="text-[14.5px]">
                        <Button variant="ghost" aria-pressed={sel === r.id} onClick={(e) => { e.stopPropagation(); pick(r.id); }} className="h-auto justify-start gap-2 p-0 text-left text-[14.5px] whitespace-normal hover:bg-transparent">
                          {r.s === "new" && <i aria-hidden className="size-2 flex-none rounded-full bg-primary" />}{r.subj}
                        </Button>
                      </ItemTitle>
                      <ItemDescription className="line-clamp-1 text-[13.5px]">{r.body}</ItemDescription>
                    </ItemContent>
                    <ItemFooter className="justify-start text-[13px] text-muted-foreground">
                      <span>{r.from}</span>{r.tk && <TkBadge>{r.tk}</TkBadge>}
                      {isLate(r) && <span className="inline-flex items-center gap-1 font-semibold text-(--sp-danger-text)"><Clock aria-hidden className="size-3" />Lewat {r.late} hari</span>}
                      {r.votes && <span className="inline-flex items-center gap-1 text-sp-info"><ThumbsUp aria-hidden className="size-3" />+{r.votes}</span>}
                      <Avatar className="ml-auto size-[22px]" title={r.a ? `Ditangani ${r.a}` : "Belum ada yang menangani"}>
                        <AvatarFallback className={cn("text-[11px] font-semibold", r.a ? "bg-foreground text-primary" : "border border-dashed border-input bg-background text-sp-faint")}>{r.a ? r.a[0] : <CircleHelp className="size-3" />}</AvatarFallback>
                      </Avatar>
                    </ItemFooter>
                  </Item>
                ))}
              </div>
              <Pager text={`${list.length} dari ${tab === "open" && !needle && !kind && !mine ? "18 terbuka" : `${list.length} masukan`}`} onNext={() => toast("Halaman berikutnya belum tersedia (data contoh)")} />
            </>
          ) : (
            <EmptyResult title="Tidak ada masukan di sini" desc="Coba status lain, atau hapus pencarian dan filter jenis." onReset={() => { setQ(""); setKind(""); setMine(false); setTab("all"); }} />
          )}
        </Card>

        <Card aria-label="Detail masukan" className="min-w-0 gap-0 py-0">
          {t ? (
            <>
              <CardHeader className="gap-3 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-xs text-muted-foreground">{t.id}</code><KindBadge k={t.k} /><StatusBadge tone={STATUS[t.s][1]}>{STATUS[t.s][0]}</StatusBadge>
                  {isLate(t) && <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-(--sp-danger-text)"><Clock aria-hidden className="size-3.5" />Lewat {t.late} hari dari janji balasan</span>}
                </div>
                <CardTitle className="text-lg leading-snug"><h2>{t.subj}</h2></CardTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Status" htmlFor="d-st">
                    <NativeSelect id="d-st" value={t.s} onChange={(e) => { const v = e.target.value as TStatus; patch(applyStatus(t, v)); toast(`Status ${t.id}: ${STATUS[v][0]}`); }}>
                      {(Object.keys(STATUS) as TStatus[]).map((s) => <NativeSelectOption key={s} value={s}>{s === "prog" ? "Sedang ditangani" : STATUS[s][0]}</NativeSelectOption>)}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Ditangani oleh" htmlFor="d-as">
                    <NativeSelect id="d-as" value={t.a} onChange={(e) => { patch(applyAssign(t, e.target.value)); toast(e.target.value ? `${t.id} ditangani ${e.target.value}` : `${t.id} dilepas`); }}>
                      <NativeSelectOption value="">Belum ada</NativeSelectOption><NativeSelectOption value="Rina">Rina Putri (saya)</NativeSelectOption><NativeSelectOption value="Dimas">Dimas Arya</NativeSelectOption>
                    </NativeSelect>
                  </FormField>
                </div>
              </CardHeader>
              <Separator />
              <dl className="grid grid-cols-[90px_1fr] items-center gap-x-3 gap-y-2.5 px-5 py-4 text-sm">
                <dt className="text-muted-foreground">Pengirim</dt><dd className="font-medium"><Link href="/admin/pengguna" className="underline underline-offset-2">{t.from}</Link> <span className="font-normal text-muted-foreground">{user[0]}</span></dd>
                <dt className="text-muted-foreground">Halaman</dt><dd className="font-medium">{t.page}</dd>
                {t.tk && <><dt className="text-muted-foreground">Emiten</dt><dd className="flex items-center gap-2 font-medium"><TkBadge>{t.tk}</TkBadge><Link href={`/admin/emiten/${t.tk}`} className={buttonVariants({ variant: "outline", size: "xs" })}><ExternalLink aria-hidden />Buka data {t.tk}</Link></dd></>}
                <dt className="text-muted-foreground">Perangkat</dt><dd className="font-medium">{t.dev}</dd>
                <dt className="text-muted-foreground">Dikirim</dt><dd className="font-medium">{t.sent}</dd>
              </dl>

              <div aria-label="Percakapan" className="flex flex-col gap-3 border-t border-sp-line-soft bg-accent p-5">
                {thread.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <Avatar aria-hidden className="size-8"><AvatarFallback className="text-xs font-semibold" style={{ background: m.kind === "user" ? user[1] : STAFF[m.who] ?? "#1C1917", color: m.kind === "user" ? "#fff" : "var(--primary)" }}>{initials(m.who)}</AvatarFallback></Avatar>
                    <Card size="sm" className={cn("min-w-0 flex-1 gap-2 px-3.5 text-sm leading-relaxed shadow-none", m.kind === "note" ? "border-[#FDE68A] bg-[#FFFBEB]" : m.kind === "reply" ? "bg-muted" : "")}>
                      <div className="flex flex-wrap items-center gap-2"><b className="font-semibold">{m.kind === "user" ? m.who : `${m.who} · tim StockPlan`}</b>
                        {m.kind === "note" && <Badge variant="warning" className="h-[18px] rounded px-1.5 text-[11px]"><Lock aria-hidden />Catatan internal</Badge>}
                        <time className="ml-auto text-xs text-muted-foreground">{m.t}</time></div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      {m.att && <Badge variant="outline" className="h-auto w-fit gap-2 rounded-lg bg-accent px-2 py-1.5 text-[13px] font-normal"><ImageIcon aria-hidden className="size-4 text-muted-foreground" />{m.att}</Badge>}
                    </Card>
                  </div>
                ))}
              </div>

              {isOpen(t.s) ? (
                <CardContent className="flex flex-col gap-3 border-t border-sp-line-soft py-5">
                  <Tabs value={mode} onValueChange={(v) => setMode(v as "reply" | "note")}>
                    <TabsList aria-label="Jenis tulisan">
                      <TabsTrigger value="reply">Balas ke pengguna</TabsTrigger>
                      <TabsTrigger value="note"><Lock aria-hidden className="size-3" />Catatan internal</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {mode === "reply" && (
                    <div aria-label="Templat balasan" className="flex flex-wrap gap-1.5">
                      {templates(t).map(([l, body]) => <Button key={l} variant="outline" size="xs" className="rounded-full px-3 font-medium" onClick={() => setTxt(body)}>{l}</Button>)}
                    </div>
                  )}
                  <Label htmlFor="cmp" className="sr-only">{mode === "note" ? "Catatan internal" : "Balasan"}</Label>
                  <Textarea id="cmp" className={cn("min-h-[110px]", mode === "note" && "border-[#FDE68A] bg-[#FFFBEB]")} value={txt} onChange={(e) => setTxt(e.target.value)}
                    placeholder={mode === "note" ? "Hanya terlihat oleh tim admin" : `Balasan dikirim ke ${user[0] || "pengguna"} dari bantuan@stockplan.id`} />
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <Help className="w-auto">{mode === "note" ? "Tidak dikirim ke pengguna" : "Dikirim lewat email · tanda tangan tim otomatis"}</Help>
                    <div className="flex gap-2">
                      {mode === "reply" ? (
                        <>
                          <Button variant="outline" size="sm" aria-disabled={!ok} onClick={() => { if (post("reply", { s: "wait" })) toast(`Balasan terkirim ke ${user[0]}. Status: menunggu pengguna.`); }}>Kirim</Button>
                          <Button variant="secondary" size="sm" aria-disabled={!ok} onClick={() => { if (post("reply", { s: "done" })) toast(`Balasan terkirim dan ${t.id} diselesaikan`); }}>Kirim &amp; selesaikan</Button>
                        </>
                      ) : (
                        <Button variant="secondary" size="sm" aria-disabled={!ok} onClick={() => { if (post("note")) toast("Catatan internal disimpan"); }}>Simpan catatan</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardFooter className="flex-wrap justify-between gap-3 bg-background py-5">
                  <Help className="w-auto">{t.s === "spam" ? "Ditandai spam. Pengirim tidak diberi balasan." : "Tiket selesai. Pengguna bisa membalas email untuk membukanya lagi."}</Help>
                  <Button variant="outline" size="sm" onClick={() => { patch({ s: "prog" }); toast(`${t.id} dibuka lagi`); }}>Buka lagi</Button>
                </CardFooter>
              )}
            </>
          ) : (
            <Empty className="py-16"><EmptyHeader><EmptyTitle>Pilih masukan</EmptyTitle><EmptyDescription>Klik salah satu di daftar untuk membaca dan membalasnya.</EmptyDescription></EmptyHeader></Empty>
          )}
        </Card>
      </div>
    </div>
  );
}
