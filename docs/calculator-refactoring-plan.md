# calculator.ts リファクタリング修正方針

## 1. 目的

- 約4,869行の巨大ファイルを空港単位に分割し、運用しやすくする
- **何があってもデグレを起こさない**ことを最優先とする

---

## 2. デグレ防止の原則

### 2.1 絶対に守る契約

| 項目 | 内容 |
|------|------|
| **外部API** | `index.ts` の export は一切変更しない |
| **関数シグネチャ** | `(lat: number, lng: number, gmaps: typeof google.maps) => AirportRestrictionResult` を維持 |
| **戻り値の型** | `AirportRestrictionResult`, `AirportRestrictionItem` の構造を変更しない |
| **計算ロジック** | 数式・定数・分岐条件を一切変更しない（コピー＆ペーストで移動のみ） |

### 2.2 参照元（変更しない）

- `MapView.tsx` → `calculateAirportRestriction` を使用
- `index.ts` → 全16空港の `calculateXxxRestriction` と `calculateAirportRestriction` を再エクスポート

### 2.3 検証方法

- リファクタリング後、地図上で各空港の制限区域内・境界・区域外の複数地点をクリックし、吹き出し表示が現行と同一であることを目視確認する
- 既存のテストが無いため、**ロジック変更ゼロ**（ファイル分割と import の整理のみ）で進める

---

## 3. 現状の構造分析

### 3.1 ファイル構成（リファクタリング前）

```
airportRestriction/
├── calculator.ts          ← 4,869行・全責務を集約
├── index.ts               ← エントリポイント（変更しない）
├── types.ts
├── popupBuilder.ts
└── data/
    ├── haneda.ts, narita.ts, kansai.ts, ...
    └── airports.ts
```

### 3.2 calculator.ts の内部構成

