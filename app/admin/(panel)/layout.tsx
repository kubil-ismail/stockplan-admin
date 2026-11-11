import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminSession } from "@/components/admin/session";
import { StoreProvider } from "@/components/admin/store-provider";

// usePathname() is runtime data on dynamic routes (/admin/emiten/[kode]), so both users sit in Suspense;
// the fallbacks keep the sidebar width / header height so nothing jumps.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
    <AdminSession>
    <SidebarProvider className="text-[15px]">
      <Suspense fallback={<div aria-hidden className="hidden w-(--sidebar-width) flex-none border-r border-border bg-sidebar md:block" />}>
        <AdminSidebar />
      </Suspense>
      <SidebarInset aria-label="Konten halaman" className="min-w-0 bg-accent">
        <Suspense fallback={<div aria-hidden className="h-[61px] border-b border-border bg-background" />}>
          <AdminHeader />
        </Suspense>
        <div className="flex-1 px-4 pt-6 pb-12 md:px-7">{children}</div>
      </SidebarInset>
    </SidebarProvider>
    </AdminSession>
    </StoreProvider>
  );
}
