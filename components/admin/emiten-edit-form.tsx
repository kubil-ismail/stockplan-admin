"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Flag, Info, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { logoOf } from "@/lib/emiten-data";
import { dec, num } from "@/lib/ipo";
import {
  AffixInput, ChoiceCards, Counter, EditorShell, EntityAvatar, Err, FileSlot, FilterTabs, FormField, Help, LinkBtn, LogoUpload, Note, RemoveBtn,
  Section, ShareBar, StatusBadge, type Check as CheckItem, type FileInfo, type Tone,
} from "./form-ui";

let uid = 1000;
const id = <T extends object>(o: T) => ({ id: uid++, ...o });
type L<T> = (T & { id: number })[];
const SEKTOR = ["Energi", "Barang Baku", "Perindustrian", "Barang Konsumen Primer", "Barang Konsumen Non-Primer", "Kesehatan", "Keuangan", "Properti & Real Estat", "Teknologi", "Infrastruktur", "Transportasi & Logistik"];

const TR = {
  aktif: { label: "Aktif", sub: "Diperdagangkan normal", dot: "#16A34A", tone: "success" as Tone, effect: "" },
  suspend: { label: "Suspend", sub: "Dihentikan sementara", dot: "#DC2626", tone: "danger" as Tone, effect: "Banner merah di halaman emiten berisi alasan dan tanggal. Tetap muncul di tema dan portofolio dengan label Suspend." },
  monitor: { label: "Monitoring", sub: "Papan pemantauan khusus", dot: "#F59E0B", tone: "warning" as Tone, effect: "Label “Pemantauan khusus” di halaman emiten dan di daftar tema, disertai alasan di bawah." },
  delisted: { label: "Delisted", sub: "Keluar dari bursa", dot: "#78716C", tone: "neutral" as Tone, effect: "Hilang dari pencarian dan tema. Pengguna yang masih menyimpannya di portofolio, tesis, atau watchlist tetap melihatnya dengan label Delisted dan mendapat email." },
} as const;
type TrKey = keyof typeof TR;

const KD = [["mc", "Market cap", "Rp", "T"], ["pbv", "PBV", "", "x"], ["roe", "ROE", "", "%"], ["gm", "Margin bruto", "", "%"], ["da", "Utang / aset", "", "%"]] as const;
const MT = [["sales", "Penjualan", "Rp triliun"], ["profit", "Laba bersih", "Rp triliun, milik induk"], ["margin", "Margin bruto", "persen"]] as const;
const PG = [["str", "Kekuatan", "#16A34A"], ["weak", "Kelemahan", "#DC2626"], ["mon", "Yang dipantau", "#F59E0B"]] as const;
const REV_COL = ["#1C1917", "#FEA722", "#A8A29E", "#78716C", "#D6D3D1"];
const LV = { h: "Tinggi", m: "Sedang", l: "Rendah" } as const;

type Lk = { y: string; q: string; rel: string; x: FileInfo | null; p: FileInfo | null; xErr?: boolean };
const file = (name: string, size: number, at: string, xErr?: boolean) => ({ name, size, at, xErr });

