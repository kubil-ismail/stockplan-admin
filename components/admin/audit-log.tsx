"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Lock, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABEL, EVENTS, filterEvents, MODULES, PEOPLE, revertEvent, type Ev, type Filters, type Kind } from "@/lib/riwayat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemActions, ItemContent, ItemMedia } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyResult, FilterTabs, PageHeader, SearchInput, StatusBadge } from "./form-ui";

const TABS: [Filters["tab"], string][] = [["all", "Semua"], ["data", "Perubahan data"], ["pub", "Terbit"], ["sec", "Akses & keamanan"]];
const ME = "Rina"; // shortcut: signed-in admin placeholder; read from the admin session.

function EventRow({ x, open, onOpen, reverted, onRevert }: { x: Ev; open: boolean; onOpen: (o: boolean) => void; reverted: boolean; onRevert: () => void }) {
  const [name, color] = PEOPLE[x.who] ?? [x.who, "#1C1917"];
  const sys = x.who === "Sistem";
  return (
    <Collapsible open={open && x.diff.length > 0} onOpenChange={onOpen} render={<Item className="items-start rounded-none border-0 border-b border-sp-line-soft px-5 py-3.5 last:border-b-0" />}>
      <ItemMedia>
        <Avatar aria-hidden className="size-8"><AvatarFallback className={cn("text-[13px] font-semibold", sys ? "border border-border bg-muted text-sp-icon" : "text-primary")} style={sys ? undefined : { background: color }}>{sys ? "S" : name[0]}</AvatarFallback></Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <div className="text-[14.5px] leading-snug"><b className="font-semibold">{name}</b> {x.verb} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12.5px] font-semibold">{x.target}</code>{x.rest && ` ${x.rest}`}</div>
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
          <Badge variant={x.kind === "sec" ? "danger" : "neutral"} className="rounded">{x.mod}</Badge>
          <span>{x.meta}</span>
          {x.diff.length > 0 && <CollapsibleTrigger render={<Button variant="link" className="h-auto px-0 text-[12.5px]" />}>{open ? "Sembunyikan perubahan" : "Lihat perubahan"}</CollapsibleTrigger>}
        </div>
        <CollapsibleContent>
          <Card size="sm" className="mt-1.5 gap-0 py-0 shadow-none">
            <Table className="text-[13.5px]">
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="h-8 w-[170px] text-[11px]">Bagian</TableHead><TableHead className="h-8 text-[11px]">Sebelum</TableHead><TableHead className="h-8 text-[11px]">Sesudah</TableHead></TableRow></TableHeader>
              <TableBody>
                {x.diff.map(([k, a, b]) => (
                  <TableRow key={k} className="hover:bg-transparent">
                    <TableCell className="py-2">{k}</TableCell>
                    <TableCell className="bg-(--sp-danger-bg) py-2 text-[#991B1B] line-through">{a}</TableCell>
                    <TableCell className="bg-(--sp-success-bg) py-2 text-[#166534]">{b}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </CollapsibleContent>
      </ItemContent>
      <ItemActions className="flex-col items-end gap-2">
        <time className="font-mono text-xs text-muted-foreground">{x.time}</time>
        {x.revertable && !reverted && <Button variant="outline" size="sm" onClick={onRevert}><Undo2 aria-hidden />Kembalikan</Button>}
        {reverted && <StatusBadge tone="neutral">Dikembalikan</StatusBadge>}
      </ItemActions>
    </Collapsible>
  );
}

export function AuditLog() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("");
  const [who, setWho] = useState("");
  const [range, setRange] = useState<Filters["range"]>("7");
  const [tab, setTab] = useState<Filters["tab"]>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({ e1: true });
  const [reverted, setReverted] = useState<string[]>([]);
  const [added, setAdded] = useState<Ev[]>([]);

  const events = [...added, ...EVENTS];
  const base = filterEvents(events, { q, mod, who, range });
  const list = base.filter((x) => tab === "all" || x.kind === tab);
  const days = [...new Set(list.map((x) => x.day))].sort((a, b) => a - b);

  const revert = (x: Ev) => {
    setReverted([...reverted, x.id]);
    setAdded([revertEvent(x, ME, `r${added.length + 1}`), ...added]);
    toast("Dikembalikan ke nilai sebelumnya. Tercatat sebagai perubahan baru.");
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Riwayat perubahan" desc="Semua yang dilakukan admin dan sistem: perubahan data, terbit, akses, dan percobaan masuk. Tidak bisa diubah atau dihapus."
        actions={<Button variant="outline" onClick={() => toast(`CSV riwayat ${range === "1" ? "hari ini" : `${range} hari terakhir`} sedang disiapkan`)}><Download aria-hidden />Ekspor CSV</Button>} />

      <Card aria-label="Riwayat" className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput label="Cari riwayat" placeholder="Cari emiten, tema, email, atau isi perubahan" value={q} onChange={setQ} />
          <NativeSelect size="sm" aria-label="Modul" value={mod} onChange={(e) => setMod(e.target.value)} className="w-[180px]"><NativeSelectOption value="">Semua modul</NativeSelectOption>{MODULES.map((m) => <NativeSelectOption key={m}>{m}</NativeSelectOption>)}</NativeSelect>
          <NativeSelect size="sm" aria-label="Pelaku" value={who} onChange={(e) => setWho(e.target.value)} className="w-[180px]"><NativeSelectOption value="">Semua pelaku</NativeSelectOption>{Object.entries(PEOPLE).map(([k, [n]]) => <NativeSelectOption key={k} value={k}>{n}</NativeSelectOption>)}</NativeSelect>
          <NativeSelect size="sm" aria-label="Rentang waktu" value={range} onChange={(e) => setRange(e.target.value as Filters["range"])} className="w-[180px]"><NativeSelectOption value="7">7 hari terakhir</NativeSelectOption><NativeSelectOption value="1">Hari ini</NativeSelectOption><NativeSelectOption value="30">30 hari terakhir</NativeSelectOption></NativeSelect>
        </div>
        <div className="border-y border-sp-line-soft px-4 py-3">
          <FilterTabs label="Jenis" value={tab} onChange={setTab} tabs={TABS.map(([v, label]) => ({ v, label, n: base.filter((x) => v === "all" || x.kind === (v as Kind)).length }))} />
        </div>

        {days.length ? days.map((d) => (
          <section key={d} aria-label={DAY_LABEL[d]}>
            <h2 className="border-b border-sp-line-soft bg-accent px-5 py-2.5 text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase">{DAY_LABEL[d]}</h2>
            {list.filter((x) => x.day === d).map((x) => (
              <EventRow key={x.id} x={x} open={!!open[x.id]} onOpen={(o) => setOpen({ ...open, [x.id]: o })} reverted={reverted.includes(x.id)} onRevert={() => revert(x)} />
            ))}
          </section>
        )) : (
          <EmptyResult title="Tidak ada riwayat yang cocok" desc="Coba kata lain atau perluas rentang waktu." onReset={() => { setQ(""); setMod(""); setWho(""); setRange("30"); setTab("all"); }} />
        )}
        <CardFooter className="gap-2 text-[12.5px]"><Lock aria-hidden className="size-3.5 flex-none" />Riwayat disimpan 2 tahun. “Kembalikan” membuat perubahan baru yang tercatat di sini; riwayat aslinya tidak dihapus.</CardFooter>
      </Card>
    </div>
  );
}
