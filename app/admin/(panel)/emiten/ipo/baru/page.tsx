import type { Metadata } from "next";
import { CompanyEditor } from "@/components/admin/company-editor";

export const metadata: Metadata = { title: "StockPlan Admin — Tambah emiten IPO" };

export default function AdminEmitenIpoPage() {
  return <CompanyEditor />;
}
