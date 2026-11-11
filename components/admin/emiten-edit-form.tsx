"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Info, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { describeError, publishCompany, saveCompany, type EditView, type PublishKey } from "@/lib/admin-companies";
import { fmtWhen } from "@/lib/format";
import { dec, num } from "@/lib/ipo";
import { profileFromForm, profileToForm, type KeyId, type LvKey, type MetricId, type TrKey } from "@/lib/emiten-form";
import {
  AffixInput, ChoiceCards, Counter, EditorShell, EntityAvatar, Err, FilterTabs, FormField, Help, LinkBtn, Note, RemoveBtn,
  Section, ShareBar, StatusBadge, type Check as CheckItem, type Tone,
} from "./form-ui";

let uid = 1000;
const id = <T extends object>(o: T) => ({ id: uid++, ...o });
type L<T> = (T & { id: number })[];
const withIds = <T extends object>(l: T[]): L<T> => l.map((x) => id(x));
/** Copy of a list row without its UI-only id. */
const omitId = <T extends { id: number }>(x: T): Omit<T, "id"> => { const c: Partial<T> = { ...x }; delete c.id; return c as Omit<T, "id">; };

const TR: Record<TrKey, { label: string; sub: string; dot: string; tone: Tone; effect: string }> = {
  aktif: { label: "Aktif", sub: "Diperdagangkan normal", dot: "#16A34A", tone: "success", effect: "" },
  suspend: { label: "Suspend", sub: "Dihentikan sementara", dot: "#DC2626", tone: "danger", effect: "Banner merah di halaman emiten berisi alasan dan tanggal. Tetap muncul di tema dan portofolio dengan label Suspend." },
  monitor: { label: "Monitoring", sub: "Papan pemantauan khusus", dot: "#F59E0B", tone: "warning", effect: "Label “Pemantauan khusus” di halaman emiten dan di daftar tema, disertai alasan di bawah." },
  delisted: { label: "Delisted", sub: "Keluar dari bursa", dot: "#78716C", tone: "neutral", effect: "Hilang dari pencarian dan tema. Pengguna yang masih menyimpannya di portofolio, tesis, atau watchlist tetap melihatnya dengan label Delisted dan mendapat email." },
};

const KD: readonly [KeyId, string, string, string][] = [["mc", "Market cap", "Rp", "T"], ["pbv", "PBV", "", "x"], ["roe", "ROE", "", "%"], ["gm", "Margin bruto", "", "%"], ["da", "Utang / aset", "", "%"]];
const MT: readonly [MetricId, string, string][] = [["sales", "Penjualan", "Rp triliun"], ["profit", "Laba bersih", "Rp triliun, milik induk"], ["margin", "Margin bruto", "persen"]];
const PG = [["str", "Kekuatan", "#16A34A"], ["weak", "Kelemahan", "#DC2626"], ["mon", "Yang dipantau", "#F59E0B"]] as const;
const REV_COL = ["#1C1917", "#FEA722", "#A8A29E", "#78716C", "#D6D3D1"];
const LV: Record<LvKey, string> = { h: "Tinggi", m: "Sedang", l: "Rendah" };
const PUB: Record<PublishKey, [string, Tone]> = { review: ["Perlu ditinjau", "warning"], draft: ["Draf tersimpan", "neutral"], published: ["Terbit", "success"] };
const MAX_PERIODS = 6; // backend limit

