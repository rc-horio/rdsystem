# RD Map 空港高さ制限 実装方針・実装フェーズ

要件定義書（`airport-height-restriction-requirements.md`）に基づく実装計画。

---

## 1. 実装方針

### 1.1 アーキテクチャ

- **既存パターンの踏襲**：測定モード（`useMeasurementMode`）・エリア追加モード（`useAddAreaMode`）と同様の構成とする
- **カスタムフック**：`useAirportHeightRestrictionMode` を新規作成し、モード状態・クリックハンドラ・吹き出し表示を集約
- **データ層の分離**：制限表面の座標・計算ロジックは `airportRestriction` モジュールに分離し、空港ごとに拡張しやすくする

### 1.2 ファイル構成（新規・変更）

```
apps/map/src/
├── components/hook/
│   └── useAirportHeightRestrictionMode.ts   # 新規：モード制御・クリック処理
├── pages/parts/
│   ├── MapView.tsx                          # 変更：フック統合・ヒント表示
│   ├── MapToolsPanel.tsx                    # 変更：ボタン追加・免責表示
│   └── airportRestriction/
│       ├── index.ts                         # 新規：エントリ
│       ├── types.ts                         # 新規：型定義
│       ├── data/
│       │   ├── haneda.ts                    # 新規：羽田の座標・定数
│       │   └── airports.ts                  # 新規：空港メタ情報（URL等）
│       ├── calculator.ts                    # 新規：高さ計算ロジック
│       └── popupBuilder.ts                  # 新規：吹き出しHTML生成
```

### 1.3 既存実装との統合ポイント

| 既存 | 空港高さ制限での対応 |
|------|----------------------|
| `map.addListener("click", ...)` | 照会モード中はクリックで高さ制限表示。`airportHeightRestrictionModeRef` で分岐 |
| `infoRef` / `djiNfzInfoRef` | 照会モード用に `airportHeightRestrictionInfoRef` を追加。DJI NFZ と統合表示時は同一 InfoWindow に両方の内容を組み立て |
| `useMeasurementMode` | 照会モード開始時に `cancelMeasurementMode()` を呼ぶ |
| `useAddAreaMode` | 照会モード開始時に `cancelAddMode()` を呼ぶ |
| 座標変更モード | 照会モード開始時に `cancelChangePosition()` を呼ぶ。モード中はマーカークリックで高さ制限を表示（マーカー選択は行わない） |
| MapToolsPanel | 既存の `useBreakpointMd()`、`detectEmbedMode()` の挙動に従う（変更不要） |

### 1.4 吹き出し・UI の仕様（要件より）

| 項目 | 仕様 |
|------|------|
| 閉じるボタン | 不要 |
| 複数吹き出し | 同時表示しない。新しいクリックで上書き |
| 一時マーカー | 不要。吹き出しのみを `InfoWindow.setPosition()` でクリック位置に表示 |
| モード終了 | ボタン再押下、キャンセルボタン、**Escape キー** |
| 公式リンク文言 | 「○○空港 公式照会システム」 |
| 計算エラー時 | 「照会できませんでした」を表示。公式リンクの案内は不要 |

---

## 2. 羽田空港のデータ・計算ロジック（公式 map.js より）

### 2.1 座標データ

| データ | 内容 |
|--------|------|
| **mpA, mpB, mpC, mpD** | 4滑走路（A〜D）の制限表面用座標（cd01〜cd23） |
| **landingKi** | 円錐表面のポリゴン座標（切欠きあり） |
| **landingKi_s** | 外側水平表面のポリゴン座標（切欠きあり） |
| **空港標点** | (35.55325248, 139.78122849) |

### 2.2 定数

| 表面 | 定数 |
|------|------|
| 水平表面 | 中心=空港標点、半径=4000m、高さ=51.4m |
| 円錐表面 | 中心=空港標点、半径=16536m、上限=301.4m |
| 外側水平表面 | 中心=空港標点、半径=24000m、高さ=301.4m |

