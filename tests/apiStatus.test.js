import test from "node:test";
import assert from "node:assert/strict";
import { buildStaleFallback, describeApiDataStatus } from "../src/utils/apiStatus.js";

test("stale fallback preserves cached data and gives a visible warning", () => {
  const data = [{ team: "Example FC" }];
  const result = buildStaleFallback(data, new Error("HTTP 503"));
  assert.equal(result.data, data);
  assert.equal(result.source, "stale-cache");
  assert.equal(result.stale, true);
  assert.match(result.warning, /HTTP 503/);
  assert.equal(describeApiDataStatus(result), "stale");
});

test("API status helper distinguishes live and fresh browser-cache responses", () => {
  assert.equal(describeApiDataStatus({ source: "server", stale: false }), "live");
  assert.equal(describeApiDataStatus({ source: "browser-cache", stale: false }), "cached");
  assert.equal(describeApiDataStatus(null), "unknown");
});