| 行範囲 | 種類 | 説明 |
|--------|------|------|
| 1-288 | インポート | 全16空港の data/* から定数・型をインポート |
| 289-299 | 定数・型 | STR_TO_SURFACE, HeightEntry |
| 308-527 | 共通ユーティリティ | mathSinnyu, mathTennia, mathTennib, chkInclusion, isPointInPolygon 等 |
| 530-828 | 羽田専用 | calcHorizontalSurface, calcConicalSurface, calcOuterHorizontalSurface（mpA/B/C/D 使用） |
| 865-... | 各空港 | calculateXxxRestriction + 各空港の補助関数（isXxxPointInPolygon, calcXxx*） |
| 4751-4869 | ディスパッチャ | calculateAirportRestriction（距離判定→該当空港の計算関数を呼び出し） |

### 3.3 空港ごとの依存関係

| 空港 | 共通ユーティリティ | 空港専用補助関数 | 特記事項 |
|------|-------------------|------------------|----------|
| 羽田 | mathSinnyu, mathTennia, mathTennib, chkInclusion | calcHorizontalSurface, calcConicalSurface, calcOuterHorizontalSurface | 共通の calc* は羽田データ(mpA/B/C/D)を参照 |
| 成田 | isPointInPolygon | isNaritaPointInPolygon, calcNarita* | - |
| 関西 | isPointInPolygon | isKansaiPointInPolygon, calcKansai* | - |
| 那覇 | isPointInPolygon | isNahaPointInPolygon, calcNaha* | - |
| 福岡 | - | mathEnsuiFukuoka, calcFukuoka* | 独自の円錐計算 |
| 松山 | isPointInPolygon | isMatsuyamaPointInPolygon, calcMatsuyama* | - |
| 仙台 | isPointInPolygon | isSendaiPointInPolygon, calcSendai* | 補助関数が Yao より前に定義されている |
| 八尾 | isPointInPolygon | isYaoPointInPolygon, calcYaoHorizontalSurface | 円錐・外側水平なし |
| 新千歳 | isPointInPolygon | isShinchitosePointInPolygon, calcShinchitose* | 円錐・外側水平なし |
| 函館 | isPointInPolygon | isHakodatePointInPolygon, calcHakodate* | - |
| 宮崎 | isPointInPolygon | isMiyazakiPointInPolygon, calcMiyazaki* | - |
| 伊丹 | - | mathEnsuiItami, calcItami* | 独自の円錐計算 |
| 中部 | isPointInPolygon | isCentrairPointInPolygon, calcCentrair* | - |
| 新潟 | isPointInPolygon | isNiigataPointInPolygon, calcNiigata* | 円錐・外側水平なし |
| 長崎 | - | mathEnsuiNagasaki, calcNagasaki* | 独自の円錐計算 |
| 熊本 | - | mathEnsuiKumamoto, calcKumamoto* | 独自の円錐計算 |

### 3.4 calculateAirportRestriction の評価順序（必須維持）

距離判定の順序は現行のまま維持する（境界付近で複数空港に該当する場合の挙動に影響）：

1. 羽田 → 2. 成田 → 3. 関西 → 4. 伊丹 → 5. 中部 → 6. 福岡 → 7. 松山 → 8. 仙台 → 9. 八尾 → 10. 新千歳 → 11. 函館 → 12. 新潟 → 13. 長崎 → 14. 熊本 → 15. 那覇 → 16. 宮崎

---

## 4. リファクタリング後のディレクトリ構成

```
airportRestriction/
├── calculator/
│   ├── index.ts              ← バレル export（既存の calculator の代わり）
│   ├── shared.ts             ← 共通ユーティリティ（math*, chkInclusion, isPointInPolygon 等）
│   ├── dispatcher.ts         ← calculateAirportRestriction
│   ├── haneda.ts
│   ├── narita.ts
│   ├── kansai.ts
│   ├── naha.ts
│   ├── itami.ts
│   ├── centrair.ts
│   ├── fukuoka.ts
│   ├── matsuyama.ts
│   ├── sendai.ts
│   ├── yao.ts
│   ├── shinchitose.ts
│   ├── hakodate.ts
│   ├── niigata.ts
│   ├── nagasaki.ts
│   ├── kumamoto.ts
│   └── miyazaki.ts
├── index.ts                  ← 変更: "./calculator" から import に変更
├── types.ts
├── popupBuilder.ts
└── data/
    └── （既存のまま）
```

---

## 5. 分割方針（詳細）

### 5.1 shared.ts に配置するもの

- `STR_TO_SURFACE`（定数）
- `HeightEntry`（型）
- `mathSinnyu`, `mathSinnyu40`, `mathSinnyuWithPitch`
- `mathTennia`, `mathTennib`, `mathTennibHei`
- `mathEnsui`（羽田の円錐用・他空港で使う場合は各モジュールで必要に応じて import）
- `intersectM`, `posIncludeTri`, `chkInclusion`
- `isPointInPolygon`

**注意（Coord 型）**: 各 `data/*.ts` は `export type Coord = { lat: number; lng: number }` を定義している（構造は同一）。`shared.ts` では `import type { Coord } from "../data/haneda"` のままとするか、`types.ts` に `Coord` を追加する。**既存の import 元を変えない**ことがデグレ防止の観点で安全。分割後も各空港モジュールは自前の data の `Coord` を使える。

### 5.2 各空港モジュール（例: haneda.ts）に配置するもの

- 当該空港の `data/*` からの import
- `shared` からの import
- 羽田の場合: `calcHorizontalSurface`, `calcConicalSurface`, `calcOuterHorizontalSurface`（mpA/B/C/D を使用するため羽田専用）
- 当該空港の `isXxxPointInPolygon`, `calcXxx*`（空港専用のもの）
- 当該空港の `mathEnsuiXxx`（福岡・伊丹・長崎・熊本のみ）
- `calculateXxxRestriction`（export）

### 5.3 dispatcher.ts に配置するもの

- 全16空港の `REFERENCE_POINT` と `OUTER_RADIUS`（または `HORIZ_RADIUS`）の import
- 全16空港の `calculateXxxRestriction` の import
- `calculateAirportRestriction` の実装（評価順序を維持）

### 5.4 calculator/index.ts（バレル）

- `shared` は外部に露出しない
- 各空港の `calculateXxxRestriction` を re-export
- `calculateAirportRestriction` を re-export
- 既存の `index.ts` が `from "./calculator"` で import したときに、現行と同じ export が得られるようにする

---

## 6. 実施手順（デグレ防止のための段階的アプローチ）

### Phase 0: 事前準備

1. 現行の `calculator.ts` をバックアップ（git で管理されているため、必要に応じてブランチで作業）
2. 検証用チェックリストを作成（各空港の代表座標・期待値の一覧）

### Phase 1: 共通ユーティリティの抽出

1. `calculator/shared.ts` を新規作成
2. `mathSinnyu` ～ `isPointInPolygon` を `calculator.ts` から `shared.ts` にコピー（**コピーのみ、修正なし**）
3. `calculator.ts` の該当箇所を `import { ... } from "./calculator/shared"` に置き換え
4. 動作確認（地図クリックで吹き出し表示が現行と同じこと）

### Phase 2: 1空港ずつ分割（羽田から開始）

1. `calculator/haneda.ts` を新規作成
2. 羽田関連のコード（calcHorizontalSurface, calcConicalSurface, calcOuterHorizontalSurface, calculateHanedaRestriction）を `calculator.ts` から `haneda.ts` にコピー
3. `haneda.ts` で `shared` と `data/haneda` を import
4. `calculator.ts` から羽田関連を削除し、`import { calculateHanedaRestriction } from "./haneda"` に置き換え
5. 動作確認

### Phase 3: 残り15空港を同様に分割

- 成田 → 関西 → 那覇 → 福岡 → 松山 → 仙台 → 八尾 → 新千歳 → 函館 → 宮崎 → 伊丹 → 中部 → 新潟 → 長崎 → 熊本 の順で実施
- **1空港ずつ** 分割し、その都度動作確認

### Phase 4: ディスパッチャの分離

1. `calculator/dispatcher.ts` を新規作成
2. `calculateAirportRestriction` を `calculator.ts` から `dispatcher.ts` に移動
3. `dispatcher.ts` で全16空港の計算関数と参照点・半径を import
4. 動作確認

### Phase 5: バレルと旧ファイルの整理

1. `calculator/index.ts` を新規作成し、全 export を集約
2. 親の `index.ts` の import を `from "./calculator"` に変更
3. 旧 `calculator.ts` を削除
4. 最終動作確認

---

## 7. 禁止事項（デグレ防止）

- [ ] 計算式・定数値の変更
- [ ] 分岐条件の変更（`<=` と `<` の取り違え等）
- [ ] `calculateAirportRestriction` の評価順序の変更
- [ ] 型定義の変更（`AirportRestrictionResult` 等）
- [ ] `index.ts` の export 一覧の変更
- [ ] リネームによる意味の変更（変数名の整理は可だが、定数名・関数名は維持）

---

## 8. 検証チェックリスト（例）

各空港について、少なくとも以下を確認する：

| 空港 | 制限区域内の代表座標 | 期待される表示例 |
|------|----------------------|------------------|
| 羽田 | （要確認） | 羽田空港　○○表面　○○ｍ |
| 成田 | （要確認） | 成田国際空港　○○表面　○○ｍ |
| ... | ... | ... |

※ 具体的な座標は、各空港の data ファイルまたは公式システムで確認する。

---

## 9. ロールバック方針

- 各 Phase をコミット単位で区切り、問題があれば直前のコミットに戻す
- リファクタリング用ブランチで作業し、検証完了後に main にマージ

---

## 10. まとめ

- **方針**: ロジック変更ゼロ、ファイル分割と import 整理のみ
- **原則**: 外部 API 不変、関数シグネチャ不変、計算結果不変
- **手順**: 共通ユーティリティ抽出 → 1空港ずつ分割 → ディスパッチャ分離 → バレル化
- **検証**: 各 Phase 後に地図上で目視確認
