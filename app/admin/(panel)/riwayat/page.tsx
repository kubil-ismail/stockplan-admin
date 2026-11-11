import type { Metadata } from "next";
import { AuditLog } from "@/components/admin/audit-log";

export const metadata: Metadata = { title: "StockPlan Admin — Riwayat perubahan" };

export default function AdminRiwayatPage() {
  return <AuditLog />;
}
