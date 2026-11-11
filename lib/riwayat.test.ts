import assert from "node:assert/strict";
import { cell, dayLabel, timeOf } from "./riwayat.ts";

const now = new Date("2026-11-06T05:00:00Z"); // 12.00 WIB
assert.equal(dayLabel("2026-11-06", now), "Hari ini · Jumat, 6 Nov 2026");
assert.equal(dayLabel("2026-11-05", now), "Kemarin · Kamis, 5 Nov 2026");
assert.equal(dayLabel("2026-11-04", now), "Rabu, 4 Nov 2026");
assert.equal(timeOf("2026-11-06T03:42:00Z"), "10.42"); // UTC -> WIB
assert.equal(timeOf("2026-11-05T17:05:00Z"), "00.05"); // midnight must not render as 24.05
assert.equal(cell(null), "—");
assert.equal(cell(["a"]), '["a"]');
console.log("riwayat ok");
