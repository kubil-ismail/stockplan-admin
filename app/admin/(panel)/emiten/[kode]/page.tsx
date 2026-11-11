import type { Metadata } from "next";
import { EmitenEditForm } from "@/components/admin/emiten-edit-form";

// Static title: a params-based generateMetadata() blocks prerendering under cacheComponents.
export const metadata: Metadata = { title: "StockPlan Admin — Edit emiten" };

// shortcut: the form always loads BUMI's sample data; fetch GET /admin/api/companies/:kode and pass it in.
export default async function AdminEmitenEditPage({ params }: PageProps<"/admin/emiten/[kode]">) {
  const { kode } = await params;
  return <EmitenEditForm kode={kode.toUpperCase()} />;
}