### 2.3 計算式

| 関数 | 表面 | 式 |
|------|------|-----|
| math_sinnyu | 進入・延長進入 | `h = he + teihen * (1/50)` |
| math_tennia | 転移(a) | `hm = nh + (sh - nh) * shahen / ta`、`h = hm + dm * (1/7)` |
| math_tennib | 転移(b) | `h = hm + dm * (1/7)` |
| math_ensui | 円錐 | `h = 6.4 + (kyori - 4000) * (1/50) + 45`（kyori は空港標点からの距離 m） |

### 2.4 クリック位置の判定順序

公式システムは「水平表面」「円錐表面」「外側水平表面」でクリックイベントを分けている。RD Map では地図全体のクリックで判定するため、以下の順で判定する。

1. **水平表面内**（半径 4000m の円内）→ `s_surface_event` 相当の処理
2. **円錐表面内**（landingKi ポリゴン内）→ `Kikkake_event` 相当の処理
3. **外側水平表面内**（landingKi_s ポリゴン内）→ `Kikkake_s_event` 相当の処理
4. **いずれにも該当しない** → 制限表面外

ポリゴン包含判定は `google.maps.geometry.poly.containsLocation()` を使用。

### 2.5 表示の優先ルール（公式より）

- 円錐表面と進入表面が重なる → 「進入表面」を表示
- 円錐表面と延長進入表面が重なる → 「延長進入表面」を表示
- 外側水平表面と延長進入表面が重なる → 「延長進入表面」を表示
- 同一空港内で複数表面に該当 → 制限高が最も低い 1 件のみ表示
- 複数空港に該当 → すべて表示し、制限高の低い順

---

## 3. 実装フェーズ

### Phase 1：羽田空港 + 基本機能 + DJI NFZ 統合

**目標**：羽田空港の高さ制限を吹き出しで表示する。DJI NFZ との統合表示も含める。

#### Step 1-1：型定義・空港メタ情報（見積もり：0.5日）

| タスク | 内容 |
|--------|------|
| **types.ts** | `AirportRestrictionResult`, `SurfaceType`, `AirportMeta` など型を定義 |
| **airports.ts** | 16空港のメタ情報（id, name, displayName, officialUrl）を定義。Phase 1 では羽田のみ使用 |

**成果物**：`airportRestriction/types.ts`, `airportRestriction/data/airports.ts`

---

#### Step 1-2：羽田空港のデータ・計算ロジック（見積もり：2〜3日）

| タスク | 内容 |
|--------|------|
| **haneda.ts** | map.js の mpA, mpB, mpC, mpD, landingKi, landingKi_s、水平・円錐・外側水平表面の定数を TypeScript に移植 |
| **calculator.ts** | math_sinnyu, math_tennia, math_tennib, math_ensui, chk_Inclusion（PosIncludeTri, intersectM）を移植。判定順序（水平→円錐→外側水平）を実装 |
| **検証** | 公式システムのテスト座標（霞が関付近等）で計算結果が一致するか確認 |

**成果物**：`airportRestriction/data/haneda.ts`, `airportRestriction/calculator.ts`

**参照**：羽田空港公式システムの map.js（座標・計算式のソース）

---

#### Step 1-3：useAirportHeightRestrictionMode フック（見積もり：1日）

| タスク | 内容 |
|--------|------|
| **フック作成** | `useAirportHeightRestrictionMode(mapRef, mapReady)` を実装 |
| **状態** | `airportHeightRestrictionMode`, `airportHeightRestrictionModeRef` |
| **開始** | `map:start-airport-height-restriction` イベントでモード開始。他モード終了を呼ぶ |
| **終了** | `cancelAirportHeightRestrictionMode()` でモード終了 |
| **返却** | `{ airportHeightRestrictionMode, startAirportHeightRestrictionMode, cancelAirportHeightRestrictionMode }` |

**成果物**：`components/hook/useAirportHeightRestrictionMode.ts`

