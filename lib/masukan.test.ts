import assert from "node:assert/strict";
import { applyAssign, applyStatus, inTab, isLate, templates } from "./masukan.ts";

assert.equal(isLate({ s: "prog", late: 1 }), true);
assert.equal(isLate({ s: "wait", late: 5 }), false); // waiting on the user is not our delay
assert.equal(isLate({ s: "done", late: 5 }), false);
assert.equal(inTab("spam", "done"), true);
assert.equal(inTab("wait", "open"), true);
assert.deepEqual(applyStatus({ s: "new", a: "" }, "prog"), { s: "prog", a: "Rina" });
assert.deepEqual(applyStatus({ s: "prog", a: "Dimas" }, "done"), { s: "done", a: "Dimas" });
assert.deepEqual(applyAssign({ s: "new", a: "" }, "Dimas"), { a: "Dimas", s: "prog" });
assert.deepEqual(applyAssign({ s: "new", a: "Dimas" }, ""), { a: "", s: "new" });
assert.match(templates({ k: "data", tk: "AADI", from: "Andi Wijaya" })[0][1], /AADI/);
console.log("masukan ok");
