import assert from "node:assert/strict";
import { checklist, fromForm, moveEmiten, moveStage, parsePct, readiness, removeEmiten, stagesOf, toForm, type Stage } from "./tema.ts";

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
  stages: [{ name: "Tambang", groupKey: "hulu", description: "Menggali batu bara", rows: [{ ticker: "BUMI", pct: 12.5, source: "LK 2025" }, { ticker: "ITMG", pct: null, source: "" }] }],
};
const d = fromForm(form);
assert.equal(d.stages[0].rows[0].p, "12,5");
assert.deepEqual(toForm(d), form);
assert.deepEqual(checklist(d).map((c) => c[1]), [true, true, false, true]); // ITMG has no share/source
assert.deepEqual(checklist({ ...d, stages: [] }).map((c) => c[1]), [true, false, true, true]);
console.log("tema ok");
