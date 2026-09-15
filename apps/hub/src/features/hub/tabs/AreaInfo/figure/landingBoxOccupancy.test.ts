import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLandingBoxOccupancy,
  derivedLandingBoxRowCount,
  isValidLandingBoxCountX,
  landingBoxOccupancyError,
} from "./landingBoxOccupancy.ts";

describe("buildLandingBoxOccupancy 300機 X=20", () => {
  const occ = buildLandingBoxOccupancy(20, 300);
  if (!occ) throw new Error("300機 X=20 の占有が作れない");

  it("BOX 数と段", () => {
    assert.equal(occ.boxCount, 38);
    assert.equal(occ.boxesPerRow, 10);
    assert.equal(occ.boxRowCount, 4);
    assert.equal(occ.gridCols, 20);
    assert.equal(occ.gridRows, 16);
    assert.equal(occ.occupiedRowCount, 16);
    assert.equal(derivedLandingBoxRowCount(20, 300), 16);
  });

  it("欠けるのは最後の 1 BOX だけ（4機）", () => {
    assert.equal(occ.tiles.length, 38);
    for (let i = 0; i < 37; i++) {
      assert.equal(occ.tiles[i]!.isFull, true);
      assert.equal(occ.tiles[i]!.count, 8);
    }
    const last = occ.tiles[37]!;
    assert.equal(last.isFull, false);
    assert.equal(last.count, 4);
    assert.equal(last.col0, 14);
    assert.equal(last.col1, 15);
    assert.equal(last.row0, 12);
    assert.equal(last.row1, 13);
  });

  it("下段左 0、右 19。BOX37/38 の番号は図どおり", () => {
    assert.equal(occ.idAt(0, 0), 0);
    assert.equal(occ.idAt(0, 19), 19);
    assert.deepEqual(occ.cellForId(0), { col: 0, row: 0 });

    assert.equal(occ.idAt(12, 12), 252);
    assert.equal(occ.idAt(12, 13), 253);
    assert.equal(occ.idAt(12, 14), 254);
    assert.equal(occ.idAt(12, 15), 255);
    assert.equal(occ.idAt(13, 12), 268);
    assert.equal(occ.idAt(13, 13), 269);
    assert.equal(occ.idAt(13, 14), 270);
    assert.equal(occ.idAt(13, 15), 271);
    assert.equal(occ.idAt(14, 12), 284);
    assert.equal(occ.idAt(14, 13), 285);
    assert.equal(occ.idAt(15, 12), 298);
    assert.equal(occ.idAt(15, 13), 299);

    assert.equal(occ.idAt(14, 14), null);
    assert.equal(occ.idAt(14, 15), null);
    assert.equal(occ.idAt(15, 14), null);
    assert.equal(occ.idAt(15, 15), null);
    assert.equal(occ.idAt(15, 16), null);
  });

  it("四隅", () => {
    assert.deepEqual(occ.corner, { bl: 0, br: 19, tl: 286, tr: 299 });
    assert.deepEqual(occ.cornerCell.tl, { col: 0, row: 15 });
    assert.deepEqual(occ.cornerCell.tr, { col: 13, row: 15 });
    assert.deepEqual(occ.cornerCell.bl, { col: 0, row: 0 });
    assert.deepEqual(occ.cornerCell.br, { col: 19, row: 0 });
  });
});

describe("余り 1〜7 は最後の BOX を下から・段内は左→右", () => {
  for (let rem = 1; rem <= 7; rem++) {
    it(`余り ${rem}`, () => {
      const occ = buildLandingBoxOccupancy(2, rem);
      assert.ok(occ);
      assert.equal(occ.boxCount, 1);
      assert.equal(occ.tiles[0]!.count, rem);
      assert.equal(occ.tiles[0]!.isFull, false);
      for (let i = 0; i < rem; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        assert.equal(occ.idAt(row, col), i);
      }
      assert.equal(occ.idAt(Math.floor(rem / 2), rem % 2), null);
    });
  }

  it("余り 0 は満杯 BOX のみ", () => {
    const occ = buildLandingBoxOccupancy(2, 8);
    assert.ok(occ);
    assert.equal(occ.boxCount, 1);
    assert.equal(occ.tiles[0]!.isFull, true);
    assert.equal(occ.idAt(3, 1), 7);
  });
});

describe("入力", () => {
  it("X 奇数・1・0 は作れない", () => {
    assert.equal(isValidLandingBoxCountX(20), true);
    assert.equal(isValidLandingBoxCountX(2), true);
    assert.equal(isValidLandingBoxCountX(3), false);
    assert.equal(isValidLandingBoxCountX(1), false);
    assert.equal(buildLandingBoxOccupancy(3, 8), null);
    assert.equal(buildLandingBoxOccupancy(1, 8), null);
    assert.match(
      landingBoxOccupancyError(3, 8) ?? "",
      /偶数/
    );
  });

  it("総機が無いときは占有もエラー文も出さない", () => {
    assert.equal(buildLandingBoxOccupancy(20, 0), null);
    assert.equal(landingBoxOccupancyError(20, 0), null);
    assert.equal(landingBoxOccupancyError(3, 0), null);
  });
});
