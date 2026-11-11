"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, Download, Flag, KeyRound, Lock, Mail, Plus, RotateCcw, Send, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEEDBACK, LOGINS, PLAN_LABEL, statusOf, SUSPEND_REASONS, SUSPENDED_INIT, TOTALS, USERS, initials, type Plan, type Status } from "@/lib/pengguna";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyResult, EntityAvatar, FilterTabs, FormField, Note, PageHeader, Pager, SearchInput, StatCard, StatusBadge, type Tone } from "./form-ui";

type Tab = "all" | Status;
const TABS: [Tab, string][] = [["all", "Semua"], ["act", "Aktif"], ["new", "Belum konfirmasi"], ["idle", "Tidak aktif"], ["sus", "Ditangguhkan"]];
const ST: Record<Status, [string, Tone]> = { act: ["Aktif", "success"], new: ["Belum konfirmasi", "info"], idle: ["Tidak aktif", "neutral"], sus: ["Ditangguhkan", "danger"] };
const PLAN_VARIANT: Record<Plan, "amber" | "neutral" | "ghost"> = { y: "amber", m: "neutral", n: "ghost" };
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const UserAvatar = ({ i, name, size = 32 }: { i: number; name: string; size?: number }) => <EntityAvatar code={initials(name)} size={size} color={AVATAR[i % AVATAR.length]} className="[&_[data-slot=avatar-fallback]]:font-sans" />;
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="text-[11.5px] font-semibold tracking-[.06em] text-muted-foreground uppercase">{children}</h3>;
const Panel = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-3 px-5 py-4">{children}</div>;

