"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ExternalLink, Flag, Info, Lock, Plus } from "lucide-react";
import { logoOf } from "@/lib/emiten-data";
import { dec, num } from "@/lib/ipo";
import {
  area, btn, Chip, cls, Counter, EditorShell, EntityAvatar, Err, Field, FileSlot, Help, inp, LinkBtn, LogoUpload, Note, RemoveBtn,
  Section, SegCards, TONE, useToast, type Check as CheckItem, type FileInfo,
} from "./form-ui";

let uid = 1000;
const id = <T extends object>(o: T) => ({ id: uid++, ...o });
type L<T> = (T & { id: number })[];
const SEKTOR = ["Energi", "Barang Baku", "Perindustrian", "Barang Konsumen Primer", "Barang Konsumen Non-Primer", "Kesehatan", "Keuangan", "Properti & Real Estat", "Teknologi", "Infrastruktur", "Transportasi & Logistik"];

const TR = {
  aktif: { label: "Aktif", sub: "Diperdagangkan normal", dot: "#16A34A", tone: TONE.ok, effect: "" },
  suspend: { label: "Suspend", sub: "Dihentikan sementara", dot: "#DC2626", tone: TONE.err, effect: "Banner merah di halaman emiten berisi alasan dan tanggal. Tetap muncul di tema dan portofolio dengan label Suspend." },
  monitor: { label: "Monitoring", sub: "Papan pemantauan khusus", dot: "#F59E0B", tone: TONE.warn, effect: "Label “Pemantauan khusus” di halaman emiten dan di daftar tema, disertai alasan di bawah." },
  delisted: { label: "Delisted", sub: "Keluar dari bursa", dot: "#78716C", tone: TONE.neutral, effect: "Hilang dari pencarian dan tema. Pengguna yang masih menyimpannya di portofolio, tesis, atau watchlist tetap melihatnya dengan label Delisted dan mendapat email." },
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
  const { flash, toast } = useToast();
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
  const ST = { review: ["Perlu ditinjau", TONE.warn], draft: ["Draf tersimpan", TONE.neutral], ok: ["Terbit", TONE.ok] } as const;

  const header = (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <EntityAvatar code={code} logo={logo} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold leading-tight tracking-tight"><code className="mr-2 font-mono text-[22px]">{code || "····"}</code>{name.trim() || "Nama emiten"}</h1>
            <Chip cls={TR[tr].tone}>{TR[tr].label}</Chip>
            <Chip cls={ST[status][1]}>{ST[status][0]}</Chip>
          </div>
          <span className="text-sm text-[#716A65]">{sektor} · {sub || "subsektor"} · Papan Utama · Dilihat pengguna 3.410 kali bulan ini</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/emiten/${code}`} className={cls(btn.base, btn.outline)}><ExternalLink aria-hidden size={16} strokeWidth={1.8} />Lihat di aplikasi</Link>
          <button type="button" className={cls(btn.base, btn.outline)} onClick={() => { setStatus("draft"); flash("Draf tersimpan. Pengguna masih melihat versi yang sudah terbit."); }}>Simpan draf</button>
          <button type="button" aria-disabled={!canPub} className={cls(btn.base, canPub ? btn.primary : btn.disabled)}
            onClick={() => { if (!canPub) return flash(`Belum bisa terbit: ${checks.filter((c) => !c.ok).map((c) => c.label).join(", ")}`); setStatus("ok"); flash(`Perubahan ${code} diterbitkan dan langsung tampil di aplikasi`); }}>Terbitkan</button>
        </div>
      </div>
      {REPS.length > 0 && (
        <section aria-labelledby="rep-h" className="overflow-hidden rounded-xl border border-[#FECACA] bg-[#FEF2F2]">
          <div id="rep-h" className="flex items-center gap-2 px-4 py-3 text-[13.5px] text-[#991B1B]"><Flag aria-hidden size={16} strokeWidth={1.8} /><b className="font-semibold">{REPS.length} laporan pengguna belum ditangani</b><span className="text-[#B45309]">Dari form Bantuan › Data salah</span></div>
          {REPS.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 border-t border-[#FECACA] bg-white/60 px-4 py-3">
              <div className="min-w-[240px] flex-1"><q className="text-sm">“{r.text}”</q><small className="block text-xs text-[#716A65]">{r.meta}</small></div>
              <a href={r.href} className={cls(btn.base, btn.outline, btn.small)}>Ke bagian ini</a>
              <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { setRepDone([...repDone, r.id]); flash("Laporan ditandai selesai. Pelapor diberi tahu lewat email."); }}><Check aria-hidden size={14} />Tandai selesai</button>
            </div>
          ))}
        </section>
      )}
    </>
  );

  const rail = (
    <section className="flex flex-col gap-3 rounded-xl border border-[#E7E5E4] bg-white p-5">
      <b className="text-[15px] font-semibold">Riwayat perubahan</b>
      <div className="flex flex-col gap-2.5 text-[13px] leading-snug">
        {[["Rina", "memperbarui tren keuangan H1-2026", "Hari ini, 09.40 · draf"], ["Dimas", "menerbitkan profil", "30 Okt 2026"], ["Sistem", "memperbarui manajemen dari BEI", "1 Okt 2026"]].map(([w, a, t]) => (
          <div key={t}><span><b className="font-semibold">{w}</b> {a}</span><time className="block text-xs text-[#716A65]">{t}</time></div>
        ))}
      </div>
    </section>
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
              <Field label="Nama emiten" htmlFor="f-nm"><input id="f-nm" className={inp(!name.trim())} value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Kode saham" htmlFor="f-tk"><input id="f-tk" className={cls(inp(tkBad), "font-mono")} value={tk} maxLength={4} autoComplete="off" onChange={(e) => setTk(e.target.value.toUpperCase())} /></Field>
            </div>
            {code !== kode && !tkBad && <Note><Info aria-hidden size={16} className="mt-0.5 flex-none" /><span>Kode lama <b>{kode}</b> disimpan sebagai alias. Tautan, watchlist, portofolio, dan tesis pengguna tetap jalan dan otomatis pindah ke <b>{code}</b>.</span></Note>}
            {tkBad && <Err>Kode saham harus 4 huruf.</Err>}
            <Field label="Status perdagangan">
              <SegCards label="Status perdagangan" value={tr} onChange={setTr} options={(Object.keys(TR) as TrKey[]).map((k) => ({ v: k, label: TR[k].label, sub: TR[k].sub, dot: TR[k].dot }))} />
            </Field>
            {trNA && (
              <div className={cls("flex flex-col gap-3 rounded-[10px] border p-3.5 text-[13.5px]", tr === "suspend" ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#E7E5E4] bg-[#FAFAF9]")}>
                <p><b>Yang dilihat pengguna:</b> {TR[tr].effect}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Berlaku sejak" htmlFor="f-sd"><input id="f-sd" type="date" className={inp(!trSince)} value={trSince} onChange={(e) => setTrSince(e.target.value)} /></Field>
                  <Field label="Sumber pengumuman BEI" htmlFor="f-ss"><input id="f-ss" className={inp(!trSrc.trim())} value={trSrc} onChange={(e) => setTrSrc(e.target.value)} placeholder="mis. Pengumuman BEI No. Peng-SPT-00012/BEI.PP1/11-2026" /></Field>
                </div>
                <Field label="Alasan, dalam bahasa sederhana" hint="tampil ke pengguna" htmlFor="f-sr"><textarea id="f-sr" className={cls(area(!trWhy.trim()), "min-h-16")} value={trWhy} onChange={(e) => setTrWhy(e.target.value)} placeholder="mis. Perdagangan dihentikan sementara karena belum menyampaikan laporan keuangan." /></Field>
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-3.5 border-t border-[#F0EEEC] pt-3.5 sm:grid-cols-3">
          <Field label="Sektor IDX-IC"><select aria-label="Sektor IDX-IC" className={inp()} value={sektor} onChange={(e) => setSektor(e.target.value)}>{SEKTOR.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Subsektor"><input aria-label="Subsektor" className={inp(!sub.trim())} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="mis. Batu bara" /></Field>
          <Field label="Papan · tercatat"><span className="flex h-11 items-center text-sm">Utama · 1990</span></Field>
        </div>
        {!sub.trim() && <Err>Subsektor wajib diisi.</Err>}
      </Section>

      <Section id="s-angka" title="Angka utama" desc="Lima angka di kepala halaman emiten. Diisi manual, tidak realtime, jadi selalu tulis per tanggal berapa.">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Per tanggal" htmlFor="f-asof"><input id="f-asof" className={inp()} value={asOf} onChange={(e) => setAsOf(e.target.value)} /></Field>
          <Field label="Sumber" htmlFor="f-asrc"><input id="f-asrc" className={inp()} value={asSrc} onChange={(e) => setAsSrc(e.target.value)} /></Field>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {KD.map(([k, l, pre, suf]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <label htmlFor={`k-${k}`} className="text-[13.5px] font-semibold">{l}</label>
              <span className="relative flex items-center">
                {pre && <span className="absolute left-3 text-[13px] text-[#716A65]">{pre}</span>}
                <input id={`k-${k}`} inputMode="decimal" className={cls(inp(!keys[k].v.trim()), "text-right font-mono", pre ? "pl-9 pr-9" : "pr-9")} value={keys[k].v} onChange={(e) => setKeys({ ...keys, [k]: { ...keys[k], v: e.target.value } })} />
                <span className="absolute right-3 text-[13px] text-[#716A65]">{suf}</span>
              </span>
              <textarea aria-label={`Penjelasan ${l}`} className={cls(area(), "min-h-20 text-[13px]")} value={keys[k].tip} onChange={(e) => setKeys({ ...keys, [k]: { ...keys[k], tip: e.target.value } })} />
              {k === "gm" && num(keys.gm.v) !== num(lastGm) && <span className="text-[12.5px] text-[#B45309]">Beda dengan margin periode terakhir di Tren keuangan ({lastGm}%).</span>}
            </div>
          ))}
        </div>
        <Help>Kotak penjelasan di bawah tiap angka muncul saat pengguna mengarahkan kursor ke angka itu.</Help>
      </Section>

      <Section id="s-ringkas" title="Ringkasan bisnis" desc="Dua sampai tiga kalimat bahasa sehari-hari: bisnis apa, uangnya dari mana, dan apa yang menggerakkan kinerjanya.">
        <Field label="Deskripsi singkat" hint="satu baris, tanpa format — dipakai di kartu pencarian, daftar tema, dan watchlist" htmlFor="shortsum">
          <input id="shortsum" className={inp(!shortOk)} value={shortSum} onChange={(e) => setShortSum(e.target.value)} placeholder="mis. Produsen batu bara termal terbesar di Indonesia" />
          <div className="flex justify-end"><Counter n={shortSum.length} max={100} /></div>
        </Field>
        <Field label="Ringkasan lengkap" hint="tampil di halaman emiten" htmlFor="sum">
          <textarea id="sum" className={cls(area(!sumOk), "min-h-[140px]")} value={sum} onChange={(e) => setSum(e.target.value)} />
          <div className="flex justify-between gap-3"><Help>Apit dengan **dua bintang** untuk menebalkan satu frasa penting.</Help><Counter n={sum.length} max={400} /></div>
        </Field>
        <Field label="Sumber" htmlFor="sumsrc"><input id="sumsrc" className={inp()} value={sumSrc} onChange={(e) => setSumSrc(e.target.value)} placeholder="mis. Laporan Tahunan 2025, hlm. 12" /></Field>
      </Section>

      <Section id="s-poin" title="Kekuatan, kelemahan & yang dipantau" desc="Poin pendek, maksimal 60 karakter dan 5 poin per kelompok. Tampil di bawah ringkasan bisnis.">
        <div className="grid gap-4 md:grid-cols-3">
          {PG.map(([k, label, c]) => {
            const set = ((fn: React.SetStateAction<L<{ t: string }>>) => setPts((p) => ({ ...p, [k]: typeof fn === "function" ? fn(p[k]) : fn }))) as React.Dispatch<React.SetStateAction<L<{ t: string }>>>;
            return (
              <div key={k} className="flex flex-col gap-2">
                <b className="flex items-center gap-2 text-sm font-semibold"><i className="size-2 rounded-full" style={{ background: c }} />{label}<span className="ml-auto font-mono text-xs font-normal text-[#716A65]">{pts[k].length}/5</span></b>
                {pts[k].map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1"><input className={cls(inp(!p.t.trim() || p.t.length > 60), "!h-10")} aria-label={`${label} ${i + 1}`} maxLength={80} {...bind(set, p, "t")} /><RemoveBtn label={`Hapus ${label.toLowerCase()} ${i + 1}`} onClick={() => drop(set, p.id)} /></div>
                ))}
                {pts[k].length < 5 && <LinkBtn onClick={() => set((l) => [...l, id({ t: "" })])}>+ Tambah poin</LinkBtn>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="s-tren" title="Tren keuangan" desc="Angka dari laporan keuangan, dalam triliun rupiah kecuali margin. Periode terakhir disorot di aplikasi."
        aside={<button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => { setPers([...pers, id({ p: "", sub: "" })]); setTv((v) => Object.fromEntries(Object.entries(v).map(([m, a]) => [m, [...a, ""]]))); }}><Plus aria-hidden size={14} />Periode</button>}>
        <div className="overflow-x-auto">
          <div className="grid min-w-[520px] items-center gap-2" style={{ gridTemplateColumns: `150px repeat(${pers.length}, minmax(90px, 1fr))` }}>
            <span className="text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]">Periode</span>
            {pers.map((p, i) => (
              <span key={p.id} className="flex flex-col gap-1">
                <input className={cls(inp(!p.p.trim()), "!h-9 text-center font-mono text-[13px]")} aria-label={`Periode ${i + 1}`} {...bind(setPers, p, "p")} />
                <input className={cls(inp(), "!h-8 text-center text-xs")} aria-label={`Keterangan periode ${i + 1}`} {...bind(setPers, p, "sub")} />
              </span>
            ))}
            {MT.map(([m, l, u]) => (
              <div key={m} className="contents">
                <span className="flex flex-col text-sm font-semibold">{l}<small className="text-xs font-normal text-[#716A65]">{u}</small></span>
                {pers.map((p, i) => <input key={p.id} inputMode="decimal" aria-label={`${l} ${p.p}`} className={cls(inp(!(tv[m][i] ?? "").trim()), "!h-10 text-right font-mono")} value={tv[m][i] ?? ""} onChange={(e) => setTv((v) => ({ ...v, [m]: pers.map((_, j) => (j === i ? e.target.value : v[m][j] ?? "")) }))} />)}
              </div>
            ))}
            <span />
            {pers.map((p, i) => <span key={p.id} className="text-center">{pers.length > 2 && <button type="button" className="text-xs font-semibold text-[#B91C1C] underline underline-offset-2" onClick={() => { drop(setPers, p.id); setTv((v) => Object.fromEntries(Object.entries(v).map(([m, a]) => [m, a.filter((_, j) => j !== i)]))); }}>Hapus</button>}</span>)}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-[#F0EEEC] pt-3.5">
          <span className="text-[13.5px] font-semibold">Catatan per grafik <small className="font-normal text-[#716A65]">teks di bawah grafik saat tab itu dipilih</small></span>
          <div role="tablist" aria-label="Pilih metrik" className="flex w-fit gap-1 rounded-[10px] bg-[#F5F5F4] p-[3px]">
            {MT.map(([m, l]) => <button key={m} type="button" role="tab" aria-selected={metric === m} onClick={() => setMetric(m)} className={cls("h-8 rounded-lg px-3 text-[13.5px]", metric === m ? "bg-white font-semibold shadow-sm" : "text-[#57534E]")}>{l}</button>)}
          </div>
          <div aria-hidden className="flex h-24 items-end gap-3 px-1">
            {barVals.map((v, i) => <div key={pers[i]?.id ?? i} className="flex flex-1 flex-col items-center justify-end gap-1"><small className="font-mono text-[11px] text-[#716A65]">{tv[metric][i]}</small><i className={cls("w-full max-w-14 rounded-t", i === barVals.length - 1 ? "bg-[#FEA722]" : "bg-[#E7E5E4]")} style={{ height: `${Math.max(4, (v / barMax) * 70)}%` }} /></div>)}
          </div>
          <div aria-hidden className="flex gap-3 px-1 text-center text-[11.5px] text-[#716A65]">{pers.map((p) => <span key={p.id} className="flex-1">{p.p}</span>)}</div>
          <textarea className={cls(area(!notes[metric].trim()), "min-h-24")} aria-label={`Catatan grafik ${MT.find((m) => m[0] === metric)?.[1]}`} value={notes[metric]} onChange={(e) => setNotes({ ...notes, [metric]: e.target.value })} />
        </div>
      </Section>

      <Section id="s-lk" title="Laporan keuangan" desc="Lampiran XBRL dan PDF per periode, persis seperti yang dirilis emiten di BEI. PDF bisa diunduh pengguna dari halaman emiten; XBRL dipakai untuk membaca angka Tren keuangan."
        aside={<button type="button" aria-expanded={!!lkAdd} className={cls(btn.base, btn.outline, btn.small)} onClick={() => setLkAdd(lkAdd ? null : { y: "2026", q: "FY", rel: "" })}><Plus aria-hidden size={14} />Periode</button>}>
        {lkAdd && (
          <div className="grid gap-3 rounded-[10px] border border-[#E7E5E4] bg-[#FAFAF9] p-3.5 sm:grid-cols-3">
            <Field label="Tahun buku" htmlFor="lk-y"><select id="lk-y" className={inp()} value={lkAdd.y} onChange={(e) => setLkAdd({ ...lkAdd, y: e.target.value })}>{Array.from({ length: 8 }, (_, i) => 2026 - i).map((y) => <option key={y}>{y}</option>)}</select></Field>
            <Field label="Tanggal rilis di BEI" htmlFor="lk-rel"><input id="lk-rel" type="date" className={inp()} value={lkAdd.rel} onChange={(e) => setLkAdd({ ...lkAdd, rel: e.target.value })} /></Field>
            <Field label="Periode"><div role="radiogroup" aria-label="Periode" className="flex gap-1">{["Q1", "Q2", "Q3", "FY"].map((q) => <button key={q} type="button" role="radio" aria-checked={lkAdd.q === q} onClick={() => setLkAdd({ ...lkAdd, q })} className={cls("h-11 flex-1 rounded-lg border text-sm font-semibold", lkAdd.q === q ? "border-[#1C1917] bg-[#1C1917] text-white" : "border-[#D6D3D1] bg-white")}>{q === "FY" ? "Tahunan" : q}</button>)}</div></Field>
            {lkDup && <span className="sm:col-span-3"><Err>{lkDup}</Err></span>}
            <div className="flex justify-end gap-2 sm:col-span-3">
              <button type="button" className={cls(btn.base, btn.outline, btn.small)} onClick={() => setLkAdd(null)}>Batal</button>
              <button type="button" className={cls(btn.base, btn.primary, btn.small)} onClick={() => { if (lkDup) return; setLk([id({ ...lkAdd, x: null, p: null }), ...lk].sort((a, b) => b.y.localeCompare(a.y))); setLkAdd(null); flash("Periode ditambahkan. Unggah XBRL dan PDF-nya."); }}>Tambah periode</button>
            </div>
          </div>
        )}
        {!lkOk && <Note><Info aria-hidden size={16} className="mt-0.5 flex-none" /><span>{lkBad} periode belum lengkap atau bermasalah. Tiap periode butuh XBRL yang terbaca dan PDF-nya sebelum profil bisa terbit.</span></Note>}
        <div role="tablist" aria-label="Saring periode" className="flex flex-wrap items-center gap-1.5">
          {([["all", "Semua", lk.length], ["q", "Kuartalan", lk.filter((r) => r.q !== "FY").length], ["fy", "Tahunan", lk.filter((r) => r.q === "FY").length]] as const).map(([k, l, n]) => (
            <button key={k} type="button" role="tab" aria-selected={lkF === k} onClick={() => setLkF(k)} className={cls("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium", lkF === k ? "border-[#1C1917] bg-[#1C1917] text-white" : "border-[#E7E5E4] bg-white")}>{l}<i className="font-mono text-[11px] not-italic opacity-70">{n}</i></button>
          ))}
          <span className="ml-auto text-[12.5px] text-[#716A65]">XBRL .zip/.xbrl maks. 20 MB · PDF maks. 50 MB</span>
        </div>
        {lkShown.map((r) => {
          const setFile = (k: "x" | "p") => (v: FileInfo | null) => patch(setLk, r.id, { [k]: v, ...(k === "x" ? { xErr: false } : {}) } as Partial<Lk>);
          return (
            <div key={r.id} className="flex flex-col gap-2 border-t border-[#F0EEEC] pt-3">
              <div className="flex flex-wrap items-center gap-2"><b className="text-sm font-semibold">{r.q === "FY" ? `Tahunan ${r.y}` : `${r.q} ${r.y}`}</b><Chip cls={r.q === "FY" ? TONE.info : TONE.neutral}>{r.q === "FY" ? "Tahunan" : "Kuartalan"}</Chip><small className="text-xs text-[#716A65]">{r.rel ? `rilis ${r.rel}` : ""}</small><span className="ml-auto"><RemoveBtn label={`Hapus periode ${r.q} ${r.y}`} onClick={() => drop(setLk, r.id)} /></span></div>
              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="flex flex-col gap-1"><FileSlot value={r.x} onChange={setFile("x")} accept=".zip,.xbrl" ext="XBRL" maxMb={20} label={`XBRL ${r.q} ${r.y}`} onError={flash} />{r.xErr && <Err>XBRL tidak terbaca. Unggah ulang file dari BEI.</Err>}</div>
                <FileSlot value={r.p} onChange={setFile("p")} accept=".pdf" ext="PDF" maxMb={50} label={`PDF ${r.q} ${r.y}`} onError={flash} />
              </div>
            </div>
          );
        })}
        {lkShown.length === 0 && <div className="py-4 text-center text-sm text-[#716A65]">Belum ada laporan untuk periode ini.</div>}
      </Section>

      <Section id="s-pend" title="Sumber pendapatan" desc="Persentase per segmen. Totalnya harus 100% dan tiap baris wajib punya sumber.">
        <div className={cls(rowCls, "grid-cols-[1fr_100px_1.2fr_36px] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}><span>Segmen</span><span className="text-right">Porsi</span><span>Sumber dokumen</span><span /></div>
        {rev.map((r, i) => (
          <div key={r.id} className={cls(rowCls, "grid-cols-[1fr_100px_1.2fr_36px]")}>
            <input className={inp()} aria-label={`Segmen ${i + 1}`} {...bind(setRev, r, "name")} />
            <span className="relative flex items-center"><input className={cls(inp(), "pr-8 text-right font-mono")} inputMode="decimal" aria-label={`Porsi segmen ${i + 1}`} {...bind(setRev, r, "pct")} /><span className="absolute right-3 text-[13px] text-[#716A65]">%</span></span>
            <input className={inp(!r.src.trim())} aria-label={`Sumber segmen ${i + 1}`} placeholder="Wajib diisi" {...bind(setRev, r, "src")} />
            <RemoveBtn label={`Hapus segmen ${i + 1}`} onClick={() => drop(setRev, r.id)} />
          </div>
        ))}
        <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-[#F0EEEC]">{rev.map((r, i) => <i key={r.id} className="h-full" style={{ width: `${(Math.max(0, num(r.pct)) / Math.max(revTot, 100)) * 100}%`, background: REV_COL[i % REV_COL.length] }} />)}</div>
        <div className="flex items-center justify-between text-sm"><LinkBtn onClick={() => setRev([...rev, id({ name: "", pct: "0", src: "" })])}>+ Tambah segmen</LinkBtn><span>Total <b className={cls("font-mono", revTot === 100 ? "text-[#15803D]" : "text-[#B91C1C]")}>{dec(revTot, 2)}%</b> <Help>· {revMsg}</Help></span></div>
      </Section>

      <Section id="s-grup" title="Struktur grup" desc="Anak usaha dan investasi beserta porsi kepemilikan. Isi kode kalau perusahaannya juga tercatat di BEI supaya bisa diklik."
        aside={<span className="inline-flex items-center gap-1.5 text-xs text-[#716A65]"><Lock aria-hidden size={12} />Daftar awal dari BEI</span>}>
        <div className={cls(rowCls, "grid-cols-[1fr_90px_80px_52px_36px] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}><span>Perusahaan &amp; bidang usaha</span><span className="text-right">Kepemilikan</span><span>Kode</span><span>Tampil</span><span /></div>
        {subs.map((s, i) => (
          <div key={s.id} className={cls(rowCls, "grid-cols-[1fr_90px_80px_52px_36px]")}>
            <span className="flex flex-col gap-1"><input className={cls(inp(!s.name.trim()), "!h-9")} aria-label={`Nama perusahaan ${i + 1}`} placeholder="Nama perusahaan" {...bind(setSubs, s, "name")} /><input className={cls(inp(), "!h-9 text-[13px]")} aria-label={`Bidang usaha ${i + 1}`} placeholder="Bidang usaha" {...bind(setSubs, s, "biz")} /></span>
            <span className="relative flex items-center"><input className={cls(inp(!(num(s.p) > 0 && num(s.p) <= 100)), "pr-7 text-right font-mono")} inputMode="decimal" aria-label={`Kepemilikan ${i + 1}`} {...bind(setSubs, s, "p")} /><span className="absolute right-2.5 text-xs text-[#716A65]">%</span></span>
            <input className={cls(inp(), "font-mono")} aria-label={`Kode ${i + 1}`} maxLength={4} placeholder="—" value={s.tk} onChange={(e) => patch(setSubs, s.id, { tk: e.target.value.toUpperCase() })} />
            <button type="button" role="switch" aria-checked={s.show} aria-label={`Tampilkan ${s.name || `perusahaan ${i + 1}`}`} onClick={() => patch(setSubs, s.id, { show: !s.show })} className={cls("relative h-6 w-10 rounded-full transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-[18px] after:rounded-full after:bg-white after:transition-transform", s.show ? "bg-[#1C1917] after:translate-x-4" : "bg-[#D6D3D1]")} />
            <RemoveBtn label={`Hapus perusahaan ${i + 1}`} onClick={() => drop(setSubs, s.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setSubs([...subs, id({ name: "", biz: "", p: "", tk: "", show: true })])}>+ Tambah perusahaan</LinkBtn>
      </Section>

      <Section id="s-saham" title="Pemegang saham" desc="Pemegang 5% ke atas. Sisanya dihitung otomatis sebagai publik (free float).">
        <div className={cls(rowCls, "grid-cols-[1fr_100px_36px] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}><span>Nama</span><span className="text-right">Porsi</span><span /></div>
        {sh.map((s, i) => (
          <div key={s.id} className={cls(rowCls, "grid-cols-[1fr_100px_36px]")}>
            <input className={inp(!s.name.trim())} aria-label={`Pemegang saham ${i + 1}`} {...bind(setSh, s, "name")} />
            <span className="relative flex items-center"><input className={cls(inp(shBad), "pr-8 text-right font-mono")} inputMode="decimal" aria-label={`Porsi pemegang ${i + 1}`} {...bind(setSh, s, "p")} /><span className="absolute right-3 text-[13px] text-[#716A65]">%</span></span>
            <RemoveBtn label={`Hapus pemegang ${i + 1}`} onClick={() => drop(setSh, s.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setSh([...sh, id({ name: "", p: "" })])}>+ Tambah pemegang saham</LinkBtn>
        <div className="flex items-center justify-between rounded-[10px] bg-[#FAFAF9] px-3.5 py-2.5 text-sm"><span>Publik (free float)</span><b className={cls("font-mono", shBad ? "text-[#B91C1C]" : "")}>{dec(Math.max(0, 100 - shTot), 2)}%</b></div>
        {shBad && <Err>Total pemegang saham lebih dari 100%.</Err>}
        <Field label="Catatan kepemilikan" hint="opsional" htmlFor="f-shn"><textarea id="f-shn" className={cls(area(), "min-h-[60px]")} value={shNote} onChange={(e) => setShNote(e.target.value)} /></Field>
      </Section>

      <Section id="s-mgmt" title="Manajemen" desc="Tiga nama teratas tampil di halaman emiten, jadi urutkan dari jabatan tertinggi." aside={<span className="inline-flex items-center gap-1.5 text-xs text-[#716A65]"><Lock aria-hidden size={12} />Dari BEI · {mg.length} orang</span>}>
        <div className={cls(rowCls, "grid-cols-[1fr_1fr_36px] text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]")}><span>Nama</span><span>Jabatan</span><span /></div>
        {mg.map((m, i) => (
          <div key={m.id} className={cls(rowCls, "grid-cols-[1fr_1fr_36px]")}>
            <input className={inp(!m.name.trim())} aria-label={`Nama ${i + 1}`} {...bind(setMg, m, "name")} />
            <input className={inp(!m.role.trim())} aria-label={`Jabatan ${i + 1}`} {...bind(setMg, m, "role")} />
            <RemoveBtn label={`Hapus orang ${i + 1}`} onClick={() => drop(setMg, m.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setMg([...mg, id({ name: "", role: "" })])}>+ Tambah orang</LinkBtn>
      </Section>

      <Section id="s-risk" title="Risiko utama" desc="Judul pendek dan satu kalimat penjelasan. Tingkat “Tinggi” diberi tanda merah di aplikasi.">
        {rk.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_120px_36px] items-start gap-2">
            <div className="flex flex-col gap-1.5"><input className={inp(!r.t.trim())} aria-label={`Judul risiko ${i + 1}`} {...bind(setRk, r, "t")} /><textarea className={cls(area(!r.d.trim()), "min-h-16 text-[13.5px]")} aria-label={`Penjelasan risiko ${i + 1}`} {...bind(setRk, r, "d")} /></div>
            <select className={inp()} aria-label={`Tingkat risiko ${i + 1}`} {...bind(setRk, r, "lv")}>{(Object.keys(LV) as (keyof typeof LV)[]).map((k) => <option key={k} value={k}>{LV[k]}</option>)}</select>
            <RemoveBtn label={`Hapus risiko ${i + 1}`} onClick={() => drop(setRk, r.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setRk([...rk, id({ t: "", d: "", lv: "m" as const })])}>+ Tambah risiko</LinkBtn>
      </Section>

      <Section id="s-berita" title="Berita & perkembangan" desc="Tiga terbaru tampil di halaman emiten. Tulis faktanya, bukan opini atau rekomendasi.">
        {nw.map((n, i) => (
          <div key={n.id} className="grid grid-cols-[1fr_36px] items-start gap-2">
            <div className="flex flex-col gap-1.5">
              <input className={inp(!n.t.trim())} aria-label={`Judul berita ${i + 1}`} placeholder="Judul" {...bind(setNw, n, "t")} />
              <div className="grid gap-1.5 sm:grid-cols-2"><input className={inp(!n.src.trim())} aria-label={`Sumber berita ${i + 1}`} placeholder="Sumber" {...bind(setNw, n, "src")} /><input className={inp(!n.d.trim())} aria-label={`Tanggal berita ${i + 1}`} placeholder="Tanggal, mis. 30 Okt 2026" {...bind(setNw, n, "d")} /></div>
            </div>
            <RemoveBtn label={`Hapus berita ${i + 1}`} onClick={() => drop(setNw, n.id)} />
          </div>
        ))}
        <LinkBtn onClick={() => setNw([...nw, id({ t: "", src: "", d: "" })])}>+ Tambah berita</LinkBtn>
      </Section>

      <Section id="s-tema" title="Tema & rantai nilai" desc={<>Diatur dari halaman tema. Buka <Link href="/admin/tema/batubara" className="font-semibold underline underline-offset-2">Batubara</Link> untuk mengubah tahap atau porsi pendapatan.</>}>
        <div className="flex items-center gap-2.5 rounded-[10px] border border-[#E7E5E4] px-3.5 py-3 text-sm"><b className="font-semibold">Batubara</b><small className="text-[#716A65]">· Tahap 2 · Pemilik tambang termal</small><span className="ml-auto"><Chip cls={TONE.ok}>Terbit</Chip></span></div>
      </Section>
      {toast}
    </EditorShell>
  );
}

