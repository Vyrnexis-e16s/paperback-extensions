import assert from "node:assert/strict";
import test from "node:test";

import {
  isCloudflareChallenge,
  isCloudflareHtml,
  parseJsonOrCloudflare,
} from "../../src/common/cloudflare.ts";

function bufferFrom(text) {
  return new TextEncoder().encode(text).buffer;
}

test("detects Cloudflare HTML challenge pages", () => {
  assert.equal(isCloudflareHtml("<html><title>Just a moment...</title></html>"), true);
  assert.equal(
    isCloudflareHtml('<script src="/cdn-cgi/challenge-platform/h/b/orchestrate"></script>'),
    true,
  );
  assert.equal(isCloudflareHtml("<!DOCTYPE html><title>Asura Scans</title>"), false);
});

test("treats cf-mitigated challenge headers as Cloudflare", () => {
  assert.equal(
    isCloudflareChallenge(
      { status: 403, headers: { "cf-mitigated": "challenge" } },
      bufferFrom(""),
    ),
    true,
  );
  assert.equal(
    isCloudflareChallenge(
      { status: 200, headers: { "Content-Type": "text/html" } },
      bufferFrom("<html>Just a moment</html>"),
    ),
    true,
  );
});

test("does not treat images as Cloudflare pages", () => {
  assert.equal(
    isCloudflareChallenge(
      { status: 200, headers: { "content-type": "image/jpeg" } },
      bufferFrom("Just a moment"),
    ),
    false,
  );
});

test("parseJsonOrCloudflare returns JSON and rejects HTML", () => {
  const json = parseJsonOrCloudflare(
    { status: 200, headers: { "content-type": "application/json" } },
    bufferFrom('{"ok":true}'),
    "https://asurascans.com",
  );
  assert.equal(json.ok, true);

  assert.throws(
    () =>
      parseJsonOrCloudflare(
        { status: 200, headers: { "content-type": "text/html" } },
        bufferFrom("<!DOCTYPE html><p>nope</p>"),
        "https://asurascans.com",
      ),
    /HTML instead of JSON/,
  );
});
