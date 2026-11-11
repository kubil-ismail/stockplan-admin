import assert from "node:assert/strict";
import { EVENTS, filterEvents, revertEvent } from "./riwayat.ts";

const f = { q: "", mod: "", who: "", range: "7" as const };
assert.equal(filterEvents(EVENTS, f).length, 14);
assert.equal(filterEvents(EVENTS, { ...f, range: "1" }).length, 7);
assert.equal(filterEvents(EVENTS, { ...f, who: "Rina" }).every((x) => x.who === "Rina"), true);
assert.ok(filterEvents(EVENTS, { ...f, q: "rp2,04" }).some((x) => x.id === "e1")); // searches inside diffs
const r = revertEvent(EVENTS[0], "Rina", "r1");
assert.deepEqual(r.diff[0], ["Laba bersih H1-2026", "Rp2,04 T", "Rp1,92 T"]); // before/after swapped
assert.equal(r.revertable, false);
console.log("riwayat ok");
