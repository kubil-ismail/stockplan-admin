"use client";

// Admin building blocks composed from shadcn/ui primitives (components/ui). Views import these or the primitives directly.
import Link from "next/link";
import { useState } from "react";
import { Check, FileText, Search, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Label + control + optional hint, built on shadcn Field. */
export function FormField({ label, hint, htmlFor, children, className }: { label?: React.ReactNode; hint?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <Field className={cn("min-w-0", className)}>
      {label && (
        <FieldLabel htmlFor={htmlFor}>
          {label}
          {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
        </FieldLabel>
      )}
      {children}
    </Field>
  );
}

export const Err = ({ children }: { children: React.ReactNode }) => <FieldError>{children}</FieldError>;
export const Help = ({ children, className }: { children: React.ReactNode; className?: string }) => <FieldDescription className={className}>{children}</FieldDescription>;
export const Counter = ({ n, max }: { n: number; max: number }) => (
  <span className={cn("font-mono text-xs", n > max ? "font-semibold text-(--sp-danger-text)" : "text-muted-foreground")}>{n}/{max}</span>
);

/** Form section = shadcn Card with title, description and an optional header action. */
export function Section({ id, title, desc, aside, children }: { id: string; title: string; desc: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card id={id} aria-labelledby={`h-${id}`} className="min-w-0 scroll-mt-4">
      <CardHeader>
        <CardTitle id={`h-${id}`}>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
        {aside && <CardAction>{aside}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

/** Title + description on the left, Switch on the right. */
export function ToggleRow({ title, desc, on, onChange, id }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void; id?: string }) {
  const sid = id ?? `sw-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Field orientation="horizontal" className="justify-between border-t border-sp-line-soft py-3 first:border-t-0">
      <FieldContent>
        <FieldLabel htmlFor={sid} className="text-sm">{title}</FieldLabel>
        <FieldDescription className="text-[13px]">{desc}</FieldDescription>
      </FieldContent>
      <Switch id={sid} checked={on} onCheckedChange={onChange} />
    </Field>
  );
}

export function RemoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} className="text-muted-foreground hover:text-(--sp-danger-text)">
      <X aria-hidden />
    </Button>
  );
}

export const LinkBtn = ({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
  <Button type="button" variant="link" onClick={onClick} className={cn("h-auto self-start px-0 text-[13px]", className)}>{children}</Button>
);

export function Note({ children, icon, tone = "warning" }: { children: React.ReactNode; icon?: React.ReactNode; tone?: "warning" | "info" | "destructive" | "success" }) {
  return (
    <Alert role="note" variant={tone}>
      {icon}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";
/** Status pill with a dot (design `.b` chip) = shadcn Badge. */
export const StatusBadge = ({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) => (
  <Badge variant={tone} dot className={cn("h-[22px] text-xs", className)}>{children}</Badge>
);

/** Card-style radio options (shadcn "choice card": RadioGroup + FieldLabel). */
export function ChoiceCards<T extends string>({ label, value, onChange, options, className }: { label: string; value: T; onChange: (v: T) => void; options: { v: T; label: string; sub: string; dot?: string }[]; className?: string }) {
  return (
    <RadioGroup aria-label={label} value={value} onValueChange={(v) => onChange(v as T)} className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {options.map((o) => (
        <FieldLabel key={o.v} htmlFor={`${label}-${o.v}`} className="has-data-checked:border-foreground has-data-checked:bg-accent">
          <Field orientation="horizontal" className="items-start">
            <FieldContent>
              <FieldTitle className="font-semibold">{o.dot && <i aria-hidden className="size-2 rounded-full" style={{ background: o.dot }} />}{o.label}</FieldTitle>
              <FieldDescription>{o.sub}</FieldDescription>
            </FieldContent>
            <RadioGroupItem id={`${label}-${o.v}`} value={o.v} className="data-checked:border-foreground data-checked:bg-foreground" />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
}

export type Check = { label: string; ok: boolean; note?: string; href: string; group?: string };

/** Editor layout: TOC (left), sections (middle), completeness Card + extra rail (right). */
export function EditorShell({ header, checks, rail, children, skeleton }: { header: React.ReactNode; checks: Check[]; rail?: React.ReactNode; children: React.ReactNode; skeleton?: number }) {
  const done = checks.filter((c) => c.ok).length;
  return (
    <div className="flex flex-col gap-5">
      {header}
      <div className="grid items-start gap-5 lg:grid-cols-[168px_minmax(0,1fr)] xl:grid-cols-[168px_minmax(0,1fr)_280px]">
        <nav aria-label="Bagian form" aria-hidden={skeleton ? true : undefined} className="sticky top-4 hidden flex-col gap-0.5 lg:flex">
          {skeleton ? Array.from({ length: skeleton }, (_, i) => <Skeleton key={i} className="mx-2.5 mb-2.5 h-3.5" />) : null}
          {checks.map((c, i) => {
            const g = c.group !== checks[i - 1]?.group ? c.group : undefined;
            return (
              <div key={c.href} className="flex flex-col">
                {g && <span className="px-2.5 pt-3 pb-1 text-[11px] font-semibold tracking-[.06em] text-sp-faint uppercase">{g}</span>}
                <a href={c.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-start font-normal text-sp-ink-2")}>
                  <i aria-hidden className={cn("size-1.5 flex-none rounded-full", c.ok ? "bg-[#16A34A]" : "bg-[#F59E0B]")} />{c.label}
                </a>
              </div>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">{children}</div>
        <aside aria-label="Status form" className="flex flex-col gap-4 lg:col-start-2 xl:col-start-3 xl:row-start-1">
          <Card>
            {skeleton ? (
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-[18px] w-28" /><Skeleton className="h-[13px] w-36" /><Skeleton className="h-2.5 rounded-full" />
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-2.5"><Skeleton className="size-5 rounded-full" /><Skeleton className="h-3.5 w-[120px]" /></div>)}
              </CardContent>
            ) : (
              <>
                <CardHeader><CardTitle>Kelengkapan</CardTitle><CardDescription>{done} dari {checks.length} bagian siap</CardDescription></CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Progress value={(done / Math.max(checks.length, 1)) * 100} aria-label="Kelengkapan" />
                  <div className="flex flex-col">
                    {checks.map((c) => (
                      <a key={c.href} href={c.href} className="flex items-center gap-2.5 rounded-md py-1.5 text-[13.5px] hover:underline">
                        <i aria-hidden className={cn("inline-flex size-5 flex-none items-center justify-center rounded-full text-[11px] font-bold not-italic", c.ok ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#92400E]")}>{c.ok ? <Check size={12} strokeWidth={2.5} /> : "!"}</i>
                        {c.label}
                        {c.note && <small className="ml-auto text-right text-xs text-muted-foreground">{c.note}</small>}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
          {rail}
        </aside>
      </div>
    </div>
  );
}

/** Emiten / person avatar = shadcn Avatar (logo image or initials). */
export function EntityAvatar({ code, logo, size = 56, dark = false, color, className }: { code: string; logo?: string; size?: number; dark?: boolean; color?: string; className?: string }) {
  return (
    <Avatar aria-hidden style={{ width: size, height: size }} className={className}>
      {logo && <AvatarImage src={logo} alt="" className="bg-background object-contain" />}
      <AvatarFallback className={cn("font-mono font-semibold", dark ? "bg-foreground text-primary" : color ? "text-white" : "bg-muted text-foreground")} style={{ fontSize: Math.max(10, size * 0.3), ...(color && !dark ? { background: color } : {}) }}>
        {code.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
}

/** File input styled as a shadcn outline button (a <label> so the native picker opens). */
export function FilePickButton({ label, accept, onPick, children, className, variant = "outline" }: { label: string; accept: string; onPick: (e: React.ChangeEvent<HTMLInputElement>) => void; children: React.ReactNode; className?: string; variant?: "outline" | "ghost" }) {
  return (
    <label className={cn(buttonVariants({ variant, size: "sm" }), "relative cursor-pointer focus-within:ring-3 focus-within:ring-ring/15", className)}>
      {children}
      <Input type="file" accept={accept} aria-label={label} onChange={onPick} className="absolute inset-0 h-full cursor-pointer opacity-0" />
    </label>
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
      <FilePickButton label="Unggah logo" accept="image/png,image/svg+xml,image/webp" onPick={pick}><Upload aria-hidden />{replace ? "Ganti logo" : "Unggah logo"}</FilePickButton>
      {logo && replace && <LinkBtn onClick={() => onChange("")} className="text-[12.5px]">Hapus logo</LinkBtn>}
      <Help>PNG/SVG persegi, maks. 1 MB. {replace ? "Tanpa logo, inisial yang dipakai." : "Boleh menyusul."}</Help>
      {err && <Err>{err}</Err>}
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
    return <FilePickButton label={`Unggah ${label}`} accept={accept} onPick={pick} className="h-12 w-full border-dashed bg-accent text-sp-icon"><Upload aria-hidden />Unggah {ext}</FilePickButton>;
  const short = value.name.length > 30 ? `${value.name.slice(0, 14)}…${value.name.slice(-13)}` : value.name;
  return (
    <Item variant="outline" size="sm" className="flex-nowrap py-1.5">
      <ItemMedia className="size-8 rounded-md bg-(--sp-danger-bg) text-(--sp-danger-text)"><FileText aria-hidden className="size-3.5" /></ItemMedia>
      <ItemContent className="min-w-0 gap-0">
        <ItemTitle title={value.name} className="text-[13px]">{short}</ItemTitle>
        <ItemDescription className="text-xs">{value.up ? "Mengunggah…" : `${String(value.size).replace(".", ",")} MB · ${value.at}`}</ItemDescription>
      </ItemContent>
      {!value.up && (
        <ItemActions className="gap-1">
          <FilePickButton label={`Ganti ${label}`} accept={accept} onPick={pick} variant="ghost">Ganti</FilePickButton>
          <RemoveBtn label={`Hapus ${label}`} onClick={() => onChange(null)} />
        </ItemActions>
      )}
    </Item>
  );
}

/** Page title block used at the top of every admin page. */
export function PageHeader({ title, desc, actions }: { title: string; desc?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
        {desc && <p className="text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

/** KPI tile = shadcn Card. */
export function StatCard({ label, value, note, href }: { label: string; value: React.ReactNode; note?: React.ReactNode; href?: string }) {
  const body = (
    <CardContent className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <b className="font-mono text-[28px] leading-tight font-semibold tracking-tight">{value}</b>
      {note && <small className="text-[12.5px] text-muted-foreground">{note}</small>}
    </CardContent>
  );
  const card = <Card size="sm" className={cn("h-full py-4", href && "transition-colors group-hover/stat:border-input")}>{body}</Card>;
  return href ? <Link href={href} className="group/stat block rounded-xl">{card}</Link> : card;
}

/** Flush list card: header (title + aside), full-bleed rows, optional muted footer. */
export function PanelCard({ id, title, aside, footer, children, className }: { id: string; title: React.ReactNode; aside?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Card aria-labelledby={id} className={cn("min-w-0 gap-0 py-0", className)}>
      <CardHeader className="border-b border-sp-line-soft py-4 [.border-b]:pb-4">
        <CardTitle id={id}>{title}</CardTitle>
        {aside && <CardAction className="self-center text-[13px] text-muted-foreground">{aside}</CardAction>}
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

/** Classes for a full-bleed shadcn Item row inside PanelCard. */
export const ROW = "rounded-none border-0 border-t border-sp-line-soft px-5 py-3 first:border-t-0";

/** Status filter tabs with counts (shadcn Tabs used as a segmented filter; no panels). */
export function FilterTabs<T extends string>({ label, value, onChange, tabs, className }: { label: string; value: T; onChange: (v: T) => void; tabs: { v: T; label: string; n?: number | string }[]; className?: string }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)} className={className}>
      <TabsList aria-label={label} className="h-auto! max-w-full flex-wrap">
        {tabs.map((t) => (
          <TabsTrigger key={t.v} value={t.v} className="h-8">
            {t.label}{t.n != null && <small className="font-mono text-[11.5px] font-normal text-muted-foreground">{t.n}</small>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** Search box = shadcn InputGroup with a search icon. */
export function SearchInput({ label, placeholder, value, onChange, className }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <InputGroup className={cn("h-[38px] min-w-60 flex-1", className)}>
      <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
      <InputGroupInput type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
    </InputGroup>
  );
}

/** Empty state for filtered lists = shadcn Empty. */
export function EmptyResult({ title, desc, onReset }: { title: string; desc: string; onReset?: () => void }) {
  return (
    <Empty className="py-10">
      <EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{desc}</EmptyDescription></EmptyHeader>
      {onReset && <EmptyContent><Button variant="outline" size="sm" onClick={onReset}>Hapus semua filter</Button></EmptyContent>}
    </Empty>
  );
}

/** "Showing x of y" + Prev/Next buttons. */
export function Pager({ text, canPrev = false, canNext = true, onPrev, onNext }: { text: React.ReactNode; canPrev?: boolean; canNext?: boolean; onPrev?: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-sp-line-soft px-4 py-3 text-[13px] text-muted-foreground">
      <span>{text}</span>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" aria-disabled={!canPrev} onClick={canPrev ? onPrev : undefined}>Sebelumnya</Button>
        <Button variant="outline" size="sm" aria-disabled={!canNext} onClick={canNext ? onNext : undefined}>Berikutnya</Button>
      </div>
    </div>
  );
}

/** Numeric input with prefix/suffix (Rp, %, lembar) = shadcn InputGroup. */
export function AffixInput({ prefix, suffix, invalid, className, ...props }: React.ComponentProps<"input"> & { prefix?: string; suffix?: string; invalid?: boolean }) {
  return (
    <InputGroup className={className}>
      {prefix && <InputGroupAddon><InputGroupText>{prefix}</InputGroupText></InputGroupAddon>}
      <InputGroupInput aria-invalid={invalid || undefined} className="text-right font-mono" {...props} />
      {suffix && <InputGroupAddon align="inline-end"><InputGroupText className="text-xs">{suffix}</InputGroupText></InputGroupAddon>}
    </InputGroup>
  );
}

/** Proportion bar (use of funds, revenue segments). Decorative: the numbers are in the inputs next to it. */
export function ShareBar({ parts }: { parts: { key: React.Key; pct: number; color: string }[] }) {
  return (
    <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-sp-line-soft">
      {parts.map((p) => <i key={p.key} className="h-full" style={{ width: `${p.pct}%`, background: p.color }} />)}
    </div>
  );
}
