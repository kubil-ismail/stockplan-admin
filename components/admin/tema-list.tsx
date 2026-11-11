"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Share2 } from "lucide-react";
import { readiness, READY_MIN } from "@/lib/tema";
import { SECTORS, THEMES, UNMAPPED, type ThemeStatus } from "@/lib/tema-data";
import { btn, Chip, cls, inp, TONE, useToast } from "./form-ui";

type Tab = "all" | ThemeStatus;
const TABS: [Tab, string][] = [["all", "Semua"], ["open", "Terbuka"], ["draft", "Draf"], ["review", "Perlu ditinjau"]];
const ST: Record<ThemeStatus, [string, string]> = { open: ["Terbuka", TONE.ok], review: ["Perlu ditinjau", TONE.warn], draft: ["Draf", TONE.neutral] };
const DOT = { H: "bg-[#FEA722]", T: "bg-[#60A5FA]", L: "bg-[#4ADE80]" } as const;
const NAME = { H: "Hulu", T: "Tengah", L: "Hilir" } as const;
const GRID = "grid grid-cols-[minmax(220px,1.4fr)_130px_80px_190px_130px_70px_130px_76px] items-center";

const KPIS = [
  { l: "Tema terbuka", v: () => THEMES.filter((t) => t.status === "open").length, s: "bisa dibuka pengguna" },
  { l: "Tema draf", v: () => THEMES.filter((t) => t.status === "draft").length, s: "belum lolos syarat 80%" },
  { l: "Emiten terpetakan", v: () => 214, s: "dari 958 emiten BEI" },
  { l: "Pemetaan tanpa porsi", v: () => 23, s: <><em className="font-semibold not-italic text-[#B45309]">7</em> di tema yang sudah terbuka</> },
];

