import type { Metadata } from "next";
import { TemaList } from "@/components/admin/tema-list";

export const metadata: Metadata = { title: "StockPlan Admin — Tema & rantai nilai" };

export default function AdminTemaPage() {
  return <TemaList />;
}
