import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// usePathname() is runtime data on dynamic routes (/admin/emiten/[kode]), so both users sit in Suspense;
// the fallbacks keep the sidebar width / header height so nothing jumps.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-stretch bg-white text-[15px] text-[#1C1917]">
      <Suspense fallback={<aside aria-hidden className="h-screen w-60 flex-none border-r border-[#E7E5E4] bg-white" />}>
        <AdminSidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col bg-[#FAFAF9]">
        <Suspense fallback={<header aria-hidden className="h-[61px] border-b border-[#E7E5E4] bg-white" />}>
          <AdminHeader />
        </Suspense>
        <main aria-label="Konten halaman" className="flex-1 px-7 pb-12 pt-6">{children}</main>
      </div>
    </div>
  );
}
