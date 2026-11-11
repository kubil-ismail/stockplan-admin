import { MODULES_DATA, ROLES_DATA } from "./rbac-data.ts";

export type Action = "view" | "edit" | "publish" | "delete";
export type ModuleKey = "dash" | "em" | "tm" | "usr" | "fb" | "log" | "sync" | "set" | "acc";
export type AdminModule = { key: ModuleKey; name: string; desc: string; availableActions: Action[]; superOnly: boolean };
export type Perms = Record<string, Action[]>;
export type Role = { id: string; name: string; system: boolean; desc: string; sub: string; perms: Perms };

export const ACTIONS: [Action, string][] = [["view", "Lihat"], ["edit", "Ubah"], ["publish", "Terbitkan"], ["delete", "Hapus / tangguhkan"]];
export const MODULES = MODULES_DATA;
const SUB: Record<string, string> = { super: "Semua izin, termasuk akses", data: "Emiten, tema, sinkron", tema: "Tema dan rantai nilai saja", support: "Masukan dan pengguna", view: "Hanya melihat" };
export const ROLES: Role[] = ROLES_DATA.map((r) => ({ ...r, sub: SUB[r.id] ?? "" }));

/** Single source for both the UI (hide/disable) and the API middleware (reject). Unknown role or module => false. */
export function can(roleId: string, module: ModuleKey, action: Action, roles: Role[] = ROLES) {
  const r = roles.find((x) => x.id === roleId);
  const m = MODULES.find((x) => x.key === module);
  return !!r && !!m && m.availableActions.includes(action) && (r.perms[module] ?? []).includes(action);
}

/** Toggle one cell. Any action needs "view"; removing "view" removes every action of that module. */
export function togglePerm(current: Action[], action: Action, available: Action[]): Action[] {
  if (!available.includes(action)) return current;
  const on = new Set(current);
  if (on.has(action)) on.delete(action); else on.add(action);
  if (on.has(action) && action !== "view") on.add("view");
  if (!on.has("view")) on.clear();
  return ACTIONS.map(([a]) => a).filter((a) => on.has(a));
}

/** Names of super-only modules a role can change (anything beyond "view"). */
export const sensitiveModules = (perms: Perms) =>
  MODULES.filter((m) => m.superOnly && (perms[m.key] ?? []).some((a) => a !== "view")).map((m) => m.name);
