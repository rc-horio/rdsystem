# Stock 素材アセット移行手順（content/ あり）

## 目標構成

| 種類 | URL パス | S3 バケット | S3 キー |
|------|----------|-------------|---------|
| ビルドアセット | `/stock/assets/` | rc-rdsystem-dev-stock | stock/assets/ |
| 素材アセット | `/stock/content/` | rc-rdsystem-dev-stock-assets | content/image/, content/csv/ |

---

## S3 構成

```
s3://rc-rdsystem-dev-stock-assets/
└── content/
    ├── csv/
    │   └── motifs.csv
    └── image/
        ├── motif/
        │   ├── icon/
        │   └── video/
        └── transition/
            ├── icon/
            └── video/
```

---

## 実施手順

### Step 1: S3 データ配置

rc-rdsystem-dev-stock-assets バケットに、次の構成でデータを配置する。

- `content/csv/` に motifs.csv など
- `content/image/motif/` にモチーフ画像・動画
- `content/image/transition/` にトランジション画像・動画

※ 既存の `assets/` から移行する場合は、`assets/csv/` → `content/csv/`、`assets/image/` → `content/image/` にコピー。

---

### Step 2: CloudFront 関数の修正

`/stock/content/` を `/content/` にリライトする処理を追加する。

**変更箇所：** 既存の `/stock/assets/` の処理を、次の内容に置き換える。

```javascript
// 変更前
if (uri.startsWith('/stock/assets/')) {
  r.uri = uri.replace('/stock/assets/', '/assets/');
  return r;
}

// 変更後
if (uri.startsWith('/stock/content/')) {
  r.uri = uri.replace('/stock/content/', '/content/');
  return r;
}
```

---

### Step 3: CloudFront ビヘイビアの追加

| 操作 | パスパターン | オリジン | 優先度 |
|------|--------------|----------|--------|
| 追加 | `/stock/content/*` | rc-rdsystem-dev-stock-assets | `/stock/*` より前（数値を小さく） |

---

### Step 4: 環境変数の更新

| ファイル | キー | 変更後の値 |
|----------|------|------------|
| `.env.staging` | `VITE_STOCK_ASSETS_BASE_URL` | `https://d3jv4hxjgqnm4c.cloudfront.net/stock/content` |
| `.env.production` | `VITE_STOCK_ASSETS_BASE_URL` | `https://d3uec5pspehg0b.cloudfront.net/stock/content` |
| `.env.local` | `VITE_STOCK_ASSETS_BASE_URL` | `https://rc-rdsystem-dev-stock-assets.s3.ap-northeast-1.amazonaws.com/content` |

※ 末尾の `/` は不要（assetsBase.ts で除去される）

---

### Step 5: アプリのビルド・デプロイ

1. 環境変数を反映してビルド
2. rc-rdsystem-dev-stock バケットへデプロイ

---

### Step 6: 動作確認

- ステージング: https://d3jv4hxjgqnm4c.cloudfront.net/stock/
- モチーフ画像・動画・CSV が正しく表示・取得できることを確認

---

### Step 7: 旧ビヘイビアの削除

動作確認後、次を削除する。

- `/stock/assets/csv/*`
- `/stock/assets/image/*`

---

### Step 8: 旧 S3 データの削除（任意）

`assets/` 配下のデータが不要になったら削除する。

---

## 処理フロー（フルURL）

### 素材アセット（画像）

| ステップ | 内容 |
|----------|------|
| ① ブラウザ | `https://d3jv4hxjgqnm4c.cloudfront.net/stock/content/image/motif/icon/sc_0001.jpg` |
| ② ビヘイビア | `/stock/content/*` → オリジン: rc-rdsystem-dev-stock-assets |
| ③ 関数 | `/stock/content/image/...` → `/content/image/...` にリライト |
| ④ S3 | `s3://rc-rdsystem-dev-stock-assets/content/image/motif/icon/sc_0001.jpg` |

### 素材アセット（CSV）

| ステップ | 内容 |
|----------|------|
| ① ブラウザ | `https://d3jv4hxjgqnm4c.cloudfront.net/stock/content/csv/motifs.csv` |
| ② ビヘイビア | `/stock/content/*` → オリジン: rc-rdsystem-dev-stock-assets |
| ③ 関数 | `/stock/content/csv/...` → `/content/csv/...` にリライト |
| ④ S3 | `s3://rc-rdsystem-dev-stock-assets/content/csv/motifs.csv` |

---

## チェックリスト

- [ ] Step 1: S3 に content/csv/, content/image/ を配置
- [ ] Step 2: CloudFront 関数を修正
- [ ] Step 3: ビヘイビア `/stock/content/*` を追加
- [ ] Step 4: 環境変数を更新
- [ ] Step 5: アプリをビルド・デプロイ
- [ ] Step 6: 動作確認
- [ ] Step 7: 旧ビヘイビアを削除
- [ ] Step 8: 旧 S3 データを削除（任意）
