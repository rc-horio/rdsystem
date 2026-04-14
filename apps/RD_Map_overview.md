# RD Map 機能概要

`RD Map` は、地図上でエリア情報を可視化・編集し、案件スケジュールと結びつけて管理するサブシステムです。  
`RD Hub` から渡されたクエリ情報を使って対象エリア・対象スケジュールへフォーカスできます。

## 主な役割

- Google Maps ベースの地図表示
- エリア一覧と地図を連動した操作
- 案件／スケジュール履歴とジオメトリ情報の管理
- 空港制限などの地理条件を考慮した補助表示

## 主要機能

### 1. エリア表示・検索・選択

- サイドリストからエリアを検索・並び替え・フィルタ
- エリア選択時に地図フォーカスと詳細情報を同期
- エリアの候補（candidate）や履歴（history）を含む詳細バー連携

### 2. ジオメトリ編集

- エリア境界や候補形状の編集
- スケジュールに紐づく geometry の保存・更新・クリア
- 編集内容に応じたイベント駆動のデータ受け渡し（Sidebar / DetailBar / Map 間）

### 3. Hub 連携（ディープリンク）

- クエリ `areaName` `projectUuid` `scheduleUuid` を解釈
- 該当エリアへフォーカス後、対象案件スケジュールを選択状態に反映
- 履歴データを組み立てて、右側詳細バーへ選択イベントを送出

### 4. 制限情報・補助オーバーレイ

- 空港周辺の高度制限計算ロジック
- DJI NFZ 情報（KML / Proxy）の取り込み
- オーバーレイ表示の ON/OFF 管理

### 5. 画面モード

- PC は左サイドバー + 地図 + 右詳細バー
- モバイルは地図中心のシンプルレイアウト
- 計測パネルやツールパネルを地図上に重ねて表示

## データ連携のポイント

- エリア情報取得: `areasApi` 経由で index / detail / history を参照
- 保存処理: geometry とメタ情報を API 経由で更新
- UI 連携: カスタムイベントで各コンポーネントを疎結合に連携

## 関連ファイル（実装起点）

- `apps/map/src/pages/MapPage.tsx`
- `apps/map/src/pages/parts/MapView.tsx`
- `apps/map/src/pages/parts/SideListBar.tsx`
- `apps/map/src/pages/parts/SideDetailBar.tsx`
- `apps/map/src/pages/parts/areasApi.ts`
- `apps/map/src/pages/parts/airportRestriction/*`
