import assert from "node:assert/strict";
import { fmtWhen } from "./format.ts";

const now = new Date(2026, 10, 6, 12, 0); // 6 Nov 2026, local time
assert.equal(fmtWhen(new Date(2026, 10, 6, 9, 5).toISOString(), now), "Hari ini, 09.05");
assert.equal(fmtWhen(new Date(2026, 10, 5, 16, 20).toISOString(), now), "Kemarin, 16.20");
assert.equal(fmtWhen(new Date(2026, 9, 30, 10, 0).toISOString(), now), "30 Okt 2026");
assert.equal(fmtWhen(new Date(2026, 9, 31, 10, 0).toISOString(), new Date(2026, 10, 1, 8, 0)), "Kemarin, 10.00"); // month boundary
assert.equal(fmtWhen("bukan tanggal", now), "—");
console.log("format ok");
