import assert from "node:assert/strict";
import { histPoint, isBusy, jobBadge, shortDay } from "./sinkron.ts";

assert.deepEqual(histPoint(0, "5 Nov"), { f: 0, o: 100, t: "5 Nov: semua berhasil" });
assert.equal(histPoint(3, "6 Nov").t, "6 Nov: 3 emiten gagal");
assert.deepEqual(histPoint(30, "x"), { f: 100, o: 0, t: "x: 30 emiten gagal" }); // never overflows the bar
assert.equal(shortDay("2026-11-06"), "6 Nov");
assert.deepEqual(jobBadge("failed", 3), ["3 gagal", "warning"]);
assert.deepEqual(jobBadge("ok", 0), ["Berhasil", "success"]);
assert.ok(isBusy("running") && isBusy("queued") && !isBusy("never") && !isBusy("failed"));
console.log("sinkron ok");
