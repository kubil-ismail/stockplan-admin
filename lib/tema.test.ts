import assert from "node:assert/strict";
import { checklist, EMPTY_SECTOR_MAP, fromForm, sectorMapFor, moveEmiten, moveStage, parsePct, readiness, removeEmiten, stagesOf, toForm, validateTema, type Stage } from "./tema.ts";

const S: Stage[] = [
  { id: 1, name: "Hulu", g: "g1", desc: "d", rows: [{ tk: "PGEO", p: "100" }] },
  { id: 2, name: "", g: "g1", desc: "", rows: [] },
];
let r = moveEmiten(S, "BREN", null, 1);
assert.ok("stages" in r && r.stages[0].rows.length === 2);
r = moveEmiten(S, "PGEO", null, 1);
assert.ok("error" in r && /sudah ada/.test(r.error)); // no duplicate in one stage
r = moveEmiten(S, "PGEO", 1, 2);
assert.ok("stages" in r && r.stages[0].rows.length === 0 && r.stages[1].rows[0].p === "100"); // keeps the share
r = removeEmiten(S, "PGEO", 1);
assert.ok("stages" in r && r.stages[0].rows.length === 0);
assert.deepEqual(moveStage(S, 1, 2)?.map((s) => s.id), [2, 1]);
assert.equal(moveStage(S, 1, 1), null);
assert.deepEqual(stagesOf(S, "PGEO"), [1]);
assert.equal(readiness(19, 21), 90);

assert.equal(parsePct(""), null);
assert.equal(parsePct("12,5"), 12.5);
assert.ok(Number.isNaN(parsePct("abc")));

// API form <-> builder state keeps everything, and an unfinished draft fails the checks.
const form = {
  name: "Energi", sectorSlug: "energi", description: "Satu kalimat.", drivers: ["Harga"],
  groups: [{ key: "hulu", title: "Hulu", description: "Menggali", icon: "mine", color: "amber" }],
  sectorMap: { subsectorId: "sub-1", icon: "sun", dataStatus: "ready" as const, updateNote: "Data baru" },
  stages: [{ name: "Tambang", groupKey: "hulu", description: "Menggali batu bara", rows: [{ ticker: "BUMI", pct: 12.5, source: "LK 2025" }, { ticker: "ITMG", pct: null, source: "" }] }],
};
const d = fromForm(form);
assert.equal(d.stages[0].rows[0].p, "12,5");
assert.deepEqual(toForm(d), form);
assert.deepEqual(checklist(d).map((c) => c[1]), [true, true, false, true]); // ITMG has no share/source
assert.deepEqual(checklist({ ...d, stages: [] }).map((c) => c[1]), [true, false, true, true]);
assert.deepEqual(Object.keys(validateTema({ ...d, name: "ab", sectorSlug: "" })), ["name", "sectorSlug"]);
assert.deepEqual(validateTema({ ...d, stages: [{ ...d.stages[0], rows: [{ tk: "BUMI", p: "150" }] }] }), { stages: "Porsi harus angka 0–100" });
assert.deepEqual(validateTema(d), {});
assert.deepEqual(validateTema({ ...d, sectorMap: EMPTY_SECTOR_MAP }, true), { subsectorId: "Pilih sub-sektor." }); // creating needs a sub-sector
assert.deepEqual(validateTema({ ...d, sectorMap: EMPTY_SECTOR_MAP }), {}); // editing a legacy draft does not
// Sector map: round-trips, 200-char note limit, and a sub-sector of another sector is dropped when the sector changes.
assert.deepEqual(d.sectorMap, form.sectorMap);
assert.deepEqual(validateTema({ ...d, sectorMap: { ...d.sectorMap, updateNote: "x".repeat(201) } }), { updateNote: "Catatan maksimal 200 karakter" });
const SEC = [{ slug: "energi", name: "Energi", subsectors: [{ id: "sub-1", name: "Energi Alternatif" }] }, { slug: "keuangan", name: "Keuangan", subsectors: [] }];
assert.equal(sectorMapFor(d.sectorMap, "energi", SEC).subsectorId, "sub-1");
assert.equal(sectorMapFor(d.sectorMap, "keuangan", SEC).subsectorId, "");
assert.equal(sectorMapFor(EMPTY_SECTOR_MAP, "", SEC).subsectorId, "");
console.log("tema ok");
