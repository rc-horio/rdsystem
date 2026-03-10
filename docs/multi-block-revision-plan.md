# 複数ブロック対応 修正方針

## 1. 要件サマリ

| 項目 | 内容 |
|------|------|
| ブロック数上限 | 10ブロック |
| ID体系 | 全ブロック通しの連番（0 ～ totalCount-1） |
| 既存データ | ノータッチ（後方互換を維持） |
| レイアウト | 2次元グリッド。パターン1・2・3いずれも許容 |
| 行・列の指定 | ユーザーが「行数」「各行のブロック数」を指定 |
| ブロック間の間隔 | 横方向・縦方向（行間）を別々にユーザー入力 |
| 機体間隔（spacing） | 全ブロック共通 |
| 機体の向き | 全ブロック共通 |
| 端数（六角形） | 各ブロックごとに許容 |
| ブロック追加・削除・並び替え | UIで実施（RightPanel を優先、厳しければエリアタブ内の余白等を検討） |

---

## 2. データ構造

### 2.1 新規データ（複数ブロック時）

既存の `area.drone_count` / `area.spacing_between_drones_m` はそのまま残し、複数ブロック時は `area.blocks` を追加する。

```json
{
  "area": {
    "blocks": [
      {
        "id": "block-0",
        "x_count": 100,
        "y_count": 7,
        "count": null
      },
      {
        "id": "block-1",
        "x_count": 50,
        "y_count": 5,
        "count": null
      }
    ],
    "block_layout": {
      "rows": [
        { "block_ids": ["block-0", "block-1"], "direction": "horizontal" },
        { "block_ids": ["block-2"], "direction": "horizontal" }
      ],
      "gap_horizontal_m": 2,
      "gap_vertical_m": 3
    },
    "spacing_between_drones_m": {
      "horizontal": "1,0.8",
      "vertical": "1"
    },
    "drone_orientation_deg": 180
  }
}
```

- `blocks[]`: 各ブロックの x_count, y_count, count（端数用、省略可）
- `block_layout`: 行ごとのブロック並びと方向、ブロック間隔
- `spacing_between_drones_m`, `drone_orientation_deg`: 既存と同様に全ブロック共通

### 2.2 後方互換

- `area.blocks` が無い or 空 → 既存の `drone_count` を参照し、1ブロックとして扱う
- `operation.placement` が単一オブジェクトのまま → 1ブロック用として解釈
- `operation.modules[].ids` は引き続き通しIDで運用

### 2.3 Operation の拡張

```json
{
  "operation": {
    "placements": [
      { "block_id": "block-0", "x": 100, "y": 7, "spacing_m": 1 },
      { "block_id": "block-1", "x": 50, "y": 5, "spacing_m": 1 }
    ],
    "modules": [
      { "name": "モジュール1", "ids": [0, 2, 3, 105, 106] },
      { "name": "モジュール2", "ids": [1, 4, 5] }
    ]
  }
}
```

- 複数ブロック時は `placements[]` を使用
- 1ブロック時は既存の `placement` をそのまま使用

---

## 3. 修正対象と方針

### 3.1 エリア情報タブ

#### RightPanel（機体数セクション）

- **現状**: x_count, y_count, count の単一入力
- **方針**:
  - `area.blocks` が無い場合: 既存UIのまま（既存 `drone_count` を編集）
  - `area.blocks` がある場合: ブロック一覧＋各ブロックの x_count, y_count, count を編集
  - 行数・各行のブロック数・方向・ブロック間隔の入力UIを追加
  -  cramped な場合は、エリアタブ内の余白や別パネルへの分割を検討

#### LandingAreaFigure（離発着エリア図）

- **現状**: 1つの polygon/rect を描画
- **方針**:
  - `buildLandingFigureModel` をブロック数分呼び出し、各ブロックの polygon/rect を計算
  - `block_layout` に従い、ブロック間隔を考慮して配置
  - 各ブロックの四隅IDは通し番号で表示
  - 端数（六角形）はブロックごとに `buildLandingFigureModel` 内で判定

#### buildLandingFigureModel / landingFigureModel.ts

- **方針**:
  - 既存関数は「1ブロック用」として維持
  - 新規に `buildMultiBlockLandingFigureModel` を追加し、複数ブロックの座標・IDを算出
  - または既存関数を拡張し、`blockIndex` を渡してブロック単位で計算

### 3.2 オペレーションタブ

#### useGrid / OperationTab

- **現状**: 単一の countX, countY
- **方針**:
  - 複数ブロック時は `useGrid` をブロック数分利用するか、`useMultiBlockGrid` のような新フックを導入
  - 各ブロックの countX, countY を保持
  - AreaInfo の `blocks` をソースとして同期

#### TableSection（機体の配列）

- **現状**: 1つの countX × countY グリッド
- **方針**:
  - 複数ブロック時はブロックごとに `TableSection` を描画（または1コンポーネント内で複数グリッドを描画）
  - セル番号は通しID（0 ～ totalCount-1）
  - ブロック間のレイアウト（横並び・縦並び）に合わせて配置
  - モジュールの色分けは既存のまま、ids が通しIDに対応

#### MeasureSection / MenuPanel

- **方針**:
  - `measurement.target_id` は通しIDのまま
  - target_id からブロック・ブロック内位置を逆算するユーティリティを用意

### 3.3 型定義

- `resource.ts` の `Area`, `Operation` に `blocks`, `block_layout`, `placements` を追加（オプショナル）
- 既存フィールドは維持

