"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Check, FileText, Upload, X } from "lucide-react";

export const inp = (err = false) =>
  `h-11 w-full rounded-lg border bg-white px-3 text-[14.5px] outline-none placeholder:text-[#A8A29E] focus:border-[#1C1917] focus:ring-[3px] focus:ring-[#1C1917]/10 disabled:bg-[#FAFAF9] disabled:text-[#716A65] ${err ? "border-[#DC2626]" : "border-[#D6D3D1]"}`;
export const area = (err = false) => `${inp(err)} h-auto min-h-[96px] py-2.5 leading-normal`;
export const mono = "font-mono";

export const btn = {
  base: "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold",
  primary: "border-transparent bg-[#FEA722] text-[#1C1917] hover:bg-[#F59E0B]",
  outline: "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#F5F5F4]",
  dark: "border-transparent bg-[#1C1917] text-white hover:bg-[#292524]",
  disabled: "cursor-not-allowed border-transparent bg-[#F5F5F4] text-[#A8A29E]",
  small: "!min-h-[34px] !px-3 !text-[13px]",
};
export const cls = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(" ");

export function useToast() {
  const [toast, setToast] = useState("");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useCallback((m: string) => {
    setToast(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setToast(""), 2600);
  }, []);
  const node = toast ? (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1C1917] px-4 py-[9px] text-[13.5px] text-white shadow-lg">{toast}</div>
  ) : null;
  return { flash, toast: node };
}

export function Field({ label, hint, htmlFor, children }: { label?: React.ReactNode; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-[13.5px] font-semibold">
          {label}
          {hint && <small className="ml-1.5 font-normal text-[#716A65]">{hint}</small>}
        </label>
      )}
      {children}
    </div>
  );
}

export const Err = ({ children }: { children: React.ReactNode }) => <span className="text-[13px] text-[#B91C1C]">{children}</span>;
export const Help = ({ children }: { children: React.ReactNode }) => <span className="text-[12.5px] leading-snug text-[#716A65]">{children}</span>;
export const Counter = ({ n, max }: { n: number; max: number }) => (
  <span className={cls(mono, "text-xs", n > max ? "font-semibold text-[#B91C1C]" : "text-[#716A65]")}>{n}/{max}</span>
);

export function Section({ id, title, desc, aside, children }: { id: string; title: string; desc: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="flex min-w-0 scroll-mt-4 flex-col gap-4 rounded-xl border border-[#E7E5E4] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <b id={`h-${id}`} className="text-[15px] font-semibold">{title}</b>
          <span className="text-[13.5px] leading-snug text-[#716A65]">{desc}</span>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cls("relative h-6 w-10 flex-none rounded-full transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-[18px] after:rounded-full after:bg-white after:shadow after:transition-transform", on ? "bg-[#1C1917] after:translate-x-4" : "bg-[#D6D3D1]")} />
  );
}

export function ToggleRow({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#F0EEEC] py-3 first:border-t-0">
      <div className="flex flex-col gap-0.5"><b className="text-sm font-semibold">{title}</b><small className="text-[13px] text-[#716A65]">{desc}</small></div>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  );
}

export function RemoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="inline-flex size-9 flex-none items-center justify-center rounded-lg text-[#716A65] hover:bg-[#F5F5F4] hover:text-[#B91C1C]">
      <X aria-hidden size={16} strokeWidth={1.8} />
    </button>
  );
}

export const LinkBtn = ({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button type="button" onClick={onClick} className={cls("self-start text-[13px] font-semibold underline underline-offset-2", className)}>{children}</button>
);

export function Note({ children, tone = "amber" }: { children: React.ReactNode; tone?: "amber" | "neutral" }) {
  return (
    <div className={cls("flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13.5px] leading-normal", tone === "amber" ? "border-[#FCDDA8] bg-[#FFF8EC] text-[#78350F]" : "border-[#E7E5E4] bg-[#FAFAF9] text-[#44403C]")}>{children}</div>
  );
}

export function Chip({ cls: c, children }: { cls: string; children: React.ReactNode }) {
  return <span className={cls("inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-2 text-xs font-semibold leading-[22px] before:size-1.5 before:rounded-full before:bg-current", c)}>{children}</span>;
}
export const TONE = { ok: "bg-[#DCFCE7] text-[#166534]", warn: "bg-[#FEF3C7] text-[#92400E]", err: "bg-[#FEE2E2] text-[#991B1B]", neutral: "bg-[#F5F5F4] text-[#57534E]", info: "bg-[#EFF6FF] text-[#1D4ED8]" };

export function SegCards<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { v: T; label: string; sub: string; dot?: string }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={cls("flex flex-col gap-0.5 rounded-[10px] border p-2.5 px-3 text-left", value === o.v ? "border-[#1C1917] bg-[#FAFAF9] shadow-[inset_0_0_0_1px_#1C1917]" : "border-[#E7E5E4] bg-white hover:border-[#D6D3D1]")}>
          <b className="flex items-center gap-2 text-sm font-semibold">{o.dot && <i className="size-2 rounded-full" style={{ background: o.dot }} />}{o.label}</b>
          <span className="text-[12.5px] leading-snug text-[#716A65]">{o.sub}</span>
        </button>
      ))}
    </div>
  );
}

