import assert from "node:assert/strict";
import { dec, num, rp, scheduleError, stageIndex } from "./ipo.ts";

assert.equal(num("2.500.000.000"), 2.5e9);
assert.equal(dec(1.13, 2), "1,13");
assert.equal(rp(450 * 2.5e9), "Rp1,13 T");
assert.match(scheduleError({ bbS: "2026-10-20", bbE: "2026-10-19", ojk: "", puS: "", puE: "", jt: "", ls: "" }), /akhir bookbuilding/);
const st: [string, string, string][] = [["a", "2026-10-20", "2026-10-27"], ["b", "2026-10-30", "2026-10-30"], ["c", "2026-11-04", "2026-11-10"]];
assert.equal(stageIndex(st, "2026-11-06"), 2);
assert.equal(stageIndex(st, "2026-10-28"), 0.5);
console.log("ipo ok");
