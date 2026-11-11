import assert from "node:assert/strict";
import { toApiError } from "./admin-api.ts";

assert.deepEqual(toApiError(429, { error: { code: "ACCOUNT_LOCKED", message: "Dikunci" } }), { status: 429, code: "ACCOUNT_LOCKED", message: "Dikunci", fields: undefined });
assert.equal(toApiError(500, null).code, "SERVER_ERROR"); // non-JSON / empty body
assert.equal(toApiError(502, "<html>Bad gateway</html>").code, "SERVER_ERROR");
assert.equal(toApiError(422, { error: { code: "VALIDATION", message: "x", fields: { email: "salah" } } }).fields?.email, "salah");
console.log("admin-api ok");
