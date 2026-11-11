import assert from "node:assert/strict";
import { sensitiveModules, togglePerm, type ModuleDef } from "./permissions.ts";

const mods: ModuleDef[] = [
  { key: "em", name: "Data emiten", desc: "", actions: ["view", "edit"], sensitive: false },
  { key: "usr", name: "Pengguna", desc: "", actions: ["view", "edit"], sensitive: true },
];
assert.deepEqual(togglePerm([], "publish", ["view", "edit", "publish"]), ["view", "publish"]); // adds view
assert.deepEqual(togglePerm(["view", "edit"], "view", ["view", "edit"]), []); // removing view clears all
assert.deepEqual(togglePerm(["view"], "delete", ["view"]), ["view"]); // unavailable action ignored
assert.deepEqual(sensitiveModules({ usr: ["view"], em: ["view", "edit"] }, mods), []); // view only is not sensitive
assert.deepEqual(sensitiveModules({ usr: ["view", "edit"] }, mods), ["Pengguna"]);
console.log("permissions ok");
