"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getCompany, listCompanies, type CompanySector, type EditView } from "@/lib/admin-companies";
import type { ApiError } from "@/lib/admin-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { EditorSkeleton } from "./editor-skeleton";
import { EmitenEditForm } from "./emiten-edit-form";
import { IpoForm } from "./ipo-form";

type Sectors = CompanySector[];
type Loaded = { key: string; sectors?: Sectors; view?: EditView; error?: ApiError };

/**
 * Loads what the editors need from the API, then shows the right one: no `kode` = add an IPO company;
 * an IPO company edits with the IPO form (its own checklist); everything else gets the full profile form.
 */
export function CompanyEditor({ kode }: { kode?: string }) {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${kode ?? ""}|${reload}`;

  useEffect(() => {
    let live = true;
    void Promise.all([listCompanies({ pageSize: 1 }), kode ? getCompany(kode) : Promise.resolve(null)]).then(([l, c]) => {
      if (!live) return;
      if (!l.ok) return setLoaded({ key, error: l.error });
      if (c && !c.ok) return setLoaded({ key, error: c.error });
      setLoaded({ key, sectors: l.data.sectors, view: c?.data });
    });
    return () => { live = false; };
  }, [key, kode]);

  if (!loaded || loaded.key !== key) return <EditorSkeleton variant={kode ? "edit" : "ipo"} label={kode ? "Memuat data emiten" : "Memuat form emiten IPO"} />;

  if (loaded.error) {
    const notFound = loaded.error.status === 404;
    return (
      <Empty className="py-16">
        <EmptyHeader><EmptyTitle>{notFound ? "Emiten tidak ditemukan" : "Data emiten tidak bisa dimuat"}</EmptyTitle><EmptyDescription>{loaded.error.message}</EmptyDescription></EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Link href="/admin/emiten" className={buttonVariants({ variant: "outline" })}>Ke daftar emiten</Link>
          {!notFound && <Button variant="outline" onClick={() => setReload((n) => n + 1)}><RefreshCw aria-hidden />Coba lagi</Button>}
        </EmptyContent>
      </Empty>
    );
  }

  const { sectors = [], view } = loaded;
  return !view || view.company.status === "ipo"
    ? <IpoForm view={view} sectors={sectors} />
    : <EmitenEditForm view={view} sectors={sectors} />;
}

