import type { Metadata } from "next";
import { IpoForm } from "@/components/admin/ipo-form";

export const metadata: Metadata = { title: "StockPlan Admin — Tambah emiten IPO" };

export default function AdminEmitenIpoPage() {
  return <IpoForm />;
}