---

#### Step 1-4：MapView への統合（見積もり：1.5日）

| タスク | 内容 |
|--------|------|
| **フック利用** | `useAirportHeightRestrictionMode` を MapView で読み込み |
| **地図クリック** | 照会モード中はクリックで高さ制限を計算。他モードのクリックハンドラより先に判定 |
| **吹き出し表示** | 一時マーカーは不要。`InfoWindow.setPosition()` でクリック位置に吹き出しを表示。新しいクリックで上書き |
| **airportHeightRestrictionInfoRef** | 新設。`popupBuilder` で HTML を生成して表示 |
| **マーカー選択の無効化** | 照会モード中はマーカークリックで高さ制限を表示し、マーカー選択は行わない |

**成果物**：`MapView.tsx` の変更

---

#### Step 1-5：popupBuilder・吹き出し表示（見積もり：1日）

| タスク | 内容 |
|--------|------|
| **popupBuilder.ts** | 空港高さ制限結果 + DJI NFZ 結果を統合した HTML を生成 |
| **セクション分け** | `■ 空港高さ制限` と `■ DJI 飛行禁止区域` をセクション分け。DJI NFZ OFF 時は空港高さ制限のみ |
| **公式リンク** | リンク文言「○○空港 公式照会システム」。複数空港該当時は複数リンク |
| **DJI NFZ 連携** | クリック位置が DJI NFZ 内か `map.data` で判定。該当 feature の level/name を取得 |
| **エラー時** | 「照会できませんでした」を表示。公式リンクの案内は不要 |

**成果物**：`airportRestriction/popupBuilder.ts`、MapView への組み込み

---

#### Step 1-6：MapToolsPanel・ヒント表示（見積もり：0.5日）

| タスク | 内容 |
|--------|------|
| **ボタン追加** | 「高さ制限照会」ボタンを MapToolsPanel に追加。`map:start-airport-height-restriction` を発火 |
| **免責表示** | 「高さ制限は参考情報です。正式な照会は公式システムをご利用ください。」を追加 |
| **ヒント表示** | 照会モード中は「地図をクリックして高さ制限を確認してください」+ 「キャンセル」ボタンを表示 |

**成果物**：`MapToolsPanel.tsx` の変更、MapView のヒントレイヤー追加

---

#### Step 1-7：排他モード・クリーンアップ（見積もり：0.5日）

| タスク | 内容 |
|--------|------|
| **モード開始時** | `cancelMeasurementMode()`, `cancelAddMode()`, `cancelChangePosition()` を呼ぶ |
| **モード終了時** | 吹き出しをクリア |
| **Escape キー** | 照会モード中に Escape でモード終了（測定モードと同様） |

**成果物**：MapView のイベントハンドラ修正

---

#### Phase 1 完了チェックリスト

- [ ] 羽田空港周辺でのクリックで正しい高さ制限が表示される
- [ ] DJI NFZ ON 時、重複地点で「空港高さ制限」と「DJI 飛行禁止区域」がひとつの吹き出しに表示される
- [ ] 制限表面外のクリックで「制限表面外」が表示される
- [ ] 公式リンクが吹き出し内に「○○空港 公式照会システム」で表示される
- [ ] 吹き出しはマーカーなしでクリック位置に表示され、新しいクリックで上書きされる
- [ ] Escape キーでモード終了する
- [ ] 測定モード・エリア追加モードとの排他制御が動作する

---

### Phase 2：他15空港のデータ追加

**目標**：成田・伊丹・関西・中部・福岡・仙台・新千歳・函館・新潟・熊本・長崎・那覇・松山・宮崎・八尾の15空港を追加する。

#### Step 2-1：空港データの調査・移植（見積もり：空港あたり2〜4時間）

**進め方**：空港ごとに公式システムのソースコードを調査し、座標・計算式を抽出して TypeScript に移植する。