// shortcut: BUMI sample data from the design; load from /admin/api/companies/:kode and PATCH on save/publish.
export function EmitenEditForm({ kode }: { kode: string }) {
  const [logo, setLogo] = useState(logoOf("BUMI"));
  const [name, setName] = useState("Bumi Resources Tbk");
  const [tk, setTk] = useState(kode);
  const [tr, setTr] = useState<TrKey>("aktif");
  const [trSince, setTrSince] = useState("");
  const [trSrc, setTrSrc] = useState("");
  const [trWhy, setTrWhy] = useState("");
  const [sektor, setSektor] = useState("Energi");
  const [sub, setSub] = useState("Batu bara");
  const [asOf, setAsOf] = useState("Harga penutupan 31 Okt 2026 · LK H1-2026");
  const [asSrc, setAsSrc] = useState("BEI & laporan keuangan BUMI");
  const [keys, setKeys] = useState<Record<string, { v: string; tip: string }>>({
    mc: { v: "44,9", tip: 'Harga saham × jumlah saham beredar (371,3 miliar lembar). Gambaran berapa "harga" seluruh perusahaan di bursa.' },
    pbv: { v: "1,5", tip: "Harga saham dibanding nilai buku per lembar. 1,5x artinya pasar menghargai BUMI 1,5 kali nilai bersih asetnya." },
    roe: { v: "7", tip: "Laba bersih dibanding modal pemegang saham. Mengukur seberapa efisien modal diubah jadi laba." },
    gm: { v: "17", tip: "Sisa penjualan setelah dikurangi biaya pokok (biaya tambang). Makin tinggi, makin untung tiap ton yang dijual." },
    da: { v: "36", tip: "Porsi aset yang dibiayai utang. Semakin rendah umumnya semakin ringan beban bunganya." },
  });
  const [shortSum, setShortSum] = useState("Produsen batu bara termal terbesar di Indonesia, lewat anak usaha KPC dan Arutmin.");
  const [sum, setSum] = useState("BUMI adalah induk tambang batu bara termal Grup Bakrie dan **produsen batu bara terbesar di Indonesia berdasarkan volume**. Uangnya hampir seluruhnya datang dari menjual batu bara termal (bahan bakar PLTU) yang ditambang dua anak usahanya, KPC dan Arutmin — jadi kinerjanya mengikuti harga batu bara termal dunia.");
  const [sumSrc, setSumSrc] = useState("Laporan Tahunan 2025");
  const [pts, setPts] = useState<Record<string, L<{ t: string }>>>({
    str: [id({ t: "Skala terbesar di RI" }), id({ t: "Neraca sudah sehat (utang/aset 36%)" }), id({ t: "Margin bruto naik 8% → 17%" })],
    weak: [id({ t: "ROE cuma 7%" }), id({ t: "~44% ekuitas milik minoritas anak usaha" }), id({ t: "Laba kecil dibanding skala" })],
    mon: [id({ t: "Liabilitas naik Rp7 T di H1-2026" }), id({ t: "Harga batu bara termal" }), id({ t: "Aksi korporasi soal porsi KPC" })],
  });
  const [pers, setPers] = useState<L<{ p: string; sub: string }>>([id({ p: "2023", sub: "setahun" }), id({ p: "2024", sub: "setahun" }), id({ p: "2025", sub: "setahun" }), id({ p: "H1-2026", sub: "6 bulan" })]);
  const [tv, setTv] = useState<Record<string, string[]>>({ sales: ["25,9", "22,0", "24,1", "15,5"], profit: ["0,2", "1,1", "1,4", "1,1"], margin: ["8", "12", "17", "17"] });
  const [notes, setNotes] = useState<Record<string, string>>({
    sales: "Penjualan stabil di Rp22–26 T per tahun — bisnis matang bervolume besar, bukan pertumbuhan cepat. H1-2026 baru 6 bulan, jadi belum setara setahun penuh.",
    profit: "Laba milik pemegang saham induk naik dari Rp0,2 T ke Rp1,4 T, dan 6 bulan pertama 2026 sudah Rp1,1 T. Tapi tetap kecil dibanding penjualan Rp24 T — sebagian besar laba KPC mengalir ke minoritas.",
    margin: "Ceritanya di sini: pendorong laba bukan volume, melainkan margin yang membaik seiring pemulihan harga batu bara dan pengendalian biaya.",
  });
  const [metric, setMetric] = useState<(typeof MT)[number][0]>("sales");
  const [lk, setLk] = useState<L<Lk>>([
    id({ y: "2026", q: "Q3", rel: "2026-10-30", x: null, p: null }),
    id({ y: "2026", q: "Q2", rel: "2026-07-31", x: file("BUMI_2026_Q2_instance.zip", 1.3, "31 Jul 2026"), p: file("FinancialStatement-2026-II-BUMI.pdf", 6.8, "31 Jul 2026") }),
    id({ y: "2026", q: "Q1", rel: "2026-04-30", x: file("BUMI_2026_Q1_instance.zip", 1.1, "2 Mei 2026", true), p: file("FinancialStatement-2026-I-BUMI.pdf", 5.2, "2 Mei 2026") }),
    id({ y: "2025", q: "FY", rel: "2026-03-30", x: file("BUMI_2025_Tahunan_instance.zip", 2.4, "31 Mar 2026"), p: file("FinancialStatement-2025-Tahunan-BUMI.pdf", 14.6, "31 Mar 2026") }),
    id({ y: "2025", q: "Q3", rel: "2025-10-31", x: file("BUMI_2025_Q3_instance.zip", 1.2, "3 Nov 2025"), p: file("FinancialStatement-2025-III-BUMI.pdf", 6.1, "3 Nov 2025") }),
    id({ y: "2024", q: "FY", rel: "2025-03-28", x: file("BUMI_2024_Tahunan_instance.zip", 2.2, "1 Apr 2025"), p: file("FinancialStatement-2024-Tahunan-BUMI.pdf", 13.9, "1 Apr 2025") }),
  ]);
  const [lkF, setLkF] = useState<"all" | "q" | "fy">("all");
  const [lkAdd, setLkAdd] = useState<{ y: string; q: string; rel: string } | null>(null);
  const [rev, setRev] = useState<L<{ name: string; pct: string; src: string }>>([id({ name: "Penjualan ekspor", pct: "52", src: "Laporan Keuangan 2025, Catatan 29" }), id({ name: "Penjualan domestik", pct: "48", src: "" })]);
  const [subs, setSubs] = useState<L<{ name: string; biz: string; p: string; tk: string; show: boolean }>>([
    id({ name: "Kaltim Prima Coal (KPC)", biz: "Tambang batu bara termal, Kalimantan Timur", p: "50,99", tk: "", show: true }),
    id({ name: "Arutmin Indonesia", biz: "Tambang batu bara termal, Kalimantan Selatan", p: "90", tk: "", show: true }),
    id({ name: "Pendopo Energi Batubara", biz: "Konsesi batu bara", p: "84,48", tk: "", show: true }),
    id({ name: "IndoCoal Resources", biz: "Perusahaan investasi grup batu bara", p: "70", tk: "", show: true }),
    id({ name: "Bumi Resources Minerals", biz: "Tambang emas & mineral", p: "20,09", tk: "BRMS", show: true }),
    id({ name: "Darma Henwa", biz: "Kontraktor tambang", p: "12,44", tk: "DEWA", show: true }),
  ]);
  const [sh, setSh] = useState<L<{ name: string; p: string }>>([id({ name: "Mach Energy (Hongkong) Ltd", p: "45,78" })]);
  const [shNote, setShNote] = useState("Free float besar, tapi pemilik akhir di balik Mach Energy tidak bisa ditelusuri dari data BEI.");
  const [mg, setMg] = useState<L<{ name: string; role: string }>>([id({ name: "Sharif Cicip Sutardjo", role: "Presiden Komisaris" }), id({ name: "Adika Nuraga Bakrie", role: "Presiden Direktur" }), id({ name: "Agoes Projosasmito", role: "Wakil Presiden Direktur" })]);
  const [rk, setRk] = useState<L<{ t: string; d: string; lv: keyof typeof LV }>>([
    id({ t: "Harga batu bara termal", d: "Komoditas siklikal, paling terpapar transisi energi dibanding batu bara metalurgi.", lv: "h" }),
    id({ t: "Porsi minoritas besar", d: "44% ekuitas dan hampir separuh laba KPC milik minoritas; sulit berubah tanpa aksi korporasi.", lv: "h" }),
    id({ t: "Imbal hasil rendah", d: "ROE 7% walau skala besar; perbaikan masih bergantung harga komoditas.", lv: "m" }),
    id({ t: "Utang naik lagi", d: "Liabilitas +Rp7 T di H1-2026; kalau berlanjut, hasil deleveraging bisa terkikis.", lv: "m" }),
  ]);
  const [nw, setNw] = useState<L<{ t: string; src: string; d: string }>>([
    id({ t: "BUMI targetkan jual 76–78 juta ton batu bara di 2026, naik dari target 2025 (73–75 juta ton)", src: "Laporan keuangan BUMI", d: "30 Mar 2026" }),
    id({ t: "Produksi semester I 2025 tercatat 35,9 juta ton — KPC 25,3 juta ton, Arutmin 10,6 juta ton", src: "Data operasional BUMI", d: "H1 2025" }),
    id({ t: "Laporan Analisis Saham BUMI: margin bruto naik ke 17%, ROE masih tertahan di 7%", src: "StockPlan", d: "30 Okt 2026" }),
  ]);
  const [repDone, setRepDone] = useState<string[]>([]);
  const [status, setStatus] = useState<"review" | "draft" | "ok">("review");

  // generic list patch/remove/add
  const patch = <T extends { id: number }>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number, f: Partial<T>) => set((l) => l.map((x) => (x.id === i ? { ...x, ...f } : x)));
  const drop = <T extends { id: number }>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number) => set((l) => l.filter((x) => x.id !== i));
  const bind = <T extends { id: number }, K extends keyof T>(set: React.Dispatch<React.SetStateAction<T[]>>, row: T, k: K) => ({
    value: row[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => patch(set, row.id, { [k]: e.target.value } as Partial<T>),
  });

  // --- derived / validation
  const code = tk.trim().toUpperCase();
  const tkBad = !/^[A-Z]{4}$/.test(code);
  const trNA = tr !== "aktif";
  const trOk = !trNA || (!!trSince && !!trSrc.trim() && !!trWhy.trim());
  const idOk = !tkBad && !!name.trim() && !!sub.trim() && trOk;
  const keysOk = KD.every(([k]) => keys[k].v.trim() !== "");
  const lastGm = tv.margin[tv.margin.length - 1];
  const sumOk = !!sum.trim() && sum.length <= 400, shortOk = !!shortSum.trim() && shortSum.length <= 100;
  const ptsOk = PG.every(([k]) => pts[k].length > 0 && pts[k].every((p) => p.t.trim() && p.t.length <= 60));
  const trendOk = MT.every(([m]) => pers.every((_, i) => (tv[m][i] ?? "").trim() !== "") && !!notes[m].trim());
  const lkDone = (r: Lk) => !!r.x && !!r.p && !r.xErr && !r.x.up && !r.p.up;
  const lkBad = lk.filter((r) => !lkDone(r)).length, lkOk = lk.length > 0 && lkBad === 0;
  const revTot = Math.round(rev.reduce((a, r) => a + num(r.pct), 0) * 100) / 100;
  const noSrc = rev.filter((r) => !r.src.trim()).length;
  const revOk = revTot === 100 && noSrc === 0 && rev.length > 0;
  const revMsg = revTot !== 100 ? `${revTot < 100 ? "kurang" : "lebih"} ${dec(Math.abs(100 - revTot), 2)}%` : noSrc ? `${noSrc} segmen belum punya sumber` : "siap diterbitkan";
  const grpOk = subs.length > 0 && subs.every((s) => s.name.trim() && num(s.p) > 0 && num(s.p) <= 100);
  const shTot = Math.round(sh.reduce((a, s) => a + num(s.p), 0) * 100) / 100;
  const shBad = shTot > 100, shOk = !shBad && sh.every((s) => s.name.trim() && num(s.p) > 0);
  const mgOk = mg.length > 0 && mg.every((m) => m.name.trim() && m.role.trim());
  const rkOk = rk.length > 0 && rk.every((r) => r.t.trim() && r.d.trim());
  const nwOk = nw.every((x) => x.t.trim() && x.src.trim() && x.d.trim());

  const checks: CheckItem[] = [
    { group: "Profil", label: "Identitas & status", ok: idOk, href: "#s-id", note: idOk ? "" : trOk ? "Nama/kode" : "Lengkapi status" },
    { group: "Profil", label: "Angka utama", ok: keysOk, href: "#s-angka", note: keysOk ? "" : "Ada yang kosong" },
    { group: "Profil", label: "Ringkasan bisnis", ok: sumOk && shortOk, href: "#s-ringkas", note: sumOk && shortOk ? "" : "Perlu dicek" },
    { group: "Profil", label: "Poin kekuatan dkk.", ok: ptsOk, href: "#s-poin", note: ptsOk ? "" : "Kosong / >60 karakter" },
    { group: "Keuangan", label: "Tren keuangan", ok: trendOk, href: "#s-tren", note: trendOk ? "" : "Ada sel kosong" },
    { group: "Keuangan", label: "Laporan keuangan", ok: lkOk, href: "#s-lk", note: lkOk ? "" : `${lkBad} periode belum lengkap` },
    { group: "Keuangan", label: "Sumber pendapatan", ok: revOk, href: "#s-pend", note: revOk ? "" : revMsg },
    { group: "Kepemilikan", label: "Struktur grup", ok: grpOk, href: "#s-grup", note: grpOk ? "" : "Cek porsi" },
    { group: "Kepemilikan", label: "Pemegang saham", ok: shOk, href: "#s-saham", note: shOk ? "" : "Total >100%" },
    { group: "Kepemilikan", label: "Manajemen", ok: mgOk, href: "#s-mgmt", note: mgOk ? "" : "Ada yang kosong" },
    { group: "Konteks", label: "Risiko utama", ok: rkOk, href: "#s-risk", note: rkOk ? "" : "Ada yang kosong" },
    { group: "Konteks", label: "Berita", ok: nwOk, href: "#s-berita", note: nwOk ? "" : "Ada yang kosong" },
    { group: "Konteks", label: "Tema & rantai nilai", ok: true, href: "#s-tema", note: "Modul Tema" },
  ];
  const canPub = checks.every((c) => c.ok);

  const REPS = [
    { id: "r1", text: "Porsi kepemilikan di Darma Henwa sepertinya sudah berubah setelah right issue tahun ini.", meta: "Andi W. · 3 Nov 2026 · Bagian: Struktur grup", href: "#s-grup" },
    { id: "r2", text: "Laba bersih H1-2026 di grafik beda dengan laporan keuangan yang baru dirilis.", meta: "sari.k@… · 4 Nov 2026 · Bagian: Tren keuangan", href: "#s-tren" },
  ].filter((r) => !repDone.includes(r.id));
  const ST: Record<"review" | "draft" | "ok", [string, Tone]> = { review: ["Perlu ditinjau", "warning"], draft: ["Draf tersimpan", "neutral"], ok: ["Terbit", "success"] };

  const header = (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <EntityAvatar code={code} logo={logo} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl leading-tight font-bold tracking-tight"><code className="mr-2 font-mono text-[22px]">{code || "····"}</code>{name.trim() || "Nama emiten"}</h1>
            <StatusBadge tone={TR[tr].tone}>{TR[tr].label}</StatusBadge>
            <StatusBadge tone={ST[status][1]}>{ST[status][0]}</StatusBadge>
          </div>
          <span className="text-sm text-muted-foreground">{sektor} · {sub || "subsektor"} · Papan Utama · Dilihat pengguna 3.410 kali bulan ini</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/emiten/${code}`} className={buttonVariants({ variant: "outline" })}><ExternalLink aria-hidden />Lihat di aplikasi</Link>
          <Button variant="outline" onClick={() => { setStatus("draft"); toast("Draf tersimpan. Pengguna masih melihat versi yang sudah terbit."); }}>Simpan draf</Button>
          <Button aria-disabled={!canPub}
            onClick={() => { if (!canPub) return toast(`Belum bisa terbit: ${checks.filter((c) => !c.ok).map((c) => c.label).join(", ")}`); setStatus("ok"); toast(`Perubahan ${code} diterbitkan dan langsung tampil di aplikasi`); }}>Terbitkan</Button>
        </div>
      </div>
      {REPS.length > 0 && (
        <Card aria-labelledby="rep-h" className="gap-0 border-(--sp-danger-border) bg-(--sp-danger-bg) py-0">
          <CardHeader className="flex items-center gap-2 py-3 text-[13.5px] text-[#991B1B]">
            <Flag aria-hidden className="size-4" /><CardTitle id="rep-h" className="text-[13.5px]">{REPS.length} laporan pengguna belum ditangani</CardTitle><span className="text-[#B45309]">Dari form Bantuan › Data salah</span>
          </CardHeader>
          {REPS.map((r) => (
            <Item key={r.id} className="rounded-none border-0 border-t border-(--sp-danger-border) bg-background/60 px-4">
              <ItemContent className="min-w-[240px] gap-0.5"><ItemTitle className="line-clamp-none font-normal"><q>{r.text}</q></ItemTitle><ItemDescription className="text-xs">{r.meta}</ItemDescription></ItemContent>
              <ItemActions>
                <a href={r.href} className={buttonVariants({ variant: "outline", size: "sm" })}>Ke bagian ini</a>
                <Button variant="outline" size="sm" onClick={() => { setRepDone([...repDone, r.id]); toast("Laporan ditandai selesai. Pelapor diberi tahu lewat email."); }}><Check aria-hidden />Tandai selesai</Button>
              </ItemActions>
            </Item>
          ))}
        </Card>
      )}
    </>
  );

  const rail = (
    <Card>
      <CardHeader><CardTitle>Riwayat perubahan</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-2.5 text-[13px] leading-snug">
        {[["Rina", "memperbarui tren keuangan H1-2026", "Hari ini, 09.40 · draf"], ["Dimas", "menerbitkan profil", "30 Okt 2026"], ["Sistem", "memperbarui manajemen dari BEI", "1 Okt 2026"]].map(([w, a, t]) => (
          <div key={t}><span><b className="font-semibold">{w}</b> {a}</span><time className="block text-xs text-muted-foreground">{t}</time></div>
        ))}
      </CardContent>
    </Card>
  );

  const lkShown = lk.filter((r) => lkF === "all" || (lkF === "fy" ? r.q === "FY" : r.q !== "FY"));
  const lkDup = lkAdd && lk.some((r) => r.y === lkAdd.y && r.q === lkAdd.q) ? `Periode ${lkAdd.q === "FY" ? "Tahunan" : lkAdd.q} ${lkAdd.y} sudah ada.` : "";
  const barVals = tv[metric].map((v) => num(v));
  const barMax = Math.max(...barVals, 1);
  const rowCls = "grid items-center gap-2";

  return (
    <EditorShell header={header} checks={checks} rail={rail}>
      <Section id="s-id" title="Identitas & status" desc="Biasanya ikut sinkron BEI. Ubah manual hanya kalau ada perubahan nama, kode, atau status yang belum tersinkron.">
        <div className="flex flex-wrap gap-5">
          <LogoUpload code={code} logo={logo} onChange={setLogo} replace />
          <div className="flex min-w-[260px] flex-1 flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-[1fr_140px]">
              <FormField label="Nama emiten" htmlFor="f-nm"><Input id="f-nm" aria-invalid={!name.trim()} value={name} onChange={(e) => setName(e.target.value)} /></FormField>
              <FormField label="Kode saham" htmlFor="f-tk"><Input id="f-tk" aria-invalid={tkBad} className="font-mono" value={tk} maxLength={4} autoComplete="off" onChange={(e) => setTk(e.target.value.toUpperCase())} /></FormField>
            </div>
            {code !== kode && !tkBad && <Note icon={<Info aria-hidden />}>Kode lama <b>{kode}</b> disimpan sebagai alias. Tautan, watchlist, portofolio, dan tesis pengguna tetap jalan dan otomatis pindah ke <b>{code}</b>.</Note>}
            {tkBad && <Err>Kode saham harus 4 huruf.</Err>}
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
          <FormField label="Sektor IDX-IC"><NativeSelect aria-label="Sektor IDX-IC" value={sektor} onChange={(e) => setSektor(e.target.value)}>{SEKTOR.map((s) => <NativeSelectOption key={s}>{s}</NativeSelectOption>)}</NativeSelect></FormField>
          <FormField label="Subsektor"><Input aria-label="Subsektor" aria-invalid={!sub.trim()} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="mis. Batu bara" /></FormField>
          <FormField label="Papan · tercatat"><span className="flex h-11 items-center text-sm">Utama · 1990</span></FormField>
        </div>
        {!sub.trim() && <Err>Subsektor wajib diisi.</Err>}
      </Section>

      <Section id="s-angka" title="Angka utama" desc="Lima angka di kepala halaman emiten. Diisi manual, tidak realtime, jadi selalu tulis per tanggal berapa.">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField label="Per tanggal" htmlFor="f-asof"><Input id="f-asof" value={asOf} onChange={(e) => setAsOf(e.target.value)} /></FormField>
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
        aside={<Button variant="outline" size="sm"  onClick={() => { setPers([...pers, id({ p: "", sub: "" })]); setTv((v) => Object.fromEntries(Object.entries(v).map(([m, a]) => [m, [...a, ""]]))); }}><Plus aria-hidden />Periode</Button>}>
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
            {pers.map((p, i) => <span key={p.id} className="text-center">{pers.length > 2 && <LinkBtn className="self-center text-xs text-(--sp-danger-text)" onClick={() => { drop(setPers, p.id); setTv((v) => Object.fromEntries(Object.entries(v).map(([m, a]) => [m, a.filter((_, j) => j !== i)]))); }}>Hapus</LinkBtn>}</span>)}
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

      <Section id="s-lk" title="Laporan keuangan" desc="Lampiran XBRL dan PDF per periode, persis seperti yang dirilis emiten di BEI. PDF bisa diunduh pengguna dari halaman emiten; XBRL dipakai untuk membaca angka Tren keuangan."
        aside={<Button variant="outline" size="sm" aria-expanded={!!lkAdd}  onClick={() => setLkAdd(lkAdd ? null : { y: "2026", q: "FY", rel: "" })}><Plus aria-hidden />Periode</Button>}>
        {lkAdd && (
          <Card size="sm" className="grid gap-3 bg-accent px-3.5 shadow-none sm:grid-cols-3">
            <FormField label="Tahun buku" htmlFor="lk-y"><NativeSelect id="lk-y" value={lkAdd.y} onChange={(e) => setLkAdd({ ...lkAdd, y: e.target.value })}>{Array.from({ length: 8 }, (_, i) => 2026 - i).map((y) => <NativeSelectOption key={y}>{y}</NativeSelectOption>)}</NativeSelect></FormField>
            <FormField label="Tanggal rilis di BEI" htmlFor="lk-rel"><Input id="lk-rel" type="date"  value={lkAdd.rel} onChange={(e) => setLkAdd({ ...lkAdd, rel: e.target.value })} /></FormField>
            <FormField label="Periode">
              <ToggleGroup aria-label="Periode" variant="outline" spacing={1} value={[lkAdd.q]} onValueChange={(v) => v[0] && setLkAdd({ ...lkAdd, q: v[0] })} className="w-full">
                {["Q1", "Q2", "Q3", "FY"].map((q) => <ToggleGroupItem key={q} value={q} className="h-11 flex-1 bg-background font-semibold data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background">{q === "FY" ? "Tahunan" : q}</ToggleGroupItem>)}
              </ToggleGroup>
            </FormField>
            {lkDup && <span className="sm:col-span-3"><Err>{lkDup}</Err></span>}
            <div className="flex justify-end gap-2 sm:col-span-3">
              <Button variant="outline" size="sm"  onClick={() => setLkAdd(null)}>Batal</Button>
              <Button size="sm" onClick={() => { if (lkDup) return; setLk([id({ ...lkAdd, x: null, p: null }), ...lk].sort((a, b) => b.y.localeCompare(a.y))); setLkAdd(null); toast("Periode ditambahkan. Unggah XBRL dan PDF-nya."); }}>Tambah periode</Button>
            </div>
          </Card>
        )}
        {!lkOk && <Note icon={<Info aria-hidden />}>{lkBad} periode belum lengkap atau bermasalah. Tiap periode butuh XBRL yang terbaca dan PDF-nya sebelum profil bisa terbit.</Note>}
        <div className="flex flex-wrap items-center gap-2">
          <FilterTabs label="Saring periode" value={lkF} onChange={setLkF} tabs={[{ v: "all", label: "Semua", n: lk.length }, { v: "q", label: "Kuartalan", n: lk.filter((r) => r.q !== "FY").length }, { v: "fy", label: "Tahunan", n: lk.filter((r) => r.q === "FY").length }]} />
          <Help className="ml-auto w-auto">XBRL .zip/.xbrl maks. 20 MB · PDF maks. 50 MB</Help>
        </div>
        {lkShown.map((r) => {
          const setFile = (k: "x" | "p") => (v: FileInfo | null) => patch(setLk, r.id, { [k]: v, ...(k === "x" ? { xErr: false } : {}) } as Partial<Lk>);
          return (
            <div key={r.id} className="flex flex-col gap-2 border-t border-sp-line-soft pt-3">
              <div className="flex flex-wrap items-center gap-2"><b className="text-sm font-semibold">{r.q === "FY" ? `Tahunan ${r.y}` : `${r.q} ${r.y}`}</b><StatusBadge tone={r.q === "FY" ? "info" : "neutral"}>{r.q === "FY" ? "Tahunan" : "Kuartalan"}</StatusBadge><small className="text-xs text-muted-foreground">{r.rel ? `rilis ${r.rel}` : ""}</small><span className="ml-auto"><RemoveBtn label={`Hapus periode ${r.q} ${r.y}`} onClick={() => drop(setLk, r.id)} /></span></div>
              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="flex flex-col gap-1"><FileSlot value={r.x} onChange={setFile("x")} accept=".zip,.xbrl" ext="XBRL" maxMb={20} label={`XBRL ${r.q} ${r.y}`} onError={(m) => toast(m)} />{r.xErr && <Err>XBRL tidak terbaca. Unggah ulang file dari BEI.</Err>}</div>
                <FileSlot value={r.p} onChange={setFile("p")} accept=".pdf" ext="PDF" maxMb={50} label={`PDF ${r.q} ${r.y}`} onError={(m) => toast(m)} />
              </div>
            </div>
          );
        })}
        {lkShown.length === 0 && <Help className="py-4 text-center text-sm">Belum ada laporan untuk periode ini.</Help>}
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

      <Section id="s-tema" title="Tema & rantai nilai" desc={<>Diatur dari halaman tema. Buka <Link href="/admin/tema/batubara" className="font-semibold underline underline-offset-2">Batubara</Link> untuk mengubah tahap atau porsi pendapatan.</>}>
        <Item variant="outline"><ItemContent className="flex-row items-baseline gap-2"><ItemTitle>Batubara</ItemTitle><ItemDescription>· Tahap 2 · Pemilik tambang termal</ItemDescription></ItemContent><ItemActions><StatusBadge tone="success">Terbit</StatusBadge></ItemActions></Item>
      </Section>
    </EditorShell>
  );
}

