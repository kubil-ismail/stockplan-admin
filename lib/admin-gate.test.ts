import assert from "node:assert/strict";
import { gate } from "./admin-gate.ts";

assert.equal(gate("/admin", false), "/admin/masuk");
assert.equal(gate("/admin/emiten/BUMI", false), "/admin/masuk");
assert.equal(gate("/admin/masuk", false), null); // the login page itself stays open
assert.equal(gate("/admin", true), null);
assert.equal(gate("/admin/pengaturan", true), null);
assert.equal(gate("/admin/masuk", true), "/admin"); // already signed in
console.log("admin-gate ok");
