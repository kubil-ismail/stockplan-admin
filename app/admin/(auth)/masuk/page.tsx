import type { Metadata } from "next";
import { LogoMark } from "@/components/admin/logo-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "StockPlan Admin — Masuk" };

export default function AdminLoginPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F4] px-4 py-10 text-[15px] text-[#1C1917]"
      style={{ backgroundImage: "radial-gradient(#E7E5E4 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      <div className="mb-[22px] flex items-center gap-[9px] text-[17px] font-bold tracking-tight">
        <LogoMark width={26} height={22} />
        StockPlan
        <span className="rounded-md bg-[#1C1917] px-2 text-[11.5px] font-semibold leading-[22px] text-white">Admin</span>
      </div>
      <LoginForm />
      <p className="mt-[18px] flex max-w-[420px] items-start gap-1.5 text-[12.5px] leading-normal text-[#716A65]">
        <svg aria-hidden className="mt-[3px] flex-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        Setiap percobaan masuk dicatat di Riwayat perubahan beserta alamat IP dan perangkatnya.
      </p>
    </div>
  );
}
