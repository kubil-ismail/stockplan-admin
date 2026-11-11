"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCompany, describeError } from "@/lib/admin-companies";
import { Button } from "@/components/ui/button";

/** "Hapus emiten" with an inline confirmation. `onDeleted` runs before leaving the page (e.g. to drop the stored draft). */
export function DeleteCompany({ ticker, published, onDeleted }: { ticker: string; published: boolean; onDeleted?: () => void }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    const r = await deleteCompany(ticker);
    if (!r.ok) { setBusy(false); setConfirm(false); return void toast(describeError(r.error)); }
    onDeleted?.();
    toast(`${ticker} dihapus`); // COPY: perlu review
    router.replace("/admin/emiten");
  };

  // COPY: perlu review (tombol dan konfirmasi hapus)
  return confirm ? (
    <span role="alertdialog" aria-label={`Konfirmasi hapus ${ticker}`} className="flex flex-wrap items-center gap-2 text-[13px]">
      <span>Hapus {ticker}{published ? " dari aplikasi" : ""}? Watchlist dan pengingat pengguna ikut terhapus. Tidak bisa dikembalikan.</span>
      <Button type="button" variant="destructive-outline" size="sm" disabled={busy} onClick={() => void remove()}>Ya, hapus</Button>
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setConfirm(false)}>Batal</Button>
    </span>
  ) : <Button type="button" variant="destructive-outline" onClick={() => setConfirm(true)}><Trash2 aria-hidden />Hapus emiten</Button>;
}
