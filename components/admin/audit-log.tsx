"use client";

import { useState } from "react";
import { Download, Lock, Undo2, Search } from "lucide-react";
import { DAY_LABEL, EVENTS, filterEvents, MODULES, PEOPLE, revertEvent, type Ev, type Filters, type Kind } from "@/lib/riwayat";
import { btn, cls, inp, useToast } from "./form-ui";

const TABS: [Filters["tab"], string][] = [["all", "Semua"], ["data", "Perubahan data"], ["pub", "Terbit"], ["sec", "Akses & keamanan"]];
const ME = "Rina"; // shortcut: signed-in admin placeholder; read from the admin session.

export function AuditLog() {
  const { flash, toast } = useToast();
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
    flash("Dikembalikan ke nilai sebelumnya. Tercatat sebagai perubahan baru.");
  };
  const reset = () => { setQ(""); setMod(""); setWho(""); setRange("30"); setTab("all"); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Riwayat perubahan</h1>
          <p className="text-[#716A65]">Semua yang dilakukan admin dan sistem: perubahan data, terbit, akses, dan percobaan masuk. Tidak bisa diubah atau dihapus.</p>
        </div>
        <button type="button" className={cls(btn.base, btn.outline)} onClick={() => flash(`CSV riwayat ${range === "1" ? "hari ini" : `${range} hari terakhir`} sedang disiapkan`)}><Download aria-hidden size={16} strokeWidth={1.8} />Ekspor CSV</button>
      </div>

      <section aria-label="Riwayat" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-60 flex-1">
            <Search aria-hidden size={16} className="absolute left-3 top-3.5 text-[#716A65]" />
            <input type="search" placeholder="Cari emiten, tema, email, atau isi perubahan" aria-label="Cari riwayat" value={q} onChange={(e) => setQ(e.target.value)} className={cls(inp(), "!h-[42px] pl-9 text-sm")} />
          </div>
          <select aria-label="Modul" value={mod} onChange={(e) => setMod(e.target.value)} className={cls(inp(), "!h-[42px] w-[180px] text-sm")}><option value="">Semua modul</option>{MODULES.map((m) => <option key={m}>{m}</option>)}</select>
          <select aria-label="Pelaku" value={who} onChange={(e) => setWho(e.target.value)} className={cls(inp(), "!h-[42px] w-[180px] text-sm")}><option value="">Semua pelaku</option>{Object.entries(PEOPLE).map(([k, [n]]) => <option key={k} value={k}>{k === "Sistem" ? "Sistem" : n}</option>)}</select>
          <select aria-label="Rentang waktu" value={range} onChange={(e) => setRange(e.target.value as Filters["range"])} className={cls(inp(), "!h-[42px] w-[180px] text-sm")}><option value="7">7 hari terakhir</option><option value="1">Hari ini</option><option value="30">30 hari terakhir</option></select>
        </div>
        <div className="border-b border-t border-[#F0EEEC] px-4 py-3">
          <div role="tablist" aria-label="Jenis" className="flex w-fit flex-wrap gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
            {TABS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cls("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13.5px]", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>
                {l}<small className="font-mono text-[11.5px] text-[#716A65]">{base.filter((x) => k === "all" || x.kind === (k as Kind)).length}</small>
              </button>
            ))}
          </div>
        </div>

        {days.length ? days.map((d) => (
          <div key={d}>
            <div className="border-b border-[#F0EEEC] bg-[#FAFAF9] px-5 py-2.5 text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]">{DAY_LABEL[d]}</div>
            {list.filter((x) => x.day === d).map((x) => {
              const [name, color] = PEOPLE[x.who] ?? [x.who, "#1C1917"];
              const sys = x.who === "Sistem", isOpen = !!open[x.id] && x.diff.length > 0, rv = reverted.includes(x.id);
              return (
                <div key={x.id} className="grid grid-cols-[32px_1fr_auto] gap-x-3.5 border-b border-[#F0EEEC] px-5 py-3.5 last:border-b-0">
                  <span aria-hidden className={cls("inline-flex size-8 items-center justify-center rounded-full text-[13px] font-semibold", sys ? "border border-[#E7E5E4] bg-[#F5F5F4] text-[#57534E]" : "text-[#FEA722]")} style={sys ? undefined : { background: color }}>{sys ? "S" : name[0]}</span>
                  <div className="min-w-0">
                    <div className="text-[14.5px] leading-snug"><b className="font-semibold">{name}</b> {x.verb} <code className="rounded bg-[#F5F5F4] px-1.5 py-0.5 font-mono text-[12.5px] font-semibold">{x.target}</code>{x.rest && ` ${x.rest}`}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-[#716A65]">
                      <span className={cls("rounded px-1.5 font-semibold leading-5", x.kind === "sec" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#F5F5F4] text-[#44403C]")}>{x.mod}</span>
                      <span>{x.meta}</span>
                      {x.diff.length > 0 && <button type="button" aria-expanded={isOpen} className="text-[12.5px] font-semibold text-[#1C1917] underline underline-offset-2" onClick={() => setOpen({ ...open, [x.id]: !open[x.id] })}>{isOpen ? "Sembunyikan perubahan" : "Lihat perubahan"}</button>}
                    </div>
                    {isOpen && (
                      <div className="mt-2.5 overflow-hidden rounded-[10px] border border-[#E7E5E4] text-[13.5px]">
                        <div className="grid grid-cols-[170px_1fr_1fr] bg-[#FAFAF9] text-[11px] font-semibold uppercase tracking-[.05em] text-[#716A65]">{["Bagian", "Sebelum", "Sesudah"].map((h) => <span key={h} className="px-3 py-2">{h}</span>)}</div>
                        {x.diff.map(([k, a, b]) => (
                          <div key={k} className="grid grid-cols-[170px_1fr_1fr] border-t border-[#F0EEEC]">
                            <span className="px-3 py-2">{k}</span><span className="bg-[#FEF2F2] px-3 py-2 text-[#991B1B] line-through">{a}</span><span className="bg-[#F0FDF4] px-3 py-2 text-[#166534]">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <time className="font-mono text-xs text-[#716A65]">{x.time}</time>
                    {x.revertable && !rv && <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => revert(x)}><Undo2 aria-hidden size={14} />Kembalikan</button>}
                    {rv && <span className="rounded-full bg-[#F5F5F4] px-2 text-xs font-semibold leading-[22px] text-[#57534E]">Dikembalikan</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )) : (
          <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
            <b className="text-[15px]">Tidak ada riwayat yang cocok</b><span className="text-[13.5px] text-[#716A65]">Coba kata lain atau perluas rentang waktu.</span>
            <button type="button" className={cls(btn.base, btn.outline, btn.small, "mt-2")} onClick={reset}>Hapus semua filter</button>
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[#F0EEEC] bg-[#FAFAF9] px-5 py-3 text-[12.5px] text-[#716A65]"><Lock aria-hidden size={13} className="flex-none" />Riwayat disimpan 2 tahun. “Kembalikan” membuat perubahan baru yang tercatat di sini; riwayat aslinya tidak dihapus.</div>
      </section>
      {toast}
    </div>
  );
}
