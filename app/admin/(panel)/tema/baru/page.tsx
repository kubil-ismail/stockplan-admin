import type { Metadata } from "next";
import { TemaBuilder } from "@/components/admin/tema-builder";

export const metadata: Metadata = { title: "StockPlan Admin — Tambah tema" };

export default function AdminTemaBaruPage() {
  return <TemaBuilder />;
}
