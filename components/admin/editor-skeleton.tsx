import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton as Sk } from "@/components/ui/skeleton";
import { EditorShell } from "./form-ui";

const SkCard = ({ children }: { children: React.ReactNode }) => (
  <Card>
    <CardHeader className="gap-1.5"><Sk className="h-[18px] w-40" /><Sk className="h-[13px] w-[360px] max-w-full" /></CardHeader>
    <CardContent className="flex flex-col gap-4">{children}</CardContent>
  </Card>
);

/** Same shape as the emiten editors (header, TOC, cards, rail); shell stays visible while data loads. */
export function EditorSkeleton({ label, variant }: { label: string; variant: "edit" | "ipo" }) {
  const toc = Array.from({ length: variant === "edit" ? 8 : 6 });
  const header = (
    <div className="flex flex-wrap items-center gap-4">
      <Sk className="size-14 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2.5"><Sk className="h-[26px] w-36" /><Sk className="h-[22px] w-[90px] rounded-full" /><Sk className="h-[22px] w-[90px] rounded-full" /></div>
        <Sk className="h-3.5 w-[300px] max-w-full" />
      </div>
      <div className="flex gap-2.5"><Sk className="h-10 w-[150px] rounded-lg" /><Sk className="h-10 w-[120px] rounded-lg" /><Sk className="h-10 w-[110px] rounded-lg" /></div>
    </div>
  );
  return (
    <div aria-busy="true" aria-label={label} role="status">
      <EditorShell header={header} checks={[]} skeleton={toc.length}>
        <SkCard>
          <div className="flex flex-wrap gap-5">
            <div className="flex w-[132px] flex-col gap-2"><Sk className="size-24 rounded-full" /><Sk className="h-8 w-[100px] rounded-lg" /></div>
            <div className="flex min-w-[260px] flex-1 flex-col gap-3.5">
              <div className="grid gap-3.5 sm:grid-cols-[1fr_140px]"><Sk className="h-11 rounded-lg" /><Sk className="h-11 rounded-lg" /></div>
              <Sk className="h-9 w-72 rounded-[10px]" />
            </div>
          </div>
        </SkCard>
        <SkCard><div className="grid gap-3.5 sm:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex flex-col gap-2"><Sk className="h-[13px] w-[70px]" /><Sk className="h-5 w-24" /><Sk className="h-10 rounded-lg" /></div>)}</div></SkCard>
        <SkCard><Sk className="h-10 rounded-lg" /><Sk className="h-[120px] rounded-lg" /></SkCard>
      </EditorShell>
    </div>
  );
}
