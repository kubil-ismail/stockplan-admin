"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BASE, changedKeys, FIELD_LABEL, ink, isHex, onAccent, SECTION_INFO, tint, type Settings } from "@/lib/pengaturan";
import { ChoiceCards, Counter, FormField, Help, PageHeader, PanelCard, ROW, Section } from "./form-ui";
import { LogoMark } from "./logo-mark";

type Tab = "brand" | "landing" | "app" | "email";
const TABS: [Tab, string, string][] = [["brand", "Merek", ""], ["landing", "Landing page", "landing"], ["app", "Aplikasi", "aplikasi"], ["email", "Email", "email"]];
const SWATCHES = [["#FEA722", "Oranye StockPlan"], ["#2563EB", "Biru"], ["#16A34A", "Hijau"], ["#7C3AED", "Ungu"], ["#E11D48", "Merah"], ["#0D9488", "Toska"]];
const REG = [["open", "Terbuka", "Siapa saja bisa daftar dan langsung masuk beta."], ["wait", "Waitlist", "Calon pengguna mengisi email, tim mengundang bertahap."], ["closed", "Ditutup", "Tombol daftar disembunyikan dari landing page."]] as const;
const TEMPLATES = [["Konfirmasi email", "Dikirim saat daftar · berlaku 24 jam"], ["Atur ulang password", "Tautan berlaku 1 jam"], ["Undangan beta", "Dari Pengguna › Undang pengguna"], ["Balasan tiket", "Dari Masukan & laporan"], ["Pengingat evaluasi tesis", "H-7 sebelum jadwal evaluasi"]];
const ME_EMAIL = "arief@stockplan.id"; // shortcut: signed-in admin placeholder; read from the session.

