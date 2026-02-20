# プロジェクト削除 実装方針

## 回答の整理

| # | 質問 | 回答 |
|---|------|------|
| 1 | 写真も削除する？ | はい |
| 2 | Delete URL を分ける？ | 今後 RD ○○ を追加予定。**同じ URL でよい**（全アプリで同一カタログを共有） |
| 3 | エリア紐づきの解除 | 必要。紐づきがある場合は**警告＋確認ポップアップ**を表示 |
| 4 | 削除順序 | 推奨方式で（下記） |

---

## 2. VITE_CATALOG_DELETE_URL について

**分けなくてよい**です。RD Hub / RD Map / 今後追加する RD ○○ は、すべて同じカタログ（S3）を参照するため、**同一の Delete Lambda URL を全アプリで共有**する形で問題ありません。

---

## 3. 削除フロー（推奨順序）

```
1. 紐づきチェック
   └─ areas.json を取得 → 各 area index を取得 → history に projectuuid が含まれるか判定
   
2. 紐づきあり → 確認ポップアップ
   「このプロジェクトは以下のエリアに紐づいています。削除すると紐づきが解除されます。
    エリア: ○○, △△, ...
    削除しますか？」
   
3. ユーザーが OK
   ├─ 3a. エリアの history から該当 projectuuid を除去して保存（紐づき解除）
   ├─ 3b. プロジェクト index.json から photo keys を抽出
   ├─ 3c. Delete Lambda: index.json + 全 photo keys を削除
   └─ 3d. projects.json から該当プロジェクトを除外して WRITE Lambda で保存
```

**順序の理由**
- 先にエリアを更新してからプロジェクトを削除することで、参照整合性を保つ
- 写真は index.json 削除前に keys を取得する必要があるため、3b → 3c の順

---

## 4. 実装タスク一覧

### Phase 1: 基盤

| # | タスク | 対象 | 内容 |
|---|--------|------|------|
| 1.1 | env 設定 | auth | `VITE_CATALOG_DELETE_URL` を .env.local / .env.staging / .env.production に追加 |
| 1.2 | 型定義 | auth | vite-env.d.ts に `VITE_CATALOG_DELETE_URL` を追加 |

### Phase 2: カタログ操作ユーティリティ（auth 内）

| # | タスク | 内容 |
|---|--------|------|
| 2.1 | エリア一覧取得 | `fetchAreasList()` - areas.json を取得 |
| 2.2 | エリア index 取得 | `fetchRawAreaInfo(areaUuid)` - area index を取得 |
| 2.3 | エリア index 保存 | `saveAreaInfo(areaUuid, info)` - WRITE Lambda で保存 |
| 2.4 | プロジェクト index 取得 | `fetchProjectIndex(uuid)` - 写真 keys 抽出用 |
| 2.5 | 一括削除 | `deleteFromCatalog(keys)` - Delete Lambda 呼び出し |

※ map の areasApi と同等のロジックを auth 用に実装（または共通パッケージ化）

### Phase 3: 削除ロジック

| # | タスク | 内容 |
|---|--------|------|
| 3.1 | 紐づき検出 | プロジェクト uuid を参照するエリア一覧を取得 |
| 3.2 | 紐づきあり時の確認 | エリア名一覧を表示した confirm ダイアログ |
| 3.3 | エリア更新 | 該当エリアの history から projectuuid を除去して保存 |
| 3.4 | 写真 keys 抽出 | `schedules[].photos[].key` を再帰的に収集（catalog/v1/projects/{uuid}/ 配下のみ） |
| 3.5 | S3 削除 | index.json + 写真 keys を Delete Lambda に送信 |
| 3.6 | projects.json 更新 | 該当 uuid を除外して WRITE Lambda で保存 |

### Phase 4: UI・エラー処理

| # | タスク | 内容 |
|---|--------|------|
| 4.1 | ローディング | 削除中はボタン無効化 or スピナー表示 |
| 4.2 | 成功時 | 一覧を再取得、選択をクリア、成功メッセージ |
| 4.3 | 失敗時 | alert でエラー内容を表示 |

---

## 5. Delete Lambda の拡張（写真一括削除）

**現状**: `key` または `keys` で個別オブジェクトを指定して削除。

**対応**: 現状のまま利用可能。フロントで以下を行う。
1. プロジェクト index.json を取得
2. `schedules[].photos[].key` を抽出（`catalog/v1/` で始まり、該当 uuid 配下のもののみ）
3. `keys: [index.json の key, ...photo keys]` で Delete Lambda を 1 回呼び出し

※ プレフィックス指定の一括削除は不要。index.json に写真 key が含まれているため。

---

## 6. エリア history の更新仕様

**対象**: `catalog/v1/areas/{areaUuid}/index.json` の `history` 配列

**操作**: `history` から `projectuuid === 削除対象 uuid` の要素を除去

```ts
const nextHistory = (raw.history || []).filter(
  (h: any) => (h?.projectuuid || "") !== projectUuid
);
```

---

## 7. ファイル構成（案）

```
apps/auth/
├── src/
│   ├── lib/
│   │   ├── auditHeaders.ts      # 既存
│   │   └── catalogApi.ts        # 新規: fetchAreasList, fetchRawAreaInfo, saveAreaInfo,
│   │                            #       fetchProjectIndex, deleteFromCatalog
│   └── pages/
│       └── SelectProject.tsx    # handleDeleteClick に削除フローを実装
```

---

## 8. 確認ポップアップ文言（案）

**紐づきなし**
> プロジェクト「{projectId} - {projectName}」を削除しますか？
> この操作は取り消せません。

**紐づきあり**
> このプロジェクトは以下のエリアに紐づいています。削除すると紐づきが解除されます。
>
> エリア: {areaName1}, {areaName2}, ...
>
> 削除しますか？この操作は取り消せません。
