"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { existingCodes } from "@/lib/emiten-data";
import { dec, fdShort, lembar, num, rp, scheduleError, stageIndex, type Dates } from "@/lib/ipo";
import {
  AffixInput, ChoiceCards, Counter, EditorShell, EntityAvatar, Err, FileSlot, FormField, Help, LinkBtn, LogoUpload, Note, RemoveBtn,
  Section, ShareBar, StatusBadge, ToggleRow, type Check, type FileInfo,
} from "./form-ui";

const SEKTOR = ["Energi", "Barang Baku", "Perindustrian", "Barang Konsumen Primer", "Barang Konsumen Non-Primer", "Kesehatan", "Keuangan", "Properti & Real Estat", "Teknologi", "Infrastruktur", "Transportasi & Logistik"];
const PAPAN = [
  { v: "utama", label: "Utama", sub: "Emiten besar, rekam jejak panjang" },
  { v: "pengembangan", label: "Pengembangan", sub: "Belum memenuhi syarat papan utama" },
  { v: "akselerasi", label: "Akselerasi", sub: "Aset kecil atau menengah" },
  { v: "baru", label: "Ekonomi Baru", sub: "Teknologi, saham hak suara multipel" },
];
const BAR = ["#1C1917", "#FEA722", "#A8A29E", "#78716C", "#D6D3D1"];
const TODAY = "2026-11-06"; // shortcut: fixed "today" from the design; use the real date once data is live.
const DOCS = [
  { k: "awal", label: "Prospektus awal", help: "Untuk masa bookbuilding", req: true },
  { k: "fin", label: "Prospektus final", help: "Setelah efektif OJK, berisi harga final", req: false },
  { k: "add", label: "Tambahan informasi", help: "Perbaikan/addendum, kalau ada", req: false },
] as const;

let uid = 100;
type Item = { id: number; t: string; p?: string };
const withId = <T extends object>(o: T) => ({ id: uid++, ...o });

