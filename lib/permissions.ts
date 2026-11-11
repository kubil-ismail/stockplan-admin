export type Action = "view" | "edit" | "publish" | "delete";
export type Perms = Record<string, Action[]>;
export type ModuleDef = { key: string; name: string; desc: string; actions: Action[]; sensitive: boolean };

export const ACTIONS: [Action, string][] = [["view", "Lihat"], ["edit", "Ubah"], ["publish", "Terbitkan"], ["delete", "Hapus / tangguhkan"]];

/** Toggle one cell. Any action needs "view"; removing "view" removes every action of that module. The API enforces the same rule. */
export function togglePerm(current: Action[], action: Action, available: Action[]): Action[] {
  if (!available.includes(action)) return current;
  const on = new Set(current);
  if (on.has(action)) on.delete(action); else on.add(action);
  if (on.has(action) && action !== "view") on.add("view");
  if (!on.has("view")) on.clear();
  return ACTIONS.map(([a]) => a).filter((a) => on.has(a));
}

/** Names of sensitive modules a role can change (anything beyond "view"). */
export const sensitiveModules = (perms: Perms, modules: ModuleDef[]) =>
  modules.filter((m) => m.sensitive && (perms[m.key] ?? []).some((a) => a !== "view")).map((m) => m.name);