export function EmitenEditForm({ view: loaded, sectors }: { view: EditView; sectors: { slug: string; name: string }[] }) {
  const [view, setView] = useState(loaded);
  const [p0] = useState(() => profileFromForm(loaded.form)); // initial values; edited copies live in the states below
  const code = view.company.ticker;
  const [name, setName] = useState(p0.name);
  const [tr, setTr] = useState<TrKey>(p0.tr);
  const [trSince, setTrSince] = useState(p0.trSince);
  const [trSrc, setTrSrc] = useState(p0.trSrc);
  const [trWhy, setTrWhy] = useState(p0.trWhy);
  const [sektor, setSektor] = useState(p0.sektor);
  const [sub, setSub] = useState(p0.sub);
  const [priceDate, setPriceDate] = useState(p0.priceDate);
  const [period, setPeriod] = useState(p0.period);
  const [asSrc, setAsSrc] = useState(p0.asSrc);
  const [keys, setKeys] = useState(p0.keys);
  const [shortSum, setShortSum] = useState(p0.shortSum);
  const [sum, setSum] = useState(p0.sum);
  const [sumSrc, setSumSrc] = useState(p0.sumSrc);
  const [pts, setPts] = useState<Record<"str" | "weak" | "mon", L<{ t: string }>>>({ str: withIds(p0.str.map((t) => ({ t }))), weak: withIds(p0.weak.map((t) => ({ t }))), mon: withIds(p0.mon.map((t) => ({ t }))) });
  const [pers, setPers] = useState(() => withIds(p0.pers));
  const [tv, setTv] = useState(p0.tv);
  const [notes, setNotes] = useState(p0.notes);
  const [metric, setMetric] = useState<MetricId>("sales");
  const [rev, setRev] = useState(() => withIds(p0.rev));
  const [subs, setSubs] = useState(() => withIds(p0.subs));
  const [sh, setSh] = useState(() => withIds(p0.sh));
  const [shNote, setShNote] = useState(p0.shNote);
  const [mg, setMg] = useState(() => withIds(p0.mg));
  const [rk, setRk] = useState(() => withIds(p0.rk));
  const [nw, setNw] = useState(() => withIds(p0.nw));
  const [busy, setBusy] = useState(false);

  // generic list patch/remove/add
  const patch = <T extends { id: number }>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number, f: Partial<T>) => set((l) => l.map((x) => (x.id === i ? { ...x, ...f } : x)));
  const drop = <T extends { id: number }>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number) => set((l) => l.filter((x) => x.id !== i));
  const bind = <T extends { id: number }, K extends keyof T>(set: React.Dispatch<React.SetStateAction<T[]>>, row: T, k: K) => ({
    value: row[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => patch(set, row.id, { [k]: e.target.value } as Partial<T>),
  });

  // --- derived / validation (mirrors the backend checklist in lib/adminCompanies.js `sections`; the API has the final say on publish)
  const trNA = tr !== "aktif";
  const trOk = !trNA || (!!trSince && !!trSrc.trim() && !!trWhy.trim());
  const idOk = !!name.trim() && !!sub.trim() && trOk;
  const keysOk = KD.every(([k]) => keys[k].v.trim() !== "");
  const lastGm = tv.margin[tv.margin.length - 1];
  const sumOk = !!sum.trim() && sum.length <= 400 && !!sumSrc.trim(), shortOk = !!shortSum.trim() && shortSum.length <= 100;
  const ptsOk = PG.every(([k]) => pts[k].length > 0 && pts[k].every((p) => p.t.trim() && p.t.length <= 60));
  const trendOk = pers.length >= 2 && MT.every(([m]) => pers.every((_, i) => (tv[m][i] ?? "").trim() !== "") && !!notes[m].trim());
  const revTot = Math.round(rev.reduce((a, r) => a + num(r.pct), 0) * 100) / 100;
  const noSrc = rev.filter((r) => !r.src.trim()).length;
  const revOk = revTot === 100 && noSrc === 0 && rev.every((r) => r.name.trim());
  const revMsg = revTot !== 100 ? `${revTot < 100 ? "kurang" : "lebih"} ${dec(Math.abs(100 - revTot), 2)}%` : noSrc ? `${noSrc} segmen belum punya sumber` : "siap diterbitkan";
  const grpOk = subs.length > 0 && subs.every((s) => s.name.trim() && num(s.p) > 0 && num(s.p) <= 100);
  const shTot = Math.round(sh.reduce((a, s) => a + num(s.p), 0) * 100) / 100;
  const shBad = shTot > 100, shOk = !shBad && sh.every((s) => s.name.trim() && num(s.p) > 0);
  const mgOk = mg.length > 0 && mg.every((m) => m.name.trim() && m.role.trim());
  const rkOk = rk.length > 0 && rk.every((r) => r.t.trim() && r.d.trim());
  const nwOk = nw.every((x) => x.t.trim() && x.src.trim() && x.d.trim());

  const checks: CheckItem[] = [
    { group: "Profil", label: "Identitas & status", ok: idOk, href: "#s-id", note: idOk ? "" : trOk ? "Nama/subsektor" : "Lengkapi status" },
    { group: "Profil", label: "Angka utama", ok: keysOk, href: "#s-angka", note: keysOk ? "" : "Ada yang kosong" },
    { group: "Profil", label: "Ringkasan bisnis", ok: sumOk && shortOk, href: "#s-ringkas", note: sumOk && shortOk ? "" : "Perlu dicek" },
    { group: "Profil", label: "Poin kekuatan dkk.", ok: ptsOk, href: "#s-poin", note: ptsOk ? "" : "Kosong / >60 karakter" },
    { group: "Keuangan", label: "Tren keuangan", ok: trendOk, href: "#s-tren", note: trendOk ? "" : "Ada sel kosong" },
    { group: "Keuangan", label: "Sumber pendapatan", ok: revOk, href: "#s-pend", note: revOk ? "" : revMsg },
    { group: "Kepemilikan", label: "Struktur grup", ok: grpOk, href: "#s-grup", note: grpOk ? "" : "Cek porsi" },
    { group: "Kepemilikan", label: "Pemegang saham", ok: shOk, href: "#s-saham", note: shOk ? "" : "Total >100%" },
    { group: "Kepemilikan", label: "Manajemen", ok: mgOk, href: "#s-mgmt", note: mgOk ? "" : "Ada yang kosong" },
    { group: "Konteks", label: "Risiko utama", ok: rkOk, href: "#s-risk", note: rkOk ? "" : "Ada yang kosong" },
    { group: "Konteks", label: "Berita", ok: nwOk, href: "#s-berita", note: nwOk ? "" : "Ada yang kosong" },
    { group: "Konteks", label: "Tema & rantai nilai", ok: true, href: "#s-tema", note: "Modul Tema" },
  ];
  const canPub = checks.every((c) => c.ok);
  const sectorName = sectors.find((x) => x.slug === sektor)?.name ?? "Tanpa sektor";

  const currentForm = () => profileToForm({
    name, sektor, sub, tr, trSince, trSrc, trWhy, priceDate, period, asSrc, keys, shortSum, sum, sumSrc,
    str: pts.str.map((p) => p.t), weak: pts.weak.map((p) => p.t), mon: pts.mon.map((p) => p.t),
    pers: pers.map(omitId), tv, notes, rev: rev.map(omitId), subs: subs.map(omitId), sh: sh.map(omitId), shNote, mg: mg.map(omitId), rk: rk.map(omitId), nw: nw.map(omitId),
  }, view.form);

  // Saving replaces the whole draft; customers keep seeing the published version until "Terbitkan".
  const save = async () => {
    const r = await saveCompany(code, currentForm());
    if (!r.ok) { toast(describeError(r.error)); return null; }
    setView(r.data);
    return r.data;
  };
  const saveDraft = async () => { setBusy(true); const v = await save(); setBusy(false); if (v) toast("Draf tersimpan. Pengguna masih melihat versi yang sudah terbit."); };
  const publish = async () => {
    if (!canPub) return toast(`Belum bisa terbit: ${checks.filter((c) => !c.ok).map((c) => c.label).join(", ")}`);
    setBusy(true);
    const v = await save(); // publish uses the saved draft, so unsaved edits go first
    const r = v ? await publishCompany(code) : null;
    setBusy(false);
    if (!r) return;
    if (!r.ok) return toast(describeError(r.error));
    setView(r.data);
    toast(`Perubahan ${code} diterbitkan dan langsung tampil di aplikasi`);
  };

  const header = (
    <div className="flex flex-wrap items-center gap-4">
      <EntityAvatar code={code} logo={view.company.logoUrl ?? undefined} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl leading-tight font-bold tracking-tight"><code className="mr-2 font-mono text-[22px]">{code}</code>{name.trim() || "Nama emiten"}</h1>
          <StatusBadge tone={TR[tr].tone}>{TR[tr].label}</StatusBadge>
          <StatusBadge tone={PUB[view.publishStatus.key][1]}>{PUB[view.publishStatus.key][0]}</StatusBadge>
        </div>
        <span className="text-sm text-muted-foreground">{sectorName} · {sub || "subsektor"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Link href={`/emiten/${code}`} className={buttonVariants({ variant: "outline" })}><ExternalLink aria-hidden />Lihat di aplikasi</Link>
        <Button variant="outline" disabled={busy} onClick={() => void saveDraft()}>Simpan draf</Button>
        <Button aria-disabled={!canPub} disabled={busy} onClick={() => void publish()}>Terbitkan</Button>
      </div>
    </div>
  );

  const rail = (
    <Card>
      <CardHeader><CardTitle>Terakhir diperbarui</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-1.5 text-[13px] leading-snug">
        <span><b className="font-semibold">{view.updatedBy}</b></span>
        <time className="text-xs text-muted-foreground">{fmtWhen(view.updatedAt)}</time>
        {view.hasDraft && view.published && <Help>Ada draf yang belum diterbitkan. Pengguna masih melihat versi sebelumnya.</Help>}
      </CardContent>
    </Card>
  );

  const barVals = tv[metric].map((v) => num(v));
  const barMax = Math.max(...barVals, 1);
  const rowCls = "grid items-center gap-2";

  return (
    <EditorShell header={header} checks={checks} rail={rail}>
      <Section id="s-id" title="Identitas & status" desc="Biasanya ikut sinkron BEI. Ubah manual hanya kalau ada perubahan nama, kode, atau status yang belum tersinkron.">
        <div className="flex flex-wrap gap-5">
          <div className="flex w-[132px] flex-none flex-col items-start gap-2">
            <EntityAvatar code={code} logo={view.company.logoUrl ?? undefined} size={96} dark />
            <Help>Logo mengikuti data BEI. Unggah logo belum tersedia (menunggu penyimpanan file).</Help>
          </div>
          <div className="flex min-w-[260px] flex-1 flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-[1fr_140px]">
              <FormField label="Nama emiten" htmlFor="f-nm"><Input id="f-nm" aria-invalid={!name.trim()} value={name} onChange={(e) => setName(e.target.value)} /></FormField>
              <FormField label="Kode saham" htmlFor="f-tk"><Input id="f-tk" className="font-mono" value={code} disabled readOnly /></FormField>
            </div>
            <FormField label="Status perdagangan">
              <ChoiceCards label="Status perdagangan" value={tr} onChange={setTr} options={(Object.keys(TR) as TrKey[]).map((k) => ({ v: k, label: TR[k].label, sub: TR[k].sub, dot: TR[k].dot }))} />
            </FormField>
            {trNA && (
              <Card size="sm" className={cn("gap-3 px-3.5 text-[13.5px] shadow-none", tr === "suspend" ? "border-(--sp-danger-border) bg-(--sp-danger-bg)" : "bg-accent")}>
                <p><b>Yang dilihat pengguna:</b> {TR[tr].effect}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Berlaku sejak" htmlFor="f-sd"><Input id="f-sd" type="date" aria-invalid={!trSince} value={trSince} onChange={(e) => setTrSince(e.target.value)} /></FormField>
                  <FormField label="Sumber pengumuman BEI" htmlFor="f-ss"><Input id="f-ss" aria-invalid={!trSrc.trim()} value={trSrc} onChange={(e) => setTrSrc(e.target.value)} placeholder="mis. Pengumuman BEI No. Peng-SPT-00012/BEI.PP1/11-2026" /></FormField>
                </div>
                <FormField label="Alasan, dalam bahasa sederhana" hint="tampil ke pengguna" htmlFor="f-sr"><Textarea id="f-sr" aria-invalid={!trWhy.trim()} className="min-h-16" value={trWhy} onChange={(e) => setTrWhy(e.target.value)} placeholder="mis. Perdagangan dihentikan sementara karena belum menyampaikan laporan keuangan." /></FormField>
              </Card>
            )}
          </div>
        </div>
        <div className="grid gap-3.5 border-t border-sp-line-soft pt-3.5 sm:grid-cols-3">
          <FormField label="Sektor IDX-IC"><NativeSelect aria-label="Sektor IDX-IC" value={sektor} onChange={(e) => setSektor(e.target.value)}><NativeSelectOption value="">Pilih sektor</NativeSelectOption>{sectors.map((s) => <NativeSelectOption key={s.slug} value={s.slug}>{s.name}</NativeSelectOption>)}</NativeSelect></FormField>
          <FormField label="Subsektor"><Input aria-label="Subsektor" aria-invalid={!sub.trim()} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="mis. Batu bara" /></FormField>
          <FormField label="Status data"><span className="flex h-11 items-center text-sm">{view.published ? "Pernah terbit" : "Belum pernah terbit"}</span></FormField>
        </div>
        {!sub.trim() && <Err>Subsektor wajib diisi.</Err>}
      </Section>

      <Section id="s-angka" title="Angka utama" desc="Lima angka di kepala halaman emiten. Diisi manual, tidak realtime, jadi selalu tulis per tanggal berapa.">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <FormField label="Tanggal harga penutupan" htmlFor="f-pd"><Input id="f-pd" type="date" value={priceDate} onChange={(e) => setPriceDate(e.target.value)} /></FormField>
          <FormField label="Periode laporan keuangan" htmlFor="f-per"><Input id="f-per" maxLength={20} placeholder="mis. H1-2026" value={period} onChange={(e) => setPeriod(e.target.value)} /></FormField>
          <FormField label="Sumber" htmlFor="f-asrc"><Input id="f-asrc" value={asSrc} onChange={(e) => setAsSrc(e.target.value)} /></FormField>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {KD.map(([k, l, pre, suf]) => (
            <FormField key={k} label={l} htmlFor={`k-${k}`}>
              <AffixInput id={`k-${k}`} inputMode="decimal" prefix={pre || undefined} suffix={suf} invalid={!keys[k].v.trim()} value={keys[k].v} onChange={(e) => setKeys({ ...keys, [k]: { ...keys[k], v: e.target.value } })} />
              <Textarea aria-label={`Penjelasan ${l}`} className="min-h-20 text-[13px]" value={keys[k].tip} onChange={(e) => setKeys({ ...keys, [k]: { ...keys[k], tip: e.target.value } })} />
              {k === "gm" && num(keys.gm.v) !== num(lastGm) && <span className="text-[12.5px] text-[#B45309]">Beda dengan margin periode terakhir di Tren keuangan ({lastGm}%).</span>}
            </FormField>
          ))}
        </div>
        <Help>Kotak penjelasan di bawah tiap angka muncul saat pengguna mengarahkan kursor ke angka itu.</Help>
      </Section>

      <Section id="s-ringkas" title="Ringkasan bisnis" desc="Dua sampai tiga kalimat bahasa sehari-hari: bisnis apa, uangnya dari mana, dan apa yang menggerakkan kinerjanya.">
        <FormField label="Deskripsi singkat" hint="satu baris, tanpa format — dipakai di kartu pencarian, daftar tema, dan watchlist" htmlFor="shortsum">
          <Input id="shortsum" aria-invalid={!shortOk} value={shortSum} onChange={(e) => setShortSum(e.target.value)} placeholder="mis. Produsen batu bara termal terbesar di Indonesia" />
          <div className="flex justify-end"><Counter n={shortSum.length} max={100} /></div>
        </FormField>
        <FormField label="Ringkasan lengkap" hint="tampil di halaman emiten" htmlFor="sum">
          <Textarea id="sum" aria-invalid={!sumOk} className="min-h-[140px]" value={sum} onChange={(e) => setSum(e.target.value)} />
          <div className="flex justify-between gap-3"><Help>Apit dengan **dua bintang** untuk menebalkan satu frasa penting.</Help><Counter n={sum.length} max={400} /></div>
        </FormField>
        <FormField label="Sumber" htmlFor="sumsrc"><Input id="sumsrc"  value={sumSrc} onChange={(e) => setSumSrc(e.target.value)} placeholder="mis. Laporan Tahunan 2025, hlm. 12" /></FormField>
      </Section>

      <Section id="s-poin" title="Kekuatan, kelemahan & yang dipantau" desc="Poin pendek, maksimal 60 karakter dan 5 poin per kelompok. Tampil di bawah ringkasan bisnis.">
        <div className="grid gap-4 md:grid-cols-3">
          {PG.map(([k, label, c]) => {
            const set = ((fn: React.SetStateAction<L<{ t: string }>>) => setPts((p) => ({ ...p, [k]: typeof fn === "function" ? fn(p[k]) : fn }))) as React.Dispatch<React.SetStateAction<L<{ t: string }>>>;
            return (
              <div key={k} className="flex flex-col gap-2">
                <b className="flex items-center gap-2 text-sm font-semibold"><i className="size-2 rounded-full" style={{ background: c }} />{label}<span className="ml-auto font-mono text-xs font-normal text-muted-foreground">{pts[k].length}/5</span></b>
                {pts[k].map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1"><Input aria-invalid={!p.t.trim() || p.t.length > 60} className="h-10" aria-label={`${label} ${i + 1}`} maxLength={80} {...bind(set, p, "t")} /><RemoveBtn label={`Hapus ${label.toLowerCase()} ${i + 1}`} onClick={() => drop(set, p.id)} /></div>
                ))}
                {pts[k].length < 5 && <LinkBtn onClick={() => set((l) => [...l, id({ t: "" })])}>+ Tambah poin</LinkBtn>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="s-tren" title="Tren keuangan" desc="Angka dari laporan keuangan, dalam triliun rupiah kecuali margin. Periode terakhir disorot di aplikasi."
        aside={<Button variant="outline" size="sm"  onClick={() => { if (pers.length >= MAX_PERIODS) return toast(`Maksimal ${MAX_PERIODS} periode`); setPers([...pers, id({ p: "", sub: "" })]); setTv((v) => ({ sales: [...v.sales, ""], profit: [...v.profit, ""], margin: [...v.margin, ""] })); }}><Plus aria-hidden />Periode</Button>}>
        <div className="overflow-x-auto">
          <div className="grid min-w-[520px] items-center gap-2" style={{ gridTemplateColumns: `150px repeat(${pers.length}, minmax(90px, 1fr))` }}>
            <span className="text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase">Periode</span>
            {pers.map((p, i) => (
              <span key={p.id} className="flex flex-col gap-1">
                <Input aria-invalid={!p.p.trim()} className="h-9 text-center font-mono text-[13px]" aria-label={`Periode ${i + 1}`} {...bind(setPers, p, "p")} />
                <Input className="h-8 text-center text-xs" aria-label={`Keterangan periode ${i + 1}`} {...bind(setPers, p, "sub")} />
              </span>
            ))}
            {MT.map(([m, l, u]) => (
              <div key={m} className="contents">
                <span className="flex flex-col text-sm font-semibold">{l}<small className="text-xs font-normal text-muted-foreground">{u}</small></span>
                {pers.map((p, i) => <Input key={p.id} inputMode="decimal" aria-label={`${l} ${p.p}`} aria-invalid={!(tv[m][i] ?? "").trim()} className="h-10 text-right font-mono" value={tv[m][i] ?? ""} onChange={(e) => setTv((v) => ({ ...v, [m]: pers.map((_, j) => (j === i ? e.target.value : v[m][j] ?? "")) }))} />)}
              </div>
            ))}
            <span />
            {pers.map((p, i) => <span key={p.id} className="text-center">{pers.length > 2 && <LinkBtn className="self-center text-xs text-(--sp-danger-text)" onClick={() => { drop(setPers, p.id); setTv((v) => ({ sales: v.sales.filter((_, j) => j !== i), profit: v.profit.filter((_, j) => j !== i), margin: v.margin.filter((_, j) => j !== i) })); }}>Hapus</LinkBtn>}</span>)}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-sp-line-soft pt-3.5">
          <span className="text-[13.5px] font-semibold">Catatan per grafik <small className="font-normal text-muted-foreground">teks di bawah grafik saat tab itu dipilih</small></span>
          <FilterTabs label="Pilih metrik" value={metric} onChange={setMetric} tabs={MT.map(([v, label]) => ({ v, label }))} />
          <div aria-hidden className="flex h-24 items-end gap-3 px-1">
            {barVals.map((v, i) => <div key={pers[i]?.id ?? i} className="flex flex-1 flex-col items-center justify-end gap-1"><small className="font-mono text-[11px] text-muted-foreground">{tv[metric][i]}</small><i className={cn("w-full max-w-14 rounded-t", i === barVals.length - 1 ? "bg-primary" : "bg-border")} style={{ height: `${Math.max(4, (v / barMax) * 70)}%` }} /></div>)}
          </div>
          <div aria-hidden className="flex gap-3 px-1 text-center text-[11.5px] text-muted-foreground">{pers.map((p) => <span key={p.id} className="flex-1">{p.p}</span>)}</div>
          <Textarea aria-invalid={!notes[metric].trim()} className="min-h-24" aria-label={`Catatan grafik ${MT.find((m) => m[0] === metric)?.[1]}`} value={notes[metric]} onChange={(e) => setNotes({ ...notes, [metric]: e.target.value })} />
        </div>
      </Section>

      <Section id="s-lk" title="Laporan keuangan" desc="Lampiran XBRL dan PDF per periode, persis seperti yang dirilis emiten di BEI.">
        <Note tone="info" icon={<Info aria-hidden />}>Unggah laporan keuangan belum tersedia: server belum punya penyimpanan file, dan bagian ini belum ikut cek kelengkapan terbit.</Note>
      </Section>

      <Section id="s-pend" title="Sumber pendapatan" desc="Persentase per segmen. Totalnya harus 100% dan tiap baris wajib punya sumber.">
        <div className={cn(rowCls, "grid-cols-[1fr_100px_1.2fr_36px] text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase")}><span>Segmen</span><span className="text-right">Porsi</span><span>Sumber dokumen</span><span /></div>
        {rev.map((r, i) => (
          <div key={r.id} className={cn(rowCls, "grid-cols-[1fr_100px_1.2fr_36px]")}>
            <Input  aria-label={`Segmen ${i + 1}`} {...bind(setRev, r, "name")} />
            <AffixInput suffix="%" inputMode="decimal" aria-label={`Porsi segmen ${i + 1}`} {...bind(setRev, r, "pct")} />
            <Input aria-invalid={!r.src.trim()} aria-label={`Sumber segmen ${i + 1}`} placeholder="Wajib diisi" {...bind(setRev, r, "src")} />
            <RemoveBtn label={`Hapus segmen ${i + 1}`} onClick={() => drop(setRev, r.id)} />
          </div>
        ))}
        <ShareBar parts={rev.map((r, i) => ({ key: r.id, pct: (Math.max(0, num(r.pct)) / Math.max(revTot, 100)) * 100, color: REV_COL[i % REV_COL.length] }))} />
        <div className="flex items-center justify-between text-sm"><LinkBtn onClick={() => setRev([...rev, id({ name: "", pct: "0", src: "" })])}>+ Tambah segmen</LinkBtn><span className="flex items-center gap-1.5">Total <b className={cn("font-mono", revTot === 100 ? "text-sp-success" : "text-(--sp-danger-text)")}>{dec(revTot, 2)}%</b> <Help className="w-auto">· {revMsg}</Help></span></div>
      </Section>

      <Section id="s-grup" title="Struktur grup" desc="Anak usaha dan investasi beserta porsi kepemilikan. Isi kode kalau perusahaannya juga tercatat di BEI supaya bisa diklik."
        aside={<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock aria-hidden className="size-3" />Daftar awal dari BEI</span>}>
        <div className={cn(rowCls, "grid-cols-[1fr_90px_80px_52px_36px] text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase")}><span>Perusahaan &amp; bidang usaha</span><span className="text-right">Kepemilikan</span><span>Kode</span><span>Tampil</span><span /></div>
        {subs.map((s, i) => (
          <div key={s.id} className={cn(rowCls, "grid-cols-[1fr_90px_80px_52px_36px]")}>
            <span className="flex flex-col gap-1"><Input aria-invalid={!s.name.trim()} className="h-9" aria-label={`Nama perusahaan ${i + 1}`} placeholder="Nama perusahaan" {...bind(setSubs, s, "name")} /><Input className="h-9 text-[13px]" aria-label={`Bidang usaha ${i + 1}`} placeholder="Bidang usaha" {...bind(setSubs, s, "biz")} /></span>
            <AffixInput suffix="%" invalid={!(num(s.p) > 0 && num(s.p) <= 100)} inputMode="decimal" aria-label={`Kepemilikan ${i + 1}`} {...bind(setSubs, s, "p")} />
            <Input className="font-mono" aria-label={`Kode ${i + 1}`} maxLength={4} placeholder="—" value={s.tk} onChange={(e) => patch(setSubs, s.id, { tk: e.target.value.toUpperCase() })} />
            <Switch checked={s.show} aria-label={`Tampilkan ${s.name || `perusahaan ${i + 1}`}`} onCheckedChange={(v) => patch(setSubs, s.id, { show: v })} />
            <RemoveBtn label={`Hapus perusahaan ${i + 1}`} onClick={() => drop(setSubs, s.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setSubs([...subs, id({ name: "", biz: "", p: "", tk: "", show: true })])}>+ Tambah perusahaan</LinkBtn>
      </Section>

      <Section id="s-saham" title="Pemegang saham" desc="Pemegang 5% ke atas. Sisanya dihitung otomatis sebagai publik (free float).">
        <div className={cn(rowCls, "grid-cols-[1fr_100px_36px] text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase")}><span>Nama</span><span className="text-right">Porsi</span><span /></div>
        {sh.map((s, i) => (
          <div key={s.id} className={cn(rowCls, "grid-cols-[1fr_100px_36px]")}>
            <Input aria-invalid={!s.name.trim()} aria-label={`Pemegang saham ${i + 1}`} {...bind(setSh, s, "name")} />
            <AffixInput suffix="%" invalid={shBad} inputMode="decimal" aria-label={`Porsi pemegang ${i + 1}`} {...bind(setSh, s, "p")} />
            <RemoveBtn label={`Hapus pemegang ${i + 1}`} onClick={() => drop(setSh, s.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setSh([...sh, id({ name: "", p: "" })])}>+ Tambah pemegang saham</LinkBtn>
        <Item variant="muted" size="sm"><ItemContent><ItemTitle className="font-normal">Publik (free float)</ItemTitle></ItemContent><ItemActions><b className={cn("font-mono", shBad && "text-(--sp-danger-text)")}>{dec(Math.max(0, 100 - shTot), 2)}%</b></ItemActions></Item>
        {shBad && <Err>Total pemegang saham lebih dari 100%.</Err>}
        <FormField label="Catatan kepemilikan" hint="opsional" htmlFor="f-shn"><Textarea id="f-shn" className="min-h-[60px]" value={shNote} onChange={(e) => setShNote(e.target.value)} /></FormField>
      </Section>

      <Section id="s-mgmt" title="Manajemen" desc="Tiga nama teratas tampil di halaman emiten, jadi urutkan dari jabatan tertinggi." aside={<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock aria-hidden className="size-3" />Dari BEI · {mg.length} orang</span>}>
        <div className={cn(rowCls, "grid-cols-[1fr_1fr_36px] text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase")}><span>Nama</span><span>Jabatan</span><span /></div>
        {mg.map((m, i) => (
          <div key={m.id} className={cn(rowCls, "grid-cols-[1fr_1fr_36px]")}>
            <Input aria-invalid={!m.name.trim()} aria-label={`Nama ${i + 1}`} {...bind(setMg, m, "name")} />
            <Input aria-invalid={!m.role.trim()} aria-label={`Jabatan ${i + 1}`} {...bind(setMg, m, "role")} />
            <RemoveBtn label={`Hapus orang ${i + 1}`} onClick={() => drop(setMg, m.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setMg([...mg, id({ name: "", role: "" })])}>+ Tambah orang</LinkBtn>
      </Section>

      <Section id="s-risk" title="Risiko utama" desc="Judul pendek dan satu kalimat penjelasan. Tingkat “Tinggi” diberi tanda merah di aplikasi.">
        {rk.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_120px_36px] items-start gap-2">
            <div className="flex flex-col gap-1.5"><Input aria-invalid={!r.t.trim()} aria-label={`Judul risiko ${i + 1}`} {...bind(setRk, r, "t")} /><Textarea aria-invalid={!r.d.trim()} className="min-h-16 text-[13.5px]" aria-label={`Penjelasan risiko ${i + 1}`} {...bind(setRk, r, "d")} /></div>
            <NativeSelect aria-label={`Tingkat risiko ${i + 1}`} {...bind(setRk, r, "lv")}>{(Object.keys(LV) as (keyof typeof LV)[]).map((k) => <NativeSelectOption key={k} value={k}>{LV[k]}</NativeSelectOption>)}</NativeSelect>
            <RemoveBtn label={`Hapus risiko ${i + 1}`} onClick={() => drop(setRk, r.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setRk([...rk, id({ t: "", d: "", lv: "m" as const })])}>+ Tambah risiko</LinkBtn>
      </Section>

      <Section id="s-berita" title="Berita & perkembangan" desc="Tiga terbaru tampil di halaman emiten. Tulis faktanya, bukan opini atau rekomendasi.">
        {nw.map((n, i) => (
          <div key={n.id} className="grid grid-cols-[1fr_36px] items-start gap-2">
            <div className="flex flex-col gap-1.5">
              <Input aria-invalid={!n.t.trim()} aria-label={`Judul berita ${i + 1}`} placeholder="Judul" {...bind(setNw, n, "t")} />
              <div className="grid gap-1.5 sm:grid-cols-2"><Input aria-invalid={!n.src.trim()} aria-label={`Sumber berita ${i + 1}`} placeholder="Sumber" {...bind(setNw, n, "src")} /><Input aria-invalid={!n.d.trim()} aria-label={`Tanggal berita ${i + 1}`} placeholder="Tanggal, mis. 30 Okt 2026" {...bind(setNw, n, "d")} /></div>
            </div>
            <RemoveBtn label={`Hapus berita ${i + 1}`} onClick={() => drop(setNw, n.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setNw([...nw, id({ t: "", src: "", d: "" })])}>+ Tambah berita</LinkBtn>
      </Section>

      <Section id="s-tema" title="Tema & rantai nilai" desc="Diatur dari halaman tema: tahap dan porsi pendapatan emiten ada di sana.">
        {view.themes.length ? view.themes.map((t) => (
          <Item key={t.slug} variant="outline"><ItemContent className="flex-row items-baseline gap-2"><ItemTitle><Link href={`/admin/tema/${t.slug}`} className="hover:underline">{t.name}</Link></ItemTitle><ItemDescription>· {t.stageCount} tahap</ItemDescription></ItemContent></Item>
        )) : <Help>Belum dipetakan ke tema mana pun.</Help>}
      </Section>
    </EditorShell>
  );
}

