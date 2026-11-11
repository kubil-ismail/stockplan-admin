"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ExternalLink, History, Inbox, LayoutDashboard, LogOut, RefreshCw, Settings, Share2, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { LogoMark } from "./logo-mark";
import { useAdmin } from "./session";

type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

// shortcut: badge counts are static placeholders from the design; feed from the API when it exists.
export const ADMIN_NAV: { section?: string; items: Item[] }[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Data",
    items: [
      { href: "/admin/emiten", label: "Data emiten", icon: Building2, badge: 37 },
      { href: "/admin/tema", label: "Tema & Industri", icon: Share2 },
    ],
  },
  {
    section: "Operasional",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: Users },
      { href: "/admin/masukan", label: "Masukan & laporan", icon: Inbox, badge: 18 },
    ],
  },
  {
    section: "Sistem",
    items: [
      { href: "/admin/riwayat", label: "Riwayat perubahan", icon: History },
      { href: "/admin/sinkron", label: "Sinkron data BEI", icon: RefreshCw },
      { href: "/admin/akses", label: "Akses & peran", icon: ShieldCheck },
      { href: "/admin/pengaturan", label: "Pengaturan aplikasi", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  const { setOpenMobile } = useSidebar();
  const { logout } = useAdmin();
  const close = () => setOpenMobile(false);

  return (
    <Sidebar aria-label="Navigasi admin" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pt-4 pb-1">
        <Link href="/admin" onClick={close} aria-label="StockPlan Admin, ke dashboard" className="flex items-center gap-2 rounded-lg px-2.5 pt-1.5 pb-3 text-foreground">
          <LogoMark width={22} height={19} />
          <b className="text-[15px] font-bold tracking-tight">StockPlan</b>
          <Badge variant="secondary" className="ml-auto rounded-md text-[11px] font-semibold">Admin</Badge>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-1">
        {ADMIN_NAV.map((g) => (
          <SidebarGroup key={g.section ?? "top"} className="py-0">
            {g.section && <SidebarGroupLabel className="mt-3 h-7 text-[11px] font-semibold tracking-[.06em] text-muted-foreground uppercase">{g.section}</SidebarGroupLabel>}
            <SidebarMenu className="gap-0.5">
              {g.items.map(({ href, label, icon: Icon, badge }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton isActive={isActive(href)} aria-current={isActive(href) ? "page" : undefined} className="rounded-lg" render={<Link href={href} onClick={close} />}>
                    <Icon aria-hidden strokeWidth={1.8} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                  {badge != null && <SidebarMenuBadge className="top-2.5! right-2 rounded-full bg-sp-amber-bg px-[7px] text-[11.5px] font-semibold text-sp-amber-text">{badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-3 pb-4">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem><SidebarMenuButton className="rounded-lg" render={<Link href="/beranda" onClick={close} />}><ExternalLink aria-hidden strokeWidth={1.8} /><span>Buka aplikasi</span></SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton className="rounded-lg" onClick={() => { close(); void logout(); }}><LogOut aria-hidden strokeWidth={1.8} /><span>Keluar</span></SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
