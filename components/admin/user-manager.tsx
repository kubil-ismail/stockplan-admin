"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, Download, Flag, KeyRound, Lock, Mail, Plus, RotateCcw, Search, Send, ShieldAlert, X } from "lucide-react";
import { FEEDBACK, initials, LOGINS, PLAN_LABEL, statusOf, SUSPEND_REASONS, SUSPENDED_INIT, TOTALS, USERS, type Plan, type Status } from "@/lib/pengguna";
import { area, btn, Chip, cls, Field, inp, TONE, useToast } from "./form-ui";

type Tab = "all" | Status;
const TABS: [Tab, string][] = [["all", "Semua"], ["act", "Aktif"], ["new", "Belum konfirmasi"], ["idle", "Tidak aktif"], ["sus", "Ditangguhkan"]];
const ST: Record<Status, [string, string]> = { act: ["Aktif", TONE.ok], new: ["Belum konfirmasi", TONE.info], idle: ["Tidak aktif", TONE.neutral], sus: ["Ditangguhkan", TONE.err] };
const PLAN_CLS: Record<Plan, string> = { y: "bg-[#FFF4E2] text-[#92400E]", m: "bg-[#F5F5F4] text-[#44403C]", n: "text-[#A8A29E]" };
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const GRID = "grid grid-cols-[minmax(200px,1.6fr)_140px_130px_50px_90px] items-center";
const KPIS = [
  { l: "Pengguna beta", v: "1.284", s: <><em className="font-semibold not-italic text-[#15803D]">+86</em> minggu ini</> },
  { l: "Aktif 7 hari terakhir", v: "612", s: "48% dari semua pengguna" },
  { l: "Sudah menulis tesis", v: "538", s: "rata-rata 2,4 tesis per orang" },
  { l: "Minat berlangganan", v: "391", s: <>minta diingatkan · <em className="font-semibold not-italic text-[#15803D]">64%</em> tahunan</> },
];

