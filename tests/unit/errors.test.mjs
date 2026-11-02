import assert from "node:assert/strict";
import test from "node:test";

import { classifyHttpStatus, isRetryable } from "../../src/common/errors.ts";

test("classifies reload-metadata style HTTP failures", () => {
  assert.equal(classifyHttpStatus(401), "authentication-required");
  assert.equal(classifyHttpStatus(404), "content-removed");
  assert.equal(classifyHttpStatus(429), "rate-limited");
  assert.equal(classifyHttpStatus(503), "website-maintenance");
});

test("only retryable classes are retried", () => {
  assert.equal(isRetryable("timeout"), true);
  assert.equal(isRetryable("content-removed"), false);
  assert.equal(isRetryable("invalid-json"), false);
});
