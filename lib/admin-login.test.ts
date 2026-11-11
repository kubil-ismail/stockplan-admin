import assert from "node:assert/strict";
import { cleanCode, validateLogin, validateOtp } from "./admin-login.ts";

assert.deepEqual(validateLogin({ email: "rina@stockplan.id", password: "x" }), {});
assert.equal(validateLogin({ email: "rina@gmail.com", password: "x" }).email, "Gunakan email kerja @stockplan.id.");
assert.equal(validateLogin({ email: " rina@stockplan.id ", password: "x" }).email, undefined); // trims like the submit does
assert.equal(validateLogin({ email: "rina@stockplan.id", password: "" }).password, "Isi password Anda.");
assert.deepEqual(validateOtp({ code: "123456", trust: true }, false), {});
assert.equal(validateOtp({ code: "12345", trust: true }, false).code, "Kode harus 6 digit angka.");
assert.deepEqual(validateOtp({ code: "ab12-cd34", trust: false }, true), {});
assert.equal(validateOtp({ code: "123456", trust: false }, true).code, "Format kode cadangan: xxxx-xxxx.");
assert.equal(cleanCode("12a3 456789", false), "123456");
assert.equal(cleanCode("abcd-efgh-ijkl", true), "abcd-efgh");
console.log("admin-login ok");