const Avatar = ({ i, name, size = 32 }: { i: number; name: string; size?: number }) => (
  <span aria-hidden className="inline-flex flex-none items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: AVATAR[i % AVATAR.length], fontSize: size * 0.36 }}>{initials(name)}</span>
);
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="text-[11.5px] font-semibold uppercase tracking-[.06em] text-[#716A65]">{children}</h3>;
const Panel = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-3 border-t border-[#F0EEEC] p-5 first:border-t-0">{children}</div>;

export function UserManager() {
  const { flash, toast } = useToast();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [plan, setPlan] = useState("");
  const [sel, setSel] = useState("u1");
  const [sus, setSus] = useState<Record<string, [string, string]>>(SUSPENDED_INIT);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invEmail, setInvEmail] = useState("");

  const all = USERS.map((u, i) => ({ ...u, i, status: statusOf(u, !!sus[u.id]) }));
  const needle = q.trim().toLowerCase();
  const base = all.filter((u) => (!needle || `${u.name} ${u.email}`.toLowerCase().includes(needle)) && (!plan || u.plan === plan));
  const filtered = !needle && !plan;
  const rows = base.filter((u) => tab === "all" || u.status === tab);
  const u = all.find((x) => x.id === sel);
  const invOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invEmail.trim());
  const select = (id: string) => { setSel(id); setConfirm(false); setReason(""); setNote(""); };

  const logins = u ? (u.status === "sus" ? LOGINS.act.slice(0, 1).map(([d]) => [d, u.last]) : LOGINS[u.activity]) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Pengguna</h1>
          <p className="text-[#716A65]">Akun beta StockPlan. Semua akses masih gratis sampai rilis; belum ada penagihan.</p>
        </div>
        <div className="flex gap-2.5">
          <button type="button" className={cls(btn.base, btn.outline)} onClick={() => flash("CSV pengguna sedang disiapkan. Isi tesis dan portofolio tidak ikut diekspor.")}><Download aria-hidden size={16} strokeWidth={1.8} />Ekspor CSV</button>
          <button type="button" className={cls(btn.base, btn.dark)} onClick={() => setInviting(true)}><Plus aria-hidden size={16} strokeWidth={1.8} />Undang pengguna</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-[#E7E5E4] bg-white px-[18px] py-4">
            <span className="text-[13px] font-medium text-[#716A65]">{k.l}</span><b className="font-mono text-[28px] font-semibold leading-tight tracking-tight">{k.v}</b><small className="text-[12.5px] text-[#716A65]">{k.s}</small>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_383px]">
        <section aria-label="Daftar pengguna" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
          <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
            <div className="relative min-w-60 max-w-[360px] flex-1">
              <Search aria-hidden size={16} className="absolute left-3 top-3.5 text-[#716A65]" />
              <input type="search" placeholder="Cari nama atau email" aria-label="Cari pengguna" value={q} onChange={(e) => setQ(e.target.value)} className={cls(inp(), "!h-[38px] pl-9 text-sm")} />
            </div>
            <select aria-label="Minat paket" value={plan} onChange={(e) => setPlan(e.target.value)} className={cls(inp(), "!h-[38px] ml-auto w-[190px] text-sm")}>
              <option value="">Semua minat paket</option><option value="y">Tahunan</option><option value="m">Bulanan</option><option value="n">Belum memilih</option>
            </select>
          </div>
          <div className="border-b border-[#F0EEEC] px-4 pb-3">
            <div role="tablist" aria-label="Filter status" className="flex w-fit max-w-full flex-wrap gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
              {TABS.map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={cls("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13.5px]", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>
                  {l}<small className="font-mono text-[11.5px] text-[#716A65]">{(filtered ? TOTALS[k] : base.filter((x) => k === "all" || x.status === k).length).toLocaleString("id-ID")}</small>
                </button>
              ))}
            </div>
          </div>

          {inviting && (
            <div role="group" aria-label="Undang pengguna beta" className="flex flex-wrap items-center gap-2.5 border-b border-[#F0EEEC] bg-[#FAFAF9] p-4">
              <input type="email" placeholder="email@contoh.com" aria-label="Email yang diundang" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className={cls(inp(!!invEmail.trim() && !invOk), "!h-10 min-w-60 flex-1 text-sm")} />
              <button type="button" className={cls(btn.base, btn.dark, btn.small)} onClick={() => { if (!invOk) return flash("Email belum valid"); flash(`Undangan beta dikirim ke ${invEmail.trim()}`); setInviting(false); setInvEmail(""); }}><Send aria-hidden size={14} />Kirim undangan</button>
              <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { setInviting(false); setInvEmail(""); }}>Batal</button>
            </div>
          )}

          {rows.length ? (
            <>
              <div className="overflow-x-auto">
                <div role="table" aria-label="Pengguna" className="min-w-[640px] text-sm">
                  <div role="row" className={cls(GRID, "border-b border-[#E7E5E4] bg-[#FAFAF9] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}>
                    {["Pengguna", "Status", "Terakhir aktif", "Tesis", "Minat paket"].map((h, i) => <span key={h} role="columnheader" className={cls("px-3 py-3.5", i === 0 && "pl-4")}>{h}</span>)}
                  </div>
                  {rows.map((r) => (
                    <div key={r.id} role="row" onClick={() => select(r.id)} className={cls(GRID, "cursor-pointer border-b border-[#F0EEEC] last:border-b-0", sel === r.id ? "bg-[#FFFBF2] shadow-[inset_3px_0_0_#FEA722]" : "hover:bg-[#FCFCFB]")}>
                      <span role="cell" className="py-3 pl-4 pr-3">
                        <button type="button" aria-pressed={sel === r.id} aria-label={`Lihat detail ${r.name}`} onClick={(e) => { e.stopPropagation(); select(r.id); }} className="flex w-full items-center gap-2.5 text-left">
                          <Avatar i={r.i} name={r.name} />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="truncate font-semibold">{r.name}</b><em className="truncate text-[12.5px] not-italic text-[#716A65]">{r.email}</em></span>
                        </button>
                      </span>
                      <span role="cell" className="px-3 py-3"><Chip cls={ST[r.status][1]}>{ST[r.status][0]}</Chip></span>
                      <span role="cell" className="px-3 py-3 text-[13px]">{r.last}</span>
                      <span role="cell" className="px-3 py-3 font-mono text-[13px]">{r.tesis}</span>
                      <span role="cell" className="px-3 py-3"><span className={cls("inline-block rounded-md px-2 text-xs font-semibold leading-5", PLAN_CLS[r.plan])}>{PLAN_LABEL[r.plan][0]}</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#F0EEEC] px-4 py-3 text-[13px] text-[#716A65]">
                <span>Menampilkan 1–{rows.length} dari {(filtered ? TOTALS[tab] : rows.length).toLocaleString("id-ID")} pengguna</span>
                <div className="flex gap-1.5">
                  <button type="button" aria-disabled className={cls(btn.base, btn.outline, btn.small, "cursor-not-allowed !bg-[#F5F5F4] !text-[#A8A29E]")}>Sebelumnya</button>
                  <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => flash("Halaman berikutnya belum tersedia (data contoh)")}>Berikutnya</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
              <b className="text-[15px]">Tidak ada pengguna yang cocok</b><span className="text-[13.5px] text-[#716A65]">Coba nama atau email lain, atau hapus filter.</span>
              <button type="button" className={cls(btn.base, btn.outline, btn.small, "mt-2")} onClick={() => { setQ(""); setPlan(""); setTab("all"); }}>Hapus semua filter</button>
            </div>
          )}
        </section>

        <aside aria-label="Detail pengguna" className="sticky top-4 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
          {u ? (
            <>
              <div className="flex items-start gap-3.5 p-5">
                <Avatar i={u.i} name={u.name} size={52} />
                <div className="flex min-w-0 flex-1 flex-col"><b className="text-base font-semibold">{u.name}</b><span className="truncate text-[13px] text-[#716A65]">{u.email}</span><span className="mt-1 self-start"><Chip cls={ST[u.status][1]}>{ST[u.status][0]}</Chip></span></div>
                <button type="button" aria-label="Tutup detail" onClick={() => { setSel(""); setConfirm(false); }} className="inline-flex size-8 items-center justify-center rounded-md text-[#716A65] hover:bg-[#F5F5F4]"><X size={16} /></button>
              </div>

              {sus[u.id] && (
                <Panel><div className="flex gap-2.5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] leading-snug text-[#991B1B]"><ShieldAlert aria-hidden size={16} className="mt-0.5 flex-none" /><span><b>Ditangguhkan {sus[u.id][0]}</b> · {sus[u.id][1]}. Pengguna tidak bisa masuk, datanya tetap tersimpan.</span></div></Panel>
              )}

              <Panel>
                <H3>Akun</H3>
                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-[#716A65]">Bergabung</dt><dd>{u.joined}</dd>
                  <dt className="text-[#716A65]">Masuk dengan</dt><dd>{u.login}</dd>
                  <dt className="text-[#716A65]">Email</dt><dd>{u.verified ? "Terkonfirmasi" : "Belum dikonfirmasi"}</dd>
                  <dt className="text-[#716A65]">Langganan</dt><dd>Akses beta · gratis</dd>
                  <dt className="text-[#716A65]">Minat paket</dt><dd>{PLAN_LABEL[u.plan][1]}{u.plan !== "n" && " · minta diingatkan"}</dd>
                </dl>
              </Panel>

              <Panel>
                <H3>Pemakaian</H3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[[u.tesis, "tesis ditulis"], [u.evals, "evaluasi tesis"], [u.ems, "emiten dipantau"], [u.temas, "tema dibuka"]].map(([v, l]) => (
                    <div key={l} className="flex flex-col rounded-[10px] border border-[#E7E5E4] p-3"><b className="font-mono text-lg font-semibold">{v}</b><span className="text-[12.5px] text-[#716A65]">{l}</span></div>
                  ))}
                </div>
                <div className="flex gap-2 rounded-[10px] bg-[#FAFAF9] p-3 text-[12.5px] leading-snug text-[#57534E]"><Lock aria-hidden size={14} className="mt-0.5 flex-none" /><span>Admin hanya melihat jumlah. Isi tesis, portofolio, dan watchlist pengguna tidak bisa dibuka dari sini.</span></div>
              </Panel>

              <Panel>
                <H3>Login terakhir</H3>
                <div className="flex flex-col gap-2 text-sm">
                  {logins.length ? logins.map(([d, t], i) => <div key={i} className="flex justify-between gap-3"><span>{d}</span><time className="text-[13px] text-[#716A65]">{t}</time></div>) : <div className="flex justify-between"><span>Belum pernah masuk</span><span className="text-[#716A65]">—</span></div>}
                </div>
              </Panel>

              {FEEDBACK[u.id] && (
                <Panel>
                  <H3>Laporan &amp; masukan</H3>
                  {FEEDBACK[u.id].map((f) => (
                    <Link key={f.t} href="/admin/masukan" className="flex flex-col gap-0.5 rounded-[10px] border border-[#E7E5E4] px-3 py-2.5 hover:bg-[#FAFAF9]"><span className="flex items-center gap-1.5 text-sm"><Flag aria-hidden size={13} />{f.t}</span><small className="text-xs text-[#716A65]">{f.m}</small></Link>
                  ))}
                </Panel>
              )}

              <Panel>
                <H3>Tindakan</H3>
                {!confirm ? (
                  <div className="flex flex-col gap-2">
                    {!u.verified && <button type="button" className={cls(btn.base, btn.outline, btn.small, "w-full justify-start")} onClick={() => flash(`Email konfirmasi dikirim ulang ke ${u.email}`)}><Mail aria-hidden size={14} />Kirim ulang email konfirmasi</button>}
                    {u.verified && u.login === "Email" && !sus[u.id] && <button type="button" className={cls(btn.base, btn.outline, btn.small, "w-full justify-start")} onClick={() => flash(`Tautan atur ulang password dikirim ke ${u.email}. Berlaku 1 jam.`)}><KeyRound aria-hidden size={14} />Kirim tautan atur ulang password</button>}
                    {sus[u.id] ? (
                      <button type="button" className={cls(btn.base, btn.outline, btn.small, "w-full justify-start")} onClick={() => { const o = { ...sus }; delete o[u.id]; setSus(o); flash(`Akun ${u.name} dipulihkan. Pengguna bisa masuk lagi.`); }}><RotateCcw aria-hidden size={14} />Pulihkan akun</button>
                    ) : (
                      <button type="button" className={cls(btn.base, btn.small, "w-full justify-start border-[#FECACA] bg-white text-[#B91C1C] hover:bg-[#FEF2F2]")} onClick={() => setConfirm(true)}><Ban aria-hidden size={14} />Tangguhkan akun</button>
                    )}
                  </div>
                ) : (
                  <div role="group" aria-label="Konfirmasi tangguhkan akun" className="flex flex-col gap-3 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2]/50 p-3.5">
                    <b className="text-sm">Tangguhkan {u.name.split(" ")[0]}?</b>
                    <span className="text-[13px] leading-snug text-[#57534E]">Pengguna langsung keluar dari semua perangkat dan tidak bisa masuk sampai dipulihkan. Tesis dan portofolionya tidak dihapus.</span>
                    <Field label="Alasan" htmlFor="sus-r"><select id="sus-r" className={cls(inp(), "!h-10 text-sm")} value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Pilih alasan…</option>{SUSPEND_REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
                    <Field label="Catatan internal" hint="tidak dikirim ke pengguna" htmlFor="sus-n"><textarea id="sus-n" className={cls(area(), "min-h-16 text-sm")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
                    <div className="flex justify-end gap-2">
                      <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { setConfirm(false); setReason(""); setNote(""); }}>Batal</button>
                      <button type="button" aria-disabled={!reason} className={cls(btn.base, btn.small, reason ? "border-transparent bg-[#DC2626] text-white hover:bg-[#B91C1C]" : btn.disabled)}
                        onClick={() => { if (!reason) return flash("Pilih alasan dulu"); setSus({ ...sus, [u.id]: ["baru saja", reason] }); setConfirm(false); setReason(""); setNote(""); flash(`${u.name} ditangguhkan dan sudah dikeluarkan dari semua perangkat`); }}>Tangguhkan</button>
                    </div>
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 px-6 py-14 text-center"><b className="text-[15px]">Pilih pengguna</b><span className="text-[13.5px] text-[#716A65]">Klik salah satu baris untuk melihat akun, pemakaian, dan tindakan.</span></div>
          )}
        </aside>
      </div>
      {toast}
    </div>
  );
}
