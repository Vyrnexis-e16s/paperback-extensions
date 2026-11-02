import assert from "node:assert/strict";
import test from "node:test";

import { matchByExtensionId, refuseNameOnlyMerge } from "../../src/migration/match.ts";

const entries = [
  {
    previousExtensionId: "ManhuaPlus",
    currentExtensionId: "ManhuaPlus",
    mappingConfidence: "high",
    reason: "unchanged",
  },
  {
    previousExtensionId: "OldSlug",
    currentExtensionId: "NewSlug",
    mappingConfidence: "medium",
    reason: "domain-change",
  },
];

test("matches an unchanged extension id exactly", () => {
  const result = matchByExtensionId(entries, "ManhuaPlus");
  assert.equal(result.status, "exact");
  if (result.status === "exact") {
    assert.equal(result.entry.currentExtensionId, "ManhuaPlus");
  }
});

test("does not merge different titles just because names look similar", () => {
  assert.equal(refuseNameOnlyMerge("Solo Leveling", "Solo Leveling", false), true);
  assert.equal(refuseNameOnlyMerge("Solo Leveling", "Solo Leveling", true), false);
});

test("unknown previous ids do not invent a match", () => {
  assert.equal(matchByExtensionId(entries, "DoesNotExist").status, "none");
});
