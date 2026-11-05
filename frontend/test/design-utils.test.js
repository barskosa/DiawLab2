import test from "node:test";
import assert from "node:assert/strict";
import { contrastRatio } from "../src/design-utils.js";

test("black and white have the reference contrast21:1 in either order", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#fff", "#000"), 21);
});

test("the gray777 reference remains below the4.5:1 threshold", () => {
  const ratio = contrastRatio("#777777", "#FFFFFF");
  assert.ok(Math.abs(ratio - 4.478) < 0.001);
  assert.ok(ratio < 4.5);
});

test("invalid colors cannot produce a misleading accessibility score", () => {
  assert.equal(contrastRatio("invalid", "#fff"), null);
  assert.equal(contrastRatio("#ffff", "#fff"), null);
  assert.equal(contrastRatio(undefined, "#fff"), null);
});
