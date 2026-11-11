"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Lock, Plus, Send } from "lucide-react";
import { isLastSuper, ME, TEAM, WORK_EMAIL, type Member, type MemberStatus } from "@/lib/akses";
import { ACTIONS, MODULES, ROLES, sensitiveModules, togglePerm, type Action, type Perms, type Role } from "@/lib/permissions";
import { btn, Chip, cls, Field, inp, TONE, useToast } from "./form-ui";

type Tab = "team" | "roles";
const STATUS: Record<MemberStatus, [string, string]> = { act: ["Aktif", TONE.ok], inv: ["Undangan", TONE.info], off: ["Nonaktif", TONE.neutral] };
const GRID = "grid grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_100px_minmax(160px,1fr)_100px_130px] items-center gap-x-3";
const PERM_GRID = "grid grid-cols-[minmax(240px,1.6fr)_repeat(4,minmax(80px,1fr))] items-center";
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

export function AccessManager() {
  const { flash, toast } = useToast();
  const [tab, setTabState] = useState<Tab>(useSearchParams().get("tab") === "peran" ? "roles" : "team");
  const [team, setTeam] = useState<Member[]>(TEAM);
  const [roles, setRoles] = useState<Role[]>(ROLES);
  const [sel, setSel] = useState("data");
  const [draft, setDraft] = useState<Record<string, Perms>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [newIds, setNewIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("support");

  const setTab = (t: Tab) => { setTabState(t); window.history.replaceState(null, "", t === "roles" ? "?tab=peran" : window.location.pathname); };
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const countOf = (id: string) => team.filter((m) => m.role === id && m.status !== "off").length;
  const patch = (id: string, o: Partial<Member>) => setTeam(team.map((m) => (m.id === id ? { ...m, ...o } : m)));

  const emailOk = WORK_EMAIL.test(invEmail.trim());
  const sendInvite = () => {
    if (!emailOk) return flash("Gunakan email kerja @stockplan.id");
    const e = invEmail.trim();
    setTeam([...team, { id: `n${team.length + 1}`, name: e.split("@")[0].replace(/^./, (c) => c.toUpperCase()), email: e, role: invRole, fa: false, last: "—", sub: "Undangan dikirim baru saja", status: "inv", color: "#0F766E" }]);
    setInviting(false); setInvEmail("");
    flash(`Undangan dikirim ke ${e} sebagai ${roleName(invRole)}`);
  };

  const cur = roles.find((r) => r.id === sel) ?? roles[1];
  const isNew = newIds.includes(cur.id);
  const editable = cur.id !== "super";
  const perms = draft[cur.id] ?? cur.perms;
  const dirty = !!draft[cur.id];
  const sens = sensitiveModules(perms);
  const toggle = (mod: string, action: Action) => {
    if (!editable) return flash("Izin super admin tidak bisa diubah");
    const m = MODULES.find((x) => x.key === mod)!;
    setDraft({ ...draft, [cur.id]: { ...perms, [mod]: togglePerm(perms[mod] ?? [], action, m.availableActions) } });
  };
  const discard = () => { const d = { ...draft }; delete d[cur.id]; setDraft(d); };
  const save = () => {
    if (!dirty) return;
    const nm = isNew ? (names[cur.id] ?? "").trim() : cur.name;
    if (isNew && !nm) return flash("Beri nama peran dulu");
    setRoles(roles.map((r) => (r.id === cur.id ? { ...r, name: nm, perms, sub: isNew ? "Peran kustom" : r.sub } : r)));
    setNewIds(newIds.filter((i) => i !== cur.id));
    discard();
    flash(`Izin ${nm} disimpan untuk ${countOf(cur.id)} anggota`);
  };
  const newRole = () => {
    const id = `r${newIds.length + 1}${roles.length}`;
    setRoles([...roles, { id, name: "", system: false, desc: "Centang izin yang dibutuhkan, lalu simpan.", sub: "Belum disimpan", perms: {} }]);
    setNewIds([...newIds, id]); setSel(id);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Akses &amp; peran</h1>
          <p className="text-[#716A65]">Siapa saja yang bisa masuk ke panel admin, dan apa yang boleh mereka lakukan. Setiap perubahan tercatat di Riwayat perubahan.</p>
        </div>
        <button type="button" className={cls(btn.base, btn.dark)} onClick={() => { setTab("team"); setInviting(true); }}><Plus aria-hidden size={16} strokeWidth={1.8} />Undang anggota</button>
      </div>

      <div role="tablist" aria-label="Bagian" className="flex w-fit gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
        {([["team", "Anggota tim", team.length], ["roles", "Peran & izin", roles.length]] as const).map(([k, l, n]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cls("inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>{l}<small className="font-mono text-[11.5px] text-[#716A65]">{n}</small></button>
        ))}
      </div>

      {tab === "team" ? (
        <section aria-label="Anggota tim" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
          {inviting && (
            <div role="group" aria-label="Undang anggota" className="flex flex-wrap items-center gap-2.5 border-b border-[#F0EEEC] bg-[#FAFAF9] p-4">
              <input type="email" placeholder="nama@stockplan.id" aria-label="Email anggota" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className={cls(inp(!!invEmail.trim() && !emailOk), "!h-10 min-w-60 flex-1 text-sm")} />
              <select aria-label="Peran" value={invRole} onChange={(e) => setInvRole(e.target.value)} className={cls(inp(), "!h-10 w-[180px] text-sm")}>{roles.filter((r) => !newIds.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <button type="button" className={cls(btn.base, btn.dark, btn.small)} onClick={sendInvite}><Send aria-hidden size={14} />Kirim undangan</button>
              <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { setInviting(false); setInvEmail(""); }}>Batal</button>
            </div>
          )}
          <div className="overflow-x-auto">
            <div role="table" aria-label="Anggota" className="min-w-[900px] text-sm">
              <div role="row" className={cls(GRID, "border-b border-[#E7E5E4] bg-[#FAFAF9] px-5 py-3 text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}>
                {["Anggota", "Peran", "2FA", "Terakhir masuk", "Status"].map((h) => <span key={h} role="columnheader">{h}</span>)}<span role="columnheader" className="sr-only">Aksi</span>
              </div>
              {team.map((m) => {
                const me = m.id === ME, lastSuper = isLastSuper(m, team), locked = me || lastSuper;
                return (
                  <div key={m.id} role="row" className={cls(GRID, "border-b border-[#F0EEEC] px-5 py-3.5 last:border-b-0")}>
                    <span role="cell" className="flex items-center gap-3">
                      <span aria-hidden className="inline-flex size-9 flex-none items-center justify-center rounded-full text-[13px] font-semibold text-white" style={{ background: m.color }}>{initials(m.name)}</span>
                      <span className="flex min-w-0 flex-col leading-tight"><b className="flex items-center gap-2 font-semibold">{m.name}{me && <span className="rounded bg-[#F5F5F4] px-1.5 text-[11px] font-semibold leading-[18px] text-[#57534E]">Anda</span>}</b><em className="truncate text-[12.5px] not-italic text-[#716A65]">{m.email}</em></span>
                    </span>
                    <span role="cell">
                      {locked ? <span className="flex flex-col text-[13.5px] leading-snug">{roleName(m.role)}<small className="text-xs text-[#716A65]">{me ? "Tidak bisa mengubah peran sendiri" : "Super admin terakhir"}</small></span> : (
                        <select aria-label={`Peran ${m.name}`} className={cls(inp(), "!h-10 text-sm")} value={m.role} onChange={(e) => { patch(m.id, { role: e.target.value }); flash(`Peran ${m.name} diubah menjadi ${roleName(e.target.value)}. Berlaku di sesi berikutnya.`); }}>
                          {roles.filter((r) => !newIds.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      )}
                    </span>
                    <span role="cell" className={cls("text-[13px] font-semibold", m.fa ? "text-[#15803D]" : "text-[#B91C1C]")}>{m.fa ? "✓ Aktif" : m.status === "inv" ? "Belum diatur" : "✕ Belum"}</span>
                    <span role="cell" className="flex flex-col text-[13px] leading-snug">{m.last}<small className="text-xs text-[#716A65]">{m.sub}</small></span>
                    <span role="cell"><Chip cls={STATUS[m.status][1]}>{STATUS[m.status][0]}</Chip></span>
                    <span role="cell" className="text-right">
                      {!me && (
                        <button type="button" className={cls(btn.base, btn.small, m.status === "act" ? "border-[#FECACA] bg-white text-[#B91C1C] hover:bg-[#FEF2F2]" : btn.outline)}
                          onClick={() => {
                            if (m.status === "act") { if (lastSuper) return flash("Harus ada minimal 1 super admin aktif"); patch(m.id, { status: "off" }); flash(`${m.name} dinonaktifkan dan dikeluarkan dari semua sesi`); }
                            else if (m.status === "inv") flash(`Undangan dikirim ulang ke ${m.email}. Berlaku 72 jam.`);
                            else { patch(m.id, { status: "act" }); flash(`${m.name} diaktifkan lagi`); }
                          }}>{m.status === "act" ? "Nonaktifkan" : m.status === "inv" ? "Kirim ulang" : "Aktifkan lagi"}</button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-[#F0EEEC] bg-[#FAFAF9] px-5 py-3.5 text-[13px] text-[#716A65]">Anggota wajib mengaktifkan 2FA sebelum bisa membuka data. Minimal harus ada 1 super admin aktif.</div>
        </section>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <section aria-label="Daftar peran" className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
            {roles.map((r) => (
              <button key={r.id} type="button" aria-pressed={r.id === cur.id} onClick={() => setSel(r.id)} className={cls("flex w-full flex-col gap-0.5 border-b border-[#F0EEEC] px-4 py-3 text-left", r.id === cur.id ? "bg-[#FFFBF2] shadow-[inset_3px_0_0_#FEA722]" : "hover:bg-[#FAFAF9]")}>
                <b className="flex items-center gap-1.5 text-sm font-semibold">{(names[r.id] ?? r.name) || "Peran baru"}{r.system && <Lock aria-label="Peran bawaan" size={12} className="text-[#716A65]" />}</b>
                <small className="text-[12.5px] text-[#716A65]">{r.sub} · {countOf(r.id)} orang</small>
              </button>
            ))}
            <div className="p-3"><button type="button" className={cls(btn.base, btn.outline, btn.small, "w-full")} onClick={newRole}><Plus aria-hidden size={14} />Buat peran baru</button></div>
          </section>

          <section aria-label="Izin peran" className="min-w-0 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
            <div className="flex flex-col gap-1.5 border-b border-[#F0EEEC] p-5">
              <div className="flex items-center gap-2.5"><b className="text-base font-semibold">{(isNew ? names[cur.id] : cur.name) || "Peran baru"}</b><Chip cls={TONE.neutral}>{countOf(cur.id)} orang</Chip>{cur.system && <Chip cls={TONE.neutral}>Peran bawaan</Chip>}</div>
              <span className="text-[13.5px] text-[#716A65]">{cur.desc}</span>
              {isNew && <Field label="Nama peran" htmlFor="rn"><input id="rn" className={inp()} value={names[cur.id] ?? ""} onChange={(e) => setNames({ ...names, [cur.id]: e.target.value })} placeholder="mis. Penulis konten" /></Field>}
            </div>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Izin per modul" className="min-w-[640px]">
                <div role="row" className={cls(PERM_GRID, "border-b border-[#E7E5E4] bg-[#FAFAF9] px-5 py-3 text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}>
                  <span role="columnheader">Modul</span>{ACTIONS.map(([a, l]) => <span key={a} role="columnheader" className="text-center">{l}</span>)}
                </div>
                {MODULES.map((m) => (
                  <div key={m.key} role="row" className={cls(PERM_GRID, "border-b border-[#F0EEEC] px-5 py-3 last:border-b-0")}>
                    <span role="rowheader" className="flex flex-col text-sm leading-snug"><b className="flex items-center gap-2 font-semibold">{m.name}{m.superOnly && <span className="rounded bg-[#FEF3C7] px-1.5 text-[11px] font-semibold leading-[18px] text-[#92400E]">Sensitif</span>}</b><small className="text-[12.5px] font-normal text-[#716A65]">{m.desc}</small></span>
                    {ACTIONS.map(([a, l]) => {
                      const avail = m.availableActions.includes(a), on = (perms[m.key] ?? []).includes(a);
                      return (
                        <span key={a} role="cell" className="flex justify-center">
                          <button type="button" role="checkbox" aria-checked={on} aria-disabled={!avail || !editable} aria-label={`${l} ${m.name}`} onClick={() => avail && toggle(m.key, a)}
                            className={cls("inline-flex size-[22px] items-center justify-center rounded-md border-[1.5px] text-xs font-bold text-white", on ? "border-[#1C1917] bg-[#1C1917]" : "border-[#A8A29E] bg-white", !avail && "cursor-not-allowed border-transparent !bg-[#F5F5F4]", avail && !editable && "cursor-not-allowed opacity-60")}>
                            {on ? "✓" : !avail ? <span className="text-[#D6D3D1]">–</span> : ""}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EEEC] px-5 py-3.5">
              <span className="text-[12.5px] text-[#716A65]">{!editable ? "Super admin selalu punya semua izin." : sens.length ? `Peran ini punya izin sensitif: ${sens.join(", ")}. Perubahan dicatat di Riwayat.` : dirty ? "Ada perubahan yang belum disimpan." : "Perubahan berlaku saat anggota masuk berikutnya."}</span>
              {editable && (
                <div className="flex gap-2">
                  <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={discard}>Batalkan</button>
                  <button type="button" aria-disabled={!dirty} className={cls(btn.base, btn.small, dirty ? btn.dark : btn.disabled)} onClick={save}>Simpan izin</button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {toast}
    </div>
  );
}