| 空港 | データファイル | 備考 |
|------|----------------|------|
| 成田 | `narita.ts` | 公式システムの構造を確認 |
| 伊丹 | `itami.ts` | 八尾・関西との重複区域あり |
| 関西 | `kansai.ts` | 誤差～100m の注意 |
| 中部 | `centrair.ts` | |
| 福岡 | `fukuoka.ts` | |
| 仙台 | `sendai.ts` | |
| 新千歳 | `shinchitose.ts` | 複数表面の表示あり |
| 函館 | `hakodate.ts` | |
| 新潟 | `niigata.ts` | |
| 熊本 | `kumamoto.ts` | ヘリポート・病院との重複あり |
| 長崎 | `nagasaki.ts` | 大村飛行場との重複あり |
| 那覇 | `naha.ts` | **中城湾平均海面** の標高系に注意 |
| 松山 | `matsuyama.ts` | |
| 宮崎 | `miyazaki.ts` | |
| 八尾 | `yao.ts` | 伊丹との重複区域あり |

**成果物**：`airportRestriction/data/` 配下に各空港のデータファイル

---

#### Step 2-2：calculator の拡張（見積もり：0.5日）

| タスク | 内容 |
|--------|------|
| **空港ルーティング** | クリック位置から全16空港に対して「該当するか・制限高」を計算 |
| **那覇の標高** | 中城湾平均海面と東京湾平均海面の違いを考慮（表示時に注記を付ける等） |

**成果物**：`calculator.ts` の拡張

---

#### Step 2-3：結合テスト・検証（見積もり：1日）

| タスク | 内容 |
|--------|------|
| **複数空港該当** | 伊丹・八尾の重複区域等で、制限高順の表示を確認 |
| **境界付近** | 各空港の制限表面境界付近で正しく「制限表面外」になるか確認 |
| **パフォーマンス** | 16空港分の計算が重くないか確認。必要なら遅延計算やキャッシュを検討 |

**成果物**：検証レポート、必要に応じた修正

---

#### Phase 2 完了チェックリスト

- [ ] 全16空港で正しい高さ制限が表示される
- [ ] 複数空港該当時に制限高順で表示される
- [ ] 那覇空港の標高系が適切に扱われている（または注記がある）
- [ ] 重複区域（伊丹・八尾等）で正しい動作をする

---

## 4. フェーズ間の依存関係

```
Step 1-1 ──────┬─────────────────────────────────────────────────────────────────
(型・メタ)     │
               │
Step 1-2 ──────┼─── Step 1-3 ─── Step 1-4 ─── Step 1-5 ─── Step 1-6 ─── Step 1-7
(羽田データ)   │    (フック)      (MapView)    (popup)      (Panel)      (排他)
               │
               └─────────────────────────────────────────────────────────────────
                                                                                  │
Phase 1 完了 ────────────────────────────────────────────────────────────────────
                                                                                  │
Step 2-1 ────────────────────────────────────────────────────────────────────────
(他15空港データ)                                                                    │
               │                                                                   │
Step 2-2 ──────┼─── Step 2-3 ────────────────────────────────────────────────────
(calculator拡張)  (結合テスト)                                                      │
                                                                                    │
Phase 2 完了 ─────────────────────────────────────────────────────────────────────
```

---

## 5. リスク・注意点

| 項目 | 内容 |
|------|------|
| **公式ソースの違い** | 各空港の公式システムは実装が異なる可能性がある。空港ごとに移植作業が必要 |
| **那覇の標高系** | 中城湾平均海面と東京湾平均海面の差は数m程度。厳密な換算が必要か要検討 |
| **URL の変更** | 成田・中部は `/Temporary/index.html` を使用。パス変更の可能性あり |
| **計算の検証** | 公式システムと結果が一致するか、複数地点で検証する必要がある |

---

## 6. 次のアクション

1. **Step 1-1** から着手する
2. 各 Step 完了後に動作確認を実施
3. Phase 1 完了後、ユーザーに確認してもらい、Phase 2 に進むか判断
