# areas.json 上書きバグ 修正方針

## 1. 再現結果（確認済み）

| 手順 | 結果 |
|------|------|
| Network で `areas.json` をブロック | fetch 失敗 |
| エリアの新規作成 or 編集保存 or 削除 | 処理は完了 |
| S3 の `areas.json` を確認 | **既存エリアが消え、操作したエリアのみ / 空になる** |

**結論**: fetch 失敗時に `list = []` のまま上書き保存しているため、既存データが消える。（projects.json と同様のパターン）

---

## 2. 影響箇所

| ファイル | 関数/処理 | トリガー | 失敗時の結果 |
|----------|-----------|----------|--------------|
| `apps/map/src/pages/parts/areasApi.ts` | `upsertAreasListEntryFromInfo` | エリア新規作成・編集保存 | 新規/編集 1 件のみ保存（他が消える） |
| `apps/map/src/pages/parts/areasApi.ts` | `removeAreasListEntryByUuid` | エリア削除 | 空配列で上書き（全件消える） |

### 呼び出し元

| 呼び出し元 | 関数 | トリガー |
|------------|------|----------|
| `areasApi.ts` | `createNewArea` → `upsertAreasListEntryFromInfo` | エリア新規作成（MapView） |
| `SideListBar.tsx` | `upsertAreasListEntryFromInfo` | エリア編集保存 |
| `SideListBar.tsx` | `removeAreasListEntryByUuid` | エリア削除保存 |

### データフロー

```
fetchAreasList()  ← getJson() 使用
  ↓ 失敗時: getJson が null → fetchAreasList は [] を返す
  ↓
upsertAreasListEntryFromInfo / removeAreasListEntryByUuid
  ↓ list = [] のまま処理
  ↓
saveAreasList(list)  ← 空 or 1件のみで上書き
```

---

## 3. 修正方針

### 基本原則

**fetch が失敗した場合は、areas.json を上書きしない。**

---

### 3.1 areasApi.ts - fetchAreasList の扱い

**現状**: `getJson` が失敗時 `null` を返す → `fetchAreasList` は `[]` を返す

**修正案**:
- **案A**: 保存用の専用関数 `fetchAreasListForWrite` を追加し、失敗時は throw
- **案B**: `fetchAreasList` に `strict?: boolean` を追加。`strict: true` の時は失敗で throw
- **案C**: `getJson` の戻り値で「失敗」を検知できるようにし、`upsert` / `remove` 内で throw

**推奨: 案A**  
読み取り専用（`isAreaNameDuplicated` 等）は従来どおり `fetchAreasList`（失敗時 `[]`）を使用。保存処理では `fetchAreasListForWrite` を使い、失敗時は throw する。

---

### 3.2 upsertAreasListEntryFromInfo

**現状**: `fetchAreasList()` → 失敗時 `list = []` → 1 件追加して保存

**修正**:
- `fetchAreasListForWrite()` を使用（失敗時 throw）
- 呼び出し元（createNewArea, SideListBar）で catch し、エラー表示

---

### 3.3 removeAreasListEntryByUuid

**現状**: `fetchAreasList()` → 失敗時 `list = []` → `next = []` で保存

**修正**:
- `fetchAreasListForWrite()` を使用（失敗時 throw）
- 呼び出し元（SideListBar）で catch し、エラー表示

---

### 3.4 呼び出し元のエラーハンドリング

| 呼び出し元 | 現状 | 修正 |
|------------|------|------|
| `createNewArea` (MapView から呼ばれる) | `okAreas` が false で alert | throw を catch して alert。既存の `E002_AREAS_LIST` 等を活用 |
| `SideListBar` 編集保存 | `okAreas` が false で alert | 同様 |
| `SideListBar` 削除保存 | `okRemove` が false で console.warn のみ | throw を catch して alert |

---

## 4. 実装時の注意点

1. **fetchAreasListForWrite の実装**
   - `getJson` を直接使うか、`fetch` を自前で呼ぶか
   - `getJson` は `!r.ok` または catch で `null` を返す
   - `fetchAreasListForWrite` は `getJson` の結果が `null` の場合に throw

2. **エラーメッセージ**
   - ユーザー向け: 「エリア一覧の取得に失敗しました。ネットワークを確認して、しばらく待ってから再試行してください。」
   - 既存の `E002_AREAS_LIST`（エリア一覧保存失敗）と整合させる

3. **isAreaNameDuplicated**
   - 読み取り専用のため `fetchAreasList` のまま（失敗時 `[]`）
   - 失敗時は重複チェックができないが、`createNewArea` 内で `upsertAreasListEntryFromInfo` が throw するため、保存は行われない

---

## 5. 修正後の確認項目

- [ ] エリア新規作成時、areas.json の fetch 失敗で保存されないこと
- [ ] エリア編集保存時、fetch 失敗で areas.json が上書きされないこと
- [ ] エリア削除時、fetch 失敗で areas.json が上書きされないこと
- [ ] 通常時（fetch 成功時）の挙動が変わっていないこと
