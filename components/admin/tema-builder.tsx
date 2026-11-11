"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, MousePointer2, Plus, Search, Trash2, MoreHorizontal } from "lucide-react";
import { logoOf } from "@/lib/emiten-data";
import { checklist, moveEmiten, moveStage, removeEmiten, stagesOf, type Group, type Result, type Row, type Stage } from "@/lib/tema";
import { ICONS, PALETTE, POOL, SECTORS, THEMES } from "@/lib/tema-data";
import { area, btn, cls, Counter, Field, Help, inp, Section, useToast } from "./form-ui";

type Drag = { kind: "em"; tk: string; from: number | null } | { kind: "st"; id: number } | null;
const AVATAR = ["#15803D", "#1D4ED8", "#0F766E", "#92400E", "#6D28D9", "#1C1917", "#BE185D", "#B45309"];
const pal = (g?: Group) => { const p = PALETTE[g?.c ?? "stone"]; return { bg: p[1], bar: p[2], soft: p[3], ink: p[4] }; };
const KEYS = Object.keys(POOL);
const ICON_D = Object.fromEntries(ICONS.map((i) => [i[0], i[2]]));
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

function Avatar({ tk }: { tk: string }) {
  const logo = logoOf(tk);
  return (
    <span aria-hidden className="inline-flex size-8 flex-none items-center justify-center overflow-hidden rounded-full border border-[#E7E5E4] font-mono text-[11px] font-semibold text-white" style={logo ? { background: "#fff" } : { background: AVATAR[KEYS.indexOf(tk) % AVATAR.length], borderColor: "transparent" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" className="size-full object-contain" /> : tk.slice(0, 2)}
    </span>
  );
}

// shortcut: starts from the design's "Energi terbarukan" example; start empty and POST /admin/api/themes on save.
export function TemaBuilder() {
  const { flash, toast } = useToast();
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
  const [menu, setMenu] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const gById = Object.fromEntries(groups.map((g) => [g.id, g]));
  const endDrag = () => { setDrag(null); setOver(null); };
  const apply = (r: Result) => { if ("error" in r) { if (r.error) flash(r.error); return; } setStages(r.stages); flash(r.msg); };

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
    onDragStart: (e: React.DragEvent) => { try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", d && d.kind === "em" ? d.tk : "tahap"); } catch {} setDrag(d); setOver(null); setMenu(null); },
    onDragEnd: endDrag,
  });
  const dropProps = (key: string, accept: boolean, onDrop: () => void) => ({
    onDragOver: (e: React.DragEvent) => { if (!drag || !accept) return; e.preventDefault(); if (over !== key) setOver(key); },
    onDragLeave: (e: React.DragEvent) => { if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return; if (over === key) setOver(null); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (drag && accept) onDrop(); endDrag(); },
  });

  const save = () => {
    if (!ok) return flash(`Belum bisa disimpan: ${(checks.find((c) => !c[1])?.[0] ?? "deskripsi terlalu panjang").toLowerCase()}`);
    setCreated(true);
    flash(`Draf tema ${name.trim()} tersimpan`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Tambah tema</h1>
          <p className="text-[#716A65]">Isi identitasnya, lalu susun rantai nilai dengan menarik emiten ke tiap tahap.</p>
        </div>
        <Link href="/admin/tema" className={cls(btn.base, btn.outline)}>Batal</Link>
      </div>

      {created && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
          <span><b>{name}</b> tersimpan sebagai draf. Lanjutkan isi porsi dan sumber pendapatan di halaman tema.</span>
          <Link href="/admin/tema/batubara" className={cls(btn.base, btn.dark, btn.small)}>Buka halaman tema</Link>
        </div>
      )}

      <Section id="t-id" title="1 · Identitas tema" desc="Tampil di kartu tema dan di atas peta rantai nilai.">
        <div className="grid gap-3.5 sm:grid-cols-[1fr_260px]">
          <Field label="Nama tema" htmlFor="n-n">
            <input id="n-n" className={inp(dup)} value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Energi terbarukan" />
            {dup && <span className="text-[12.5px] text-[#B91C1C]">Tema dengan nama ini sudah ada.</span>}
          </Field>
          <Field label="Sektor IDX-IC" htmlFor="n-s"><select id="n-s" className={inp()} value={sektor} onChange={(e) => setSektor(e.target.value)}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <Field label="Deskripsi singkat" htmlFor="n-d">
          <textarea id="n-d" className={cls(area(desc.length > 160), "min-h-16")} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Satu kalimat: bisnis apa saja yang masuk tema ini." />
          <div className="flex justify-between gap-3"><Help>Bisa diubah lagi setelah draf dibuat.</Help><Counter n={desc.length} max={160} /></div>
        </Field>
      </Section>

      <Section id="t-ms" title="2 · Tahap utama" desc="Kelompok besar di peta rantai nilai. Ikon, warna, judul, dan deskripsinya tampil di aplikasi persis seperti pratinjau ini.">
        <div className="flex flex-col gap-2.5">
          {groups.map((g, i) => {
            const p = pal(g), open = !!gOpen[g.id], used_ = stages.filter((s) => s.g === g.id).length, nm = g.t.trim() || `tahap utama ${i + 1}`;
            return (
              <div key={g.id} className="overflow-hidden rounded-xl border border-[#E7E5E4]">
                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ background: p.bg, boxShadow: `inset 3px 0 0 ${p.bar}` }}>
                  <span aria-hidden className="inline-flex size-7 flex-none items-center justify-center rounded-lg" style={{ background: p.soft, color: p.ink }}><Icon d={ICON_D[g.ic]} /></span>
                  <span className="text-[11.5px] font-bold uppercase tracking-[.08em]" style={{ color: p.ink }}>{g.t.trim() || "Tanpa judul"}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#57534E]">{g.d.trim() || "Belum ada deskripsi"}</span>
                  <span className="text-xs text-[#716A65]">{used_ ? `${used_} tahap` : "Belum dipakai"}</span>
                  <span className="flex items-center gap-0.5">
                    <button type="button" aria-label={`Naikkan ${nm}`} aria-disabled={i === 0} onClick={() => moveG(i, -1)} className="inline-flex size-8 items-center justify-center rounded-md text-[#57534E] hover:bg-black/5 aria-disabled:opacity-30"><ChevronUp size={16} /></button>
                    <button type="button" aria-label={`Turunkan ${nm}`} aria-disabled={i === nG - 1} onClick={() => moveG(i, 1)} className="inline-flex size-8 items-center justify-center rounded-md text-[#57534E] hover:bg-black/5 aria-disabled:opacity-30"><ChevronDown size={16} /></button>
                    <button type="button" aria-label={`Hapus ${nm}`} onClick={() => { if (used_) return flash(`Pindahkan dulu ${used_} tahap yang memakai ${nm}`); if (nG <= 1) return flash("Minimal satu tahap utama"); setGroups(groups.filter((x) => x.id !== g.id)); flash(`${nm} dihapus`); }} className="inline-flex size-8 items-center justify-center rounded-md text-[#57534E] hover:bg-black/5 hover:text-[#B91C1C]"><Trash2 size={15} /></button>
                    <button type="button" aria-expanded={open} onClick={() => setGOpen({ ...gOpen, [g.id]: !open })} className={cls(btn.base, btn.outline, btn.small, "ml-1")}>{open ? "Selesai" : "Ubah"}</button>
                  </span>
                </div>
                {open && (
                  <div className="flex flex-col gap-3.5 border-t border-[#E7E5E4] bg-white p-4">
                    <div className="grid gap-3.5 sm:grid-cols-[240px_1fr]">
                      <Field label="Judul" htmlFor={`gt-${g.id}`}><input id={`gt-${g.id}`} className={inp(!g.t.trim() || g.t.length > 20)} value={g.t} onChange={(e) => updG(g.id, { t: e.target.value })} placeholder="mis. Hulu" /><div className="flex justify-end"><Counter n={g.t.length} max={20} /></div></Field>
                      <Field label="Deskripsi" htmlFor={`gd-${g.id}`}><input id={`gd-${g.id}`} className={inp(!g.d.trim() || g.d.length > 80)} value={g.d} onChange={(e) => updG(g.id, { d: e.target.value })} placeholder="mis. Menggali batu bara dari dalam tanah." /><div className="flex justify-end"><Counter n={g.d.length} max={80} /></div></Field>
                    </div>
                    <div className="flex flex-wrap justify-between gap-4">
                      <Field label="Ikon">
                        <div role="group" aria-label="Pilih ikon" className="flex flex-wrap gap-1.5">
                          {ICONS.map(([k, l, d]) => <button key={k} type="button" aria-pressed={g.ic === k} aria-label={l} title={l} onClick={() => updG(g.id, { ic: k })} className={cls("inline-flex size-10 items-center justify-center rounded-lg border", g.ic === k ? "border-[#1C1917] shadow-[inset_0_0_0_1px_#1C1917]" : "border-[#E7E5E4] hover:border-[#D6D3D1]")}><Icon d={d} size={18} /></button>)}
                        </div>
                      </Field>
                      <Field label="Warna">
                        <div role="group" aria-label="Pilih warna" className="flex gap-2">
                          {Object.entries(PALETTE).map(([k, v]) => <button key={k} type="button" aria-pressed={g.c === k} aria-label={v[0]} title={v[0]} onClick={() => updG(g.id, { c: k })} className={cls("size-7 rounded-full border-2 border-white", g.c === k ? "ring-2 ring-[#1C1917]" : "ring-1 ring-[#E7E5E4]")} style={{ background: v[2] }} />)}
                        </div>
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => { const id = `g${gid}`; setGroups([...groups, { id, t: "", d: "", ic: "factory", c: "violet" }]); setGid(gid + 1); setGOpen({ ...gOpen, [id]: true }); }} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-[#D6D3D1] text-sm font-semibold text-[#44403C] hover:border-[#A8A29E]"><Plus aria-hidden size={16} />Tambah tahap utama</button>
      </Section>

      <Section id="t-rn" title="3 · Susun rantai nilai" desc="Tiap tahap butuh nama, deskripsi singkat, dan tahap utamanya. Satu emiten boleh ada di lebih dari satu tahap.">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-[#716A65]">
          <span className="inline-flex items-center gap-1.5"><MousePointer2 aria-hidden size={13} />Tarik dari daftar kiri ke tahap untuk menambah</span>
          <span>Tarik antar tahap untuk memindahkan</span>
          <span>Tarik ke daftar kiri untuk mengeluarkan</span>
          <span className="inline-flex items-center gap-1.5"><GripVertical aria-hidden size={13} />Tarik pegangan tahap untuk mengubah urutan</span>
          <span>Tanpa mouse: tombol <kbd className="rounded border border-[#D6D3D1] px-1">⋯</kbd> di kartu</span>
        </div>

        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          <div aria-label="Daftar emiten" {...dropProps("pool", poolDz, () => { if (drag?.kind === "em" && drag.from !== null) apply(removeEmiten(stages, drag.tk, drag.from)); })}
            className={cls("sticky left-0 flex w-[260px] flex-none flex-col gap-2.5 rounded-xl border bg-[#FAFAF9] p-3", poolDz ? (over === "pool" ? "border-[#1C1917] bg-[#FFFBF2]" : "border-dashed border-[#A8A29E]") : "border-[#E7E5E4]")}>
            <b className="text-sm font-semibold">Emiten</b>
            <div className="relative"><Search aria-hidden size={14} className="absolute left-3 top-3 text-[#716A65]" /><input type="search" placeholder="Cari kode atau nama" aria-label="Cari emiten" value={pq} onChange={(e) => setPq(e.target.value)} className={cls(inp(), "!h-10 pl-9 text-sm")} /></div>
            <select aria-label="Filter sektor emiten" value={psec} onChange={(e) => setPsec(e.target.value)} className={cls(inp(), "!h-10 text-sm")}><option value="">Semua sektor</option><option>Energi</option><option>Infrastruktur</option><option>Perindustrian</option></select>
            <div className="flex max-h-[560px] flex-col gap-1.5 overflow-y-auto">
              {pool.map((k) => {
                const at = stagesOf(stages, k);
                return (
                  <div key={k} {...dragProps({ kind: "em", tk: k, from: null })} title={at.length ? `${k} sudah di tahap ${at.join(", ")}. Tarik lagi untuk menambah ke tahap lain.` : `Tarik ${k} ke salah satu tahap`}
                    className={cls("flex cursor-grab items-center gap-2 rounded-lg border border-[#E7E5E4] bg-white p-1.5 active:cursor-grabbing", drag?.kind === "em" && drag.tk === k && drag.from === null && "opacity-40")}>
                    <GripVertical aria-hidden size={14} className="flex-none text-[#A8A29E]" />
                    <Avatar tk={k} />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight"><b className="font-mono text-[12.5px]">{k}</b><em className="truncate text-xs not-italic text-[#716A65]">{POOL[k][0]}</em></span>
                    <span className={cls("whitespace-nowrap text-[11px]", at.length ? "font-semibold text-[#44403C]" : "text-[#A8A29E]")}>{at.length ? `Tahap ${at.join(", ")}` : "Belum"}</span>
                  </div>
                );
              })}
              {!pool.length && <Help>Tidak ada emiten yang cocok.</Help>}
            </div>
            <div className="border-t border-[#E7E5E4] pt-2 text-xs text-[#716A65]">{poolDz ? "Lepas di sini untuk mengeluarkan dari tahap" : `${used.size} emiten dipakai · ${KEYS.length} di daftar`}</div>
          </div>

          <div className="flex items-start gap-4">
            {stages.map((s, i) => {
              const key = `s${s.id}`;
              const dzEm = drag?.kind === "em" && drag.from !== s.id && !s.rows.some((r) => r.tk === drag.tk);
              const dzSt = drag?.kind === "st" && drag.id !== s.id;
              const dz = dzEm || dzSt;
              const miss = s.rows.filter((r) => !r.p.trim()).length;
              return (
                <div key={s.id} aria-label={`Tahap ${i + 1}${s.name ? `: ${s.name}` : ""}`}
                  {...dropProps(key, !!dz, () => { if (drag?.kind === "em") apply(moveEmiten(stages, drag.tk, drag.from, s.id)); else if (drag?.kind === "st") { const n = moveStage(stages, drag.id, s.id); if (n) setStages(n); } })}
                  className={cls("flex w-[250px] flex-none flex-col gap-3 rounded-xl border bg-[#FAFAF9] p-3", dz ? (over === key ? "border-[#1C1917] bg-[#FFFBF2]" : "border-dashed border-[#A8A29E]") : "border-[#E7E5E4]", drag?.kind === "st" && drag.id === s.id && "opacity-50")}
                  style={{ boxShadow: `inset 0 3px 0 ${pal(gById[s.g]).bar}` }}>
                  <div className="flex items-center gap-2">
                    <span {...dragProps({ kind: "st", id: s.id })} title="Tarik untuk mengubah urutan" aria-hidden className="cursor-grab text-[#A8A29E]"><GripVertical size={14} /></span>
                    <span className="inline-flex size-5 items-center justify-center rounded bg-[#1C1917] font-mono text-[11px] font-semibold text-white">{i + 1}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-[#716A65]">Tahap</span>
                    <button type="button" aria-label={`Hapus tahap ${i + 1}`} className="ml-auto text-[#716A65] hover:text-[#B91C1C]" onClick={() => { setStages(stages.filter((x) => x.id !== s.id)); flash(`Tahap ${i + 1} dihapus${s.rows.length ? `. ${s.rows.length} emiten kembali ke daftar.` : ""}`); }}><Trash2 size={15} /></button>
                  </div>
                  <input className={cls(inp(!s.name.trim()), "!h-10 text-sm font-medium")} aria-label={`Nama tahap ${i + 1}`} value={s.name} onChange={(e) => updS(s.id, { name: e.target.value })} placeholder="Nama tahap" />
                  <div className="flex flex-col gap-1">
                    <textarea className={cls(area(!s.desc.trim() || s.desc.length > 90), "min-h-[72px] text-[13px]")} aria-label={`Deskripsi singkat tahap ${i + 1}`} value={s.desc} onChange={(e) => updS(s.id, { desc: e.target.value })} placeholder="Deskripsi singkat, mis. Mengebor uap panas bumi dan menjual listriknya." />
                    <span className="flex justify-end"><Counter n={s.desc.length} max={90} /></span>
                  </div>
                  <select className={cls(inp(), "!h-10 text-sm")} aria-label={`Posisi tahap ${i + 1}`} value={s.g} onChange={(e) => updS(s.id, { g: e.target.value })}>{groups.map((g, j) => <option key={g.id} value={g.id}>{g.t.trim() || `Tahap utama ${j + 1}`}</option>)}</select>

                  <div className="flex min-h-[120px] flex-col gap-2">
                    {s.rows.map((r) => <EmitenCard key={r.tk} row={r} stage={s} stageIdx={i} stages={stages} dragging={drag?.kind === "em" && drag.tk === r.tk && drag.from === s.id} menuOpen={menu === `${s.id}:${r.tk}`}
                      dragProps={dragProps({ kind: "em", tk: r.tk, from: s.id })} onToggle={() => setMenu(menu === `${s.id}:${r.tk}` ? null : `${s.id}:${r.tk}`)} onPortion={(p) => updRow(s.id, r.tk, p)}
                      onMove={(to) => { apply(moveEmiten(stages, r.tk, s.id, to)); setMenu(null); }} onRemove={() => { apply(removeEmiten(stages, r.tk, s.id)); setMenu(null); }} />)}
                    {!s.rows.length && (
                      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#D6D3D1] px-3 py-6 text-center text-[13px] text-[#716A65]"><MousePointer2 aria-hidden size={16} />{dzEm ? "Lepas di sini" : "Tarik emiten ke sini"}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#716A65]"><span>{s.rows.length} emiten</span>{miss > 0 && <span className="font-semibold text-[#B45309]">{miss} tanpa porsi</span>}</div>
                </div>
              );
            })}
            <button type="button" onClick={() => { setStages([...stages, { id: nid, name: "", g: groups[groups.length - 1]?.id ?? "", desc: "", rows: [] }]); setNid(nid + 1); }}
              className="flex min-h-[200px] w-[150px] flex-none flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D6D3D1] text-sm font-semibold text-[#44403C] hover:border-[#A8A29E]"><Plus aria-hidden size={16} />Tambah tahap</button>
          </div>
        </div>
      </Section>

      <div role="region" aria-label="Simpan tema" className="sticky bottom-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)]">
        <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {checks.map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><i aria-hidden className={cls("inline-flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold not-italic", c ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#92400E]")}>{c ? "✓" : "!"}</i>{l}</span>)}
        </div>
        <span className="text-[13px] text-[#716A65]">Porsi boleh diisi nanti</span>
        <button type="button" aria-disabled={!ok} onClick={save} className={cls(btn.base, ok ? btn.dark : btn.disabled)}>Simpan sebagai draf</button>
      </div>
      {toast}
    </div>
  );
}

function EmitenCard({ row, stage, stageIdx, stages, dragging, menuOpen, dragProps, onToggle, onPortion, onMove, onRemove }: {
  row: Row; stage: Stage; stageIdx: number; stages: Stage[]; dragging: boolean; menuOpen: boolean; dragProps: object;
  onToggle: () => void; onPortion: (p: string) => void; onMove: (to: number) => void; onRemove: () => void;
}) {
  return (
    <div onKeyDown={(e) => { if (e.key === "Escape" && menuOpen) onToggle(); }} className="flex flex-col gap-1.5">
      <div {...dragProps} className={cls("flex cursor-grab flex-col gap-2 rounded-[10px] border border-[#E7E5E4] bg-white p-2 active:cursor-grabbing", dragging && "opacity-40")}>
        <div className="flex items-center gap-2">
          <GripVertical aria-hidden size={14} className="flex-none text-[#A8A29E]" />
          <Avatar tk={row.tk} />
          <span className="flex min-w-0 flex-1 flex-col leading-tight"><b className="font-mono text-[12.5px]">{row.tk}</b><em className="truncate text-xs not-italic text-[#716A65]">{POOL[row.tk]?.[0]}</em></span>
          <button type="button" aria-label={`Pindahkan ${row.tk}`} aria-expanded={menuOpen} aria-haspopup="menu" onClick={onToggle} className="inline-flex size-7 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F5F5F4]"><MoreHorizontal size={16} /></button>
        </div>
        <label className="flex items-center justify-end gap-2 text-xs text-[#716A65]">Porsi
          <span className="relative flex w-20 items-center"><input className={cls(inp(), "!h-8 pr-6 text-right font-mono text-[13px]")} inputMode="decimal" aria-label={`Porsi ${row.tk} di tahap ${stageIdx + 1}`} placeholder="—" value={row.p} onChange={(e) => onPortion(e.target.value)} /><span className="absolute right-2 text-xs">%</span></span>
        </label>
      </div>
      {menuOpen && (
        <div role="menu" aria-label={`Pindahkan ${row.tk}`} className="flex flex-col rounded-[10px] border border-[#E7E5E4] bg-white p-1 text-[13px] shadow-md">
          <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[.05em] text-[#716A65]">Pindah ke</span>
          {stages.filter((x) => x.id !== stage.id).map((x) => <button key={x.id} type="button" role="menuitem" onClick={() => onMove(x.id)} className="rounded-md px-2 py-1.5 text-left hover:bg-[#F5F5F4]">Tahap {stages.findIndex((y) => y.id === x.id) + 1}{x.name ? ` · ${x.name}` : ""}</button>)}
          <button type="button" role="menuitem" onClick={onRemove} className="rounded-md px-2 py-1.5 text-left text-[#B91C1C] hover:bg-[#FEF2F2]">Keluarkan dari tahap</button>
        </div>
      )}
    </div>
  );
}
