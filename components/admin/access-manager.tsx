"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { changeRole, createRole, deactivateMember, inviteMember, listMembers, listRoles, reactivateMember, resendInvite, saveRole, type Member, type MemberStatus, type Members, type Role, type Roles } from "@/lib/admin-access";
import { describeError } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { fmtWhen } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WORK_EMAIL } from "@/lib/akses";
import { ACTIONS, sensitiveModules, togglePerm, type Action, type Perms } from "@/lib/permissions";
import { EntityAvatar, FormField, Help, PageHeader, StatusBadge, type Tone } from "./form-ui";
import { useAdmin } from "./session";

type Tab = "team" | "roles";
const TONE: Record<MemberStatus, Tone> = { active: "success", invited: "info", disabled: "neutral" };
const AVATAR = ["#92400E", "#1C1917", "#57534E", "#BE185D", "#1D4ED8", "#0F766E", "#78716C"];
const colorOf = (t: string) => AVATAR[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length];
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);
const day = (iso: string | null) => (iso ? fmtWhen(iso).replace(/^(Hari ini|Kemarin), .*/, "$1") : "");
// "3 gagal masuk pagi ini" / "Undangan dikirim 5 Nov" / "Dinonaktifkan 1 Okt" / the device of the last login
const subOf = (m: Member) => m.failedToday ? `${m.failedToday} gagal masuk pagi ini` : m.status === "invited" ? `Undangan dikirim ${day(m.invite?.sentAt ?? null)}` : m.status === "disabled" ? `Dinonaktifkan ${day(m.disabledAt)}` : m.lastLogin?.device ?? "";

type Loaded = { key: string; data?: { members: Members; roles: Roles }; error?: ApiError };

export function AccessManager() {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = String(reload);

  useEffect(() => {
    let live = true;
    void Promise.all([listMembers(), listRoles()]).then(([m, r]) => {
      if (!live) return;
      if (!m.ok) return setLoaded({ key, error: m.error });
      if (!r.ok) return setLoaded({ key, error: r.error });
      setLoaded({ key, data: { members: m.data, roles: r.data } });
    });
    return () => { live = false; };
  }, [key]);

  if (!loaded || loaded.key !== key) {
    return <div role="status" aria-busy="true" aria-label="Memuat akses & peran" className="flex flex-col gap-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-72" /></div>;
  }
  if (!loaded.data) {
    return (
      <Empty className="py-16">
        <EmptyHeader><EmptyTitle>Akses & peran tidak bisa dimuat</EmptyTitle><EmptyDescription>{loaded.error ? describeError(loaded.error) : ""}</EmptyDescription></EmptyHeader>
        <EmptyContent className="flex-row justify-center"><Button variant="outline" onClick={() => setReload((n) => n + 1)}><RefreshCw aria-hidden />Coba lagi</Button></EmptyContent>
      </Empty>
    );
  }
  return <AccessView members={loaded.data.members.members} roles={loaded.data.roles} />;
}

