import assert from "node:assert/strict";
import { can, ROLES, sensitiveModules, togglePerm } from "./permissions.ts";

assert.equal(can("super", "acc", "delete"), true);
assert.equal(can("data", "acc", "view"), false); // only super admin sees Akses
assert.equal(can("tema", "tm", "edit"), true);
assert.equal(can("tema", "tm", "publish"), false); // editor tema cannot publish
assert.equal(can("support", "em", "edit"), false);
assert.equal(can("nope", "em", "view"), false);
assert.equal(can("super", "dash", "edit"), false); // dashboard only has "view"
assert.deepEqual(togglePerm([], "publish", ["view", "edit", "publish"]), ["view", "publish"]); // adds view
assert.deepEqual(togglePerm(["view", "edit"], "view", ["view", "edit"]), []); // removing view clears all
assert.deepEqual(togglePerm(["view"], "delete", ["view"]), ["view"]); // unavailable action ignored
assert.deepEqual(sensitiveModules(ROLES.find((r) => r.id === "view")!.perms), []);
assert.deepEqual(sensitiveModules(ROLES.find((r) => r.id === "data")!.perms), []);
assert.ok(sensitiveModules(ROLES.find((r) => r.id === "support")!.perms).includes("Pengguna"));
console.log("permissions ok");
