"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, ExternalLink, HelpCircle, Image as ImageIcon, Lock, Search, ThumbsUp } from "lucide-react";
import {
  applyAssign, applyStatus, initials, inTab, isLate, isOpen, KIND, ME, MIN_REPLY, STAFF, STATUS, templates, TICKETS, USERS,
  type Kind, type Msg, type Tab, type TStatus,
} from "@/lib/masukan";
import { area, btn, Chip, cls, Field, inp, mono, useToast } from "./form-ui";

const TABS: [Tab, string][] = [["open", "Terbuka"], ["new", "Baru"], ["wait", "Menunggu pengguna"], ["done", "Selesai"], ["all", "Semua"]];
const KPIS = [
  { l: "Terbuka", v: (o: number) => String(o + 11), s: (late: number) => <><em className="font-semibold not-italic text-[#B45309]">{late + 3}</em> lewat batas 2 hari kerja</> },
  { l: "Data salah terbuka", v: () => "12", s: () => "paling banyak: AADI, BUMI" },
  { l: "Balasan pertama", v: () => "9 jam", s: () => "rata-rata 30 hari terakhir" },
  { l: "Selesai minggu ini", v: () => "41", s: () => <><em className="font-semibold not-italic text-[#15803D]">+6</em> dari minggu lalu</> },
];
const Tag = ({ children }: { children: React.ReactNode }) => <span className="rounded border border-[#BFDBFE] bg-[#EFF6FF] px-1.5 font-mono text-[11px] font-bold leading-[18px] text-[#1D4ED8]">{children}</span>;
const KindChip = ({ k }: { k: Kind }) => <span className={cls("rounded-md px-2 text-xs font-semibold leading-5", KIND[k][1])}>{KIND[k][0]}</span>;

type Override = { s?: TStatus; a?: string };

