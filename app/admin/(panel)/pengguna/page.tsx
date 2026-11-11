import type { Metadata } from "next";
import { UserManager } from "@/components/admin/user-manager";

export const metadata: Metadata = { title: "StockPlan Admin — Pengguna" };

export default function AdminPenggunaPage() {
  return <UserManager />;
}
