"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Flag, Plus, Search } from "lucide-react";
import { MISSING, ROWS, SECTORS, TOTALS, logoOf, type Row, type Status } from "@/lib/emiten-data";
import { btn, Chip, cls, inp, TONE, useToast } from "./form-ui";

type Tab = "all" | "review" | "inc" | "ok";
const TABS: [Tab, string][] = [["all", "Semua"], ["review", "Perlu ditinjau"], ["inc", "Belum lengkap"], ["ok", "Siap terbit"]];
const STATUS: Record<Status, [string, string]> = {
  ok: ["Siap terbit", TONE.ok], review: ["Perlu ditinjau", TONE.warn], draft: ["Draf", TONE.neutral], new: ["IPO baru", TONE.info],
};
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const GRID = "grid grid-cols-[52px_minmax(230px,1.6fr)_minmax(110px,.8fr)_150px_minmax(150px,1fr)_128px_84px_128px_76px] items-center";
const done = (r: Row) => r.parts.reduce((a, b) => a + b, 0);

function Checkbox({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={cls("inline-flex size-[18px] items-center justify-center rounded-[5px] border-[1.5px] text-white", on ? "border-[#1C1917] bg-[#1C1917]" : "border-[#A8A29E] bg-white")}>
      {on && <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7" /></svg>}
    </button>
  );
}

export function EmitenTable() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sec, setSec] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());
  const { flash, toast } = useToast();

  const all = ROWS.map((r) => (review.has(r.code) ? { ...r, status: "review" as Status } : r));
  const needle = q.trim().toLowerCase();
  const base = all.filter((r) => (!needle || `${r.code} ${r.name}`.toLowerCase().includes(needle)) && (!sec || r.secKey === sec));
  const inTab = (r: Row, t: Tab) => t === "all" || (t === "review" && r.status === "review") || (t === "inc" && done(r) < 5) || (t === "ok" && r.status === "ok");
  const filtered = !needle && !sec;
  const rows = base.filter((r) => inTab(r, tab));
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.code));
  const total = filtered ? TOTALS[tab] : rows.length;

  const toggle = (c: string) => setSel((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const reset = () => { setQ(""); setSec(""); setTab("all"); };

  return (
    <div className="flex max-w-none flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Data emiten</h1>
          <p className="text-[#716A65]">958 emiten dari BEI. Profil, anak usaha, dan manajemen disinkron otomatis; ringkasan bisnis dan sumber pendapatan diisi tim data.</p>
        </div>
        <div className="flex gap-2.5">
          <button type="button" className={cls(btn.base, btn.outline)} onClick={() => flash("CSV semua emiten sedang disiapkan")}><Download aria-hidden size={16} strokeWidth={1.8} />Ekspor CSV</button>
          <Link href="/admin/emiten/ipo/baru" className={cls(btn.base, btn.dark)}><Plus aria-hidden size={16} strokeWidth={1.8} />Tambah emiten IPO</Link>
        </div>
      </div>

      <section aria-label="Daftar emiten" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0EEEC] p-4">
          <div className="relative min-w-60 max-w-[360px] flex-1">
            <Search aria-hidden size={16} className="absolute left-3 top-3.5 text-[#716A65]" />
            <input type="search" placeholder="Cari kode atau nama emiten" aria-label="Cari emiten" value={q} onChange={(e) => setQ(e.target.value)} className={cls(inp(), "!h-[38px] pl-9 text-sm")} />
          </div>
          <div role="tablist" aria-label="Filter status" className="flex gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
            {TABS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={cls("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13.5px]", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>
                {l}<small className="font-mono text-[11.5px] text-[#716A65]">{(filtered ? TOTALS[k] : base.filter((r) => inTab(r, k)).length).toLocaleString("id-ID")}</small>
              </button>
            ))}
          </div>
          <select aria-label="Sektor" value={sec} onChange={(e) => setSec(e.target.value)} className={cls(inp(), "!h-[38px] ml-auto w-[200px] text-sm")}>
            {SECTORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {sel.size > 0 && (
          <div role="region" aria-label="Aksi massal" className="flex items-center gap-3 bg-[#1C1917] px-4 py-2.5 text-[13.5px] text-[#E7E5E4]">
            <b className="text-white">{sel.size} dipilih</b>
            {[
              ["Tandai perlu ditinjau", () => { setReview((r) => new Set([...r, ...sel])); flash(`${sel.size} emiten ditandai perlu ditinjau`); setSel(new Set()); }],
              ["Ekspor yang dipilih", () => flash(`CSV untuk ${sel.size} emiten sedang disiapkan`)],
            ].map(([l, f]) => (
              <button key={l as string} type="button" onClick={f as () => void} className={cls(btn.base, btn.small, "border-[#44403C] bg-transparent text-[#E7E5E4] hover:bg-[#292524]")}>{l as string}</button>
            ))}
            <button type="button" className="ml-auto text-[13.5px] font-semibold underline underline-offset-2" onClick={() => setSel(new Set())}>Batal pilih</button>
          </div>
        )}

        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Emiten" className="min-w-[1080px] text-sm">
                <div role="row" className={cls(GRID, "border-b border-[#E7E5E4] bg-[#FAFAF9] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}>
                  <span role="columnheader" className="py-2.5 pl-4"><Checkbox on={allOn} label="Pilih semua di halaman ini" onClick={() => setSel(allOn ? new Set() : new Set(rows.map((r) => r.code)))} /></span>
                  {["Emiten", "Sektor BEI", "Kelengkapan", "Tema", "Status", "Laporan", "Diperbarui"].map((h) => <span key={h} role="columnheader" className="p-3">{h}</span>)}
                  <span role="columnheader" className="sr-only">Aksi</span>
                </div>
                {rows.map((r, i) => {
                  const n = done(r), on = sel.has(r.code), logo = logoOf(r.code);
                  const idx = ROWS.findIndex((x) => x.code === r.code) || i;
                  return (
                    <div key={r.code} role="row" className={cls(GRID, "border-b border-[#F0EEEC] last:border-b-0", on ? "bg-[#FFFBF2]" : "hover:bg-[#FCFCFB]")}>
                      <span role="cell" className="py-3 pl-4"><Checkbox on={on} label={`Pilih ${r.code}`} onClick={() => toggle(r.code)} /></span>
                      <span role="cell" className="min-w-0 p-3">
                        <Link href={`/admin/emiten/${r.code}`} className="group flex min-w-0 items-center gap-2.5">
                          <span aria-hidden className="inline-flex size-8 flex-none items-center justify-center overflow-hidden rounded-full border border-[#E7E5E4] bg-white font-mono text-[11px] font-semibold text-white" style={logo ? undefined : { background: AVATAR[idx % AVATAR.length], borderColor: "transparent" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {logo ? <img src={logo} alt="" className="size-full object-contain" /> : r.code.slice(0, 2)}
                          </span>
                          <span className="flex min-w-0 flex-col leading-tight"><b className="font-mono text-[13.5px] group-hover:underline">{r.code}</b><em className="max-w-[220px] truncate text-[12.5px] not-italic text-[#716A65]">{r.name}</em></span>
                        </Link>
                      </span>
                      <span role="cell" className="p-3 text-[13px] text-[#57534E]">{r.sector}</span>
                      <span role="cell" className="p-3" title={n === 5 ? "Semua bagian lengkap" : `Belum: ${r.parts.map((v, k) => (v ? null : MISSING[k])).filter(Boolean).join(", ")}`}>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F0EEEC]"><i className={cls("block h-full rounded-full", n === 5 ? "bg-[#1C1917]" : "bg-[#FEA722]")} style={{ width: `${n * 20}%` }} /></span>
                          <span className="font-mono text-[12.5px] text-[#44403C]">{n}/5</span>
                        </span>
                      </span>
                      <span role="cell" className="p-3 text-[13px] text-[#57534E]">{r.tema}</span>
                      <span role="cell" className="p-3"><Chip cls={STATUS[r.status][1]}>{STATUS[r.status][0]}</Chip></span>
                      <span role="cell" className="p-3">
                        {r.reports > 0 ? <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 font-mono text-[12.5px] font-semibold leading-[22px] text-[#991B1B]"><Flag aria-hidden size={12} strokeWidth={1.8} />{r.reports}</span> : <span className="font-mono text-[12.5px] text-[#A8A29E]">—</span>}
                      </span>
                      <span role="cell" className="p-3 text-[13px] leading-snug">{r.when}<small className="block text-xs text-[#716A65]">{r.by}</small></span>
                      <span role="cell" className="py-3 pr-4 text-right"><Link href={`/admin/emiten/${r.code}`} className={cls(btn.base, btn.outline, btn.small)}>Edit</Link></span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#F0EEEC] px-4 py-3 text-[13px] text-[#716A65]">
              <span>Menampilkan 1–{rows.length} dari {total.toLocaleString("id-ID")} emiten</span>
              <div className="flex gap-1.5">
                <button type="button" aria-disabled className={cls(btn.base, btn.outline, btn.small, "cursor-not-allowed !bg-[#F5F5F4] !text-[#A8A29E]")}>Sebelumnya</button>
                <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => flash("Halaman berikutnya belum tersedia (data contoh)")}>Berikutnya</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
            <b className="text-[15px]">Tidak ada emiten yang cocok</b>
            <span className="text-[13.5px] text-[#716A65]">Coba kode lain, atau hapus filter status dan sektor.</span>
            <button type="button" className={cls(btn.base, btn.outline, btn.small, "mt-2")} onClick={reset}>Hapus semua filter</button>
          </div>
        )}
      </section>
      {toast}
    </div>
  );
}
