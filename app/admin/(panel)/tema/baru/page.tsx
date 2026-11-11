import type { Metadata } from "next";
import { TemaEditor } from "@/components/admin/tema-editor";

export const metadata: Metadata = { title: "StockPlan Admin — Tambah tema" };

export default function AdminTemaBaruPage() {
  return <TemaEditor />;
}
