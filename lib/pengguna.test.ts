import assert from "node:assert/strict";
import { initials } from "./pengguna.ts";

assert.equal(initials("promo-saham88"), "PS");
assert.equal(initials("Budi Santoso"), "BS");
console.log("pengguna ok");
