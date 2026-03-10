# projects.json データ消失 調査ガイド

## 事象

- `s3://rc-rdsystem-dev-catalog/catalog/v1/projects.json` のデータが空になる
- 個別プロジェクトのメタデータ（例: `projects/02295da8-defe-4551-a582-a7a91bbc8ae4/index.json`）は残っている

---

## 1. 調査の優先順位

| 優先度 | 調査対象 | 目的 |
|--------|----------|------|
| 1 | **DynamoDB 監査ログ** | 誰が・いつ `projects_list_update` を実行したか特定 |
| 2 | **CloudWatch Logs（rdhub-projectSave Lambda）** | リクエスト内容・エラーの有無を確認 |
| 3 | **S3 バージョニング** | 過去の projects.json の内容を復元可能か確認 |
| 4 | **コードの潜在バグ** | 空配列を上書きする条件を特定 |

---

## 2. DynamoDB 監査ログの確認

Lambda `rdhub-projectSave` は `projects.json` への書き込み時に **action: `projects_list_update`** を DynamoDB に記録します。

### テーブル構造（推定）

- **pk**: `DATE#YYYY-MM-DD`
- **sk**: `YYYY-MM-DDTHH:MM:SS.mmmZ#itemId`
- **action**: `projects_list_update`（projects.json 書き込み時）
- **userId**, **userEmail**: 操作者
- **target**: `catalog/v1/projects.json`
- **details**: `{ "key": "catalog/v1/projects.json" }`

### 確認手順

1. AWS Console → DynamoDB → テーブル一覧
2. 環境変数 `AUDIT_TABLE_NAME` で指定されているテーブルを開く（rdhub-projectSave Lambda の設定を確認）
3. スキャンまたはクエリで `action = "projects_list_update"` を検索
4. 事象発生時期のレコードを時系列で確認し、**誰が・いつ** 書き込んだかを特定

### AWS CLI 例

```bash
# テーブル名は環境に合わせて置換
aws dynamodb query \
  --table-name <AUDIT_TABLE_NAME> \
  --key-condition-expression "pk = :pk" \
  --expression-attribute-values '{":pk":{"S":"DATE#2025-03-10"}}' \
  --filter-expression "action = :action" \
  --expression-attribute-values '{":pk":{"S":"DATE#2025-03-10"},":action":{"S":"projects_list_update"}}'
```

---

## 3. CloudWatch Logs の確認

### ロググループ

- Lambda 名: `rdhub-projectSave`（または類似名）
- ログストリーム: 実行日時ごと

### 確認内容

- `projects_list_update` に紐づくリクエストの `body` 内容（空配列 `[]` が送られていないか）
- エラー・例外の有無
- リクエストのタイムスタンプ

### 注意

Lambda は受け取った `body` をそのまま S3 に保存するため、**空配列が送信されれば空の projects.json が保存される**。

---

## 4. S3 バージョニングの確認

### 確認手順

1. S3 バケット `rc-rdsystem-dev-catalog` のバージョニングが有効か確認
2. 有効な場合: `catalog/v1/projects.json` の「以前のバージョン」を一覧
3. 事象発生前のバージョンをダウンロードし、内容を確認・復元

### バージョニングが無効な場合

- 過去の内容は復元できない
- 今後の再発防止のため、バージョニングの有効化を検討

---

## 5. コード上の潜在原因（推測）

`projects.json` を**書き込む**箇所は次の 3 つです。

### 5.1 SelectProject.tsx - `removeProjectFromList`

**ファイル**: `apps/auth/src/pages/SelectProject.tsx` (101-132行)

```typescript
async function removeProjectFromList(uuid: string): Promise<ListRow[]> {
  let list: ListRow[] = [];
  try {
    const r = await fetch(LIST_URL, { cache: "no-cache" });
    if (r.ok) {
      const json = await r.json();
      if (Array.isArray(json)) list = json;
    }
  } catch (e) {
    console.warn("[SelectProject] fetch projects.json failed", e);
  }

  const next = list.filter((x) => x.uuid !== uuid);
  // ...
  // body: next を Lambda に送信
}
```

**リスク**: `fetch` が失敗（ネットワークエラー、404、JSON パースエラー）すると `list = []` のまま。  
`next = [].filter(...) = []` となり、**空配列が projects.json に上書きされる**。

**トリガー**: プロジェクト削除時、かつ fetch 失敗時。

---

### 5.2 SelectProject.tsx - `upsertProjectList`

**ファイル**: `apps/auth/src/pages/SelectProject.tsx` (66-99行)

**リスク**: fetch 失敗時は `list = []`。新規追加時は `next = [row]` のみになるため、他プロジェクトが消える（空にはならない）。

---

### 5.3 useHubPageState.ts - プロジェクト保存時の projects.json 同期

**ファイル**: `apps/hub/src/pages/HubPage/useHubPageState.ts` (653-699行)

```typescript
const listRes = await fetch(listUrl, { cache: "no-cache" });
let list: any[] = [];
if (listRes.ok) {
  list = (await listRes.json()) ?? [];
}
// 現在のプロジェクト 1 件を list に追加/更新して保存
```

**リスク**: `listRes.ok` が false（404、500、ネットワークエラー）の場合、`list = []`。  
現在のプロジェクト 1 件だけを追加して保存するため、**他プロジェクトが消える**。  
（プロジェクトが 1 件もない状態で保存すると、空にはならないが 1 件だけになる）

---

## 6. 想定シナリオ

| シナリオ | 発生条件 | 結果 |
|----------|----------|------|
| A | SelectProject でプロジェクト削除 + fetch 失敗 | **空配列 [] で上書き** |
| B | Hub でプロジェクト保存 + fetch 失敗 | 1 件だけ残る（他が消える） |
| C | projects.json が既に空/破損 + いずれかの操作 | 空のまま上書きされる |
| D | 複数ユーザーの同時操作（競合） | 古い list で上書きし、他ユーザーの変更が消える |

**「中身が削除された」が空配列 `[]` の場合、シナリオ A が最も疑わしい。**

---

## 7. 再発防止の検討事項

1. **fetch 失敗時の扱い**
   - `fetch` が失敗した場合、projects.json の上書きを**行わない**
   - ユーザーに「一覧の取得に失敗しました。しばらく待って再試行してください」と表示

2. **楽観的ロック**
   - projects.json に `version` や `updatedAt` を付与し、更新時に競合チェック

3. **S3 バージョニング**
   - バケットのバージョニングを有効化し、誤上書き時の復元を可能にする

4. **監査ログの拡張**
   - `details` に `body` の件数（例: `projectsCount: 5`）を記録し、空配列での上書きを追跡しやすくする

---

## 8. チェックリスト

- [ ] DynamoDB で `projects_list_update` の履歴を確認した
- [ ] 事象発生時期の操作者（userId / userEmail）を特定した
- [ ] CloudWatch Logs で該当リクエストの body を確認した
- [ ] S3 バージョニングの有無を確認した
- [ ] 可能であれば過去バージョンから復元した
- [ ] 上記のコード修正を検討した