export function TemaList() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sec, setSec] = useState("");
  const [mapped, setMapped] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>(Object.fromEntries(UNMAPPED.map((u) => [u.tk, u.pick])));
  const { flash, toast } = useToast();

  const needle = q.trim().toLowerCase();
  const base = THEMES.filter((t) => (!needle || t.name.toLowerCase().includes(needle)) && (!sec || t.sec === sec));
  const rows = base.filter((t) => tab === "all" || t.status === tab);
  const um = UNMAPPED.filter((u) => !mapped.includes(u.tk));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Tema &amp; rantai nilai</h1>
          <p className="text-[#716A65]">Peta emiten per tahap rantai nilai, lengkap dengan porsi pendapatannya.</p>
        </div>
        <Link href="/admin/tema/baru" className={cls(btn.base, btn.dark)}><Plus aria-hidden size={16} strokeWidth={1.8} />Tambah tema</Link>
      </div>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-[#E7E5E4] bg-white px-[18px] py-4">
            <span className="text-[13px] font-medium text-[#716A65]">{k.l}</span>
            <b className="font-mono text-[28px] font-semibold leading-tight tracking-tight">{k.v()}</b>
            <small className="text-[12.5px] text-[#716A65]">{k.s}</small>
          </div>
        ))}
      </div>

      <section aria-label="Daftar tema" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#F0EEEC] p-4">
          <div className="relative min-w-60 max-w-[360px] flex-1">
            <Search aria-hidden size={16} className="absolute left-3 top-3.5 text-[#716A65]" />
            <input type="search" placeholder="Cari tema" aria-label="Cari tema" value={q} onChange={(e) => setQ(e.target.value)} className={cls(inp(), "!h-[38px] pl-9 text-sm")} />
          </div>
          <div role="tablist" aria-label="Filter status" className="flex gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
            {TABS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={cls("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13.5px]", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>
                {l}<small className="font-mono text-[11.5px] text-[#716A65]">{base.filter((t) => k === "all" || t.status === k).length}</small>
              </button>
            ))}
          </div>
          <select aria-label="Sektor" value={sec} onChange={(e) => setSec(e.target.value)} className={cls(inp(), "!h-[38px] ml-auto w-[220px] text-sm")}>
            <option value="">Semua sektor</option>
            {SECTORS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {rows.length ? (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Tema" className="min-w-[1000px] text-sm">
                <div role="row" className={cls(GRID, "border-b border-[#E7E5E4] bg-[#FAFAF9] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}>
                  {["Tema", "Tahap", "Emiten", "Kesiapan emiten", "Status", "Tesis", "Diperbarui"].map((h, i) => <span key={h} role="columnheader" className={cls("p-3", i === 0 && "pl-4")}>{h}</span>)}
                  <span role="columnheader" className="sr-only">Aksi</span>
                </div>
                {rows.map((t) => {
                  const pct = readiness(t.ok, t.n);
                  return (
                    <div key={t.name} role="row" className={cls(GRID, "border-b border-[#F0EEEC] last:border-b-0 hover:bg-[#FCFCFB]")}>
                      <span role="cell" className="p-3 pl-4">
                        <Link href="/admin/tema/batubara" className="group flex items-center gap-2.5">
                          <span aria-hidden className="inline-flex size-8 flex-none items-center justify-center rounded-lg bg-[#FFF4E2] text-[#92400E]"><Share2 size={16} strokeWidth={1.8} /></span>
                          <span className="flex flex-col leading-tight"><b className="font-semibold group-hover:underline">{t.name}</b><em className="text-[12.5px] not-italic text-[#716A65]">{t.sec}</em></span>
                        </Link>
                      </span>
                      <span role="cell" className="p-3" title={t.chain.split("").map((c) => NAME[c as "H"]).join(" → ")}>
                        <span className="flex items-center gap-[3px]">{t.chain.split("").map((c, i) => <i key={i} className={cls("h-1.5 w-3.5 rounded-full", DOT[c as "H"])} />)}<small className="ml-1.5 font-mono text-[12.5px] text-[#44403C]">{t.chain.length} tahap</small></span>
                      </span>
                      <span role="cell" className="p-3 font-mono text-[13px] text-[#44403C]">{t.n}</span>
                      <span role="cell" className="p-3" title="Garis abu-abu = batas 80%">
                        <span className="flex flex-col gap-1">
                          <span className="flex justify-between font-mono text-xs text-[#44403C]"><span>{t.ok}/{t.n}</span><span>{pct}%</span></span>
                          <span className="relative h-1.5 overflow-hidden rounded-full bg-[#F0EEEC]">
                            <i className={cls("block h-full rounded-full", pct >= READY_MIN ? "bg-[#1C1917]" : "bg-[#FEA722]")} style={{ width: `${pct}%` }} />
                            <b className="absolute top-0 h-full w-px bg-[#78716C]" style={{ left: `${READY_MIN}%` }} />
                          </span>
                        </span>
                      </span>
                      <span role="cell" className="p-3"><Chip cls={ST[t.status][1]}>{ST[t.status][0]}</Chip></span>
                      <span role="cell" className="p-3 font-mono text-[13px] text-[#44403C]">{t.tesis ? t.tesis.toLocaleString("id-ID") : "—"}</span>
                      <span role="cell" className="p-3 text-[13px] leading-snug">{t.when}<small className="block text-xs text-[#716A65]">{t.by}</small></span>
                      <span role="cell" className="py-3 pr-4 text-right"><Link href="/admin/tema/batubara" className={cls(btn.base, btn.outline, btn.small)}>Edit</Link></span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EEEC] px-4 py-3 text-[13px] text-[#716A65]">
              <span>Menampilkan {rows.length} dari {THEMES.length} tema</span>
              <span>Kesiapan = emiten siap terbit dibagi emiten di tema. Tema baru bisa dibuka kalau minimal 80%.</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
            <b className="text-[15px]">Tidak ada tema yang cocok</b>
            <span className="text-[13.5px] text-[#716A65]">Coba kata lain, atau hapus filter status dan sektor.</span>
            <button type="button" className={cls(btn.base, btn.outline, btn.small, "mt-2")} onClick={() => { setQ(""); setSec(""); setTab("all"); }}>Hapus semua filter</button>
          </div>
        )}
      </section>

      <section aria-labelledby="um-h" className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
        <div className="flex items-baseline justify-between gap-3 border-b border-[#F0EEEC] px-5 py-4">
          <b id="um-h" className="text-[15px] font-semibold">Emiten belum masuk tema mana pun</b>
          <span className="text-[13px] text-[#716A65]">{744 - mapped.length} emiten · {um.length} teratas dari antrian</span>
        </div>
        {um.map((u) => {
          const pick = picks[u.tk] ?? "";
          return (
            <div key={u.tk} className="grid grid-cols-[1fr_260px_auto] items-center gap-x-3 gap-y-1 border-t border-[#F0EEEC] px-5 py-3.5 first:border-t-0">
              <Link href={`/admin/emiten/${u.tk}`} className="group flex items-center gap-2.5">
                <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-white" style={{ background: u.color }}>{u.tk.slice(0, 2)}</span>
                <span className="flex flex-col leading-tight"><b className="font-mono text-[13.5px] group-hover:underline">{u.tk}</b><em className="text-[12.5px] not-italic text-[#716A65]">{u.name}</em></span>
              </Link>
              <select aria-label={`Tema untuk ${u.tk}`} className={cls(inp(), "!h-10")} value={pick} onChange={(e) => setPicks({ ...picks, [u.tk]: e.target.value })}>
                <option value="">Pilih tema…</option>
                {THEMES.map((t) => <option key={t.name}>{t.name}</option>)}
              </select>
              <button type="button" aria-disabled={!pick} className={cls(btn.base, btn.small, pick ? btn.dark : btn.disabled)}
                onClick={() => { if (!pick) return; setMapped([...mapped, u.tk]); flash(`${u.tk} masuk ${pick} sebagai draf. Isi porsi pendapatannya di halaman tema.`); }}>Petakan</button>
              <span className="col-span-full text-[12.5px] text-[#716A65]">{u.note}</span>
            </div>
          );
        })}
        <div className="border-t border-[#F0EEEC] bg-[#FAFAF9] px-5 py-3.5 text-[13px] text-[#716A65]">Emiten baru masuk tema sebagai draf. Porsi pendapatannya diisi dari halaman tema.</div>
      </section>
      {toast}
    </div>
  );
}
