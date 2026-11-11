import type { Metadata } from "next";
import { SyncStatus } from "@/components/admin/sync-status";

export const metadata: Metadata = { title: "StockPlan Admin — Sinkron data BEI" };

export default function AdminSinkronPage() {
  return <SyncStatus />;
}
