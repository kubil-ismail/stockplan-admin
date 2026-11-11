// Pure helpers for the theme builder (value-chain stages with emiten rows). No React here so they can be tested.
export type Row = { tk: string; p: string };
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

export function checklist(a: { name: string; dup: boolean; stages: Stage[]; groupsOk: boolean }): [string, boolean][] {
  const emptyN = a.stages.filter((s) => !s.rows.length).length;
  const unnamed = a.stages.filter((s) => !s.name.trim() || !s.desc.trim() || s.desc.length > 90).length;
  return [
    ["Nama tema", a.name.trim().length >= 3 && !a.dup],
    ["Minimal 2 tahap", a.stages.length >= 2],
    [emptyN ? `${emptyN} tahap masih kosong` : "Tiap tahap ada emiten", a.stages.length > 0 && emptyN === 0],
    [unnamed ? `${unnamed} tahap belum ada nama/deskripsi` : "Nama & deskripsi tahap", unnamed === 0],
    ["Tahap utama lengkap", a.groupsOk],
  ];
}
