import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "StockPlan Admin — Pengaturan aplikasi" };

// SettingsForm reads ?tab= via useSearchParams, which needs a Suspense boundary to keep the page prerenderable.
export default function AdminPengaturanPage() {
  return (
    <Suspense fallback={null}>
      <SettingsForm />
    </Suspense>
  );
}