export function UserManager() {
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
  const cancelSuspend = () => { setConfirm(false); setReason(""); setNote(""); };
  const logins = u ? (u.status === "sus" ? LOGINS.act.slice(0, 1).map(([d]) => [d, u.last]) : LOGINS[u.activity]) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Pengguna" desc="Akun beta StockPlan. Semua akses masih gratis sampai rilis; belum ada penagihan." actions={<>
        <Button variant="outline" onClick={() => toast("CSV pengguna sedang disiapkan. Isi tesis dan portofolio tidak ikut diekspor.")}><Download aria-hidden />Ekspor CSV</Button>
        <Button variant="secondary" onClick={() => setInviting(true)}><Plus aria-hidden />Undang pengguna</Button>
      </>} />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Pengguna beta" value="1.284" note={<><em className="font-semibold text-sp-success not-italic">+86</em> minggu ini</>} />
        <StatCard label="Aktif 7 hari terakhir" value="612" note="48% dari semua pengguna" />
        <StatCard label="Sudah menulis tesis" value="538" note="rata-rata 2,4 tesis per orang" />
        <StatCard label="Minat berlangganan" value="391" note={<>minta diingatkan · <em className="font-semibold text-sp-success not-italic">64%</em> tahunan</>} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_383px]">
        <Card aria-label="Daftar pengguna" className="min-w-0 gap-0 py-0">
          <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
            <SearchInput label="Cari pengguna" placeholder="Cari nama atau email" value={q} onChange={setQ} className="max-w-[360px]" />
            <NativeSelect size="sm" aria-label="Minat paket" value={plan} onChange={(e) => setPlan(e.target.value)} className="ml-auto w-[190px]">
              <NativeSelectOption value="">Semua minat paket</NativeSelectOption><NativeSelectOption value="y">Tahunan</NativeSelectOption><NativeSelectOption value="m">Bulanan</NativeSelectOption><NativeSelectOption value="n">Belum memilih</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="border-b border-sp-line-soft px-4 pb-3">
            <FilterTabs label="Filter status" value={tab} onChange={setTab} tabs={TABS.map(([v, label]) => ({ v, label, n: (filtered ? TOTALS[v] : base.filter((x) => v === "all" || x.status === v).length).toLocaleString("id-ID") }))} />
          </div>

          {inviting && (
            <div role="group" aria-label="Undang pengguna beta" className="flex flex-wrap items-center gap-2.5 border-b border-sp-line-soft bg-accent p-4">
              <Input type="email" placeholder="email@contoh.com" aria-label="Email yang diundang" aria-invalid={!!invEmail.trim() && !invOk} value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className="h-10 min-w-60 flex-1 text-sm" />
              <Button variant="secondary" size="sm" onClick={() => { if (!invOk) return toast("Email belum valid"); toast(`Undangan beta dikirim ke ${invEmail.trim()}`); setInviting(false); setInvEmail(""); }}><Send aria-hidden />Kirim undangan</Button>
              <Button variant="outline" size="sm" onClick={() => { setInviting(false); setInvEmail(""); }}>Batal</Button>
            </div>
          )}

          {rows.length ? (
            <>
              <Table className="min-w-[640px]">
                <TableHeader><TableRow className="hover:bg-transparent">{["Pengguna", "Status", "Terakhir aktif", "Tesis", "Minat paket"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} onClick={() => select(r.id)} data-state={sel === r.id ? "selected" : undefined} className="cursor-pointer data-[state=selected]:bg-[#FFFBF2] data-[state=selected]:shadow-[inset_3px_0_0_var(--primary)]">
                      <TableCell>
                        <Button variant="ghost" aria-pressed={sel === r.id} aria-label={`Lihat detail ${r.name}`} onClick={(e) => { e.stopPropagation(); select(r.id); }} className="h-auto w-full justify-start gap-2.5 p-0 text-left font-normal hover:bg-transparent">
                          <UserAvatar i={r.i} name={r.name} />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="truncate font-semibold">{r.name}</b><em className="truncate text-[12.5px] text-muted-foreground not-italic">{r.email}</em></span>
                        </Button>
                      </TableCell>
                      <TableCell><StatusBadge tone={ST[r.status][1]}>{ST[r.status][0]}</StatusBadge></TableCell>
                      <TableCell className="text-[13px]">{r.last}</TableCell>
                      <TableCell className="font-mono text-[13px]">{r.tesis}</TableCell>
                      <TableCell><Badge variant={PLAN_VARIANT[r.plan]} className={cn("rounded-md font-semibold", r.plan === "n" && "text-sp-faint")}>{PLAN_LABEL[r.plan][0]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager text={`Menampilkan 1–${rows.length} dari ${(filtered ? TOTALS[tab] : rows.length).toLocaleString("id-ID")} pengguna`} onNext={() => toast("Halaman berikutnya belum tersedia (data contoh)")} />
            </>
          ) : (
            <EmptyResult title="Tidak ada pengguna yang cocok" desc="Coba nama atau email lain, atau hapus filter." onReset={() => { setQ(""); setPlan(""); setTab("all"); }} />
          )}
        </Card>

        <Card aria-label="Detail pengguna" className="sticky top-4 gap-0 py-0">
          {u ? (
            <>
              <div className="flex items-start gap-3.5 p-5">
                <UserAvatar i={u.i} name={u.name} size={52} />
                <div className="flex min-w-0 flex-1 flex-col"><b className="text-base font-semibold">{u.name}</b><span className="truncate text-[13px] text-muted-foreground">{u.email}</span><StatusBadge tone={ST[u.status][1]} className="mt-1 self-start">{ST[u.status][0]}</StatusBadge></div>
                <Button variant="ghost" size="icon-sm" aria-label="Tutup detail" onClick={() => { setSel(""); setConfirm(false); }}><X /></Button>
              </div>

              {sus[u.id] && (
                <><Separator /><Panel>
                  <Alert variant="destructive"><ShieldAlert aria-hidden /><AlertDescription><b>Ditangguhkan {sus[u.id][0]}</b> · {sus[u.id][1]}. Pengguna tidak bisa masuk, datanya tetap tersimpan.</AlertDescription></Alert>
                </Panel></>
              )}

              <Separator />
              <Panel>
                <H3>Akun</H3>
                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Bergabung</dt><dd>{u.joined}</dd>
                  <dt className="text-muted-foreground">Masuk dengan</dt><dd>{u.login}</dd>
                  <dt className="text-muted-foreground">Email</dt><dd>{u.verified ? "Terkonfirmasi" : "Belum dikonfirmasi"}</dd>
                  <dt className="text-muted-foreground">Langganan</dt><dd>Akses beta · gratis</dd>
                  <dt className="text-muted-foreground">Minat paket</dt><dd>{PLAN_LABEL[u.plan][1]}{u.plan !== "n" && " · minta diingatkan"}</dd>
                </dl>
              </Panel>

              <Separator />
              <Panel>
                <H3>Pemakaian</H3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[[u.tesis, "tesis ditulis"], [u.evals, "evaluasi tesis"], [u.ems, "emiten dipantau"], [u.temas, "tema dibuka"]].map(([v, l]) => (
                    <Card key={l} size="sm" className="py-3 shadow-none"><CardContent className="flex flex-col px-3"><b className="font-mono text-lg font-semibold">{v}</b><span className="text-[12.5px] text-muted-foreground">{l}</span></CardContent></Card>
                  ))}
                </div>
                <Note tone="info" icon={<Lock aria-hidden />}>Admin hanya melihat jumlah. Isi tesis, portofolio, dan watchlist pengguna tidak bisa dibuka dari sini.</Note>
              </Panel>

              <Separator />
              <Panel>
                <H3>Login terakhir</H3>
                {logins.length ? (
                  <div className="flex flex-col gap-2 text-sm">{logins.map(([d, t], i) => <div key={i} className="flex justify-between gap-3"><span>{d}</span><time className="text-[13px] text-muted-foreground">{t}</time></div>)}</div>
                ) : (
                  <Empty className="p-2"><EmptyHeader><EmptyTitle className="text-sm font-normal">Belum pernah masuk</EmptyTitle><EmptyDescription>—</EmptyDescription></EmptyHeader></Empty>
                )}
              </Panel>

              {FEEDBACK[u.id] && (
                <><Separator /><Panel>
                  <H3>Laporan &amp; masukan</H3>
                  {FEEDBACK[u.id].map((f) => (
                    <Item key={f.t} variant="outline" size="sm" render={<Link href="/admin/masukan" />}>
                      <ItemContent className="gap-0.5"><ItemTitle className="font-normal"><Flag aria-hidden className="size-3.5" />{f.t}</ItemTitle><ItemDescription className="text-xs">{f.m}</ItemDescription></ItemContent>
                    </Item>
                  ))}
                </Panel></>
              )}

              <Separator />
              <Panel>
                <H3>Tindakan</H3>
                {!confirm ? (
                  <div className="flex flex-col gap-2">
                    {!u.verified && <Button variant="outline" size="sm" className="justify-start" onClick={() => toast(`Email konfirmasi dikirim ulang ke ${u.email}`)}><Mail aria-hidden />Kirim ulang email konfirmasi</Button>}
                    {u.verified && u.login === "Email" && !sus[u.id] && <Button variant="outline" size="sm" className="justify-start" onClick={() => toast(`Tautan atur ulang password dikirim ke ${u.email}. Berlaku 1 jam.`)}><KeyRound aria-hidden />Kirim tautan atur ulang password</Button>}
                    {sus[u.id] ? (
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => { const o = { ...sus }; delete o[u.id]; setSus(o); toast(`Akun ${u.name} dipulihkan. Pengguna bisa masuk lagi.`); }}><RotateCcw aria-hidden />Pulihkan akun</Button>
                    ) : (
                      <Button variant="destructive-outline" size="sm" className="justify-start" onClick={() => setConfirm(true)}><Ban aria-hidden />Tangguhkan akun</Button>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive" role="group" aria-label="Konfirmasi tangguhkan akun" className="gap-3 bg-(--sp-danger-bg)/50 text-foreground">
                    <AlertTitle className="text-sm font-semibold">Tangguhkan {u.name.split(" ")[0]}?</AlertTitle>
                    <AlertDescription className="text-[13px] text-sp-icon">Pengguna langsung keluar dari semua perangkat dan tidak bisa masuk sampai dipulihkan. Tesis dan portofolionya tidak dihapus.</AlertDescription>
                    <FormField label="Alasan" htmlFor="sus-r"><NativeSelect id="sus-r" size="sm" value={reason} onChange={(e) => setReason(e.target.value)}><NativeSelectOption value="">Pilih alasan…</NativeSelectOption>{SUSPEND_REASONS.map((r) => <NativeSelectOption key={r}>{r}</NativeSelectOption>)}</NativeSelect></FormField>
                    <FormField label="Catatan internal" hint="tidak dikirim ke pengguna" htmlFor="sus-n"><Textarea id="sus-n" className="min-h-16 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></FormField>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={cancelSuspend}>Batal</Button>
                      <Button variant="destructive" size="sm" aria-disabled={!reason} onClick={() => { if (!reason) return toast("Pilih alasan dulu"); setSus({ ...sus, [u.id]: ["baru saja", reason] }); cancelSuspend(); toast(`${u.name} ditangguhkan dan sudah dikeluarkan dari semua perangkat`); }}>Tangguhkan</Button>
                    </div>
                  </Alert>
                )}
              </Panel>
            </>
          ) : (
            <Empty className="py-14"><EmptyHeader><EmptyTitle>Pilih pengguna</EmptyTitle><EmptyDescription>Klik salah satu baris untuk melihat akun, pemakaian, dan tindakan.</EmptyDescription></EmptyHeader></Empty>
          )}
        </Card>
      </div>
    </div>
  );
}
