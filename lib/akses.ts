// shortcut: sample team from the design; replace with GET /admin/api/members. "u1" (Arief) is the signed-in super admin.
export type MemberStatus = "act" | "inv" | "off";
export type Member = { id: string; name: string; email: string; role: string; fa: boolean; last: string; sub: string; status: MemberStatus; color: string };
export const ME = "u1";
export const TEAM: Member[] = (
  [
    ["u1", "Arief Santoso", "arief@stockplan.id", "super", true, "Hari ini, 09.58", "Chrome · Jakarta", "act", "#92400E"],
    ["u2", "Rina Putri", "rina@stockplan.id", "data", true, "Hari ini, 10.42", "Chrome · Jakarta", "act", "#1C1917"],
    ["u3", "Dimas Arya", "dimas@stockplan.id", "data", true, "Hari ini, 08.31", "3 gagal masuk pagi ini", "act", "#57534E"],
    ["u4", "Nadia Halim", "nadia@stockplan.id", "support", true, "Kemarin, 17.10", "Safari · Jakarta", "act", "#BE185D"],
    ["u5", "Kevin Tanoto", "kevin@stockplan.id", "tema", false, "—", "Undangan dikirim 5 Nov", "inv", "#1D4ED8"],
    ["u6", "Yudi Prakoso", "yudi@stockplan.id", "view", false, "12 Sep 2026", "Dinonaktifkan 1 Okt", "off", "#78716C"],
  ] as const
).map(([id, name, email, role, fa, last, sub, status, color]) => ({ id, name, email, role, fa, last, sub, status, color }));

export const WORK_EMAIL = /^[^@\s]+@stockplan\.id$/i;

/** The last active super admin can't be demoted or deactivated (guards against locking everyone out). */
export const activeSupers = (team: Pick<Member, "role" | "status">[]) => team.filter((m) => m.role === "super" && m.status === "act").length;
export const isLastSuper = (m: Pick<Member, "role" | "status">, team: Pick<Member, "role" | "status">[]) => m.role === "super" && m.status === "act" && activeSupers(team) <= 1;
