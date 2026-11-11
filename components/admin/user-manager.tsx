"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, Download, KeyRound, Lock, Mail, Plus, RefreshCw, RotateCcw, Send, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportUsersCsv, getUser, inviteUser, listUsers, restoreUser, resendConfirmation, sendPasswordReset, suspendUser, type ListResponse, type Plan, type Status, type Tab, type UserDetail } from "@/lib/admin-users";
import { describeError, saveBlob } from "@/lib/admin-companies";
import type { ApiError, Result } from "@/lib/admin-api";
import { fmtWhen } from "@/lib/format";
import { initials, SUSPEND_REASONS } from "@/lib/pengguna";
import { useDebounced } from "@/hooks/use-debounced";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyResult, EntityAvatar, FilterTabs, FormField, Note, PageHeader, Pager, SearchInput, StatCard, StatusBadge, type Tone } from "./form-ui";

const PAGE_SIZE = 12;
const TABS: [Tab, string][] = [["all", "Semua"], ["act", "Aktif"], ["new", "Belum konfirmasi"], ["idle", "Tidak aktif"], ["sus", "Ditangguhkan"]];
const ST: Record<Status, [string, Tone]> = { act: ["Aktif", "success"], new: ["Belum konfirmasi", "info"], idle: ["Tidak aktif", "neutral"], sus: ["Ditangguhkan", "danger"] };
const PLAN_VARIANT: Record<Plan, "amber" | "neutral" | "ghost"> = { y: "amber", m: "neutral", n: "ghost" };
const id = (n: number) => n.toLocaleString("id-ID");
type Loaded<T> = { key: string; data?: T; error?: ApiError };
const AVATAR = ["#1C1917", "#92400E", "#1D4ED8", "#15803D", "#6D28D9", "#BE185D", "#0F766E", "#B45309"];
const UserAvatar = ({ name, size = 32 }: { name: string; size?: number }) => <EntityAvatar code={initials(name)} size={size} color={AVATAR[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]} className="[&_[data-slot=avatar-fallback]]:font-sans" />;
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="text-[11.5px] font-semibold tracking-[.06em] text-muted-foreground uppercase">{children}</h3>;
const Panel = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-3 px-5 py-4">{children}</div>;

