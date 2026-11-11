import assert from "node:assert/strict";
import { histPoint, jobOk } from "./sinkron.ts";

assert.equal(jobOk("mgmt", 3, false), false);
assert.equal(jobOk("mgmt", 0, false), true);
assert.equal(jobOk("mgmt", 3, true), true);
assert.equal(jobOk("px", 3, false), true); // only management has failures
assert.deepEqual(histPoint(0, "5 Nov"), { f: 0, o: 100, t: "5 Nov: semua berhasil" });
assert.equal(histPoint(3, "6 Nov").t, "6 Nov: 3 emiten gagal");
console.log("sinkron ok");
