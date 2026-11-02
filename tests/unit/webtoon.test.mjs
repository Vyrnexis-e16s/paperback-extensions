import assert from "node:assert/strict";
import test from "node:test";

import {
  contentTypeForTitle,
  shouldMarkWebtoon,
  webtoonGenreTag,
} from "../../src/common/webtoon.ts";

test("maps long-strip titles to comic contentType, not an invented field", () => {
  assert.equal(contentTypeForTitle("webtoon"), "comic");
  assert.equal(contentTypeForTitle("paginated-manga"), "comic");
  assert.equal(contentTypeForTitle("novel"), "novel");
});

test("only webtoon-kind titles receive the Webtoon genre tag helper", () => {
  assert.equal(shouldMarkWebtoon("webtoon"), true);
  assert.equal(shouldMarkWebtoon("paginated-manga"), false);
  assert.deepEqual(webtoonGenreTag(), { id: "webtoon", title: "Webtoon" });
});
