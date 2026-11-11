"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isLastSuper, ME, TEAM, WORK_EMAIL, type Member, type MemberStatus } from "@/lib/akses";
import { ACTIONS, MODULES, ROLES, sensitiveModules, togglePerm, type Action, type Perms, type Role } from "@/lib/permissions";
import { EntityAvatar, FormField, Help, PageHeader, StatusBadge, type Tone } from "./form-ui";

type Tab = "team" | "roles";
const STATUS: Record<MemberStatus, [string, Tone]> = { act: ["Aktif", "success"], inv: ["Undangan", "info"], off: ["Nonaktif", "neutral"] };
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

export function AccessManager() {
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
    if (!emailOk) return toast("Gunakan email kerja @stockplan.id");
    const e = invEmail.trim();
    setTeam([...team, { id: `n${team.length + 1}`, name: e.split("@")[0].replace(/^./, (c) => c.toUpperCase()), email: e, role: invRole, fa: false, last: "—", sub: "Undangan dikirim baru saja", status: "inv", color: "#0F766E" }]);
    setInviting(false); setInvEmail("");
    toast(`Undangan dikirim ke ${e} sebagai ${roleName(invRole)}`);
  };

  const cur = roles.find((r) => r.id === sel) ?? roles[1];
  const isNew = newIds.includes(cur.id);
  const editable = cur.id !== "super";
  const perms = draft[cur.id] ?? cur.perms;
  const dirty = !!draft[cur.id];
  const sens = sensitiveModules(perms);
  const toggle = (mod: string, action: Action) => {
    if (!editable) return toast("Izin super admin tidak bisa diubah");
    const m = MODULES.find((x) => x.key === mod)!;
    setDraft({ ...draft, [cur.id]: { ...perms, [mod]: togglePerm(perms[mod] ?? [], action, m.availableActions) } });
  };
  const discard = () => { const d = { ...draft }; delete d[cur.id]; setDraft(d); };
  const save = () => {
    if (!dirty) return;
    const nm = isNew ? (names[cur.id] ?? "").trim() : cur.name;
    if (isNew && !nm) return toast("Beri nama peran dulu");
    setRoles(roles.map((r) => (r.id === cur.id ? { ...r, name: nm, perms, sub: isNew ? "Peran kustom" : r.sub } : r)));
    setNewIds(newIds.filter((i) => i !== cur.id));
    discard();
    toast(`Izin ${nm} disimpan untuk ${countOf(cur.id)} anggota`);
  };
  const newRole = () => {
    const id = `r${newIds.length + 1}${roles.length}`;
    setRoles([...roles, { id, name: "", system: false, desc: "Centang izin yang dibutuhkan, lalu simpan.", sub: "Belum disimpan", perms: {} }]);
    setNewIds([...newIds, id]); setSel(id);
  };

  const roleOptions = roles.filter((r) => !newIds.includes(r.id)).map((r) => <NativeSelectOption key={r.id} value={r.id}>{r.name}</NativeSelectOption>);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Akses & peran" desc="Siapa saja yang bisa masuk ke panel admin, dan apa yang boleh mereka lakukan. Setiap perubahan tercatat di Riwayat perubahan."
        actions={<Button variant="secondary" onClick={() => { setTab("team"); setInviting(true); }}><Plus aria-hidden />Undang anggota</Button>} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-5">
        <TabsList aria-label="Bagian">
          <TabsTrigger value="team" className="px-3.5 text-sm">Anggota tim<small className="font-mono text-[11.5px] font-normal text-muted-foreground">{team.length}</small></TabsTrigger>
          <TabsTrigger value="roles" className="px-3.5 text-sm">Peran &amp; izin<small className="font-mono text-[11.5px] font-normal text-muted-foreground">{roles.length}</small></TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card aria-label="Anggota tim" className="min-w-0 gap-0 py-0">
            {inviting && (
              <div role="group" aria-label="Undang anggota" className="flex flex-wrap items-center gap-2.5 border-b border-sp-line-soft bg-accent p-4">
                <Input type="email" placeholder="nama@stockplan.id" aria-label="Email anggota" aria-invalid={!!invEmail.trim() && !emailOk} value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className="h-10 min-w-60 flex-1 text-sm" />
                <NativeSelect size="sm" aria-label="Peran" value={invRole} onChange={(e) => setInvRole(e.target.value)} className="w-[180px]">{roleOptions}</NativeSelect>
                <Button variant="secondary" size="sm" onClick={sendInvite}><Send aria-hidden />Kirim undangan</Button>
                <Button variant="outline" size="sm" onClick={() => { setInviting(false); setInvEmail(""); }}>Batal</Button>
              </div>
            )}
            <Table className="min-w-[900px]">
              <TableHeader><TableRow className="hover:bg-transparent">{["Anggota", "Peran", "2FA", "Terakhir masuk", "Status"].map((h) => <TableHead key={h}>{h}</TableHead>)}<TableHead><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {team.map((m) => {
                  const me = m.id === ME, lastSuper = isLastSuper(m, team), locked = me || lastSuper;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <EntityAvatar code={initials(m.name)} size={36} color={m.color} className="[&_[data-slot=avatar-fallback]]:font-sans" />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="flex items-center gap-2 font-semibold">{m.name}{me && <StatusBadge tone="neutral" className="h-[18px] rounded px-1.5 text-[11px] before:hidden">Anda</StatusBadge>}</b><em className="truncate text-[12.5px] text-muted-foreground not-italic">{m.email}</em></span>
                        </span>
                      </TableCell>
                      <TableCell className="w-[220px]">
                        {locked ? <span className="flex flex-col text-[13.5px] leading-snug">{roleName(m.role)}<small className="text-xs text-muted-foreground">{me ? "Tidak bisa mengubah peran sendiri" : "Super admin terakhir"}</small></span> : (
                          <NativeSelect size="sm" aria-label={`Peran ${m.name}`} value={m.role} onChange={(e) => { patch(m.id, { role: e.target.value }); toast(`Peran ${m.name} diubah menjadi ${roleName(e.target.value)}. Berlaku di sesi berikutnya.`); }}>{roleOptions}</NativeSelect>
                        )}
                      </TableCell>
                      <TableCell className={cn("text-[13px] font-semibold", m.fa ? "text-sp-success" : "text-(--sp-danger-text)")}>{m.fa ? "✓ Aktif" : m.status === "inv" ? "Belum diatur" : "✕ Belum"}</TableCell>
                      <TableCell className="text-[13px] leading-snug">{m.last}<small className="block text-xs text-muted-foreground">{m.sub}</small></TableCell>
                      <TableCell><StatusBadge tone={STATUS[m.status][1]}>{STATUS[m.status][0]}</StatusBadge></TableCell>
                      <TableCell className="text-right">
                        {!me && (
                          <Button size="sm" variant={m.status === "act" ? "destructive-outline" : "outline"}
                            onClick={() => {
                              if (m.status === "act") { if (lastSuper) return toast("Harus ada minimal 1 super admin aktif"); patch(m.id, { status: "off" }); toast(`${m.name} dinonaktifkan dan dikeluarkan dari semua sesi`); }
                              else if (m.status === "inv") toast(`Undangan dikirim ulang ke ${m.email}. Berlaku 72 jam.`);
                              else { patch(m.id, { status: "act" }); toast(`${m.name} diaktifkan lagi`); }
                            }}>{m.status === "act" ? "Nonaktifkan" : m.status === "inv" ? "Kirim ulang" : "Aktifkan lagi"}</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <CardFooter>Anggota wajib mengaktifkan 2FA sebelum bisa membuka data. Minimal harus ada 1 super admin aktif.</CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card aria-label="Daftar peran" className="gap-0 py-0">
              {roles.map((r) => (
                <Item key={r.id} aria-pressed={r.id === cur.id} onClick={() => setSel(r.id)} render={<button type="button" />}
                  className={cn("rounded-none border-0 border-b border-sp-line-soft px-4 py-3 text-left", r.id === cur.id ? "bg-[#FFFBF2] shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-accent")}>
                  <ItemContent className="gap-0.5">
                    <ItemTitle>{(names[r.id] ?? r.name) || "Peran baru"}{r.system && <Lock aria-label="Peran bawaan" className="size-3 text-muted-foreground" />}</ItemTitle>
                    <ItemDescription className="text-[12.5px]">{r.sub} · {countOf(r.id)} orang</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
              <CardContent className="p-3"><Button variant="outline" size="sm" className="w-full" onClick={newRole}><Plus aria-hidden />Buat peran baru</Button></CardContent>
            </Card>

            <Card aria-label="Izin peran" className="min-w-0 gap-0 py-0">
              <CardHeader className="gap-1.5 border-b border-sp-line-soft py-5 [.border-b]:pb-5">
                <CardTitle className="flex items-center gap-2.5 text-base">{(isNew ? names[cur.id] : cur.name) || "Peran baru"}<StatusBadge tone="neutral" className="before:hidden">{countOf(cur.id)} orang</StatusBadge>{cur.system && <StatusBadge tone="neutral" className="before:hidden">Peran bawaan</StatusBadge>}</CardTitle>
                <CardDescription>{cur.desc}</CardDescription>
                {isNew && <FormField label="Nama peran" htmlFor="rn" className="mt-1"><Input id="rn" value={names[cur.id] ?? ""} onChange={(e) => setNames({ ...names, [cur.id]: e.target.value })} placeholder="mis. Penulis konten" /></FormField>}
              </CardHeader>
              <Table aria-label="Izin per modul" className="min-w-[640px]">
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Modul</TableHead>{ACTIONS.map(([a, l]) => <TableHead key={a} className="text-center">{l}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {MODULES.map((m) => (
                    <TableRow key={m.key}>
                      <TableHead scope="row" className="h-auto py-3 text-sm font-normal tracking-normal whitespace-normal text-foreground normal-case">
                        <b className="flex items-center gap-2 font-semibold">{m.name}{m.superOnly && <StatusBadge tone="warning" className="h-[18px] rounded px-1.5 text-[11px] before:hidden">Sensitif</StatusBadge>}</b>
                        <small className="text-[12.5px] text-muted-foreground">{m.desc}</small>
                      </TableHead>
                      {ACTIONS.map(([a, l]) => {
                        const avail = m.availableActions.includes(a), on = (perms[m.key] ?? []).includes(a);
                        return (
                          <TableCell key={a} className="text-center">
                            {avail ? (
                              <Checkbox aria-label={`${l} ${m.name}`} checked={on} disabled={!editable} onCheckedChange={() => toggle(m.key, a)} className="mx-auto" />
                            ) : <span aria-label={`${l} tidak tersedia untuk ${m.name}`} className="text-input">–</span>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CardFooter className="flex-wrap justify-between gap-3 bg-background">
                <Help className="w-auto">{!editable ? "Super admin selalu punya semua izin." : sens.length ? `Peran ini punya izin sensitif: ${sens.join(", ")}. Perubahan dicatat di Riwayat.` : dirty ? "Ada perubahan yang belum disimpan." : "Perubahan berlaku saat anggota masuk berikutnya."}</Help>
                {editable && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={discard}>Batalkan</Button>
                    <Button variant="secondary" size="sm" aria-disabled={!dirty} onClick={save}>Simpan izin</Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
