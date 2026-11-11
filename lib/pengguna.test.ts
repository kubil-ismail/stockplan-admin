import assert from "node:assert/strict";
import { initials, statusOf } from "./pengguna.ts";

assert.equal(statusOf({ activity: "act" }, true), "sus");
assert.equal(statusOf({ activity: "new" }, false), "new");
assert.equal(statusOf({ activity: "idle" }, false), "idle");
assert.equal(initials("promo-saham88"), "PS");
assert.equal(initials("Budi Santoso"), "BS");
console.log("pengguna ok");
