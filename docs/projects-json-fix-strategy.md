# projects.json 上書きバグ 修正方針

## 1. 再現結果（確認済み）

| 手順 | 結果 |
|------|------|
| Network で `projects.json` をブロック | fetch 失敗 |
| Hub でプロジェクトを新規作成 | 処理は完了 |
| S3 の `projects.json` を確認 | **既存案件が消え、新規案件のみ残る** |

**結論**: fetch 失敗時に `list = []` のまま上書き保存しているため、既存データが消える。

---

## 2. 影響箇所

| ファイル | 関数/処理 | トリガー | 失敗時の結果 |
|----------|-----------|----------|--------------|
| `apps/auth/src/pages/SelectProject.tsx` | `upsertProjectList` | プロジェクト新規作成 | 新規 1 件のみ保存（他が消える） |
| `apps/auth/src/pages/SelectProject.tsx` | `removeProjectFromList` | プロジェクト削除 | 空配列で上書き（全件消える） |
| `apps/hub/src/pages/HubPage/useHubPageState.ts` | handleSave 内の projects.json 同期 | プロジェクト保存（ID/名称変更時） | 現在 1 件のみ保存（他が消える） |

---

## 3. 修正方針

### 基本原則

**fetch が失敗した場合は、projects.json を上書きしない。**

---

### 3.1 SelectProject.tsx - upsertProjectList

**現状**: fetch 失敗 → `list = []` → 新規 1 件を追加して保存

**修正**:
- fetch 失敗時は **保存処理を実行せず、エラーを throw**
- 呼び出し元で catch し、ユーザーに「一覧の取得に失敗しました。しばらく待って再試行してください」等を表示

---

### 3.2 SelectProject.tsx - removeProjectFromList

**現状**: fetch 失敗 → `list = []` → 空配列を保存

**修正**:
- fetch 失敗時は **保存処理を実行せず、エラーを throw**
- 呼び出し元で catch し、削除を中止してユーザーにエラー表示

---

### 3.3 useHubPageState.ts - projects.json 同期

**現状**: fetch 失敗 → `list = []` → 現在 1 件のみ保存

**修正**:
- fetch 失敗時は **projects.json の更新をスキップ**（何も書き込まない）
- index.json の保存は成功しているため、プロジェクト本体は問題なし
- 必要に応じて `console.warn` や toast で「一覧の同期に失敗しました」と通知

---

## 4. 実装時の注意点

1. **既存の catch の扱い**
   - 現在は `console.warn` / `console.error` で握りつぶしている箇所がある
   - 修正後は fetch 失敗を明示的に検知し、保存処理に進まないようにする

2. **removeProjectFromList の「最後の 1 件を削除」**
   - fetch 成功時、`next = []` は正常（全件削除）
   - fetch 失敗時、`list = []` から得た `next = []` は異常
   - 区別するには「fetch が成功したかどうか」で判断する

3. **エラーメッセージ**
   - ユーザー向け: 「プロジェクト一覧の取得に失敗しました。ネットワークを確認して、しばらく待ってから再試行してください。」
   - 開発者向け: 既存の `console.warn` / `console.error` は維持してデバッグしやすくする

---

## 5. 修正後の確認項目

- [ ] プロジェクト新規作成時、projects.json の fetch 失敗で保存されないこと
- [ ] プロジェクト削除時、fetch 失敗で projects.json が上書きされないこと
- [ ] Hub 保存時、fetch 失敗で projects.json の更新がスキップされること
- [ ] 通常時（fetch 成功時）の挙動が変わっていないこと
