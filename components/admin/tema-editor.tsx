"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { listCompanies } from "@/lib/admin-companies";
import { getTheme, type ThemeView } from "@/lib/admin-themes";
import type { ApiError } from "@/lib/admin-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { TemaBuilder } from "./tema-builder";

type Loaded = { key: string; sectors?: { slug: string; name: string }[]; view?: ThemeView; error?: ApiError };

/** Loads the sector list (and the theme when `slug` is given), then shows the builder. */
export function TemaEditor({ slug }: { slug?: string }) {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${slug ?? ""}|${reload}`;

  useEffect(() => {
    let live = true;
    void Promise.all([listCompanies({ pageSize: 1 }), slug ? getTheme(slug) : Promise.resolve(null)]).then(([l, t]) => {
      if (!live) return;
      if (!l.ok) return setLoaded({ key, error: l.error });
      if (t && !t.ok) return setLoaded({ key, error: t.error });
      setLoaded({ key, sectors: l.data.sectors, view: t?.data });
    });
    return () => { live = false; };
  }, [key, slug]);

  if (!loaded || loaded.key !== key) {
    return (
      <div role="status" aria-busy="true" aria-label="Memuat tema" className="flex flex-col gap-5">
        <Skeleton className="h-10 w-72" /><Skeleton className="h-48" /><Skeleton className="h-64" />
      </div>
    );
  }
  if (loaded.error) {
    const notFound = loaded.error.status === 404;
    return (
      <Empty className="py-16">
        <EmptyHeader><EmptyTitle>{notFound ? "Tema tidak ditemukan" : "Tema tidak bisa dimuat"}</EmptyTitle><EmptyDescription>{loaded.error.message}</EmptyDescription></EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Link href="/admin/tema" className={buttonVariants({ variant: "outline" })}>Ke daftar tema</Link>
          {!notFound && <Button variant="outline" onClick={() => setReload((n) => n + 1)}><RefreshCw aria-hidden />Coba lagi</Button>}
        </EmptyContent>
      </Empty>
    );
  }
  return <TemaBuilder view={loaded.view} sectors={loaded.sectors ?? []} />;
}
