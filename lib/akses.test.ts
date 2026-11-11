import assert from "node:assert/strict";
import { WORK_EMAIL } from "./akses.ts";

assert.equal(WORK_EMAIL.test("kevin@stockplan.id"), true);
assert.equal(WORK_EMAIL.test("kevin@gmail.com"), false);
console.log("akses ok");
