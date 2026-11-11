"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ExternalLink, History, Inbox, LayoutDashboard, LogOut, RefreshCw, Settings, Share2, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "./logo-mark";

type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

// shortcut: badge counts are static placeholders from the design; feed from the API when it exists.
export const ADMIN_NAV: { section?: string; items: Item[] }[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Data",
    items: [
      { href: "/admin/emiten", label: "Data emiten", icon: Building2, badge: 37 },
      { href: "/admin/tema", label: "Tema & rantai nilai", icon: Share2 },
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

const nv = "flex min-h-10 items-center gap-2.5 rounded-lg border px-2.5 text-sm";

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  const cls = (on: boolean) =>
    `${nv} ${on ? "border-[#E7E5E4] bg-white font-semibold text-[#1C1917] shadow-sm" : "border-transparent text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#1C1917]"}`;

  return (
    <aside aria-label="Navigasi admin" className="sticky top-0 flex h-screen w-60 flex-none flex-col gap-0.5 overflow-y-auto border-r border-[#E7E5E4] bg-white px-3 py-4">
      <Link href="/admin" aria-label="StockPlan Admin, ke dashboard" className="flex items-center gap-2 px-2.5 pb-[18px] pt-1.5">
        <LogoMark width={22} height={19} />
        <b className="text-[15px] font-bold tracking-tight">StockPlan</b>
        <span className="ml-auto rounded-md bg-[#1C1917] px-[7px] text-[11px] font-semibold leading-5 text-white">Admin</span>
      </Link>
      {ADMIN_NAV.map((g) => (
        <div key={g.section ?? "top"} className="flex flex-col gap-0.5">
          {g.section && (
            <span className="px-2.5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[.06em] text-[#716A65]">{g.section}</span>
          )}
          {g.items.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={cls(isActive(href))}>
              <Icon aria-hidden size={18} strokeWidth={1.8} />
              {label}
              {badge != null && (
                <i className="ml-auto rounded-full bg-[#FFF4E2] px-[7px] text-[11.5px] font-semibold not-italic leading-5 text-[#92400E]">{badge}</i>
              )}
            </Link>
          ))}
        </div>
      ))}
      <div className="mt-auto flex flex-col gap-0.5 pt-6">
        <Link href="/beranda" className={cls(false)}><ExternalLink aria-hidden size={16} strokeWidth={1.8} />Buka aplikasi</Link>
        <Link href="/admin/masuk" className={cls(false)}><LogOut aria-hidden size={16} strokeWidth={1.8} />Keluar</Link>
      </div>
    </aside>
  );
}