function AccessView({ members, roles: loadedRoles }: { members: Member[]; roles: Roles }) {
  const { admin } = useAdmin();
  const modules = loadedRoles.modules;
  const [tab, setTabState] = useState<Tab>(useSearchParams().get("tab") === "peran" ? "roles" : "team");
  const [team, setTeam] = useState<Member[]>(members);
  const [roles, setRoles] = useState<Role[]>(loadedRoles.roles);
  const [sel, setSel] = useState((loadedRoles.roles.find((r) => r.id === "data") ?? loadedRoles.roles[0]).id);
  const [draft, setDraft] = useState<Record<string, Perms>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [newIds, setNewIds] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("support");

  const setTab = (t: Tab) => { setTabState(t); window.history.replaceState(null, "", t === "roles" ? "?tab=peran" : window.location.pathname); };
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const countOf = (id: string) => team.filter((m) => m.role.id === id && m.status !== "disabled").length;
  const put = (m: Member) => setTeam(team.map((x) => (x.id === m.id ? m : x)));

  // One member action: call the API, swap in the member it returns, toast the design copy.
  const act = async (m: Member, call: () => ReturnType<typeof deactivateMember>, done: string) => {
    setBusy(m.id);
    const r = await call();
    setBusy("");
    if (!r.ok) return toast(describeError(r.error));
    put(r.data.member);
    toast(done);
  };
  const onRole = (m: Member, role: string) => void act(m, () => changeRole(m.id, role), `Peran ${m.name} diubah menjadi ${roleName(role)}. Berlaku langsung.`); // COPY: perlu review (design: "Berlaku di sesi berikutnya", server menerapkannya langsung)

  const emailOk = WORK_EMAIL.test(invEmail.trim());
  const sendInvite = async () => {
    if (!emailOk) return toast("Gunakan email kerja @stockplan.id");
    const e = invEmail.trim();
    setBusy("invite");
    const r = await inviteMember(e, invRole);
    setBusy("");
    if (!r.ok) return toast(describeError(r.error));
    setTeam([...team, r.data.member]);
    setInviting(false); setInvEmail("");
    toast(`Undangan dikirim ke ${e} sebagai ${roleName(invRole)}`);
  };

  const cur = roles.find((r) => r.id === sel) ?? roles[0];
  const isNew = newIds.includes(cur.id);
  const own = cur.id === admin.role; // the API refuses it too (OWN_ROLE): stops widening your own role
  const editable = !cur.locked && !own;
  const perms = draft[cur.id] ?? cur.perms;
  const dirty = !!draft[cur.id];
  const sens = sensitiveModules(perms, modules);
  const toggle = (mod: string, action: Action) => {
    if (!editable) return toast(cur.locked ? "Izin super admin tidak bisa diubah" : "Tidak bisa mengubah izin peran Anda sendiri"); // COPY: perlu review (kalimat kedua, dari API)
    const m = modules.find((x) => x.key === mod)!;
    setDraft({ ...draft, [cur.id]: { ...perms, [mod]: togglePerm(perms[mod] ?? [], action, m.actions) } });
  };
  const discard = () => { const d = { ...draft }; delete d[cur.id]; setDraft(d); };
  const save = async () => {
    if (!dirty) return;
    const nm = isNew ? (names[cur.id] ?? "").trim() : cur.name;
    if (isNew && !nm) return toast("Beri nama peran dulu");
    setBusy("role");
    const r = isNew ? await createRole(nm, perms) : await saveRole(cur.id, perms);
    setBusy("");
    if (!r.ok) return toast(describeError(r.error));
    setRoles(roles.map((x) => (x.id === cur.id ? r.data.role : x)));
    setNewIds(newIds.filter((i) => i !== cur.id));
    setSel(r.data.role.id);
    discard();
    toast(`Izin ${r.data.role.name} disimpan untuk ${countOf(r.data.role.id)} anggota`);
  };
  const newRole = () => {
    const id = `new-${newIds.length + 1}`;
    setRoles([...roles, { id, name: "", summary: "Belum disimpan", description: "Centang izin yang dibutuhkan, lalu simpan.", system: false, locked: false, memberCount: 0, perms: {}, sensitive: [] }]);
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
                <Button variant="secondary" size="sm" disabled={busy === "invite"} onClick={() => void sendInvite()}><Send aria-hidden />Kirim undangan</Button>
                <Button variant="outline" size="sm" onClick={() => { setInviting(false); setInvEmail(""); }}>Batal</Button>
              </div>
            )}
            <Table className="min-w-[900px]">
              <TableHeader><TableRow className="hover:bg-transparent">{["Anggota", "Peran", "2FA", "Terakhir masuk", "Status"].map((h) => <TableHead key={h}>{h}</TableHead>)}<TableHead><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {team.map((m) => {
                  const me = m.me, a = m.actions, hasAction = a.deactivate || a.resendInvite || a.reactivate;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <EntityAvatar code={initials(m.name)} size={36} color={colorOf(m.email)} className="[&_[data-slot=avatar-fallback]]:font-sans" />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="flex items-center gap-2 font-semibold">{m.name}{me && <StatusBadge tone="neutral" className="h-[18px] rounded px-1.5 text-[11px] before:hidden">Anda</StatusBadge>}</b><em className="truncate text-[12.5px] text-muted-foreground not-italic">{m.email}</em></span>
                        </span>
                      </TableCell>
                      <TableCell className="w-[220px]">
                        {m.roleLocked ? <span className="flex flex-col text-[13.5px] leading-snug">{m.role.name}<small className="text-xs text-muted-foreground">{m.roleLockReason}</small></span> : (
                          <NativeSelect size="sm" aria-label={`Peran ${m.name}`} disabled={busy === m.id} value={m.role.id} onChange={(e) => onRole(m, e.target.value)}>{roleOptions}</NativeSelect>
                        )}
                      </TableCell>
                      <TableCell className={cn("text-[13px] font-semibold", m.twoFactor === "active" ? "text-sp-success" : "text-(--sp-danger-text)")}>{m.twoFactor === "active" ? "✓ Aktif" : m.twoFactor === "pending" ? "Belum diatur" : "✕ Belum"}</TableCell>
                      <TableCell className="text-[13px] leading-snug">{m.lastLogin ? fmtWhen(m.lastLogin.at) : "—"}<small className="block text-xs text-muted-foreground">{subOf(m)}</small></TableCell>
                      <TableCell><StatusBadge tone={TONE[m.status]}>{m.statusLabel}</StatusBadge></TableCell>
                      <TableCell className="text-right">
                        {hasAction && (
                          <Button size="sm" variant={a.deactivate ? "destructive-outline" : "outline"} disabled={busy === m.id}
                            onClick={() => {
                              if (a.deactivate) void act(m, () => deactivateMember(m.id), `${m.name} dinonaktifkan dan dikeluarkan dari semua sesi`);
                              else if (a.resendInvite) void act(m, () => resendInvite(m.id), `Undangan dikirim ulang ke ${m.email}. Berlaku 72 jam.`);
                              else void act(m, () => reactivateMember(m.id), `${m.name} diaktifkan lagi`);
                            }}>{a.deactivate ? "Nonaktifkan" : a.resendInvite ? "Kirim ulang" : "Aktifkan lagi"}</Button>
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
                    <ItemDescription className="text-[12.5px]">{r.summary ?? "Peran kustom"} · {countOf(r.id)} orang</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
              <CardContent className="p-3"><Button variant="outline" size="sm" className="w-full" onClick={newRole}><Plus aria-hidden />Buat peran baru</Button></CardContent>
            </Card>

            <Card aria-label="Izin peran" className="min-w-0 gap-0 py-0">
              <CardHeader className="gap-1.5 border-b border-sp-line-soft py-5 [.border-b]:pb-5">
                <CardTitle className="flex items-center gap-2.5 text-base">{(isNew ? names[cur.id] : cur.name) || "Peran baru"}<StatusBadge tone="neutral" className="before:hidden">{countOf(cur.id)} orang</StatusBadge>{cur.system && <StatusBadge tone="neutral" className="before:hidden">Peran bawaan</StatusBadge>}</CardTitle>
                <CardDescription>{cur.description}</CardDescription>
                {isNew && <FormField label="Nama peran" htmlFor="rn" className="mt-1"><Input id="rn" value={names[cur.id] ?? ""} onChange={(e) => setNames({ ...names, [cur.id]: e.target.value })} placeholder="mis. Penulis konten" /></FormField>}
              </CardHeader>
              <Table aria-label="Izin per modul" className="min-w-[640px]">
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Modul</TableHead>{ACTIONS.map(([a, l]) => <TableHead key={a} className="text-center">{l}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {modules.map((m) => (
                    <TableRow key={m.key}>
                      <TableHead scope="row" className="h-auto py-3 text-sm font-normal tracking-normal whitespace-normal text-foreground normal-case">
                        <b className="flex items-center gap-2 font-semibold">{m.name}{m.sensitive && <StatusBadge tone="warning" className="h-[18px] rounded px-1.5 text-[11px] before:hidden">Sensitif</StatusBadge>}</b>
                        <small className="text-[12.5px] text-muted-foreground">{m.desc}</small>
                      </TableHead>
                      {ACTIONS.map(([a, l]) => {
                        const avail = m.actions.includes(a), on = (perms[m.key] ?? []).includes(a);
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
                <Help className="w-auto">{!editable ? (cur.locked ? "Super admin selalu punya semua izin." : "Anda tidak bisa mengubah izin peran Anda sendiri.") : sens.length ? `Peran ini punya izin sensitif: ${sens.join(", ")}. Perubahan dicatat di Riwayat.` : dirty ? "Ada perubahan yang belum disimpan." : "Perubahan berlaku langsung."}</Help>
                {editable && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={discard}>Batalkan</Button>
                    <Button variant="secondary" size="sm" aria-disabled={!dirty} disabled={busy === "role"} onClick={() => void save()}>Simpan izin</Button>
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
