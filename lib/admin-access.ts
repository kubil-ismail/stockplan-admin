// Typed client for /admin/api/access (backend: controllers/adminAccessController.js, lib/adminAccess.js, lib/adminRoles.js).
import { adminGet, adminPatch, adminPost, adminPut } from "./admin-api";
import type { ModuleDef, Perms } from "./permissions";

export type MemberStatus = "active" | "invited" | "disabled";
export type Member = {
  id: string; name: string; email: string; me: boolean;
  role: { id: string; name: string }; roleLocked: boolean; roleLockReason: string | null;
  twoFactor: "active" | "pending" | "off";
  lastLogin: { at: string; device: string } | null; failedToday: number;
  status: MemberStatus; statusLabel: string;
  invite: { sentAt: string | null; expiresAt: string | null; expired: boolean; by: string | null } | null;
  disabledAt: string | null;
  actions: { deactivate: boolean; resendInvite: boolean; reactivate: boolean };
};
export type Members = { members: Member[]; counts: { members: number; roles: number }; roleOptions: { id: string; name: string }[] };

export type Role = { id: string; name: string; summary: string | null; description: string | null; system: boolean; locked: boolean; memberCount: number; perms: Perms; sensitive: string[] };
export type Roles = { modules: ModuleDef[]; roles: Role[] };

export const listMembers = () => adminGet<Members>("/access/members");
export const listRoles = () => adminGet<Roles>("/access/roles");

const m = (id: string) => `/access/members/${encodeURIComponent(id)}`;
type One = { member: Member };
export const inviteMember = (email: string, role: string) => adminPost<One>("/access/members/invite", { email, role });
export const changeRole = (id: string, role: string) => adminPatch<One>(m(id), { role });
export const deactivateMember = (id: string) => adminPost<One>(`${m(id)}/deactivate`);
export const reactivateMember = (id: string) => adminPost<One>(`${m(id)}/reactivate`);
export const resendInvite = (id: string) => adminPost<One>(`${m(id)}/resend-invite`);

export const createRole = (name: string, perms: Perms) => adminPost<{ role: Role }>("/access/roles", { name, perms });
export const saveRole = (id: string, perms: Perms) => adminPut<{ role: Role }>(`/access/roles/${encodeURIComponent(id)}`, { perms });
