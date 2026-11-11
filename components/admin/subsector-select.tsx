import type { CompanySector } from "@/lib/admin-companies";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

/** Sub-sektors of one sector; the stored value is the sub-sector name. */
export const subsectorsOf = (sectors: CompanySector[], slug: string) => sectors.find((s) => s.slug === slug)?.subsectors ?? [];

/** Switching sector keeps the sub-sector only if the new sector has it. */
export const subFor = (sectors: CompanySector[], slug: string, sub: string) => (subsectorsOf(sectors, slug).some((x) => x.name === sub) ? sub : "");

/** Dropdown of the chosen sector's sub-sektors (from the API). A saved value that is not in the list stays selectable so it is not silently lost. */
export function SubsectorSelect({ sectors, sector, value, onChange, id, label = "Subsektor", invalid }: {
  sectors: CompanySector[]; sector: string; value: string; onChange: (v: string) => void; id?: string; label?: string; invalid?: boolean;
}) {
  const options = subsectorsOf(sectors, sector);
  const legacy = value && !options.some((x) => x.name === value);
  return (
    <NativeSelect id={id} aria-label={label} aria-invalid={invalid} disabled={!sector} value={value} onChange={(e) => onChange(e.target.value)}>
      <NativeSelectOption value="">{sector ? "Pilih subsektor" : "Pilih sektor dulu"}</NativeSelectOption> {/* COPY: perlu review */}
      {options.map((x) => <NativeSelectOption key={x.id} value={x.name}>{x.name}</NativeSelectOption>)}
      {legacy && <NativeSelectOption value={value}>{value} (nilai lama)</NativeSelectOption>}
    </NativeSelect>
  );
}
