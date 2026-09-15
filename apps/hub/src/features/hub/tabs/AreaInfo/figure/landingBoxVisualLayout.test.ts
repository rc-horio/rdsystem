import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLandingBoxVisualLayout } from "./landingBoxVisualLayout.ts";

describe("createLandingBoxVisualLayout", () => {
  it("外枠の中に収まり、等間隔でも箱の境に隙間がある", () => {
    const vis = createLandingBoxVisualLayout({
      x: 10,
      y: 20,
      w: 400,
      h: 200,
      gridCols: 20,
      gridRows: 16,
      seqX: [0.4],
      seqY: [0.4],
    });
    assert.equal(vis.gutterX.length, 9);
    assert.equal(vis.gutterY.length, 3);
    for (const g of vis.gutterX) assert.ok(g > 0);
    for (const g of vis.gutterY) assert.ok(g > 0);
    const last = vis.cellRect(19, 0);
    assert.ok(Math.abs(last.x + last.w - (10 + 400)) < 1e-6);
    const top = vis.cellRect(0, 15);
    assert.ok(Math.abs(top.y - 20) < 1e-6);
  });

  it("大きい間隔の境は、小さい間隔の境より広い", () => {
    const vis = createLandingBoxVisualLayout({
      x: 0,
      y: 0,
      w: 1000,
      h: 400,
      gridCols: 6,
      gridRows: 8,
      seqX: [0.4, 1.5, 0.4],
      seqY: [0.4],
    });
    const a = vis.cellRect(1, 0);
    const b = vis.cellRect(2, 0);
    const c = vis.cellRect(3, 0);
    const d = vis.cellRect(4, 0);
    const gap01 = b.x - (a.x + a.w);
    const gap12 = d.x - (c.x + c.w);
    assert.ok(gap01 > gap12);
    assert.ok(gap12 > 0);
  });

  it("gutters: false なら箱の境も密着する", () => {
    const vis = createLandingBoxVisualLayout({
      x: 0,
      y: 0,
      w: 400,
      h: 200,
      gridCols: 6,
      gridRows: 8,
      seqX: [0.4, 1.5, 0.4],
      seqY: [0.4],
      gutters: false,
    });
    const a = vis.cellRect(1, 0);
    const b = vis.cellRect(2, 0);
    assert.ok(Math.abs(b.x - (a.x + a.w)) < 1e-6);
  });
});
