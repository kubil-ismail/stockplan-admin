// Pure helpers for the theme builder (value-chain stages with emiten rows). No React here so they can be tested.
import type { ThemeForm } from "./admin-themes";

export type Row = { tk: string; p: string; src?: string };
export type Stage = { id: number; name: string; g: string; desc: string; rows: Row[] };
export type Group = { id: string; t: string; d: string; ic: string; c: string };

export type Result = { stages: Stage[]; msg: string } | { error: string };

const label = (s: Stage, i: number) => s.name || `tahap ${i + 1}`;
const idx = (S: Stage[], id: number) => S.findIndex((s) => s.id === id);

/** from === null means "dragged from the emiten list" (adds); otherwise moves between stages. */
export function moveEmiten(S: Stage[], tk: string, from: number | null, to: number): Result {
  const ti = idx(S, to);
  if (from === to) return { error: "" };
  if (S[ti].rows.some((r) => r.tk === tk)) return { error: `${tk} sudah ada di tahap ${ti + 1}` };
  if (from === null)
    return { stages: S.map((s) => (s.id === to ? { ...s, rows: [...s.rows, { tk, p: "" }] } : s)), msg: `${tk} masuk ke ${label(S[ti], ti)}` };
  const row = S[idx(S, from)].rows.find((r) => r.tk === tk)!;
  return {
    stages: S.map((s) => (s.id === from ? { ...s, rows: s.rows.filter((r) => r.tk !== tk) } : s.id === to ? { ...s, rows: [...s.rows, row] } : s)),
    msg: `${tk} dipindah ke ${label(S[ti], ti)}`,
  };
}

export function removeEmiten(S: Stage[], tk: string, from: number): Result {
  return { stages: S.map((s) => (s.id === from ? { ...s, rows: s.rows.filter((r) => r.tk !== tk) } : s)), msg: `${tk} dikeluarkan dari tahap ${idx(S, from) + 1}` };
}

export function moveStage(S: Stage[], from: number, to: number): Stage[] | null {
  if (from === to) return null;
  const a = S.slice();
  const [x] = a.splice(idx(S, from), 1);
  a.splice(idx(S, to), 0, x);
  return a;
}

export const stagesOf = (S: Stage[], tk: string) => S.flatMap((s, i) => (s.rows.some((r) => r.tk === tk) ? [i + 1] : []));

export const READY_MIN = 80;
export const readiness = (ok: number, n: number) => (n ? Math.round((ok / n) * 100) : 0);

/** "" -> null (empty share); "12,5" -> 12.5; junk -> NaN (blocks saving). */
export const parsePct = (p: string) => (p.trim() ? Number(p.trim().replace(",", ".")) : null);
const showPct = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

export type Draft = { name: string; sectorSlug: string; description: string; drivers: string[]; groups: Group[]; stages: Stage[] };

export const fromForm = (f: ThemeForm): Draft => ({
  name: f.name, sectorSlug: f.sectorSlug, description: f.description, drivers: f.drivers,
  groups: f.groups.map((g) => ({ id: g.key, t: g.title, d: g.description, ic: g.icon, c: g.color })),
  stages: f.stages.map((s, i) => ({ id: i + 1, name: s.name, g: s.groupKey, desc: s.description, rows: s.rows.map((r) => ({ tk: r.ticker, p: showPct(r.pct), src: r.source })) })),
});

export const toForm = (d: Draft): ThemeForm => ({
  name: d.name.trim(), sectorSlug: d.sectorSlug, description: d.description.trim(), drivers: d.drivers.map((x) => x.trim()).filter(Boolean),
  groups: d.groups.map((g) => ({ key: g.id, title: g.t, description: g.d, icon: g.ic, color: g.c })),
  stages: d.stages.map((s) => ({ name: s.name, groupKey: s.g, description: s.desc, rows: s.rows.map((r) => ({ ticker: r.tk, pct: parsePct(r.p) as number | null, source: r.src ?? "" })) })),
});

/** Mirrors the first four publish conditions of the API (lib/adminThemes.js checks()); the fifth, emiten readiness, only the API can tell. */
export function checklist(d: Draft): [string, boolean][] {
  const f = (s: string) => s.trim() !== "";
  const groupsOk = d.groups.length > 0 && d.groups.every((g) => f(g.t) && f(g.d) && g.t.length <= 20 && g.d.length <= 80);
  const keys = new Set(d.groups.map((g) => g.id));
  const bad = d.stages.filter((s) => !s.rows.length || !f(s.name) || !f(s.desc) || s.desc.length > 90 || !keys.has(s.g)).length;
  const rows = d.stages.flatMap((s) => s.rows);
  const missing = rows.filter((r) => !f(r.p)).length + rows.filter((r) => !f(r.src ?? "")).length;
  const sums: Record<string, number> = {};
  rows.forEach((r) => { sums[r.tk] = (sums[r.tk] ?? 0) + (parsePct(r.p) || 0); });
  const over = Object.values(sums).some((v) => v > 100);
  return [
    ["Identitas & tahap utama lengkap", d.name.trim().length >= 3 && f(d.description) && d.description.length <= 160 && d.drivers.some(f) && groupsOk],
    [bad ? `${bad} tahap belum lengkap` : "Tiap tahap punya nama, deskripsi & emiten", d.stages.length > 0 && bad === 0],
    ["Porsi & sumber terisi", missing === 0],
    ["Total porsi per emiten ≤ 100%", !over],
  ];
}
