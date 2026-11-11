import type { Metadata } from "next";
import { Inbox } from "@/components/admin/inbox";

export const metadata: Metadata = { title: "StockPlan Admin — Masukan & laporan" };

export default function AdminMasukanPage() {
  return <Inbox />;
}
