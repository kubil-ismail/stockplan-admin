import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessManager } from "@/components/admin/access-manager";

export const metadata: Metadata = { title: "StockPlan Admin — Akses & peran" };

// AccessManager reads ?tab= via useSearchParams, which needs a Suspense boundary to keep the page prerenderable.
export default function AdminAksesPage() {
  return (
    <Suspense fallback={null}>
      <AccessManager />
    </Suspense>
  );
}
