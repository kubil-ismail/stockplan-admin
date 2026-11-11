import assert from "node:assert/strict";
import { activeSupers, isLastSuper, WORK_EMAIL } from "./akses.ts";

const team = [{ role: "super", status: "act" as const }, { role: "data", status: "act" as const }, { role: "super", status: "off" as const }];
assert.equal(activeSupers(team), 1); // deactivated super admin does not count
assert.equal(isLastSuper(team[0], team), true);
assert.equal(isLastSuper(team[1], team), false);
assert.equal(WORK_EMAIL.test("kevin@stockplan.id"), true);
assert.equal(WORK_EMAIL.test("kevin@gmail.com"), false);
console.log("akses ok");