export function UserManager() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [plan, setPlan] = useState<Plan | "">("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState("");
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded<ListResponse> | null>(null);
  const [detail, setDetail] = useState<Loaded<UserDetail> | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const dq = useDebounced(q.trim(), 300);

  // Results are keyed by the inputs that produced them, so "loading" is derived (key mismatch), not stored.
  const key = `${dq}|${tab}|${plan}|${page}|${reload}`;
  useEffect(() => {
    let live = true;
    void listUsers({ q: dq, tab, plan, page, pageSize: PAGE_SIZE }).then((r) => { if (live) setLoaded(r.ok ? { key, data: r.data } : { key, error: r.error }); });
    return () => { live = false; };
  }, [key, dq, tab, plan, page]);

  const [dReload, setDReload] = useState(0);
  const dKey = `${sel}|${dReload}`;
  useEffect(() => {
    if (!sel) return;
    let live = true;
    void getUser(sel).then((r) => { if (live) setDetail(r.ok ? { key: dKey, data: r.data.user } : { key: dKey, error: r.error }); });
    return () => { live = false; };
  }, [sel, dKey]);

  const loading = !loaded || loaded.key !== key;
  const data = loaded?.data;
  const rows = data?.items ?? [];
  const u = sel && detail?.key === dKey ? detail.data : undefined;
  const detailLoading = !!sel && detail?.key !== dKey;
  const sus = u?.suspension;
  const invOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invEmail.trim());
  const refresh = () => setReload((n) => n + 1);
  const filter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const resetSuspend = () => { setConfirm(false); setReason(""); setNote(""); };
  const select = (uid: string) => { setSel(uid); resetSuspend(); };

  /** Runs one admin action: toasts the API error or `ok`, then reloads the list (and the panel unless the action returned it). */
  const act = async <T extends { user?: UserDetail } | null>(call: Promise<Result<T>>, ok: string) => {
    setBusy(true);
    const r = await call;
    setBusy(false);
    if (!r.ok) { toast(describeError(r.error)); return false; }
    toast(ok);
    const user = r.data?.user;
    if (user) setDetail({ key: dKey, data: user }); else setDReload((n) => n + 1);
    refresh();
    return true;
  };

  const download = async () => {
    const r = await exportUsersCsv({ q: dq, plan });
    if (r.ok) saveBlob(r.data, "pengguna.csv"); else toast(describeError(r.error));
  };
  const sendInvite = async () => {
    if (!invOk) return toast("Email belum valid");
    const email = invEmail.trim();
    if (await act(inviteUser(email), `Undangan beta dikirim ke ${email}`)) { setInviting(false); setInvEmail(""); }
  };
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const S = data?.summary;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Pengguna" desc="Akun beta StockPlan. Semua akses masih gratis sampai rilis; belum ada penagihan." actions={<>
        <Button variant="outline" onClick={() => void download()}><Download aria-hidden />Ekspor CSV</Button>
        <Button variant="secondary" onClick={() => setInviting(true)}><Plus aria-hidden />Undang pengguna</Button>
      </>} />

      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard label="Pengguna beta" value={S ? id(S.total) : "—"} note={S ? <><em className="font-semibold text-sp-success not-italic">+{id(S.newThisWeek)}</em> minggu ini</> : "Memuat…"} />
        <StatCard label="Aktif 7 hari terakhir" value={S ? id(S.active7Days.count) : "—"} note={S ? `${S.active7Days.percent}% dari semua pengguna` : "Memuat…"} />
        <StatCard label="Sudah menulis tesis" value={S ? id(S.thesisWriters.count) : "—"} note={S?.thesisWriters.avgPerWriter != null ? `rata-rata ${S.thesisWriters.avgPerWriter.toLocaleString("id-ID")} tesis per orang` : "belum ada data"} />
        <StatCard label="Minat berlangganan" value={S ? id(S.subscriptionInterest.count) : "—"} note={S ? <>minta diingatkan · <em className="font-semibold text-sp-success not-italic">{S.subscriptionInterest.yearlyPercent}%</em> tahunan</> : "Memuat…"} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_383px]">
        <Card aria-label="Daftar pengguna" className="min-w-0 gap-0 py-0">
          <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
            <SearchInput label="Cari pengguna" placeholder="Cari nama atau email" value={q} onChange={filter(setQ)} className="max-w-[360px]" />
            <NativeSelect size="sm" aria-label="Minat paket" value={plan} onChange={(e) => filter(setPlan)(e.target.value as Plan | "")} className="ml-auto w-[190px]">
              <NativeSelectOption value="">Semua minat paket</NativeSelectOption><NativeSelectOption value="y">Tahunan</NativeSelectOption><NativeSelectOption value="m">Bulanan</NativeSelectOption><NativeSelectOption value="n">Belum memilih</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="border-b border-sp-line-soft px-4 pb-3">
            <FilterTabs label="Filter status" value={tab} onChange={filter(setTab)} tabs={TABS.map(([v, label]) => ({ v, label, n: data ? id(data.tabs[v]) : undefined }))} />
          </div>

          {inviting && (
            <div role="group" aria-label="Undang pengguna beta" className="flex flex-wrap items-center gap-2.5 border-b border-sp-line-soft bg-accent p-4">
              <Input type="email" placeholder="email@contoh.com" aria-label="Email yang diundang" aria-invalid={!!invEmail.trim() && !invOk} value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className="h-10 min-w-60 flex-1 text-sm" />
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => void sendInvite()}><Send aria-hidden />Kirim undangan</Button>
              <Button variant="outline" size="sm" onClick={() => { setInviting(false); setInvEmail(""); }}>Batal</Button>
            </div>
          )}

          {loaded?.error && !loading ? (
            <div className="p-5">
              <Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{describeError(loaded.error)}<Button size="sm" variant="destructive-outline" onClick={refresh}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert>
            </div>
          ) : !loading && rows.length === 0 ? (
            <EmptyResult title="Tidak ada pengguna yang cocok" desc="Coba nama atau email lain, atau hapus filter." onReset={() => { setQ(""); setPlan(""); setTab("all"); setPage(1); }} />
          ) : (
            <>
              <Table className="min-w-[640px]" aria-busy={loading}>
                <TableHeader><TableRow className="hover:bg-transparent">{["Pengguna", "Status", "Terakhir aktif", "Tesis", "Minat paket"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody className={cn(loading && loaded && "opacity-50")}>
                  {!loaded ? Array.from({ length: 8 }, (_, i) => (
                    <TableRow key={i} className="hover:bg-transparent"><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>
                  )) : rows.map((r) => (
                    <TableRow key={r.id} onClick={() => select(r.id)} data-state={sel === r.id ? "selected" : undefined} className="cursor-pointer data-[state=selected]:bg-[#FFFBF2] data-[state=selected]:shadow-[inset_3px_0_0_var(--primary)]">
                      <TableCell>
                        <Button variant="ghost" aria-pressed={sel === r.id} aria-label={`Lihat detail ${r.name}`} onClick={(e) => { e.stopPropagation(); select(r.id); }} className="h-auto w-full justify-start gap-2.5 p-0 text-left font-normal hover:bg-transparent">
                          <UserAvatar name={r.name} />
                          <span className="flex min-w-0 flex-col leading-tight"><b className="truncate font-semibold">{r.name}</b><em className="truncate text-[12.5px] text-muted-foreground not-italic">{r.email}</em></span>
                        </Button>
                      </TableCell>
                      <TableCell><StatusBadge tone={ST[r.status][1]}>{r.statusLabel}</StatusBadge></TableCell>
                      <TableCell className="text-[13px]">{r.lastActiveAt ? fmtWhen(r.lastActiveAt) : "Belum pernah masuk"}</TableCell>
                      <TableCell className="font-mono text-[13px]">{r.theses}</TableCell>
                      <TableCell><Badge variant={PLAN_VARIANT[r.plan.key]} className={cn("rounded-md font-semibold", r.plan.key === "n" && "text-sp-faint")}>{r.plan.label}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager text={data ? `Menampilkan ${from}–${from + rows.length - 1} dari ${id(data.total)} pengguna` : "Memuat…"}
                canPrev={page > 1} canNext={!!data && page * PAGE_SIZE < data.total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
            </>
          )}
        </Card>

        <Card aria-label="Detail pengguna" className="sticky top-4 gap-0 py-0">
          {detailLoading ? (
            <div className="flex flex-col gap-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          ) : detail?.error && sel ? (
            <div className="p-5"><Alert variant="destructive"><TriangleAlert aria-hidden /><AlertDescription className="flex items-center justify-between gap-3">{describeError(detail.error)}<Button size="sm" variant="destructive-outline" onClick={() => setDReload((n) => n + 1)}><RefreshCw aria-hidden />Coba lagi</Button></AlertDescription></Alert></div>
          ) : u ? (
            <>
              <div className="flex items-start gap-3.5 p-5">
                <UserAvatar name={u.name} size={52} />
                <div className="flex min-w-0 flex-1 flex-col"><b className="text-base font-semibold">{u.name}</b><span className="truncate text-[13px] text-muted-foreground">{u.email}</span><StatusBadge tone={ST[u.status][1]} className="mt-1 self-start">{u.statusLabel}</StatusBadge></div>
                <Button variant="ghost" size="icon-sm" aria-label="Tutup detail" onClick={() => { setSel(""); resetSuspend(); }}><X /></Button>
              </div>

              {sus && (
                <><Separator /><Panel>
                  <Alert variant="destructive"><ShieldAlert aria-hidden /><AlertDescription><b>Ditangguhkan {fmtWhen(sus.at)}</b> · {sus.reason}{sus.by && ` · oleh ${sus.by}`}. Pengguna tidak bisa masuk, datanya tetap tersimpan.{sus.note && <> Catatan: {sus.note}</>}</AlertDescription></Alert>
                </Panel></>
              )}

              <Separator />
              <Panel>
                <H3>Akun</H3>
                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Bergabung</dt><dd>{fmtWhen(u.account.joinedAt)}</dd>
                  <dt className="text-muted-foreground">Masuk dengan</dt><dd>{u.account.loginMethod}</dd>
                  <dt className="text-muted-foreground">Email</dt><dd>{u.account.emailVerified ? "Terkonfirmasi" : "Belum dikonfirmasi"}</dd>
                  <dt className="text-muted-foreground">Langganan</dt><dd>{u.account.subscription}</dd>
                  <dt className="text-muted-foreground">Minat paket</dt><dd>{u.account.planInterest}</dd>
                </dl>
              </Panel>

              <Separator />
              <Panel>
                <H3>Pemakaian</H3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[[u.usage.theses, "tesis ditulis"], [u.usage.evaluations, "evaluasi tesis"], [u.usage.watchlist, "emiten dipantau"], [u.usage.themesOpened ?? "—", "tema dibuka"]].map(([v, l]) => (
                    <Card key={l} size="sm" className="py-3 shadow-none"><CardContent className="flex flex-col px-3"><b className="font-mono text-lg font-semibold">{v}</b><span className="text-[12.5px] text-muted-foreground">{l}</span></CardContent></Card>
                  ))}
                </div>
                <Note tone="info" icon={<Lock aria-hidden />}>Admin hanya melihat jumlah. Isi tesis, portofolio, dan watchlist pengguna tidak bisa dibuka dari sini.</Note>
              </Panel>

              <Separator />
              <Panel>
                <H3>Login terakhir</H3>
                {u.recentLogins.length ? (
                  <div className="flex flex-col gap-2 text-sm">{u.recentLogins.map((l, i) => <div key={i} className="flex justify-between gap-3"><span>{l.device}</span><time dateTime={l.at} className="text-[13px] text-muted-foreground">{fmtWhen(l.at)}</time></div>)}</div>
                ) : (
                  <Empty className="p-2"><EmptyHeader><EmptyTitle className="text-sm font-normal">Belum pernah masuk</EmptyTitle><EmptyDescription>—</EmptyDescription></EmptyHeader></Empty>
                )}
              </Panel>

              <Separator />
              <Panel>
                <H3>Tindakan</H3>
                {!confirm ? (
                  <div className="flex flex-col gap-2">
                    {u.actions.resendConfirmation && <Button variant="outline" size="sm" className="justify-start" disabled={busy} onClick={() => void act(resendConfirmation(u.id), `Email konfirmasi dikirim ulang ke ${u.email}`)}><Mail aria-hidden />Kirim ulang email konfirmasi</Button>}
                    {u.actions.resetPassword && <Button variant="outline" size="sm" className="justify-start" disabled={busy} onClick={() => void act(sendPasswordReset(u.id), `Tautan atur ulang password dikirim ke ${u.email}. Berlaku 1 jam.`)}><KeyRound aria-hidden />Kirim tautan atur ulang password</Button>}
                    {u.actions.restore && <Button variant="outline" size="sm" className="justify-start" disabled={busy} onClick={() => void act(restoreUser(u.id), `Akun ${u.name} dipulihkan. Pengguna bisa masuk lagi.`)}><RotateCcw aria-hidden />Pulihkan akun</Button>}
                    {u.actions.suspend && <Button variant="destructive-outline" size="sm" className="justify-start" onClick={() => setConfirm(true)}><Ban aria-hidden />Tangguhkan akun</Button>}
                  </div>
                ) : (
                  <Alert variant="destructive" role="group" aria-label="Konfirmasi tangguhkan akun" className="gap-3 bg-(--sp-danger-bg)/50 text-foreground">
                    <AlertTitle className="text-sm font-semibold">Tangguhkan {u.name.split(" ")[0]}?</AlertTitle>
                    <AlertDescription className="text-[13px] text-sp-icon">Pengguna langsung keluar dari semua perangkat dan tidak bisa masuk sampai dipulihkan. Tesis dan portofolionya tidak dihapus.</AlertDescription>
                    <FormField label="Alasan" htmlFor="sus-r"><NativeSelect id="sus-r" size="sm" value={reason} onChange={(e) => setReason(e.target.value)}><NativeSelectOption value="">Pilih alasan…</NativeSelectOption>{SUSPEND_REASONS.map((r) => <NativeSelectOption key={r}>{r}</NativeSelectOption>)}</NativeSelect></FormField>
                    <FormField label="Catatan internal" hint="tidak dikirim ke pengguna" htmlFor="sus-n"><Textarea id="sus-n" className="min-h-16 text-sm" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></FormField>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={resetSuspend}>Batal</Button>
                      <Button variant="destructive" size="sm" disabled={busy} aria-disabled={!reason} onClick={async () => { if (!reason) return toast("Pilih alasan dulu"); if (await act(suspendUser(u.id, reason, note.trim()), `${u.name} ditangguhkan dan sudah dikeluarkan dari semua perangkat`)) resetSuspend(); }}>Tangguhkan</Button>
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
