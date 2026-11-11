"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { BASE, changedKeys, FIELD_LABEL, ink, isHex, onAccent, SECTION_INFO, tint, type Settings } from "@/lib/pengaturan";
import { area, btn, cls, Counter, Field, Help, inp, Section, Toggle, useToast } from "./form-ui";
import { LogoMark } from "./logo-mark";

type Tab = "brand" | "landing" | "app" | "email";
const TABS: [Tab, string, string][] = [["brand", "Merek", ""], ["landing", "Landing page", "landing"], ["app", "Aplikasi", "aplikasi"], ["email", "Email", "email"]];
const SWATCHES = [["#FEA722", "Oranye StockPlan"], ["#2563EB", "Biru"], ["#16A34A", "Hijau"], ["#7C3AED", "Ungu"], ["#E11D48", "Merah"], ["#0D9488", "Toska"]];
const REG = [["open", "Terbuka", "Siapa saja bisa daftar dan langsung masuk beta."], ["wait", "Waitlist", "Calon pengguna mengisi email, tim mengundang bertahap."], ["closed", "Ditutup", "Tombol daftar disembunyikan dari landing page."]] as const;
const TEMPLATES = [["Konfirmasi email", "Dikirim saat daftar · berlaku 24 jam"], ["Atur ulang password", "Tautan berlaku 1 jam"], ["Undangan beta", "Dari Pengguna › Undang pengguna"], ["Balasan tiket", "Dari Masukan & laporan"], ["Pengingat evaluasi tesis", "H-7 sebelum jadwal evaluasi"]];
const ME_EMAIL = "arief@stockplan.id"; // shortcut: signed-in admin placeholder; read from the session.