// shortcut: sample values from the design (ABNU); start empty and POST to /admin/api/companies once the API exists.
export function IpoForm() {
  const [logo, setLogo] = useState("");
  const [name, setName] = useState("PT Andalan Baterai Nusantara Tbk");
  const [tk, setTk] = useState("ABNU");
  const [sektor, setSektor] = useState("Barang Baku");
  const [sub, setSub] = useState("Nikel & bahan baterai");
  const [papan, setPapan] = useState("utama");
  const [shortSum, setShortSum] = useState("Pengolah bijih nikel menjadi bahan baku baterai kendaraan listrik di Sulawesi Tengah.");
  const [longSum, setLongSum] = useState("ABNU mengolah bijih nikel kadar rendah dari tambangnya di Morowali menjadi **MHP (mixed hydroxide precipitate)**, bahan baku utama katoda baterai kendaraan listrik. Hampir seluruh pendapatannya datang dari menjual MHP ke produsen prekursor baterai, jadi kinerjanya mengikuti harga nikel dunia dan permintaan baterai EV.");
  const [dt, setDt] = useState<Dates>({ bbS: "2026-10-20", bbE: "2026-10-27", ojk: "2026-10-30", puS: "2026-11-04", puE: "2026-11-10", jt: "2026-11-10", ls: "2026-11-12" });
  const [pLo, setPLo] = useState("420");
  const [pHi, setPHi] = useState("480");
  const [pFin, setPFin] = useState("450");
  const [shares, setShares] = useState("2.500.000.000");
  const [porsi, setPorsi] = useState("20");
  const [uw, setUw] = useState<Item[]>([withId({ t: "PT Sekuritas Nusantara Raya" }), withId({ t: "PT Arta Kencana Sekuritas" })]);
  const [wr, setWr] = useState(false);
  const [wrRatio, setWrRatio] = useState("");
  const [wrPrice, setWrPrice] = useState("");
  const [ud, setUd] = useState<Item[]>([withId({ t: "Pembangunan smelter HPAL tahap 2", p: "65" }), withId({ t: "Modal kerja", p: "20" }), withId({ t: "Pelunasan sebagian utang bank", p: "15" })]);
  const [docs, setDocs] = useState<Record<string, FileInfo | null>>({ awal: { name: "Prospektus-Awal-ABNU.pdf", size: 8.4, at: "20 Okt 2026" }, fin: null, add: null });
  const [soon, setSoon] = useState(true);
  const [auto, setAuto] = useState(true);
  const [saved, setSaved] = useState(false);

  const code = tk.trim().toUpperCase();
  const tkErr = !code ? "Kode saham wajib diisi." : !/^[A-Z]{4}$/.test(code) ? "Kode saham harus 4 huruf." : existingCodes.includes(code) ? `Kode ${code} sudah dipakai emiten lain. Cek lagi kode dari pengumuman BEI.` : "";
  const idOk = !tkErr && !!name.trim() && !!sub.trim() && shortSum.length <= 100 && longSum.length <= 400;

  const jdErr = scheduleError(dt);
  const jdOk = !!dt.ls && !jdErr;
  const stages: [string, string, string][] = [["Bookbuilding", dt.bbS, dt.bbE], ["Efektif OJK", dt.ojk, dt.ojk], ["Penawaran umum", dt.puS, dt.puE], ["Penjatahan", dt.jt, dt.jt], ["Pencatatan", dt.ls, dt.ls]];
  const cur = stageIndex(stages, TODAY);
  const stageLabel = cur < 0 ? "Belum mulai" : cur >= 4 ? "Sudah tercatat" : Number.isInteger(cur) ? `Tahap: ${stages[cur][0]}` : `Menunggu ${stages[Math.ceil(cur)][0].toLowerCase()}`;

  const lo = num(pLo), hi = num(pHi), fin = num(pFin), sh = num(shares), pr = num(porsi);
  const pErr = lo && hi && lo > hi ? "Harga bawah lebih tinggi dari harga atas." : fin && lo && hi && (fin < lo || fin > hi) ? `Harga final di luar rentang bookbuilding (Rp${pLo}–${pHi}).` : "";
  let fund = "—", fundSub = "Isi harga dan jumlah saham", mcap = "—", mcapSub = "Isi porsi dari modal";
  if (sh && fin) { fund = rp(fin * sh); fundSub = `Rp${pFin} × ${lembar(sh)}`; }
  else if (sh && lo && hi) { fund = `${rp(lo * sh)}–${rp(hi * sh).replace("Rp", "")}`; fundSub = "Dari rentang harga, sebelum harga final"; }
  const px = fin || hi;
  if (sh && pr > 0 && pr <= 100 && px) { mcap = rp((px * sh) / (pr / 100)); mcapSub = `${fin ? "Harga final" : "Harga atas"} × ${lembar(sh / (pr / 100))} total`; }
  const tawarOk = !pErr && !!((lo && hi) || fin) && sh > 0 && pr > 0 && pr <= 100 && uw.some((u) => u.t.trim());

  const udTot = Math.round(ud.reduce((a, u) => a + num(u.p ?? ""), 0) * 100) / 100;
  const udFull = ud.every((u) => u.t.trim());
  const udOk = udTot === 100 && udFull;
  const udMsg = udTot !== 100 ? `· ${udTot < 100 ? "kurang" : "lebih"} ${dec(Math.abs(100 - udTot), 2)}%` : udFull ? "· pas" : "· ada tujuan kosong";
  const dokOk = !!docs.awal && !docs.awal.up;

  const checks: Check[] = [
    { group: "Emiten", label: "Identitas", ok: idOk, href: "#i-id", note: idOk ? "" : tkErr ? "Cek kode saham" : "Ada yang kosong" },
    { group: "Penawaran", label: "Jadwal IPO", ok: jdOk, href: "#i-jadwal", note: jdOk ? "" : dt.ls ? "Urutan tanggal" : "Tgl. pencatatan kosong" },
    { group: "Penawaran", label: "Detail penawaran", ok: tawarOk, href: "#i-tawar", note: tawarOk ? "" : pErr ? "Cek harga" : "Ada yang kosong" },
    { group: "Penawaran", label: "Penggunaan dana", ok: udOk, href: "#i-dana", note: udOk ? "" : `Total ${udTot}%` },
    { group: "Dokumen & tampilan", label: "Prospektus", ok: dokOk, href: "#i-dok", note: dokOk ? (fin && !docs.fin ? "Final menyusul" : "") : "Prospektus awal" },
    { group: "Dokumen & tampilan", label: "Tampil di aplikasi", ok: true, href: "#i-tampil" },
  ];
  const canNext = checks.every((c) => c.ok);

  const patchList = (set: React.Dispatch<React.SetStateAction<Item[]>>, id: number, f: Partial<Item>) => set((l) => l.map((x) => (x.id === id ? { ...x, ...f } : x)));
  const setDate = (k: keyof Dates) => (e: React.ChangeEvent<HTMLInputElement>) => setDt({ ...dt, [k]: e.target.value });

  const header = (
    <div className="flex flex-wrap items-center gap-4">
      <EntityAvatar code={code || "IPO"} logo={logo} dark />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl leading-tight font-bold tracking-tight"><code className="mr-2 font-mono text-[22px]">{code || "····"}</code>{name.trim() || "Nama perusahaan"}</h1>
          <StatusBadge tone="info">IPO baru</StatusBadge>
          <StatusBadge tone="neutral">{saved ? "Draf tersimpan" : "Belum disimpan"}</StatusBadge>
        </div>
        <span className="text-sm text-muted-foreground">Belum tercatat di BEI. Harga dan data perdagangan baru ikut sinkron mulai tanggal pencatatan.</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Link href="/admin/emiten" className={buttonVariants({ variant: "outline" })}>Batal</Link>
        <Button variant="outline" onClick={() => { if (tkErr || !name.trim()) return toast("Isi nama dan kode saham yang valid dulu"); setSaved(true); toast(`Draf ${code} tersimpan. Belum tampil di aplikasi.`); }}>Simpan draf</Button>
        {canNext ? (
          <Link href={`/admin/emiten/${code}`} className={buttonVariants()}>Simpan &amp; lanjut isi profil</Link>
        ) : (
          <Button aria-disabled onClick={() => toast(`Lengkapi dulu: ${checks.filter((c) => !c.ok).map((c) => c.label).join(", ")}`)}>Simpan &amp; lanjut isi profil</Button>
        )}
      </div>
    </div>
  );

  const rail = (
    <Card>
      <CardHeader><CardTitle>Pratinjau di aplikasi</CardTitle><CardDescription>Kartu di hasil pencarian</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Card size="sm" className="bg-accent shadow-none">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5"><EntityAvatar code={code || "IPO"} logo={logo} size={32} /><div className="flex min-w-0 flex-col leading-tight"><code className="font-mono text-xs font-semibold">{code || "····"}</code><span className="truncate text-[13px]">{name.trim() || "Nama perusahaan"}</span></div></div>
            <StatusBadge tone="info" className="self-start">{dt.ls ? `Segera IPO · ${fdShort(dt.ls)}` : "Segera IPO"}</StatusBadge>
            <p className={cn("text-[13.5px] leading-snug", !shortSum.trim() && "text-sp-faint")}>{shortSum.trim() || "Deskripsi singkat belum diisi"}</p>
            <small className="text-xs text-muted-foreground">{sektor} · {sub.trim() || "subsektor"}</small>
          </CardContent>
        </Card>
        {!soon && <Help>Tidak tampil di aplikasi sampai tanggal pencatatan.</Help>}
      </CardContent>
    </Card>
  );

  const jd: { label: string; help: string; a: keyof Dates; b?: keyof Dates; la: string; lb?: string }[] = [
    { label: "Masa penawaran awal", help: "Bookbuilding, untuk menentukan harga final", a: "bbS", b: "bbE", la: "Mulai bookbuilding", lb: "Akhir bookbuilding" },
    { label: "Pernyataan efektif OJK", help: "Setelah ini harga final bisa diisi", a: "ojk", la: "Tanggal efektif OJK" },
    { label: "Masa penawaran umum", help: "Investor memesan lewat e-IPO", a: "puS", b: "puE", la: "Mulai penawaran umum", lb: "Akhir penawaran umum" },
    { label: "Penjatahan", help: "Pembagian saham ke pemesan", a: "jt", la: "Tanggal penjatahan" },
    { label: "Pencatatan di BEI", help: "Wajib. Hari pertama saham diperdagangkan", a: "ls", la: "Tanggal pencatatan" },
  ];

  return (
    <EditorShell header={header} checks={checks} rail={rail}>
      <Section id="i-id" title="Identitas" desc="Sesuai prospektus. Kode saham diberikan BEI dan tidak boleh sama dengan emiten lain.">
        <div className="flex flex-wrap gap-5">
          <LogoUpload code={code} logo={logo} onChange={setLogo} />
          <div className="flex min-w-[260px] flex-1 flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-[1fr_140px]">
              <FormField label="Nama perusahaan" htmlFor="i-nm"><Input id="i-nm" aria-invalid={!name.trim()} value={name} onChange={(e) => setName(e.target.value)} placeholder="PT … Tbk" /></FormField>
              <FormField label="Kode saham" htmlFor="i-tk"><Input id="i-tk" aria-invalid={!!tkErr} className="font-mono" value={tk} onChange={(e) => setTk(e.target.value.toUpperCase())} maxLength={4} autoComplete="off" placeholder="ABCD" /></FormField>
            </div>
            {tkErr && <Err>{tkErr}</Err>}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <FormField label="Sektor IDX-IC" htmlFor="i-sk"><NativeSelect id="i-sk" value={sektor} onChange={(e) => setSektor(e.target.value)}>{SEKTOR.map((s) => <NativeSelectOption key={s}>{s}</NativeSelectOption>)}</NativeSelect></FormField>
              <FormField label="Subsektor" htmlFor="i-ss"><Input id="i-ss" aria-invalid={!sub.trim()} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="mis. Batu bara" /></FormField>
            </div>
            <FormField label="Papan pencatatan"><ChoiceCards label="Papan pencatatan" value={papan} onChange={setPapan} options={PAPAN} /></FormField>
            <FormField label="Deskripsi singkat" hint="boleh menyusul — dipakai di kartu pencarian" htmlFor="i-sd">
              <Input id="i-sd" aria-invalid={shortSum.length > 100} value={shortSum} onChange={(e) => setShortSum(e.target.value)} placeholder="mis. Pengolah nikel untuk bahan baku baterai" />
              <div className="flex justify-end"><Counter n={shortSum.length} max={100} /></div>
            </FormField>
            <FormField label="Deskripsi panjang" hint="boleh menyusul — jadi Ringkasan lengkap di halaman emiten" htmlFor="i-ld">
              <Textarea id="i-ld" aria-invalid={longSum.length > 400} className="min-h-[168px]" value={longSum} onChange={(e) => setLongSum(e.target.value)} placeholder="Bisnis apa, uangnya dari mana, dan apa yang menggerakkan kinerjanya. Dua sampai tiga kalimat bahasa sehari-hari." />
              <div className="flex justify-between gap-3"><Help>Ambil dari bab Kegiatan Usaha di prospektus. Apit dengan **dua bintang** untuk menebalkan satu frasa.</Help><Counter n={longSum.length} max={400} /></div>
            </FormField>
          </div>
        </div>
      </Section>

      <Section id="i-jadwal" title="Jadwal IPO" desc="Salin dari prospektus atau pengumuman BEI. Tahap aktif dihitung otomatis dari tanggal hari ini." aside={<StatusBadge tone="warning">{stageLabel}</StatusBadge>}>
        <ol aria-label="Tahapan IPO" className="relative grid grid-cols-5 gap-1 py-1">
          {stages.map((s, i) => {
            const isDone = i < cur, isCur = i === cur;
            return (
              <li key={s[0]} className="flex flex-col items-center gap-1 text-center">
                <i aria-hidden className={cn("inline-flex size-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold not-italic", isDone ? "border-foreground bg-foreground text-white" : isCur ? "border-primary bg-primary" : "border-input bg-background")}>{isDone ? "✓" : ""}</i>
                <b className={cn("text-[12.5px]", isCur || isDone ? "font-semibold" : "font-medium text-muted-foreground")}>{s[0]}</b>
                <small className="font-mono text-[11px] text-muted-foreground">{s[1] ? (s[2] && s[2] !== s[1] ? `${fdShort(s[1])}–${fdShort(s[2]).split(" ")[0]}` : fdShort(s[1])) : "belum diisi"}</small>
              </li>
            );
          })}
        </ol>
        <div>
          {jd.map((j) => (
            <div key={j.a} className="grid items-center gap-3 border-t border-sp-line-soft py-3 first:border-t-0 sm:grid-cols-[1fr_160px_160px]">
              <div className="flex flex-col"><b className="text-sm font-semibold">{j.label}</b><Help>{j.help}</Help></div>
              <Input type="date" aria-label={j.la} aria-invalid={!dt[j.a] && j.a === "ls"} value={dt[j.a]} onChange={setDate(j.a)} />
              {j.b ? <Input type="date" aria-label={j.lb} value={dt[j.b]} onChange={setDate(j.b)} /> : <span className="hidden text-center text-sp-faint sm:block">—</span>}
            </div>
          ))}
        </div>
        {jdErr && <Err>{jdErr}</Err>}
      </Section>

      <Section id="i-tawar" title="Detail penawaran" desc="Rentang harga dari masa bookbuilding. Harga final diisi setelah pernyataan efektif OJK.">
        <div className="grid gap-3.5 sm:grid-cols-3">
          {([["Harga bawah", "i-pl", pLo, setPLo], ["Harga atas", "i-ph", pHi, setPHi], ["Harga final", "i-pf", pFin, setPFin]] as const).map(([l, id, v, set]) => (
            <FormField key={id} label={l} htmlFor={id}>
              <AffixInput id={id} prefix="Rp" inputMode="numeric" invalid={id === "i-pf" && !!pErr && !!fin} value={v} placeholder={id === "i-pf" ? "—" : undefined} onChange={(e) => set(e.target.value)} />
            </FormField>
          ))}
        </div>
        {pErr && <Err>{pErr}</Err>}
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField label="Saham ditawarkan" htmlFor="i-sh">
            <AffixInput id="i-sh" suffix="lembar" inputMode="numeric" value={shares} onChange={(e) => setShares(e.target.value)} />
            <Help>{sh ? `= ${lembar(sh)}` : "Jumlah lembar saham baru yang ditawarkan"}</Help>
          </FormField>
          <FormField label="Porsi dari modal setelah IPO" htmlFor="i-pr">
            <AffixInput id="i-pr" suffix="%" inputMode="decimal" value={porsi} onChange={(e) => setPorsi(e.target.value)} />
            <Help>Dipakai untuk menghitung kapitalisasi pasar awal.</Help>
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[["Dana yang dihimpun", fund, fundSub], ["Kapitalisasi pasar di harga IPO", mcap, mcapSub]].map(([l, v, s]) => (
            <Card key={l} size="sm" className="bg-accent shadow-none"><CardContent className="flex flex-col gap-0.5"><span className="text-[12.5px] text-muted-foreground">{l}</span><b className="font-mono text-xl font-semibold">{v}</b><small className="text-xs text-muted-foreground">{s}</small></CardContent></Card>
          ))}
        </div>
        <FormField label="Penjamin pelaksana emisi">
          {uw.map((u, i) => (
            <div key={u.id} className="flex items-center gap-1.5"><Input aria-label={`Penjamin emisi ${i + 1}`} value={u.t} onChange={(e) => patchList(setUw, u.id, { t: e.target.value })} placeholder="Nama perusahaan sekuritas" /><RemoveBtn label={`Hapus penjamin ${i + 1}`} onClick={() => setUw(uw.filter((x) => x.id !== u.id))} /></div>
          ))}
          <LinkBtn onClick={() => setUw([...uw, withId({ t: "" })])}>+ Tambah penjamin</LinkBtn>
        </FormField>
        <ToggleRow id="sw-waran" title="Disertai waran" desc="Waran seri I yang dibagikan gratis bersama saham IPO." on={wr} onChange={setWr} />
        {wr && (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField label="Rasio" htmlFor="i-wr"><Input id="i-wr" value={wrRatio} onChange={(e) => setWrRatio(e.target.value)} placeholder="mis. 5 saham : 2 waran" /></FormField>
            <FormField label="Harga pelaksanaan" htmlFor="i-wp"><AffixInput id="i-wp" prefix="Rp" inputMode="numeric" value={wrPrice} onChange={(e) => setWrPrice(e.target.value)} /></FormField>
          </div>
        )}
      </Section>

      <Section id="i-dana" title="Rencana penggunaan dana" desc='Dari bab "Rencana Penggunaan Dana" di prospektus. Tampil di halaman emiten sebagai konteks bisnis, totalnya harus 100%.'>
        <div className="grid grid-cols-[1fr_110px_32px] gap-2 text-xs font-semibold tracking-[.05em] text-muted-foreground uppercase"><span>Tujuan</span><span className="text-right">Porsi</span><span /></div>
        {ud.map((u, i) => (
          <div key={u.id} className="grid grid-cols-[1fr_110px_32px] items-center gap-2">
            <Input aria-label={`Tujuan ${i + 1}`} value={u.t} onChange={(e) => patchList(setUd, u.id, { t: e.target.value })} placeholder="mis. Belanja modal pabrik" />
            <AffixInput suffix="%" inputMode="decimal" aria-label={`Porsi tujuan ${i + 1}`} value={u.p} onChange={(e) => patchList(setUd, u.id, { p: e.target.value })} />
            <RemoveBtn label={`Hapus tujuan ${i + 1}`} onClick={() => setUd(ud.filter((x) => x.id !== u.id))} />
          </div>
        ))}
        <ShareBar parts={ud.map((u, i) => ({ key: u.id, pct: udTot > 0 ? (Math.max(0, num(u.p ?? "")) / Math.max(udTot, 100)) * 100 : 0, color: BAR[i % BAR.length] }))} />
        <div className="flex items-center justify-between gap-3 text-sm">
          <LinkBtn onClick={() => setUd([...ud, withId({ t: "", p: "0" })])}>+ Tambah tujuan</LinkBtn>
          <span className="flex items-center gap-1.5">Total <b className={cn("font-mono", udTot === 100 ? "text-sp-success" : "text-(--sp-danger-text)")}>{dec(udTot, 2)}%</b> <Help className="w-auto">{udMsg}</Help></span>
        </div>
      </Section>

      <Section id="i-dok" title="Prospektus" desc="PDF dari e-IPO atau situs BEI. Pengguna bisa mengunduhnya dari halaman emiten selama masa penawaran.">
        {DOCS.map((d) => (
          <div key={d.k} className="grid items-center gap-3 border-t border-sp-line-soft pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col"><b className="flex items-center gap-2 text-sm font-semibold">{d.label}{d.req && <Badge variant="amber" className="h-[18px] text-[11px]">Wajib</Badge>}</b><Help>{d.help}</Help></div>
            <FileSlot value={docs[d.k]} onChange={(v) => { setDocs((p) => ({ ...p, [d.k]: v })); if (v && !v.up) toast(`${d.label} terunggah`); }} accept=".pdf" ext="PDF" maxMb={50} label={d.label} onError={(m) => toast(m)} />
          </div>
        ))}
      </Section>

      <Section id="i-tampil" title="Tampil di aplikasi" desc="Sebelum tercatat, emiten IPO hanya muncul di pencarian dengan label khusus.">
        <div>
          <ToggleRow id="sw-soon" title="Tampilkan sebagai “Segera IPO”" desc="Muncul di pencarian dan halaman tema sebelum tanggal pencatatan, dengan jadwal dan prospektus. Tanpa harga perdagangan." on={soon} onChange={setSoon} />
          <ToggleRow id="sw-auto" title="Jadikan aktif otomatis saat tercatat" desc="Di tanggal pencatatan, status berubah jadi Aktif dan harga mulai ikut sinkron BEI." on={auto} onChange={setAuto} />
        </div>
        <Note icon={<Info aria-hidden />}>Bagian profil lainnya (angka utama, tren keuangan, struktur grup, tema) diisi di halaman edit setelah emiten ini disimpan.</Note>
      </Section>
    </EditorShell>
  );
}
