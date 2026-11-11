import type { Metadata } from "next";
import { TemaEditor } from "@/components/admin/tema-editor";

// Static title: a params-based generateMetadata() blocks prerendering under cacheComponents.
export const metadata: Metadata = { title: "StockPlan Admin — Edit tema" };

export default async function AdminTemaEditPage({ params }: PageProps<"/admin/tema/[slug]">) {
  const { slug } = await params;
  return <TemaEditor slug={slug} />;
}