export function Inbox() {
  const { flash, toast } = useToast();
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
    if (!t) return;
    if (!ok) return flash(`Tulis minimal ${MIN_REPLY} karakter`);
    setExtra({ ...extra, [t.id]: [...(extra[t.id] ?? []), { who: ME, t: "Baru saja", body: txt.trim(), kind: kindM }] });
    if (o) patch({ ...applyStatus(t, o.s!), s: o.s });
    setTxt("");
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
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Masukan &amp; laporan</h1>
        <p className="text-[#716A65]">Semua kiriman dari form Bantuan di aplikasi. Pengguna dijanjikan balasan lewat email dalam 1–2 hari kerja.</p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-[#E7E5E4] bg-white px-[18px] py-4">
            <span className="text-[13px] font-medium text-[#716A65]">{k.l}</span><b className={cls(mono, "text-[28px] font-semibold leading-tight tracking-tight")}>{k.v(nOpen)}</b><small className="text-[12.5px] text-[#716A65]">{k.s(nLate)}</small>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-label="Daftar masukan" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
          <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
            <div className="relative min-w-52 flex-1">
              <Search aria-hidden size={16} className="absolute left-3 top-3.5 text-[#716A65]" />
              <input type="search" placeholder="Cari tiket, email, atau isi" aria-label="Cari masukan" value={q} onChange={(e) => setQ(e.target.value)} className={cls(inp(), "!h-[38px] pl-9 text-sm")} />
            </div>
            <select aria-label="Jenis" value={kind} onChange={(e) => setKind(e.target.value)} className={cls(inp(), "!h-[38px] w-[170px] text-sm")}>
              <option value="">Semua jenis</option>{(Object.keys(KIND) as Kind[]).map((k) => <option key={k} value={k}>{KIND[k][0]}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 px-4 pb-3">
            <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
              {TABS.map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cls("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px]", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>
                  {l}<small className="font-mono text-[11px] text-[#716A65]">{base.filter((x) => inTab(x.s, k)).length}</small>
                </button>
              ))}
            </div>
            <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-[#44403C]"><input type="checkbox" checked={mine} onChange={() => setMine(!mine)} />Milik saya</label>
          </div>

          {list.length ? (
            <>
              <div role="list" className="border-t border-[#F0EEEC]">
                {list.map((r) => (
                  <div key={r.id} role="listitem" onClick={() => pick(r.id)} className={cls("flex cursor-pointer flex-col gap-1.5 border-b border-[#F0EEEC] px-4 py-3.5", sel === r.id ? "bg-[#FFFBF2] shadow-[inset_3px_0_0_#FEA722]" : "hover:bg-[#FCFCFB]")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-xs text-[#716A65]">{r.id}</code><KindChip k={r.k} />
                      <Chip cls={STATUS[r.s][1]}>{STATUS[r.s][0]}</Chip>
                      <time className="ml-auto text-xs text-[#716A65]">{r.age}</time>
                    </div>
                    <button type="button" aria-pressed={sel === r.id} onClick={(e) => { e.stopPropagation(); pick(r.id); }} className="flex items-center gap-2 text-left text-[14.5px] font-semibold">
                      {r.s === "new" && <i aria-hidden className="size-2 flex-none rounded-full bg-[#FEA722]" />}{r.subj}
                    </button>
                    <span className="truncate text-[13.5px] text-[#716A65]">{r.body}</span>
                    <div className="flex items-center gap-2 text-[13px] text-[#716A65]">
                      <span>{r.from}</span>{r.tk && <Tag>{r.tk}</Tag>}
                      {isLate(r) && <span className="inline-flex items-center gap-1 font-semibold text-[#B91C1C]"><Clock aria-hidden size={12} />Lewat {r.late} hari</span>}
                      {r.votes && <span className="inline-flex items-center gap-1 text-[#1D4ED8]"><ThumbsUp aria-hidden size={12} />+{r.votes}</span>}
                      <span className="ml-auto" title={r.a ? `Ditangani ${r.a}` : "Belum ada yang menangani"}>
                        <span className={cls("inline-flex size-[22px] items-center justify-center rounded-full text-[11px] font-semibold", r.a ? "bg-[#1C1917] text-[#FEA722]" : "border border-dashed border-[#D6D3D1] text-[#A8A29E]")}>{r.a ? r.a[0] : <HelpCircle size={12} />}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] text-[#716A65]">
                <span>{list.length} dari {tab === "open" && !needle && !kind && !mine ? "18 terbuka" : `${list.length} masukan`}</span>
                <div className="flex gap-1.5">
                  <button type="button" aria-disabled className={cls(btn.base, btn.outline, btn.small, "cursor-not-allowed !bg-[#F5F5F4] !text-[#A8A29E]")}>Sebelumnya</button>
                  <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => flash("Halaman berikutnya belum tersedia (data contoh)")}>Berikutnya</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 border-t border-[#F0EEEC] px-5 py-10 text-center">
              <b className="text-[15px]">Tidak ada masukan di sini</b><span className="text-[13.5px] text-[#716A65]">Coba status lain, atau hapus pencarian dan filter jenis.</span>
              <button type="button" className={cls(btn.base, btn.outline, btn.small, "mt-2")} onClick={() => { setQ(""); setKind(""); setMine(false); setTab("all"); }}>Hapus semua filter</button>
            </div>
          )}
        </section>

        <aside aria-label="Detail masukan" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
          {t ? (
            <>
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-xs text-[#716A65]">{t.id}</code><KindChip k={t.k} /><Chip cls={STATUS[t.s][1]}>{STATUS[t.s][0]}</Chip>
                  {isLate(t) && <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C]"><Clock aria-hidden size={13} />Lewat {t.late} hari dari janji balasan</span>}
                </div>
                <h2 className="text-lg font-semibold leading-snug">{t.subj}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Status" htmlFor="d-st">
                    <select id="d-st" className={inp()} value={t.s} onChange={(e) => { const v = e.target.value as TStatus; patch(applyStatus(t, v)); flash(`Status ${t.id}: ${STATUS[v][0]}`); }}>
                      {(Object.keys(STATUS) as TStatus[]).map((s) => <option key={s} value={s}>{s === "prog" ? "Sedang ditangani" : STATUS[s][0]}</option>)}
                    </select>
                  </Field>
                  <Field label="Ditangani oleh" htmlFor="d-as">
                    <select id="d-as" className={inp()} value={t.a} onChange={(e) => { patch(applyAssign(t, e.target.value)); flash(e.target.value ? `${t.id} ditangani ${e.target.value}` : `${t.id} dilepas`); }}>
                      <option value="">Belum ada</option><option value="Rina">Rina Putri (saya)</option><option value="Dimas">Dimas Arya</option>
                    </select>
                  </Field>
                </div>
              </div>

              <dl className="grid grid-cols-[90px_1fr] items-center gap-x-3 gap-y-2.5 border-t border-[#F0EEEC] px-5 py-4 text-sm">
                <dt className="text-[#716A65]">Pengirim</dt><dd className="font-medium"><Link href="/admin/pengguna" className="underline underline-offset-2">{t.from}</Link> <span className="font-normal text-[#716A65]">{user[0]}</span></dd>
                <dt className="text-[#716A65]">Halaman</dt><dd className="font-medium">{t.page}</dd>
                {t.tk && <><dt className="text-[#716A65]">Emiten</dt><dd className="flex items-center gap-2 font-medium"><Tag>{t.tk}</Tag><Link href={`/admin/emiten/${t.tk}`} className={cls(btn.base, btn.outline, btn.small, "!min-h-7")}><ExternalLink aria-hidden size={13} />Buka data {t.tk}</Link></dd></>}
                <dt className="text-[#716A65]">Perangkat</dt><dd className="font-medium">{t.dev}</dd>
                <dt className="text-[#716A65]">Dikirim</dt><dd className="font-medium">{t.sent}</dd>
              </dl>

              <div aria-label="Percakapan" className="flex flex-col gap-3 border-t border-[#F0EEEC] bg-[#FAFAF9] p-5">
                {thread.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <span aria-hidden className="inline-flex size-8 flex-none items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: m.kind === "user" ? user[1] : STAFF[m.who] ?? "#1C1917", color: m.kind === "user" ? "#fff" : "#FEA722" }}>{initials(m.who)}</span>
                    <div className={cls("flex min-w-0 flex-1 flex-col gap-2 rounded-xl border p-3.5 text-sm leading-relaxed", m.kind === "note" ? "border-[#FDE68A] bg-[#FFFBEB]" : m.kind === "reply" ? "border-[#E7E5E4] bg-[#F5F5F4]" : "border-[#E7E5E4] bg-white")}>
                      <div className="flex flex-wrap items-center gap-2"><b className="font-semibold">{m.kind === "user" ? m.who : `${m.who} · tim StockPlan`}</b>
                        {m.kind === "note" && <span className="inline-flex items-center gap-1 rounded bg-[#FEF3C7] px-1.5 text-[11px] font-semibold leading-[18px] text-[#92400E]"><Lock aria-hidden size={10} />Catatan internal</span>}
                        <time className="ml-auto text-xs text-[#716A65]">{m.t}</time></div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      {m.att && <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-2 py-1.5 text-[13px]"><ImageIcon aria-hidden size={16} className="text-[#716A65]" />{m.att}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {isOpen(t.s) ? (
                <div className="flex flex-col gap-3 border-t border-[#F0EEEC] p-5">
                  <div role="tablist" aria-label="Jenis tulisan" className="flex w-fit gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
                    {([["reply", "Balas ke pengguna"], ["note", "Catatan internal"]] as const).map(([k, l]) => (
                      <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={cls("inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13.5px]", mode === k ? "bg-white font-semibold shadow-sm" : "text-[#57534E]")}>{k === "note" && <Lock aria-hidden size={12} />}{l}</button>
                    ))}
                  </div>
                  {mode === "reply" && (
                    <div aria-label="Templat balasan" className="flex flex-wrap gap-1.5">
                      {templates(t).map(([l, body]) => <button key={l} type="button" onClick={() => setTxt(body)} className="rounded-full border border-[#E7E5E4] bg-white px-3 py-1 text-[12.5px] font-medium hover:border-[#D6D3D1]">{l}</button>)}
                    </div>
                  )}
                  <label htmlFor="cmp" className="sr-only">{mode === "note" ? "Catatan internal" : "Balasan"}</label>
                  <textarea id="cmp" className={cls(area(), "min-h-[110px]", mode === "note" && "!border-[#FDE68A] !bg-[#FFFBEB]")} value={txt} onChange={(e) => setTxt(e.target.value)}
                    placeholder={mode === "note" ? "Hanya terlihat oleh tim admin" : `Balasan dikirim ke ${user[0] || "pengguna"} dari bantuan@stockplan.id`} />
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-[12.5px] text-[#716A65]">{mode === "note" ? "Tidak dikirim ke pengguna" : "Dikirim lewat email · tanda tangan tim otomatis"}</span>
                    <div className="flex gap-2">
                      {mode === "reply" ? (
                        <>
                          <button type="button" aria-disabled={!ok} className={cls(btn.base, btn.small, ok ? btn.outline : btn.disabled)} onClick={() => { if (!ok) return post("reply"); post("reply", { s: "wait" }); flash(`Balasan terkirim ke ${user[0]}. Status: menunggu pengguna.`); }}>Kirim</button>
                          <button type="button" aria-disabled={!ok} className={cls(btn.base, btn.small, ok ? btn.dark : btn.disabled)} onClick={() => { if (!ok) return post("reply"); post("reply", { s: "done" }); flash(`Balasan terkirim dan ${t.id} diselesaikan`); }}>Kirim &amp; selesaikan</button>
                        </>
                      ) : (
                        <button type="button" aria-disabled={!ok} className={cls(btn.base, btn.small, ok ? btn.dark : btn.disabled)} onClick={() => { if (!ok) return post("note"); post("note"); flash("Catatan internal disimpan"); }}>Simpan catatan</button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EEEC] p-5">
                  <span className="text-[12.5px] text-[#716A65]">{t.s === "spam" ? "Ditandai spam. Pengirim tidak diberi balasan." : "Tiket selesai. Pengguna bisa membalas email untuk membukanya lagi."}</span>
                  <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { patch({ s: "prog" }); flash(`${t.id} dibuka lagi`); }}>Buka lagi</button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 px-6 py-16 text-center"><b className="text-[15px]">Pilih masukan</b><span className="text-[13.5px] text-[#716A65]">Klik salah satu di daftar untuk membaca dan membalasnya.</span></div>
          )}
        </aside>
      </div>
      {toast}
    </div>
  );
}
