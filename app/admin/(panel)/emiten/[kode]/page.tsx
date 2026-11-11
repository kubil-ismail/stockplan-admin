import type { Metadata } from "next";
import { EmitenEditForm } from "@/components/admin/emiten-edit-form";

export async function generateMetadata({ params }: PageProps<"/admin/emiten/[kode]">): Promise<Metadata> {
  const { kode } = await params;
  return { title: `StockPlan Admin — Edit ${kode.toUpperCase()}` };
}

// shortcut: the form always loads BUMI's sample data; fetch GET /admin/api/companies/:kode and pass it in.
export default async function AdminEmitenEditPage({ params }: PageProps<"/admin/emiten/[kode]">) {
  const { kode } = await params;
  return <EmitenEditForm kode={kode.toUpperCase()} />;
}
