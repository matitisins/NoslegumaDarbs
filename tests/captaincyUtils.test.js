import test from "node:test";
import assert from "node:assert/strict";

import {
  toFiniteNumber,
  getCaptainExpectedPoints,
  getCaptainValue,
} from "../src/utils/captaincyUtils.js";

test("toFiniteNumber returns finite numbers and safely handles invalid values", () => {
  assert.equal(toFiniteNumber(12.5), 12.5);
  assert.equal(toFiniteNumber("8"), 8);
  assert.equal(toFiniteNumber("invalid"), 0);
  assert.equal(toFiniteNumber(null), 0);
  assert.equal(toFiniteNumber(undefined), 0);
});

test("captain expected points use the supplied fantasy points without an unsupported FDR percentage", () => {
  const player = {
    points: 18,
  };

  assert.equal(
    getCaptainExpectedPoints(player),
    18
  );
});

test("captain expected points never become negative", () => {
  assert.equal(
    getCaptainExpectedPoints({ points: -5 }),
    0
  );

  assert.equal(
    getCaptainExpectedPoints({ points: "invalid" }),
    0
  );

  assert.equal(
    getCaptainExpectedPoints(null),
    0
  );
});

test("captain value applies the standard x2 captain multiplier", () => {
  assert.equal(
    getCaptainValue(18),
    36
  );

  assert.equal(
    getCaptainValue(0),
    0
  );
});

test("captain value does not depend on an invented FDR percentage", () => {
  const expectedPoints = getCaptainExpectedPoints({
    points: 20,
  });

  assert.equal(
    getCaptainValue(expectedPoints),
    40
  );
});