"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getTheme, listThemes, type ThemeSector, type ThemeView } from "@/lib/admin-themes";
import type { ApiError } from "@/lib/admin-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { TemaBuilder } from "./tema-builder";

type Loaded = { key: string; sectors?: ThemeSector[]; view?: ThemeView; error?: ApiError };

/** Loads the sector list (and the theme when `slug` is given), then shows the builder. */
export function TemaEditor({ slug }: { slug?: string }) {
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${slug ?? ""}|${reload}`;

  useEffect(() => {
    let live = true;
    // Sectors (with sub-sectors) come with the theme itself; a new theme borrows them from the list.
    const done = (r: { ok: true; data: ThemeView | { sectors: ThemeSector[] } } | { ok: false; error: ApiError }) => {
      if (!live) return;
      if (!r.ok) return setLoaded({ key, error: r.error });
      setLoaded({ key, sectors: r.data.sectors, view: "form" in r.data ? r.data : undefined });
    };
    void (slug ? getTheme(slug) : listThemes()).then(done);
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
