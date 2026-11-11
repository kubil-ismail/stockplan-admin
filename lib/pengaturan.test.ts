import assert from "node:assert/strict";
import { BASE, changedKeys, isHex, onAccent } from "./pengaturan.ts";

const o = onAccent("#FEA722");
assert.equal(o.dark, true);
assert.equal(o.ratio.toFixed(1), "9.0"); // matches the design's "kontras 9,0:1"
assert.equal(onAccent("#1D4ED8").dark, false); // dark blue gets white text
assert.equal(isHex("#FEA722"), true);
assert.equal(isHex("FEA722"), false);
assert.deepEqual(changedKeys(BASE, BASE), []);
assert.deepEqual(changedKeys(BASE, { ...BASE, beta: false, secs: [...BASE.secs.slice(1), BASE.secs[0]] }), ["secs", "beta"].sort((a, b) => Object.keys(BASE).indexOf(a) - Object.keys(BASE).indexOf(b)));
console.log("pengaturan ok");
