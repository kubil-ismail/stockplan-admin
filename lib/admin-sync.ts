// Typed client for /admin/api/sync (backend: controllers/adminSyncController.js, lib/sync.js). Crawler endpoints (/sync/agent/*) are not for the browser.
import { adminGet, adminPost } from "./admin-api";

export type JobStatus = "running" | "queued" | "failed" | "ok" | "never";
export type SyncJob = {
  key: string; name: string; description: string; schedule: string; nextRunAt: string | null;
  lastStartedAt: string | null; lastFinishedAt: string | null; summary: string; note: string; status: JobStatus; failed: number;
};
export type SyncFailure = { id: string; jobKey: string; jobName: string; ticker: string | null; message: string; log: string; at: string; retrying: boolean };
export type SyncConflict = {
  id: string; jobKey: string; ticker: string; section: string; field: string; reason: string; at: string;
  changes: { field: string; label: string; before: unknown; after: unknown }[];
};
export type SyncStatusResponse = {
  stats: { companies: number; lastFullSyncAt: string | null };
  jobs: SyncJob[]; failures: SyncFailure[]; conflicts: SyncConflict[];
  history: { date: string; failed: number }[];
};

export const getSync = () => adminGet<SyncStatusResponse>("/sync");
/** Queues a run for the crawler (it does not finish inside the request). No key = every job. */
export const runSync = (key?: string) => adminPost<{ message: string }>("/sync/run", key ? { key } : {});
export const retryFailure = (id: string) => adminPost<{ message: string }>(`/sync/failures/${encodeURIComponent(id)}/retry`);
export const resolveConflict = (id: string, use: "bei" | "team") => adminPost<{ message: string }>(`/sync/conflicts/${encodeURIComponent(id)}/resolve`, { use });
