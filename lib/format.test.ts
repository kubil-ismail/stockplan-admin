import assert from "node:assert/strict";
import { fmtWhen, longDate } from "./format.ts";

const now = new Date(2026, 10, 6, 12, 0); // 6 Nov 2026, local time
assert.equal(fmtWhen(new Date(2026, 10, 6, 9, 5).toISOString(), now), "Hari ini, 09.05");
assert.equal(fmtWhen(new Date(2026, 10, 5, 16, 20).toISOString(), now), "Kemarin, 16.20");
assert.equal(fmtWhen(new Date(2026, 9, 30, 10, 0).toISOString(), now), "30 Okt 2026");
assert.equal(fmtWhen(new Date(2026, 9, 31, 10, 0).toISOString(), new Date(2026, 10, 1, 8, 0)), "Kemarin, 10.00"); // month boundary
assert.equal(fmtWhen("bukan tanggal", now), "—");
assert.equal(longDate("2026-11-05T03:00:00Z"), "Kamis, 5 November 2026");
assert.equal(longDate("2026-11-05T18:00:00Z"), "Jumat, 6 November 2026"); // Jakarta is UTC+7: already the next day
console.log("format ok");
