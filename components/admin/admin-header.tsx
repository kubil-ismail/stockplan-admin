"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ADMIN_NAV } from "./admin-sidebar";

// shortcut: signed-in user is a placeholder from the design; read it from the admin session once auth is real.
const USER = { name: "Rina Putri", role: "Admin data" };

export function AdminHeader() {
  const pathname = usePathname();
  const items = ADMIN_NAV.flatMap((g) => g.items);
  // longest matching nav entry, so /admin/emiten/BUMI still reads "Data emiten"
  const current = items.filter((i) => i.href !== "/admin" && (pathname === i.href || pathname.startsWith(i.href + "/"))).at(-1);

  return (
    <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:px-7">
      <SidebarTrigger className="md:hidden" aria-label="Buka menu navigasi" />
      <Breadcrumb>
        <BreadcrumbList className="text-[13px]">
          <BreadcrumbItem><BreadcrumbLink render={<Link href="/admin" />}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem><BreadcrumbPage>{current?.label ?? "Dashboard"}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2.5 leading-tight">
        <Avatar aria-hidden className="size-9">
          <AvatarFallback className="bg-foreground text-[13px] font-semibold text-primary">{USER.name[0]}</AvatarFallback>
        </Avatar>
        <div className="hidden flex-col sm:flex">
          <b className="text-[13.5px]">{USER.name}</b>
          <span className="text-xs text-muted-foreground">{USER.role}</span>
        </div>
      </div>
    </header>
  );
}
