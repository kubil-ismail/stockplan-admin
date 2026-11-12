// Typed client for GET /admin/api/dashboard (backend: controllers/adminDashboardController.js). A block the role may not see is null (or dropped from `queue`).
import { adminGet } from "./admin-api";
import type { JobStatus } from "./admin-sync";

export type QueueKey = "bei_changes" | "company_review" | "theme_review" | "no_source" | "ipo_new" | "no_summary";
export type QueueLevel = "high" | "medium" | "low";
export type DashboardResponse = {
  now: string; lastSyncAt: string | null;
  kpis: {
    companies: { total: number; ipoThisMonth: number } | null;
    ready: { count: number; percent: number } | null;
    review: { count: number; fromReports: number | null } | null;
    users: { total: number; newThisWeek: number } | null;
  };
  queue: { key: QueueKey; level: QueueLevel; levelLabel: string; title: string; sub: string; count: number; href: string }[];
  sync: { jobs: { key: string; name: string; lastFinishedAt: string | null; status: JobStatus; failed: number; note: string; failedTickers: string[]; failMessage: string | null }[] } | null;
  coverage: { threshold: number; items: { slug: string; name: string; stageCount: number; status: string; statusLabel: string; ready: number; total: number; percent: number; openable: boolean }[] } | null;
  activity: { id: string; at: string; actor: string; verb: string; target: string; rest: string }[] | null;
};

export const getDashboard = () => adminGet<DashboardResponse>("/dashboard");

/** Icon per queue item type is chosen in the view; the tone follows the level from the server. */
export const LEVEL_TONE: Record<QueueLevel, "danger" | "warning" | "neutral"> = { high: "danger", medium: "warning", low: "neutral" };