const Pair = ({ children }: { children: React.ReactNode }) => <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>;
/** Card-level switch row (title + description + Switch) = shadcn Field horizontal. */
const ToggleHead = ({ id, title, desc, on, onChange }: { id: string; title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) => (
  <Field orientation="horizontal" className="justify-between gap-4">
    <FieldContent><FieldLabel htmlFor={id} className="text-[15px]">{title}</FieldLabel><FieldDescription className="text-[13.5px]">{desc}</FieldDescription></FieldContent>
    <Switch id={id} checked={on} onCheckedChange={onChange} />
  </Field>
);
const PreviewLabel = ({ children }: { children: React.ReactNode }) => <span className="text-[11.5px] font-semibold tracking-[.06em] text-muted-foreground uppercase">{children}</span>;

export function SettingsForm() {
  const param = useSearchParams().get("tab");
  const [tab, setTabState] = useState<Tab>(TABS.find((t) => t[2] === param)?.[0] ?? "brand");
  const [base, setBase] = useState<Settings>(BASE);
  const [s, setS] = useState<Settings>(BASE);
  const [mtAsk, setMtAsk] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setTab = (t: Tab) => { setTabState(t); const q = TABS.find((x) => x[0] === t)![2]; window.history.replaceState(null, "", q ? `?tab=${q}` : window.location.pathname); };

  const changed = changedKeys(base, s);
  const clean = changed.length === 0;
  const hexOk = isHex(s.accent);
  const acc = hexOk ? s.accent : BASE.accent;
  const oa = onAccent(acc);
  const appName = s.appName || "StockPlan";
  const cta = s.cta || "Daftar";
  const moveSec = (i: number, d: number) => setS((p) => { const a = p.secs.slice(); const j = i + d; if (j < 0 || j >= a.length) return p; [a[i], a[j]] = [a[j], a[i]]; return { ...p, secs: a }; });

  const publish = () => { if (clean) return; if (!hexOk) return toast("Kode warna belum valid"); setBase(s); toast(`${changed.length} perubahan diterbitkan dan langsung tampil di aplikasi`); };
  const undo = () => { if (clean) return; setS(base); setMtAsk(false); toast("Perubahan dibatalkan"); };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Pengaturan aplikasi" desc="Merek, landing page, dan perilaku aplikasi untuk semua pengguna. Perubahan baru tampil setelah diterbitkan." />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-5">
        <TabsList aria-label="Bagian">
          {TABS.map(([k, l]) => <TabsTrigger key={k} value={k} className="px-3.5 text-sm">{l}</TabsTrigger>)}
        </TabsList>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4">
            <TabsContent value="brand" className="flex flex-col gap-4">
              <Section id="p-id" title="Identitas" desc="Dipakai di judul tab browser, email, dan aplikasi.">
                <Pair>
                  <FormField label="Nama aplikasi" htmlFor="an"><Input id="an" value={s.appName} onChange={(e) => set("appName", e.target.value)} /></FormField>
                  <FormField label="Tagline" htmlFor="tl"><Input id="tl" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></FormField>
                </Pair>
              </Section>
              <Section id="p-logo" title="Logo & ikon" desc="SVG atau PNG transparan. Ikon aplikasi dipakai untuk favicon dan layar beranda HP.">
                <div className="grid gap-3.5 sm:grid-cols-3">
                  {[
                    { t: "Logo utama", d: "Untuk latar terang · SVG", bg: "bg-[repeating-conic-gradient(var(--muted)_0_25%,var(--background)_0_50%)] bg-[length:16px_16px]", fg: "" },
                    { t: "Logo putih", d: "Untuk latar gelap · SVG", bg: "bg-foreground", fg: "text-white" },
                    { t: "Ikon aplikasi", d: "512×512 · PNG", bg: "bg-[repeating-conic-gradient(var(--muted)_0_25%,var(--background)_0_50%)] bg-[length:16px_16px]", fg: "", icon: true },
                  ].map((l) => (
                    <Card key={l.t} size="sm" className="gap-0 py-0 shadow-none">
                      <div className={cn("flex h-24 items-center justify-center gap-2 text-[15px] font-bold", l.bg, l.fg)}>
                        {l.icon ? <span className="inline-flex size-14 items-center justify-center rounded-[14px] bg-foreground"><LogoMark width={30} height={26} /></span> : <><LogoMark width={28} height={24} />{appName}</>}
                      </div>
                      <CardContent className="flex flex-col gap-0.5 border-t border-border py-3"><b className="text-sm font-semibold">{l.t}</b><Help>{l.d}</Help>
                        <Button variant="link" className="mt-1 h-auto self-start px-0 text-[13px]" onClick={() => toast("Unggah file logo belum tersambung ke penyimpanan aset")}>Ganti file</Button></CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
              <Section id="p-warna" title="Warna utama" desc="Dipakai untuk tombol utama, sorotan, dan grafik. Warna teks dan latar tetap.">
                <ToggleGroup aria-label="Pilihan warna" spacing={2.5} value={[acc.toLowerCase()]} onValueChange={(v) => v[0] && set("accent", SWATCHES.find(([c]) => c.toLowerCase() === v[0])![0])}>
                  {SWATCHES.map(([c, l]) => <ToggleGroupItem key={c} value={c.toLowerCase()} aria-label={l} title={l} className="size-9 min-w-9 rounded-full border-2 border-background p-0 ring-1 ring-border data-pressed:ring-2 data-pressed:ring-foreground" style={{ background: c }} />)}
                </ToggleGroup>
                <div className="flex items-center gap-3">
                  <i aria-hidden className="size-10 flex-none rounded-[10px]" style={{ background: acc }} />
                  <FormField label={<span className="sr-only">Kode warna</span>} htmlFor="hx" className="w-36"><Input id="hx" aria-invalid={!hexOk} className="font-mono" value={s.accent} onChange={(e) => set("accent", e.target.value.trim())} /></FormField>
                  <Help className="w-auto">Format #RRGGBB</Help>
                </div>
                <Alert role="status" variant={oa.ratio >= 4.5 ? "success" : "destructive"}>
                  <AlertDescription className="text-current">{!hexOk && "Kode warna belum valid, pratinjau memakai warna lama. "}Teks {oa.dark ? "gelap" : "putih"} di atas warna ini: kontras {oa.ratio.toFixed(1).replace(".", ",")}:1 {oa.ratio >= 4.5 ? "✓ memenuhi standar keterbacaan" : "✕ terlalu rendah, pilih warna lain"}</AlertDescription>
                </Alert>
              </Section>
            </TabsContent>

            <TabsContent value="landing" className="flex flex-col gap-4">
              <Section id="p-hero" title="Bagian pembuka" desc="Kalimat pertama yang dibaca calon pengguna.">
                <FormField label="Judul" htmlFor="ht"><Input id="ht" aria-invalid={s.heroT.length > 70} value={s.heroT} onChange={(e) => set("heroT", e.target.value)} /><div className="flex justify-end"><Counter n={s.heroT.length} max={70} /></div></FormField>
                <FormField label="Subjudul" htmlFor="hs"><Textarea id="hs" aria-invalid={s.heroS.length > 160} className="min-h-[72px]" value={s.heroS} onChange={(e) => set("heroS", e.target.value)} /><div className="flex justify-end"><Counter n={s.heroS.length} max={160} /></div></FormField>
                <Pair>
                  <FormField label="Teks tombol utama" htmlFor="ct"><Input id="ct" value={s.cta} onChange={(e) => set("cta", e.target.value)} /></FormField>
                  <FormField label="Tombol membuka" htmlFor="cd"><NativeSelect id="cd" value={s.ctaDest} onChange={(e) => set("ctaDest", e.target.value as Settings["ctaDest"])}><NativeSelectOption value="reg">Halaman daftar</NativeSelectOption><NativeSelectOption value="wait">Form waitlist</NativeSelectOption></NativeSelect></FormField>
                </Pair>
              </Section>
              <PanelCard id="p-bag" title="Bagian halaman" aside="Atur urutan dan sembunyikan bagian yang belum siap.">
                {s.secs.map(([k, on], i) => (
                  <Item key={k} className={cn(ROW, !on && "bg-accent opacity-70")}>
                    <ItemContent className="gap-0"><ItemTitle>{SECTION_INFO[k][0]}</ItemTitle><ItemDescription className="text-[12.5px]">{SECTION_INFO[k][1]}</ItemDescription></ItemContent>
                    <ItemActions className="gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Naikkan ${SECTION_INFO[k][0]}`} aria-disabled={i === 0} onClick={() => moveSec(i, -1)}><ChevronUp /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Turunkan ${SECTION_INFO[k][0]}`} aria-disabled={i === s.secs.length - 1} onClick={() => moveSec(i, 1)}><ChevronDown /></Button>
                      <Switch checked={on} aria-label={`Tampilkan ${SECTION_INFO[k][0]}`} onCheckedChange={(v) => setS((p) => ({ ...p, secs: p.secs.map((x, j) => (j === i ? [x[0], v] : x)) }))} className="ml-1" />
                    </ItemActions>
                  </Item>
                ))}
              </PanelCard>
              <Section id="p-seo" title="Mesin pencari & berbagi" desc="Tampil di hasil Google dan saat tautan dibagikan.">
                <FormField label="Judul halaman" htmlFor="st"><Input id="st" aria-invalid={s.seoT.length > 60} value={s.seoT} onChange={(e) => set("seoT", e.target.value)} /><div className="flex justify-end"><Counter n={s.seoT.length} max={60} /></div></FormField>
                <FormField label="Deskripsi" htmlFor="sd"><Input id="sd" aria-invalid={s.seoD.length > 160} value={s.seoD} onChange={(e) => set("seoD", e.target.value)} /><div className="flex justify-end"><Counter n={s.seoD.length} max={160} /></div></FormField>
              </Section>
            </TabsContent>

            <TabsContent value="app" className="flex flex-col gap-4">
              <Section id="p-reg" title="Pendaftaran" desc="Menentukan apa yang terjadi saat orang menekan tombol daftar.">
                <ChoiceCards label="Status pendaftaran" className="sm:grid-cols-3" value={s.reg}
                  onChange={(k) => setS((p) => ({ ...p, reg: k, ...(k === "wait" ? { cta: "Gabung waitlist", ctaDest: "wait" as const } : {}) }))}
                  options={REG.map(([v, label, sub]) => ({ v, label, sub }))} />
              </Section>
              <Section id="p-beta" title="Mode beta" desc="Semua fitur gratis. Halaman Langganan menampilkan “Akses beta” dan harga sementara.">
                <ToggleHead id="sw-beta" title="Mode beta" desc="Aktifkan selama aplikasi belum berbayar." on={s.beta} onChange={(v) => set("beta", v)} />
                {s.beta && <FormField label="Beta berakhir" htmlFor="be" className="max-w-60"><Input id="be" type="date" value={s.betaEnd} onChange={(e) => set("betaEnd", e.target.value)} /></FormField>}
              </Section>
              <Section id="p-ban" title="Banner pengumuman" desc="Muncul di atas semua halaman aplikasi sampai ditutup pengguna.">
                <ToggleHead id="sw-ban" title="Banner pengumuman" desc="Tampilkan satu pengumuman untuk semua pengguna." on={s.ban} onChange={(v) => set("ban", v)} />
                {s.ban && (
                  <>
                    <FormField label="Teks banner" htmlFor="bt"><Input id="bt" value={s.banText} onChange={(e) => set("banText", e.target.value)} /></FormField>
                    <Pair>
                      <FormField label="Jenis" htmlFor="bk"><NativeSelect id="bk" value={s.banKind} onChange={(e) => set("banKind", e.target.value as Settings["banKind"])}><NativeSelectOption value="info">Info</NativeSelectOption><NativeSelectOption value="warn">Penting</NativeSelectOption></NativeSelect></FormField>
                      <FormField label="Tampil sampai" htmlFor="bu"><Input id="bu" type="date" value={s.banUntil} onChange={(e) => set("banUntil", e.target.value)} /></FormField>
                    </Pair>
                  </>
                )}
              </Section>
              <Section id="p-mt" title="Mode pemeliharaan" desc="Semua pengguna keluar dan melihat halaman pemeliharaan. Panel admin tetap bisa dipakai.">
                <ToggleHead id="sw-mt" title="Mode pemeliharaan" desc="Aktif segera setelah diterbitkan." on={s.mt} onChange={(v) => (v ? setMtAsk(true) : set("mt", false))} />
                {mtAsk && (
                  <Alert variant="destructive" role="group" aria-label="Konfirmasi mode pemeliharaan" className="gap-2.5 text-foreground">
                    <AlertTitle className="font-semibold">Aktifkan mode pemeliharaan?</AlertTitle>
                    <AlertDescription className="text-sp-icon">Sekitar 612 pengguna aktif minggu ini akan langsung keluar. Mode ini aktif segera setelah diterbitkan.</AlertDescription>
                    <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setMtAsk(false)}>Batal</Button><Button variant="destructive" size="sm" onClick={() => { set("mt", true); setMtAsk(false); }}>Ya, aktifkan</Button></div>
                  </Alert>
                )}
                {s.mt && <FormField label="Pesan untuk pengguna" htmlFor="mm"><Input id="mm" value={s.mtMsg} onChange={(e) => set("mtMsg", e.target.value)} /></FormField>}
              </Section>
            </TabsContent>

            <TabsContent value="email" className="flex flex-col gap-4">
              <Section id="p-from" title="Pengirim" desc="Dipakai untuk semua email otomatis.">
                <Pair>
                  <FormField label="Nama pengirim" htmlFor="sn"><Input id="sn" value={s.fromName} onChange={(e) => set("fromName", e.target.value)} /></FormField>
                  <FormField label="Balasan dikirim ke" htmlFor="sr"><Input id="sr" value={s.replyTo} onChange={(e) => set("replyTo", e.target.value)} /></FormField>
                </Pair>
                <Help>Alamat pengirim: noreply@stockplan.id · domain sudah terverifikasi (SPF, DKIM).</Help>
              </Section>
              <PanelCard id="h-tpl" title="Templat email" aside="Bahasa Indonesia">
                {TEMPLATES.map(([n, d]) => (
                  <Item key={n} className={ROW}>
                    <ItemContent className="gap-0"><ItemTitle>{n}</ItemTitle><ItemDescription className="text-[12.5px]">{d}</ItemDescription></ItemContent>
                    <ItemActions><Button variant="outline" size="sm" onClick={() => toast(`Email uji “${n}” dikirim ke ${ME_EMAIL}`)}><Send aria-hidden />Kirim uji ke saya</Button></ItemActions>
                  </Item>
                ))}
              </PanelCard>
            </TabsContent>

            <Card role="region" aria-label="Simpan pengaturan" className="sticky bottom-4 z-10 flex-row flex-wrap items-center gap-3 px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)]">
              <span className="flex-1 text-sm">{clean ? "Semua perubahan sudah diterbitkan." : `${changed.length} perubahan belum diterbitkan: ${changed.slice(0, 3).map((k) => FIELD_LABEL[k]).join(", ")}${changed.length > 3 ? ", …" : ""}`}</span>
              <Button variant="outline" size="sm" aria-disabled={clean} onClick={undo}>Batalkan</Button>
              <Button variant="secondary" size="sm" aria-disabled={clean} onClick={publish}>Terbitkan perubahan</Button>
            </Card>
          </div>

          <Card aria-label="Pratinjau" className="sticky top-4 hidden gap-2.5 px-4 py-4 xl:flex">
            <PreviewLabel>Pratinjau aplikasi</PreviewLabel>
            <Card aria-hidden size="sm" className="grid grid-cols-[110px_1fr] gap-0 py-0 text-[11px] shadow-none">
              <div className="flex flex-col gap-1.5 border-r border-border bg-accent p-2.5"><span className="mb-1 flex items-center gap-1.5 font-bold"><LogoMark width={14} height={12} />{appName}</span>{["Beranda", "Tema bisnis", "Emiten", "Tesis saya"].map((n, i) => <span key={n} className={cn("rounded-md px-1.5 py-1", i === 0 ? "border border-border bg-background font-semibold" : "text-sp-icon")}>{n}</span>)}</div>
              <div className="flex flex-col gap-2 p-2.5">
                {s.ban && <div className={cn("rounded-md px-2 py-1.5 leading-snug", s.banKind === "warn" ? "bg-[#FEF3C7] text-[#78350F]" : "bg-sp-info-bg text-[#1E3A8A]")}>{s.banText}</div>}
                <b className="text-xs">Halo, Budi</b>
                <span className="w-fit rounded-md px-1.5 py-0.5 font-semibold" style={{ background: tint(acc, 0.12), color: ink(acc) }}>Perlu tindakan · 2</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-sp-line-soft"><i className="block h-full w-2/3 rounded-full" style={{ background: acc }} /></span>
                <span className="w-fit rounded-md px-2 py-1 font-semibold" style={{ background: acc, color: oa.text }}>Tulis tesis</span>
              </div>
            </Card>
            <PreviewLabel>Pratinjau landing page</PreviewLabel>
            <Card aria-hidden size="sm" className="gap-0 py-0 text-[11px] shadow-none">
              <div className="flex items-center justify-between border-b border-border px-3 py-2"><span className="flex items-center gap-1.5 font-bold"><LogoMark width={14} height={12} />{appName}</span><span className="rounded px-2 py-0.5 font-semibold" style={{ background: acc, color: oa.text }}>{cta}</span></div>
              <div className="flex flex-col gap-1.5 px-3 py-4" style={{ background: `linear-gradient(135deg, ${tint(acc, 0.12)} 0%, #FFFFFF 70%)` }}>
                <h3 className="text-[15px] leading-tight font-bold">{s.heroT}</h3><p className="text-[11px] leading-snug text-sp-icon">{s.heroS}</p>
                <span className="mt-1 w-fit rounded-md px-2.5 py-1 font-semibold" style={{ background: acc, color: oa.text }}>{cta}</span>
              </div>
              <div className="flex flex-wrap gap-1 border-t border-border bg-accent p-2.5">{s.secs.filter((x) => x[1]).map((x) => <span key={x[0]} className="rounded border border-dashed border-input px-1.5 py-0.5 text-sp-icon">{SECTION_INFO[x[0]][0]}</span>)}</div>
            </Card>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