const Row = ({ children, on }: { children: React.ReactNode; on?: boolean }) => <div className={cls("flex items-center gap-3 rounded-[10px] border border-[#E7E5E4] px-3.5 py-2.5", on === false && "bg-[#FAFAF9] opacity-70")}>{children}</div>;
const Pair = ({ children }: { children: React.ReactNode }) => <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>;
const ToggleHead = ({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4"><div className="flex flex-col gap-0.5"><b className="text-[15px] font-semibold">{title}</b><small className="text-[13.5px] text-[#716A65]">{desc}</small></div><Toggle on={on} onChange={onChange} label={title} /></div>
);

export function SettingsForm() {
  const { flash, toast } = useToast();
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

  const publish = () => { if (clean) return; if (!hexOk) return flash("Kode warna belum valid"); setBase(s); flash(`${changed.length} perubahan diterbitkan dan langsung tampil di aplikasi`); };
  const undo = () => { if (clean) return; setS(base); setMtAsk(false); flash("Perubahan dibatalkan"); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Pengaturan aplikasi</h1>
        <p className="text-[#716A65]">Merek, landing page, dan perilaku aplikasi untuk semua pengguna. Perubahan baru tampil setelah diterbitkan.</p>
      </div>
      <div role="tablist" aria-label="Bagian" className="flex w-fit gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cls("inline-flex h-9 items-center rounded-lg px-3.5 text-sm", tab === k ? "bg-white font-semibold shadow-sm" : "font-medium text-[#57534E] hover:text-[#1C1917]")}>{l}</button>)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          {tab === "brand" && (
            <>
              <Section id="p-id" title="Identitas" desc="Dipakai di judul tab browser, email, dan aplikasi.">
                <Pair>
                  <Field label="Nama aplikasi" htmlFor="an"><input id="an" className={inp()} value={s.appName} onChange={(e) => set("appName", e.target.value)} /></Field>
                  <Field label="Tagline" htmlFor="tl"><input id="tl" className={inp()} value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
                </Pair>
              </Section>
              <Section id="p-logo" title="Logo & ikon" desc="SVG atau PNG transparan. Ikon aplikasi dipakai untuk favicon dan layar beranda HP.">
                <div className="grid gap-3.5 sm:grid-cols-3">
                  {[
                    { t: "Logo utama", d: "Untuk latar terang · SVG", bg: "bg-[repeating-conic-gradient(#F5F5F4_0_25%,#fff_0_50%)] bg-[length:16px_16px]", fg: "" },
                    { t: "Logo putih", d: "Untuk latar gelap · SVG", bg: "bg-[#1C1917]", fg: "text-white" },
                    { t: "Ikon aplikasi", d: "512×512 · PNG", bg: "bg-[repeating-conic-gradient(#F5F5F4_0_25%,#fff_0_50%)] bg-[length:16px_16px]", fg: "", icon: true },
                  ].map((l) => (
                    <div key={l.t} className="overflow-hidden rounded-xl border border-[#E7E5E4]">
                      <div className={cls("flex h-24 items-center justify-center gap-2 text-[15px] font-bold", l.bg, l.fg)}>
                        {l.icon ? <span className="inline-flex size-14 items-center justify-center rounded-[14px] bg-[#1C1917]"><LogoMark width={30} height={26} /></span> : <><LogoMark width={28} height={24} />{appName}</>}
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-[#E7E5E4] p-3"><b className="text-sm font-semibold">{l.t}</b><small className="text-[12.5px] text-[#716A65]">{l.d}</small>
                        <button type="button" className="mt-1 self-start text-[13px] font-semibold underline underline-offset-2" onClick={() => flash("Unggah file logo belum tersambung ke penyimpanan aset")}>Ganti file</button></div>
                    </div>
                  ))}
                </div>
              </Section>
              <Section id="p-warna" title="Warna utama" desc="Dipakai untuk tombol utama, sorotan, dan grafik. Warna teks dan latar tetap.">
                <div role="group" aria-label="Pilihan warna" className="flex gap-2.5">
                  {SWATCHES.map(([c, l]) => <button key={c} type="button" aria-pressed={acc.toLowerCase() === c.toLowerCase()} aria-label={l} title={l} onClick={() => set("accent", c)} className={cls("size-9 rounded-full border-2 border-white", acc.toLowerCase() === c.toLowerCase() ? "ring-2 ring-[#1C1917]" : "ring-1 ring-[#E7E5E4]")} style={{ background: c }} />)}
                </div>
                <div className="flex items-center gap-3">
                  <i aria-hidden className="size-10 flex-none rounded-[10px]" style={{ background: acc }} />
                  <label className="sr-only" htmlFor="hx">Kode warna</label>
                  <input id="hx" className={cls(inp(!hexOk), "w-36 font-mono")} value={s.accent} onChange={(e) => set("accent", e.target.value.trim())} />
                  <Help>Format #RRGGBB</Help>
                </div>
                <div className={cls("rounded-[10px] px-3.5 py-2.5 text-[13.5px]", oa.ratio >= 4.5 ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#FEF2F2] text-[#991B1B]")}>
                  {!hexOk && "Kode warna belum valid, pratinjau memakai warna lama. "}Teks {oa.dark ? "gelap" : "putih"} di atas warna ini: kontras {oa.ratio.toFixed(1).replace(".", ",")}:1 {oa.ratio >= 4.5 ? "✓ memenuhi standar keterbacaan" : "✕ terlalu rendah, pilih warna lain"}
                </div>
              </Section>
            </>
          )}

          {tab === "landing" && (
            <>
              <Section id="p-hero" title="Bagian pembuka" desc="Kalimat pertama yang dibaca calon pengguna.">
                <Field label="Judul" htmlFor="ht"><input id="ht" className={inp(s.heroT.length > 70)} value={s.heroT} onChange={(e) => set("heroT", e.target.value)} /><div className="flex justify-end"><Counter n={s.heroT.length} max={70} /></div></Field>
                <Field label="Subjudul" htmlFor="hs"><textarea id="hs" className={cls(area(s.heroS.length > 160), "min-h-[72px]")} value={s.heroS} onChange={(e) => set("heroS", e.target.value)} /><div className="flex justify-end"><Counter n={s.heroS.length} max={160} /></div></Field>
                <Pair>
                  <Field label="Teks tombol utama" htmlFor="ct"><input id="ct" className={inp()} value={s.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
                  <Field label="Tombol membuka" htmlFor="cd"><select id="cd" className={inp()} value={s.ctaDest} onChange={(e) => set("ctaDest", e.target.value as Settings["ctaDest"])}><option value="reg">Halaman daftar</option><option value="wait">Form waitlist</option></select></Field>
                </Pair>
              </Section>
              <Section id="p-bag" title="Bagian halaman" desc="Atur urutan dan sembunyikan bagian yang belum siap.">
                <div className="flex flex-col gap-2">
                  {s.secs.map(([k, on], i) => (
                    <Row key={k} on={on}>
                      <div className="flex min-w-0 flex-1 flex-col"><b className="text-sm font-semibold">{SECTION_INFO[k][0]}</b><small className="text-[12.5px] text-[#716A65]">{SECTION_INFO[k][1]}</small></div>
                      <button type="button" aria-label={`Naikkan ${SECTION_INFO[k][0]}`} aria-disabled={i === 0} onClick={() => moveSec(i, -1)} className="inline-flex size-8 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F5F5F4] aria-disabled:opacity-30"><ChevronUp size={16} /></button>
                      <button type="button" aria-label={`Turunkan ${SECTION_INFO[k][0]}`} aria-disabled={i === s.secs.length - 1} onClick={() => moveSec(i, 1)} className="inline-flex size-8 items-center justify-center rounded-md text-[#57534E] hover:bg-[#F5F5F4] aria-disabled:opacity-30"><ChevronDown size={16} /></button>
                      <Toggle on={on} label={`Tampilkan ${SECTION_INFO[k][0]}`} onChange={(v) => setS((p) => ({ ...p, secs: p.secs.map((x, j) => (j === i ? [x[0], v] : x)) }))} />
                    </Row>
                  ))}
                </div>
              </Section>
              <Section id="p-seo" title="Mesin pencari & berbagi" desc="Tampil di hasil Google dan saat tautan dibagikan.">
                <Field label="Judul halaman" htmlFor="st"><input id="st" className={inp(s.seoT.length > 60)} value={s.seoT} onChange={(e) => set("seoT", e.target.value)} /><div className="flex justify-end"><Counter n={s.seoT.length} max={60} /></div></Field>
                <Field label="Deskripsi" htmlFor="sd"><input id="sd" className={inp(s.seoD.length > 160)} value={s.seoD} onChange={(e) => set("seoD", e.target.value)} /><div className="flex justify-end"><Counter n={s.seoD.length} max={160} /></div></Field>
              </Section>
            </>
          )}

          {tab === "app" && (
            <>
              <Section id="p-reg" title="Pendaftaran" desc="Menentukan apa yang terjadi saat orang menekan tombol daftar.">
                <div role="radiogroup" aria-label="Status pendaftaran" className="grid gap-2 sm:grid-cols-3">
                  {REG.map(([k, t, d]) => (
                    <button key={k} type="button" role="radio" aria-checked={s.reg === k} onClick={() => setS((p) => ({ ...p, reg: k, ...(k === "wait" ? { cta: "Gabung waitlist", ctaDest: "wait" as const } : {}) }))}
                      className={cls("flex flex-col gap-0.5 rounded-[10px] border p-3 text-left", s.reg === k ? "border-[#1C1917] bg-[#FAFAF9] shadow-[inset_0_0_0_1px_#1C1917]" : "border-[#E7E5E4] hover:border-[#D6D3D1]")}><b className="text-sm font-semibold">{t}</b><small className="text-[12.5px] leading-snug text-[#716A65]">{d}</small></button>
                  ))}
                </div>
              </Section>
              <Section id="p-beta" title="Mode beta" desc="Semua fitur gratis. Halaman Langganan menampilkan “Akses beta” dan harga sementara.">
                <ToggleHead title="Mode beta" desc="Aktifkan selama aplikasi belum berbayar." on={s.beta} onChange={(v) => set("beta", v)} />
                {s.beta && <div className="max-w-60"><Field label="Beta berakhir" htmlFor="be"><input id="be" type="date" className={inp()} value={s.betaEnd} onChange={(e) => set("betaEnd", e.target.value)} /></Field></div>}
              </Section>
              <Section id="p-ban" title="Banner pengumuman" desc="Muncul di atas semua halaman aplikasi sampai ditutup pengguna.">
                <ToggleHead title="Banner pengumuman" desc="Tampilkan satu pengumuman untuk semua pengguna." on={s.ban} onChange={(v) => set("ban", v)} />
                {s.ban && (
                  <>
                    <Field label="Teks banner" htmlFor="bt"><input id="bt" className={inp()} value={s.banText} onChange={(e) => set("banText", e.target.value)} /></Field>
                    <Pair>
                      <Field label="Jenis" htmlFor="bk"><select id="bk" className={inp()} value={s.banKind} onChange={(e) => set("banKind", e.target.value as Settings["banKind"])}><option value="info">Info</option><option value="warn">Penting</option></select></Field>
                      <Field label="Tampil sampai" htmlFor="bu"><input id="bu" type="date" className={inp()} value={s.banUntil} onChange={(e) => set("banUntil", e.target.value)} /></Field>
                    </Pair>
                  </>
                )}
              </Section>
              <Section id="p-mt" title="Mode pemeliharaan" desc="Semua pengguna keluar dan melihat halaman pemeliharaan. Panel admin tetap bisa dipakai.">
                <ToggleHead title="Mode pemeliharaan" desc="Aktif segera setelah diterbitkan." on={s.mt} onChange={(v) => (v ? setMtAsk(true) : set("mt", false))} />
                {mtAsk && (
                  <div role="group" aria-label="Konfirmasi mode pemeliharaan" className="flex flex-col gap-2.5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-sm">
                    <b>Aktifkan mode pemeliharaan?</b><span className="text-[13.5px] text-[#57534E]">Sekitar 612 pengguna aktif minggu ini akan langsung keluar. Mode ini aktif segera setelah diterbitkan.</span>
                    <div className="flex justify-end gap-2"><button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => setMtAsk(false)}>Batal</button><button type="button" className={cls(btn.base, btn.small, "border-transparent bg-[#B91C1C] text-white hover:bg-[#991B1B]")} onClick={() => { set("mt", true); setMtAsk(false); }}>Ya, aktifkan</button></div>
                  </div>
                )}
                {s.mt && <Field label="Pesan untuk pengguna" htmlFor="mm"><input id="mm" className={inp()} value={s.mtMsg} onChange={(e) => set("mtMsg", e.target.value)} /></Field>}
              </Section>
            </>
          )}

          {tab === "email" && (
            <>
              <Section id="p-from" title="Pengirim" desc="Dipakai untuk semua email otomatis.">
                <Pair>
                  <Field label="Nama pengirim" htmlFor="sn"><input id="sn" className={inp()} value={s.fromName} onChange={(e) => set("fromName", e.target.value)} /></Field>
                  <Field label="Balasan dikirim ke" htmlFor="sr"><input id="sr" className={inp()} value={s.replyTo} onChange={(e) => set("replyTo", e.target.value)} /></Field>
                </Pair>
                <Help>Alamat pengirim: noreply@stockplan.id · domain sudah terverifikasi (SPF, DKIM).</Help>
              </Section>
              <section aria-labelledby="h-tpl" className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white">
                <div className="flex items-baseline justify-between border-b border-[#F0EEEC] px-5 py-4"><b id="h-tpl" className="text-[15px] font-semibold">Templat email</b><span className="text-[13px] text-[#716A65]">Bahasa Indonesia</span></div>
                {TEMPLATES.map(([n, d]) => (
                  <div key={n} className="flex items-center justify-between gap-3 border-b border-[#F0EEEC] px-5 py-3.5 last:border-b-0">
                    <div className="flex flex-col"><b className="text-sm font-semibold">{n}</b><small className="text-[12.5px] text-[#716A65]">{d}</small></div>
                    <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => flash(`Email uji “${n}” dikirim ke ${ME_EMAIL}`)}><Send aria-hidden size={14} />Kirim uji ke saya</button>
                  </div>
                ))}
              </section>
            </>
          )}

          <div role="region" aria-label="Simpan pengaturan" className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)]">
            <span className="flex-1 text-sm">{clean ? "Semua perubahan sudah diterbitkan." : `${changed.length} perubahan belum diterbitkan: ${changed.slice(0, 3).map((k) => FIELD_LABEL[k]).join(", ")}${changed.length > 3 ? ", …" : ""}`}</span>
            <button type="button" aria-disabled={clean} className={cls(btn.base, btn.small, clean ? btn.disabled : btn.outline)} onClick={undo}>Batalkan</button>
            <button type="button" aria-disabled={clean} className={cls(btn.base, btn.small, clean ? btn.disabled : btn.dark)} onClick={publish}>Terbitkan perubahan</button>
          </div>
        </div>

        <aside aria-label="Pratinjau" className="sticky top-4 hidden flex-col gap-2.5 rounded-xl border border-[#E7E5E4] bg-white p-4 xl:flex">
          <span className="text-[11.5px] font-semibold uppercase tracking-[.06em] text-[#716A65]">Pratinjau aplikasi</span>
          <div aria-hidden className="grid grid-cols-[110px_1fr] overflow-hidden rounded-xl border border-[#E7E5E4] text-[11px]">
            <div className="flex flex-col gap-1.5 border-r border-[#E7E5E4] bg-[#FAFAF9] p-2.5"><span className="mb-1 flex items-center gap-1.5 font-bold"><LogoMark width={14} height={12} />{appName}</span>{["Beranda", "Tema bisnis", "Emiten", "Tesis saya"].map((n, i) => <span key={n} className={cls("rounded-md px-1.5 py-1", i === 0 ? "border border-[#E7E5E4] bg-white font-semibold" : "text-[#57534E]")}>{n}</span>)}</div>
            <div className="flex flex-col gap-2 p-2.5">
              {s.ban && <div className={cls("rounded-md px-2 py-1.5 leading-snug", s.banKind === "warn" ? "bg-[#FEF3C7] text-[#78350F]" : "bg-[#EFF6FF] text-[#1E3A8A]")}>{s.banText}</div>}
              <b className="text-xs">Halo, Budi</b>
              <span className="w-fit rounded-md px-1.5 py-0.5 font-semibold" style={{ background: tint(acc, 0.12), color: ink(acc) }}>Perlu tindakan · 2</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-[#F0EEEC]"><i className="block h-full w-2/3 rounded-full" style={{ background: acc }} /></span>
              <span className="w-fit rounded-md px-2 py-1 font-semibold" style={{ background: acc, color: oa.text }}>Tulis tesis</span>
            </div>
          </div>
          <span className="mt-1 text-[11.5px] font-semibold uppercase tracking-[.06em] text-[#716A65]">Pratinjau landing page</span>
          <div aria-hidden className="overflow-hidden rounded-xl border border-[#E7E5E4] text-[11px]">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] px-3 py-2"><span className="flex items-center gap-1.5 font-bold"><LogoMark width={14} height={12} />{appName}</span><span className="rounded px-2 py-0.5 font-semibold" style={{ background: acc, color: oa.text }}>{cta}</span></div>
            <div className="flex flex-col gap-1.5 px-3 py-4" style={{ background: `linear-gradient(135deg, ${tint(acc, 0.12)} 0%, #FFFFFF 70%)` }}>
              <h3 className="text-[15px] font-bold leading-tight">{s.heroT}</h3><p className="text-[11px] leading-snug text-[#57534E]">{s.heroS}</p>
              <span className="mt-1 w-fit rounded-md px-2.5 py-1 font-semibold" style={{ background: acc, color: oa.text }}>{cta}</span>
            </div>
            <div className="flex flex-wrap gap-1 border-t border-[#E7E5E4] bg-[#FAFAF9] p-2.5">{s.secs.filter((x) => x[1]).map((x) => <span key={x[0]} className="rounded border border-dashed border-[#D6D3D1] px-1.5 py-0.5 text-[#57534E]">{SECTION_INFO[x[0]][0]}</span>)}</div>
          </div>
        </aside>
      </div>
      {toast}
    </div>
  );
}
