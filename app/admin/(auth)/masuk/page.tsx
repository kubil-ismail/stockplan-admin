import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/admin/logo-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "StockPlan Admin — Masuk" };

export default function AdminLoginPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-10 text-[15px] text-foreground"
      style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      <div className="mb-[22px] flex items-center gap-[9px] text-[17px] font-bold tracking-tight">
        <LogoMark width={26} height={22} />
        StockPlan
        <Badge variant="secondary" className="h-[22px] rounded-md text-[11.5px] font-semibold">Admin</Badge>
      </div>
      <LoginForm />
      <p className="mt-[18px] flex max-w-[420px] items-start gap-1.5 text-[12.5px] leading-normal text-muted-foreground">
        <svg aria-hidden className="mt-[3px] flex-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        Setiap percobaan masuk dicatat di Riwayat perubahan beserta alamat IP dan perangkatnya.
      </p>
    </div>
  );
}