### 3.4 PDF / PPTX 出力

- 離発着エリア図・配置図の描画ロジックを複数ブロック対応に拡張
- 既存の `buildLandingFigureSvg` 等を複数ブロック版に拡張するか、新関数を追加

---

## 4. 実装フェーズ（小分け）

各フェーズは単体で完了・確認できる単位に分割。依存関係に従い順次実装する。

### Phase 1: 基盤

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **1a** | 型定義の追加 | `Area`, `Operation` に `blocks`, `block_layout`, `placements` をオプショナル追加 |
| **1b** | 後方互換ユーティリティ | `getBlocksFromArea(area)` 等：`blocks` が無い場合は `drone_count` から1ブロックを生成して返す |
| **1c** | 通しID計算ユーティリティ | `getGlobalId(blockIndex, localId)`, `getBlockAndLocalId(globalId, blocks)` 等 |

### Phase 2: エリア情報タブ - ブロック編集UI

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **2a** | ブロック一覧の表示・追加・削除 | RightPanel にブロック一覧、追加ボタン、削除ボタン（1ブロックは削除不可） |
| **2b** | 各ブロックの x_count / y_count / count 入力 | ブロックごとの入力欄、図を更新ボタン |
| **2c** | 行数・各行のブロック数・方向の入力 | `block_layout.rows` の編集UI |
| **2d** | ブロック間隔（gap_horizontal_m, gap_vertical_m）の入力 | 間隔入力欄 |

### Phase 3: エリア情報タブ - 離発着エリア図

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **3a** | 複数ブロック用モデル計算 | `buildMultiBlockLandingFigureModel(area)`：各ブロックの座標・四隅ID・端数判定 |
| **3b** | LandingAreaFigure の複数ブロック描画 | `blocks` がある場合に複数 polygon/rect を描画、既存1ブロックは従来どおり |

### Phase 4: オペレーションタブ - 配置図

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **4a** | 複数ブロック用グリッドデータ準備 | `useMultiBlockGrid` または OperationTab 内で blocks から countX/countY を集約 |
| **4b** | TableSection の複数ブロック表示 | ブロックごとにグリッドを描画、通しIDでセル番号・モジュール色を表示 |
| **4c** | OperationTab と AreaInfo の同期 | `area.blocks` 変更時に operation.placements を更新、既存1ブロックは placement のまま |

### Phase 5: 計測・その他

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **5a** | MeasureSection の target_id 逆算 | 通しIDからブロック番号・ブロック内位置を算出するユーティリティを利用 |
| **5b** | モジュール入力の複数ブロック対応 | 複数ブロック時も modules[].ids が通しIDで正しく保存・復元されることの確認 |

### Phase 6: 出力

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **6a** | PDF 出力の複数ブロック対応 | 離発着エリア図・配置図を複数ブロックで描画 |
| **6b** | PPTX 出力の複数ブロック対応 | 同上 |

---

### フェーズ依存関係

```
1a → 1b → 1c
         ↓
2a → 2b → 2c → 2d
         ↓
      3a → 3b
         ↓
      4a → 4b → 4c
         ↓
      5a → 5b
         ↓
      6a → 6b
```

- Phase 1 完了後に Phase 2, 3, 4 に着手可能
- Phase 2 と 3 は並行可能（2a〜2b と 3a は 1 に依存）
- Phase 4 は 1 と 2a〜2b に依存
- Phase 5, 6 は Phase 4 完了後に着手

---

## 5. レイアウトの「行」の扱い（パターン1・2・3）

ユーザーが「行数」「各行のブロック数」を指定する前提で、以下の3パターンを許容する。

- **パターン1**: 全行が横並び（例: [A][B] / [C][D]）
- **パターン2**: 全行が縦並び（例: [A] の上に [B] / [C] の上に [D]）
- **パターン3**: 行ごとに横・縦を混在（例: 行1は横 [A][B]、行2は縦 [C] の上に [D]）

`block_layout.rows[]` の `direction` で行ごとに `"horizontal"` / `"vertical"` を指定する形で実装する。

---

## 6. 未確定・お任せ事項

- ブロック追加・削除・並び替えの具体的UI（ボタン配置、ドラッグ＆ドロップ等）は実装時に検討
- RightPanel が厳しい場合の代替配置（エリアタブ内余白等）は実装時に判断
- 細かいUI/UXは実装時に調整

---

## 7. フェーズ一覧（クイックリファレンス）

| # | Phase | 内容 |
|---|-------|------|
| 1 | 1a | 型定義追加 |
| 2 | 1b | 後方互換ユーティリティ |
| 3 | 1c | 通しID計算ユーティリティ |
| 4 | 2a | ブロック一覧の表示・追加・削除 |
| 5 | 2b | 各ブロックの x_count / y_count / count 入力 |
| 6 | 2c | 行数・各行のブロック数・方向の入力 |
| 7 | 2d | ブロック間隔の入力 |
| 8 | 3a | 複数ブロック用モデル計算 |
| 9 | 3b | LandingAreaFigure の複数ブロック描画 |
| 10 | 4a | 複数ブロック用グリッドデータ準備 |
| 11 | 4b | TableSection の複数ブロック表示 |
| 12 | 4c | OperationTab と AreaInfo の同期 |
| 13 | 5a | MeasureSection の target_id 逆算 |
| 14 | 5b | モジュール入力の複数ブロック対応 |
| 15 | 6a | PDF 出力の複数ブロック対応 |
| 16 | 6b | PPTX 出力の複数ブロック対応 |
