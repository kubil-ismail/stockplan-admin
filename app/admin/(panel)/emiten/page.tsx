import type { Metadata } from "next";
import { EmitenTable } from "@/components/admin/emiten-table";

export const metadata: Metadata = { title: "StockPlan Admin — Data emiten" };

export default function AdminEmitenPage() {
  return <EmitenTable />;
}
