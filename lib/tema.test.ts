import assert from "node:assert/strict";
import { checklist, moveEmiten, moveStage, readiness, removeEmiten, stagesOf, type Stage } from "./tema.ts";

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
assert.equal(checklist({ name: "Energi", dup: false, stages: S, groupsOk: true }).filter((c) => !c[1]).length, 2);
console.log("tema ok");
