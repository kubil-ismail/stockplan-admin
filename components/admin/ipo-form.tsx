"use client";

import Link from "next/link";
import { useState } from "react";
import { Info } from "lucide-react";
import { existingCodes } from "@/lib/emiten-data";
import { dec, fdShort, lembar, num, rp, scheduleError, stageIndex, type Dates } from "@/lib/ipo";
import {
  area, btn, Chip, cls, Counter, EditorShell, EntityAvatar, Err, Field, FileSlot, Help, inp, LinkBtn, LogoUpload, Note, RemoveBtn,
  Section, SegCards, TONE, ToggleRow, useToast, type Check, type FileInfo,
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
  const { flash, toast } = useToast();
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
  const dateCls = (k: keyof Dates) => inp(!dt[k] && k === "ls");

  const header = (
    <div className="flex flex-wrap items-center gap-4">
      <EntityAvatar code={code || "IPO"} logo={logo} dark />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold leading-tight tracking-tight"><code className="mr-2 font-mono text-[22px]">{code || "····"}</code>{name.trim() || "Nama perusahaan"}</h1>
          <Chip cls={TONE.info}>IPO baru</Chip>
          <Chip cls={TONE.neutral}>{saved ? "Draf tersimpan" : "Belum disimpan"}</Chip>
        </div>
        <span className="text-sm text-[#716A65]">Belum tercatat di BEI. Harga dan data perdagangan baru ikut sinkron mulai tanggal pencatatan.</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Link href="/admin/emiten" className={cls(btn.base, btn.outline)}>Batal</Link>
        <button type="button" className={cls(btn.base, btn.outline)} onClick={() => { if (tkErr || !name.trim()) return flash("Isi nama dan kode saham yang valid dulu"); setSaved(true); flash(`Draf ${code} tersimpan. Belum tampil di aplikasi.`); }}>Simpan draf</button>
        {canNext ? (
          <Link href={`/admin/emiten/${code}`} className={cls(btn.base, btn.primary)}>Simpan &amp; lanjut isi profil</Link>
        ) : (
          <button type="button" aria-disabled className={cls(btn.base, btn.disabled)} onClick={() => flash(`Lengkapi dulu: ${checks.filter((c) => !c.ok).map((c) => c.label).join(", ")}`)}>Simpan &amp; lanjut isi profil</button>
        )}
      </div>
    </div>
  );

  const rail = (
    <section className="flex flex-col gap-3 rounded-xl border border-[#E7E5E4] bg-white p-5">
      <div className="flex flex-col gap-1"><b className="text-[15px] font-semibold">Pratinjau di aplikasi</b><span className="text-[13.5px] text-[#716A65]">Kartu di hasil pencarian</span></div>
      <div className="flex flex-col gap-2 rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] p-3.5">
        <div className="flex items-center gap-2.5"><EntityAvatar code={code || "IPO"} logo={logo} size={32} /><div className="flex min-w-0 flex-col leading-tight"><code className="font-mono text-xs font-semibold">{code || "····"}</code><span className="truncate text-[13px]">{name.trim() || "Nama perusahaan"}</span></div></div>
        <Chip cls={cls(TONE.info, "self-start")}>{dt.ls ? `Segera IPO · ${fdShort(dt.ls)}` : "Segera IPO"}</Chip>
        <p className={cls("text-[13.5px] leading-snug", !shortSum.trim() && "text-[#A8A29E]")}>{shortSum.trim() || "Deskripsi singkat belum diisi"}</p>
        <small className="text-xs text-[#716A65]">{sektor} · {sub.trim() || "subsektor"}</small>
      </div>
      {!soon && <Help>Tidak tampil di aplikasi sampai tanggal pencatatan.</Help>}
    </section>
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
              <Field label="Nama perusahaan" htmlFor="i-nm"><input id="i-nm" className={inp(!name.trim())} value={name} onChange={(e) => setName(e.target.value)} placeholder="PT … Tbk" /></Field>
              <Field label="Kode saham" htmlFor="i-tk"><input id="i-tk" className={cls(inp(!!tkErr), "font-mono")} value={tk} onChange={(e) => setTk(e.target.value.toUpperCase())} maxLength={4} autoComplete="off" placeholder="ABCD" /></Field>
            </div>
            {tkErr && <Err>{tkErr}</Err>}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Sektor IDX-IC" htmlFor="i-sk"><select id="i-sk" className={inp()} value={sektor} onChange={(e) => setSektor(e.target.value)}>{SEKTOR.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Subsektor" htmlFor="i-ss"><input id="i-ss" className={inp(!sub.trim())} value={sub} onChange={(e) => setSub(e.target.value)} placeholder="mis. Batu bara" /></Field>
            </div>
            <Field label="Papan pencatatan"><SegCards label="Papan pencatatan" value={papan} onChange={setPapan} options={PAPAN} /></Field>
            <Field label="Deskripsi singkat" hint="boleh menyusul — dipakai di kartu pencarian" htmlFor="i-sd">
              <input id="i-sd" className={inp(shortSum.length > 100)} value={shortSum} onChange={(e) => setShortSum(e.target.value)} placeholder="mis. Pengolah nikel untuk bahan baku baterai" />
              <div className="flex justify-end"><Counter n={shortSum.length} max={100} /></div>
            </Field>
            <Field label="Deskripsi panjang" hint="boleh menyusul — jadi Ringkasan lengkap di halaman emiten" htmlFor="i-ld">
              <textarea id="i-ld" className={cls(area(longSum.length > 400), "min-h-[168px]")} value={longSum} onChange={(e) => setLongSum(e.target.value)} placeholder="Bisnis apa, uangnya dari mana, dan apa yang menggerakkan kinerjanya. Dua sampai tiga kalimat bahasa sehari-hari." />
              <div className="flex justify-between gap-3"><Help>Ambil dari bab Kegiatan Usaha di prospektus. Apit dengan **dua bintang** untuk menebalkan satu frasa.</Help><Counter n={longSum.length} max={400} /></div>
            </Field>
          </div>
        </div>
      </Section>

      <Section id="i-jadwal" title="Jadwal IPO" desc="Salin dari prospektus atau pengumuman BEI. Tahap aktif dihitung otomatis dari tanggal hari ini." aside={<Chip cls={TONE.warn}>{stageLabel}</Chip>}>
        <ol aria-label="Tahapan IPO" className="relative grid grid-cols-5 gap-1 py-1">
          {stages.map((s, i) => {
            const isDone = i < cur, isCur = i === cur;
            return (
              <li key={s[0]} className="flex flex-col items-center gap-1 text-center">
                <i aria-hidden className={cls("inline-flex size-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold not-italic", isDone ? "border-[#1C1917] bg-[#1C1917] text-white" : isCur ? "border-[#FEA722] bg-[#FEA722]" : "border-[#D6D3D1] bg-white")}>{isDone ? "✓" : ""}</i>
                <b className={cls("text-[12.5px]", isCur || isDone ? "font-semibold" : "font-medium text-[#716A65]")}>{s[0]}</b>
                <small className="font-mono text-[11px] text-[#716A65]">{s[1] ? (s[2] && s[2] !== s[1] ? `${fdShort(s[1])}–${fdShort(s[2]).split(" ")[0]}` : fdShort(s[1])) : "belum diisi"}</small>
              </li>
            );
          })}
        </ol>
        <div>
          {jd.map((j) => (
            <div key={j.a} className="grid items-center gap-3 border-t border-[#F0EEEC] py-3 first:border-t-0 sm:grid-cols-[1fr_150px_150px]">
              <div className="flex flex-col"><b className="text-sm font-semibold">{j.label}</b><small className="text-[12.5px] text-[#716A65]">{j.help}</small></div>
              <input type="date" aria-label={j.la} className={dateCls(j.a)} value={dt[j.a]} onChange={setDate(j.a)} />
              {j.b ? <input type="date" aria-label={j.lb} className={dateCls(j.b)} value={dt[j.b]} onChange={setDate(j.b)} /> : <span className="hidden text-center text-[#A8A29E] sm:block">—</span>}
            </div>
          ))}
        </div>
        {jdErr && <Err>{jdErr}</Err>}
      </Section>

      <Section id="i-tawar" title="Detail penawaran" desc="Rentang harga dari masa bookbuilding. Harga final diisi setelah pernyataan efektif OJK.">
        <div className="grid gap-3.5 sm:grid-cols-3">
          {([["Harga bawah", "i-pl", pLo, setPLo], ["Harga atas", "i-ph", pHi, setPHi], ["Harga final", "i-pf", pFin, setPFin]] as const).map(([l, id, v, set]) => (
            <Field key={id} label={l} htmlFor={id}>
              <span className="relative flex items-center"><span className="absolute left-3 text-[13px] text-[#716A65]">Rp</span><input id={id} inputMode="numeric" className={cls(inp(id === "i-pf" && !!pErr && !!fin), "pl-9 text-right font-mono")} value={v} placeholder={id === "i-pf" ? "—" : undefined} onChange={(e) => set(e.target.value)} /></span>
            </Field>
          ))}
        </div>
        {pErr && <Err>{pErr}</Err>}
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Saham ditawarkan" htmlFor="i-sh">
            <span className="relative flex items-center"><input id="i-sh" inputMode="numeric" className={cls(inp(), "pr-16 text-right font-mono")} value={shares} onChange={(e) => setShares(e.target.value)} /><span className="absolute right-3 text-xs text-[#716A65]">lembar</span></span>
            <Help>{sh ? `= ${lembar(sh)}` : "Jumlah lembar saham baru yang ditawarkan"}</Help>
          </Field>
          <Field label="Porsi dari modal setelah IPO" htmlFor="i-pr">
            <span className="relative flex items-center"><input id="i-pr" inputMode="decimal" className={cls(inp(), "pr-9 text-right font-mono")} value={porsi} onChange={(e) => setPorsi(e.target.value)} /><span className="absolute right-3 text-[13px] text-[#716A65]">%</span></span>
            <Help>Dipakai untuk menghitung kapitalisasi pasar awal.</Help>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[["Dana yang dihimpun", fund, fundSub], ["Kapitalisasi pasar di harga IPO", mcap, mcapSub]].map(([l, v, s]) => (
            <div key={l} className="flex flex-col gap-0.5 rounded-[10px] border border-[#E7E5E4] bg-[#FAFAF9] p-3.5"><span className="text-[12.5px] text-[#716A65]">{l}</span><b className="font-mono text-xl font-semibold">{v}</b><small className="text-xs text-[#716A65]">{s}</small></div>
          ))}
        </div>
        <Field label="Penjamin pelaksana emisi">
          {uw.map((u, i) => (
            <div key={u.id} className="flex items-center gap-1.5"><input className={inp()} aria-label={`Penjamin emisi ${i + 1}`} value={u.t} onChange={(e) => patchList(setUw, u.id, { t: e.target.value })} placeholder="Nama perusahaan sekuritas" /><RemoveBtn label={`Hapus penjamin ${i + 1}`} onClick={() => setUw(uw.filter((x) => x.id !== u.id))} /></div>
          ))}
          <LinkBtn onClick={() => setUw([...uw, withId({ t: "" })])}>+ Tambah penjamin</LinkBtn>
        </Field>
        <ToggleRow title="Disertai waran" desc="Waran seri I yang dibagikan gratis bersama saham IPO." on={wr} onChange={setWr} />
        {wr && (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Rasio" htmlFor="i-wr"><input id="i-wr" className={inp()} value={wrRatio} onChange={(e) => setWrRatio(e.target.value)} placeholder="mis. 5 saham : 2 waran" /></Field>
            <Field label="Harga pelaksanaan" htmlFor="i-wp"><span className="relative flex items-center"><span className="absolute left-3 text-[13px] text-[#716A65]">Rp</span><input id="i-wp" inputMode="numeric" className={cls(inp(), "pl-9 text-right font-mono")} value={wrPrice} onChange={(e) => setWrPrice(e.target.value)} /></span></Field>
          </div>
        )}
      </Section>

      <Section id="i-dana" title="Rencana penggunaan dana" desc='Dari bab "Rencana Penggunaan Dana" di prospektus. Tampil di halaman emiten sebagai konteks bisnis, totalnya harus 100%.'>
        <div className="grid grid-cols-[1fr_110px_36px] gap-2 text-xs font-semibold uppercase tracking-[.05em] text-[#716A65]"><span>Tujuan</span><span className="text-right">Porsi</span><span /></div>
        {ud.map((u, i) => (
          <div key={u.id} className="grid grid-cols-[1fr_110px_36px] items-center gap-2">
            <input className={inp()} aria-label={`Tujuan ${i + 1}`} value={u.t} onChange={(e) => patchList(setUd, u.id, { t: e.target.value })} placeholder="mis. Belanja modal pabrik" />
            <span className="relative flex items-center"><input className={cls(inp(), "pr-8 text-right font-mono")} inputMode="decimal" aria-label={`Porsi tujuan ${i + 1}`} value={u.p} onChange={(e) => patchList(setUd, u.id, { p: e.target.value })} /><span className="absolute right-3 text-[13px] text-[#716A65]">%</span></span>
            <RemoveBtn label={`Hapus tujuan ${i + 1}`} onClick={() => setUd(ud.filter((x) => x.id !== u.id))} />
          </div>
        ))}
        <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-[#F0EEEC]">
          {ud.map((u, i) => <i key={u.id} className="h-full" style={{ width: `${udTot > 0 ? (Math.max(0, num(u.p ?? "")) / Math.max(udTot, 100)) * 100 : 0}%`, background: BAR[i % BAR.length] }} />)}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <LinkBtn onClick={() => setUd([...ud, withId({ t: "", p: "0" })])}>+ Tambah tujuan</LinkBtn>
          <span>Total <b className={cls("font-mono", udTot === 100 ? "text-[#15803D]" : "text-[#B91C1C]")}>{dec(udTot, 2)}%</b> <Help>{udMsg}</Help></span>
        </div>
      </Section>

      <Section id="i-dok" title="Prospektus" desc="PDF dari e-IPO atau situs BEI. Pengguna bisa mengunduhnya dari halaman emiten selama masa penawaran.">
        {DOCS.map((d) => (
          <div key={d.k} className="grid items-center gap-3 border-t border-[#F0EEEC] pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col"><b className="flex items-center gap-2 text-sm font-semibold">{d.label}{d.req && <em className="rounded bg-[#FFF4E2] px-1.5 text-[11px] font-semibold not-italic leading-[18px] text-[#92400E]">Wajib</em>}</b><small className="text-[12.5px] text-[#716A65]">{d.help}</small></div>
            <FileSlot value={docs[d.k]} onChange={(v) => { setDocs((p) => ({ ...p, [d.k]: v })); if (v && !v.up) flash(`${d.label} terunggah`); }} accept=".pdf" ext="PDF" maxMb={50} label={d.label} onError={flash} />
          </div>
        ))}
      </Section>

      <Section id="i-tampil" title="Tampil di aplikasi" desc="Sebelum tercatat, emiten IPO hanya muncul di pencarian dengan label khusus.">
        <div>
          <ToggleRow title="Tampilkan sebagai “Segera IPO”" desc="Muncul di pencarian dan halaman tema sebelum tanggal pencatatan, dengan jadwal dan prospektus. Tanpa harga perdagangan." on={soon} onChange={setSoon} />
          <ToggleRow title="Jadikan aktif otomatis saat tercatat" desc="Di tanggal pencatatan, status berubah jadi Aktif dan harga mulai ikut sinkron BEI." on={auto} onChange={setAuto} />
        </div>
        <Note><Info aria-hidden size={16} className="mt-0.5 flex-none" /><span>Bagian profil lainnya (angka utama, tren keuangan, struktur grup, tema) diisi di halaman edit setelah emiten ini disimpan.</span></Note>
      </Section>
      {toast}
    </EditorShell>
  );
}
