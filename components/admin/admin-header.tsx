"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./admin-sidebar";

// shortcut: signed-in user is a placeholder from the design; read it from the admin session once auth is real.
const USER = { name: "Rina Putri", role: "Admin data" };

export function AdminHeader() {
  const pathname = usePathname();
  const items = ADMIN_NAV.flatMap((g) => g.items);
  // longest matching nav entry, so /admin/emiten/BUMI still reads "Data emiten"
  const current = items.filter((i) => i.href !== "/admin" && (pathname === i.href || pathname.startsWith(i.href + "/"))).at(-1);

  return (
    <header className="flex items-center gap-3 border-b border-[#E7E5E4] bg-white px-7 py-3">
      <nav aria-label="Breadcrumb" className="text-[13px] text-[#716A65]">
        <Link href="/admin" className="hover:text-[#1C1917] hover:underline">Admin</Link>
        {" / "}
        <span className="text-[#1C1917]">{current?.label ?? "Dashboard"}</span>
      </nav>
      <div className="ml-auto flex items-center gap-2.5 leading-tight">
        <span aria-hidden className="inline-flex size-9 flex-none items-center justify-center rounded-full bg-[#1C1917] text-[13px] font-semibold text-[#FEA722]">
          {USER.name[0]}
        </span>
        <div className="flex flex-col">
          <b className="text-[13.5px]">{USER.name}</b>
          <span className="text-xs text-[#716A65]">{USER.role}</span>
        </div>
      </div>
    </header>
  );
}
