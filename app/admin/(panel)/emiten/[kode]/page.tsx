import type { Metadata } from "next";
import { CompanyEditor } from "@/components/admin/company-editor";

// Static title: a params-based generateMetadata() blocks prerendering under cacheComponents.
export const metadata: Metadata = { title: "StockPlan Admin — Edit emiten" };

export default async function AdminEmitenEditPage({ params }: PageProps<"/admin/emiten/[kode]">) {
  const { kode } = await params;
  return <CompanyEditor kode={kode.toUpperCase()} />;
}
