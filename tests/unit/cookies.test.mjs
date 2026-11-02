import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCookieHeader,
  serializeCookieHeader,
  serializeCookiePair,
} from "../../src/common/cookies.ts";

test("preserves cookie values that contain equals signs", () => {
  const header = serializeCookieHeader([
    { name: "session", value: "abc=def=ghi" },
    { name: "empty", value: "" },
    { name: "encoded", value: "a%3Db" },
  ]);
  assert.equal(header, "session=abc=def=ghi; empty=; encoded=a%3Db");
  const parsed = parseCookieHeader(header);
  assert.equal(parsed[0].value, "abc=def=ghi");
  assert.equal(parsed[1].value, "");
  assert.equal(parsed[2].value, "a%3Db");
});

test("does not truncate a value at the first equals", () => {
  assert.equal(serializeCookiePair({ name: "token", value: "x=y=z" }), "token=x=y=z");
});