export type Check = { label: string; ok: boolean; note?: string; href: string; group?: string };

/** Page header (avatar + title + actions) with TOC rail on the left, sections in the middle, completeness on the right. */
export function EditorShell({ header, checks, rail, children, skeleton }: { header: React.ReactNode; checks: Check[]; rail?: React.ReactNode; children: React.ReactNode; skeleton?: number }) {
  const done = checks.filter((c) => c.ok).length;
  return (
    <div className="flex flex-col gap-5">
      {header}
      <div className="grid items-start gap-5 lg:grid-cols-[168px_minmax(0,1fr)] xl:grid-cols-[168px_minmax(0,1fr)_280px]">
        <nav aria-label="Bagian form" aria-hidden={skeleton ? true : undefined} className="sticky top-4 hidden flex-col gap-0.5 text-[13px] lg:flex">
          {skeleton ? Array.from({ length: skeleton }, (_, i) => <Sk key={i} className="mx-2.5 mb-2.5 h-3.5" />) : null}
          {checks.map((c, i) => {
            const g = c.group !== checks[i - 1]?.group ? c.group : undefined;
            return (
              <div key={c.href} className="flex flex-col">
                {g && <span className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[.06em] text-[#A8A29E]">{g}</span>}
                <a href={c.href} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[#44403C] hover:bg-[#F5F5F4]">
                  <i aria-hidden className={cls("size-1.5 flex-none rounded-full", c.ok ? "bg-[#16A34A]" : "bg-[#F59E0B]")} />{c.label}
                </a>
              </div>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">{children}</div>
        <aside aria-label="Status form" className="flex flex-col gap-4 lg:col-start-2 xl:col-start-3 xl:row-start-1">
          {skeleton ? (
            <section className="flex flex-col gap-3 rounded-xl border border-[#E7E5E4] bg-white p-5">
              <Sk className="h-[18px] w-28" /><Sk className="h-[13px] w-36" /><Sk className="h-2.5 rounded-full" />
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-2.5"><Sk className="size-5 rounded-full" /><Sk className="h-3.5 w-[120px]" /></div>)}
            </section>
          ) : (
          <section className="flex flex-col gap-3 rounded-xl border border-[#E7E5E4] bg-white p-5">
            <div className="flex flex-col gap-1"><b className="text-[15px] font-semibold">Kelengkapan</b><span className="text-[13.5px] text-[#716A65]">{done} dari {checks.length} bagian siap</span></div>
            <span className="h-1.5 overflow-hidden rounded-full bg-[#F0EEEC]"><i className="block h-full rounded-full bg-[#FEA722]" style={{ width: `${(done / Math.max(checks.length, 1)) * 100}%` }} /></span>
            <div className="flex flex-col">
              {checks.map((c) => (
                <a key={c.href} href={c.href} className="flex items-center gap-2.5 py-1.5 text-[13.5px]">
                  <i aria-hidden className={cls("inline-flex size-5 flex-none items-center justify-center rounded-full text-[11px] font-bold not-italic", c.ok ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#92400E]")}>{c.ok ? <Check size={12} strokeWidth={2.5} /> : "!"}</i>
                  {c.label}
                  {c.note && <small className="ml-auto text-right text-xs text-[#716A65]">{c.note}</small>}
                </a>
              ))}
            </div>
          </section>
          )}
          {rail}
        </aside>
      </div>
    </div>
  );
}

export function EntityAvatar({ code, logo, size = 56, dark = false }: { code: string; logo?: string; size?: number; dark?: boolean }) {
  return (
    <span aria-hidden style={{ width: size, height: size }} className={cls("inline-flex flex-none items-center justify-center overflow-hidden rounded-full border font-mono text-[11px] font-semibold", dark ? "border-[#1C1917] bg-[#1C1917] text-[#FEA722]" : "border-[#E7E5E4] bg-white")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" className="size-full object-contain" /> : <span style={{ fontSize: size * 0.3 }}>{code.slice(0, 2)}</span>}
    </span>
  );
}

export function LogoUpload({ code, logo, onChange, replace }: { code: string; logo: string; onChange: (v: string) => void; replace?: boolean }) {
  const [err, setErr] = useState("");
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|svg\+xml|webp)$/.test(f.type)) return setErr("Format harus PNG, SVG, atau WebP.");
    if (f.size > 1024 * 1024) return setErr("Ukuran file lebih dari 1 MB.");
    const rd = new FileReader();
    rd.onload = () => { onChange(String(rd.result)); setErr(""); };
    rd.readAsDataURL(f);
  };
  return (
    <div className="flex w-[132px] flex-none flex-col items-start gap-2">
      <EntityAvatar code={code || "IPO"} logo={logo} size={96} dark />
      <label className={cls(btn.base, btn.outline, btn.small, "relative cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2")}>
        <Upload aria-hidden size={14} />{replace ? "Ganti logo" : "Unggah logo"}
        <input type="file" accept="image/png,image/svg+xml,image/webp" aria-label="Unggah logo" onChange={pick} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      {logo && replace && <button type="button" className="text-[12.5px] font-semibold underline underline-offset-2" onClick={() => onChange("")}>Hapus logo</button>}
      <Help>PNG/SVG persegi, maks. 1 MB. {replace ? "Tanpa logo, inisial yang dipakai." : "Boleh menyusul."}</Help>
      {err && <span className="text-[12.5px] text-[#B91C1C]">{err}</span>}
    </div>
  );
}

export type FileInfo = { name: string; size: number; at: string; up?: boolean };

// shortcut: files only live in component state (name/size); wire to real object storage + virus scan on the API.
export function FileSlot({ value, onChange, accept, ext, maxMb, label, onError }: { value: FileInfo | null; onChange: (v: FileInfo | null) => void; accept: string; ext: string; maxMb: number; label: string; onError: (m: string) => void }) {
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!new RegExp(`\\.(${accept.replace(/\./g, "").replace(/,/g, "|")})$`, "i").test(f.name)) return onError(`${label} harus berformat ${accept}`);
    const mb = f.size / 1048576;
    if (mb > maxMb) return onError(`Ukuran file melebihi ${maxMb} MB`);
    onChange({ name: f.name, size: Math.max(0.1, Math.round(mb * 10) / 10), at: "Baru saja", up: true });
    setTimeout(() => onChange({ name: f.name, size: Math.max(0.1, Math.round(mb * 10) / 10), at: "Baru saja" }), 1200);
  };
  if (!value)
    return (
      <label className="relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#D6D3D1] bg-[#FAFAF9] px-3 text-[13.5px] font-semibold text-[#57534E] hover:border-[#A8A29E]">
        <Upload aria-hidden size={16} />Unggah {ext}
        <input type="file" accept={accept} aria-label={`Unggah ${label}`} onChange={pick} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
    );
  const short = value.name.length > 30 ? `${value.name.slice(0, 14)}…${value.name.slice(-13)}` : value.name;
  return (
    <div className="flex min-h-12 items-center gap-2.5 rounded-[10px] border border-[#E7E5E4] bg-white px-2.5 py-1.5">
      <span aria-hidden className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[#FEF2F2] text-[9px] font-bold text-[#B91C1C]"><FileText size={14} /></span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight"><b title={value.name} className="truncate text-[13px] font-semibold">{short}</b><small className="text-xs text-[#716A65]">{value.up ? "Mengunggah…" : `${String(value.size).replace(".", ",")} MB · ${value.at}`}</small></span>
      {!value.up && (
        <span className="flex items-center gap-1">
          <label className="relative cursor-pointer rounded-md px-2 py-1 text-[13px] font-semibold hover:bg-[#F5F5F4]">Ganti<input type="file" accept={accept} aria-label={`Ganti ${label}`} onChange={pick} className="absolute inset-0 cursor-pointer opacity-0" /></label>
          <RemoveBtn label={`Hapus ${label}`} onClick={() => onChange(null)} />
        </span>
      )}
    </div>
  );
}

/** Shared skeleton block; shimmer is disabled for reduced motion. */
export const Sk = ({ className }: { className: string }) => <span className={cls("block animate-pulse rounded-md bg-[#EFEDEB] motion-reduce:animate-none", className)} />;

export { Link };
