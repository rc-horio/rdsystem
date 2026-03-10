# エラー発生テストガイド

動作確認のため、意図的にサーバーエラー等を発生させる方法です。

---

## 方法1: 環境変数で不正なURLを指定（推奨）

`.env.local` を作成し、既存の `.env` / `.env.production` を上書きします。  
**本番の .env.production は触らないでください。**

### マップアプリ

```bash
# apps/map/.env.local
# 保存失敗（E001, E002, E003）を発生させる
VITE_CATALOG_WRITE_URL=https://invalid-url-for-testing.local/

# 新規エリア保存失敗（E004）を発生させる
# → 上記と同じでOK。createNewArea も writeJsonToCatalog を使用

# プロジェクト一覧取得失敗（auth）
# → apps/auth の .env.local で設定
```

### ハブアプリ

```bash
# apps/hub/.env.local
# 保存失敗（トースト）を発生させる
VITE_CATALOG_WRITE_URL=https://invalid-url-for-testing.local/

# 開催地一覧取得失敗を発生させる
VITE_CATALOG_BASE_URL=https://invalid-url-for-testing.local/
```

### 認証アプリ

```bash
# apps/auth/.env.local
# プロジェクト一覧取得失敗を発生させる
VITE_CATALOG_BASE_URL=https://invalid-url-for-testing.local/
```

### ストックアプリ

```bash
# apps/stock/.env.local
# motifs.csv 取得失敗・useMotifData エラーを発生させる
VITE_STOCK_ASSETS_BASE_URL=https://invalid-url-for-testing.local/
```

---

## 方法2: ブラウザの DevTools で Network をブロック

1. F12 で DevTools を開く
2. **Network** タブ → **Network request blocking** を有効化
3. ブロックする URL パターンを追加（例: `*lambda*`、`*catalog*`）
4. 保存や一覧取得などの操作を実行

→ 保存失敗、プロジェクト一覧取得失敗などを確認できます。

---

## 方法3: 一時的なコード変更（デバッグ用）

特定の API 呼び出しの直前に `throw` を入れる。**確認後は必ず元に戻す。**

### 例: マップ保存で E001 を発生させる

```ts
// apps/map/src/pages/parts/areasApi.ts
// writeJsonToCatalog 内の fetch の直前に追加
export async function writeJsonToCatalog(key: string, body: unknown): Promise<boolean> {
  if (import.meta.env.DEV && window.location.search.includes("forceError=E001")) {
    throw new Error("E001: プロジェクト一覧の保存に失敗（テスト用）");
  }
  // ...
}
```

URL に `?forceError=E001` を付けてアクセスするとエラーが発生。

---

## エラー種別と発生させる操作

| エラー | アプリ | 発生させる操作 | 方法 |
|--------|--------|----------------|------|
| E001 プロジェクト一覧保存失敗 | マップ | エリアを編集して SAVE | 方法1: VITE_CATALOG_WRITE_URL を不正に |
| E002 エリア一覧保存失敗 | マップ | エリアを編集して SAVE | 方法1（同上） |
| E003 保存処理中エラー | マップ | 保存中に例外が発生 | 方法3 |
| E004 新規エリア保存失敗 | マップ | 新規エリアを作成して確定 | 方法1 |
| E005 エリアID取得不可 | マップ | データ不整合時（再現が難しい） | - |
| 保存トースト | ハブ | スケジュールを編集して SAVE | 方法1 |
| 開催地一覧取得失敗 | ハブ | ハブの AreaInfo タブを開く | 方法1 |
| プロジェクト一覧取得失敗 | 認証 | ログイン後プロジェクト選択画面 | 方法1 |
| 削除失敗 | 認証 | プロジェクトを削除 | 方法1 |
| PDF 生成失敗（E301） | ストック | PDF エクスポート | 方法3 または 方法2 |
| motifs.csv 取得失敗 | ストック | ストックページを開く | 方法1 |
| スクリーンショット失敗 | ハブ | 飛行エリアのスクリーンショット保存 | 方法2（Map の iframe をブロック） |
| DJI NFZ 失敗 | マップ | 飛行禁止エリアチェックをオン | 方法1: VITE_DJI_NFZ_PROXY_URL を不正に |

---

## 注意事項

- `.env.local` は **コミットしないでください**（各アプリの .gitignore に `.env` が含まれている場合、`.env.local` も同様に無視される想定）
- テスト後は `.env.local` を削除するか、正しい URL に戻してください
- 方法3 のコード変更は **コミットしないでください**
