# Stock 本番環境セットアップ手順

## 前提

- AWS アカウント: ステージングと別
- CloudFront URL: https://d3uec5pspehg0b.cloudfront.net
- **ビヘイビア上限**: 5 つ（現在すべて使用中: hub, map, catalog, __g*, default）

---

## 制約と対応方針

本番のディストリビューション 1 はビヘイビアが 5 つで上限です。Stock を追加するには **1 つ削除するか、1 つのビヘイビアで Stock を収める**必要があります。

**採用案: 1 ビヘイビアで Stock を収める**

- ビヘイビア: `/stock/*` を 1 つだけ追加
- オリジン: `rdsystem-prod-stock-assets`（アプリ＋素材を同じバケットに配置）
- 既存ビヘイビアを 1 つ削除する必要あり（例: 使用頻度の低いもの）

---

## Step 1: S3 バケットの作成

### 1.1 バケット作成

- バケット名: `rdsystem-prod-stock-assets`
- リージョン: ap-northeast-1
- パブリックアクセス: ブロックオフ（CloudFront OAC でアクセスする場合はオンのままでも可）

### 1.2 オブジェクト配置

```
s3://rdsystem-prod-stock-assets/
├── stock/                    ← ビルド成果物（index.html, JS, CSS）
│   ├── index.html
│   └── assets/
│       ├── index-xxx.js
│       └── index-xxx.css
└── content/                  ← 素材アセット
    ├── csv/
    │   ├── motifs.csv
    │   └── transitions.csv
    └── image/
        ├── motif/
        │   ├── icon/
        │   └── video/
        └── transition/
            ├── icon/
            └── video/
```

### 1.3 バケットポリシー（CloudFront OAC 用）

CloudFront の Origin Access Control を使用する場合、バケットポリシーで CloudFront のアクセスを許可する。

※ 本番の CloudFront ディストリビューション ID に合わせて `AWS:SourceArn` を変更すること。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::rdsystem-prod-stock-assets/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::<本番アカウントID>:distribution/E1CBVWG3CVL11E"
                }
            }
        }
    ]
}
```

### 1.4 CORS 設定

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": [
            "https://d3uec5pspehg0b.cloudfront.net",
            "http://localhost:5176"
        ],
        "ExposeHeaders": []
    }
]
```

---

## Step 2: CloudFront オリジンの追加

ディストリビューション E1CBVWG3CVL11E にオリジンを追加する。

| 項目 | 値 |
|------|-----|
| オリジンドメイン | rdsystem-prod-stock-assets.s3.ap-northeast-1.amazonaws.com |
| オリジンパス | （空） |
| 名前 | rdsystem-prod-stock-assets |
| Origin Access | Origin access control (OAC) を推奨 |

---

## Step 3: CloudFront ビヘイビアの追加

**事前に既存ビヘイビアを 1 つ削除する必要があります。**

| 項目 | 値 |
|------|-----|
| パスパターン | `/stock/*` |
| オリジン | rdsystem-prod-stock-assets |
| 優先度 | `/stock/*` を 0〜4 の間で設定（例: 0 の前に挿入） |
| ビューワープロトコル | HTTP を HTTPS にリダイレクト |
| キャッシュポリシー | Managed-CachingOptimized |
| オリジンリクエストポリシー | Managed-CachingDisabled（HTML 用） |

※ `/stock/*.html` は別ビヘイビアにできないため、Managed-CachingDisabled を推奨。

---

## Step 4: CloudFront 関数の修正

本番の関数に以下を追加する。

### 4.1 `/stock` の末尾スラッシュ正規化（既存の auth/hub/map と同様）

```javascript
if (uri === "/stock") return { statusCode: 302, headers: { location: { value: "/stock/" } } };
```

### 4.2 `/stock/content/` のリライト

```javascript
// /stock/content/* → /content/* (rdsystem-prod-stock-assets バケット用)
if (uri.startsWith("/stock/content/")) {
  r.uri = uri.replace("/stock/content/", "/content/");
  return r;
}
```

### 4.3 SPA ルーティング（`/stock/` 配下の拡張子なし）

```javascript
if (uri.startsWith("/stock/") && !hasExt) { r.uri = "/stock/index.html"; return r; }
```

### 4.4 挿入位置

`hasExt` の定義の後、`/auth` の処理の前あたりに配置する。

---

## Step 5: 関数の全体イメージ

```javascript
function handler(event) {
  var r = event.request;
  var uri = r.uri || "/";
  var hasExt = /\.[^/]+$/.test(uri);

  // ★ /__gstatic は Google 側のパスに合わせる（先頭で処理）
  if (uri.startsWith("/__gtile/")) {
    r.uri = uri.substring("/__gtile".length);
    return r;
  }

  // 入口系の末尾スラッシュ正規化
  if (uri === "/login/" || uri === "/select/" || uri === "/callback/") {
    return { statusCode: 301, headers: { location: { value: uri.slice(0, -1) } } };
  }

  // 入口は /login に統一
  if (uri === "/" || uri === "/index.html") {
    return { statusCode: 302, headers: { location: { value: "/login" } } };
  }

  // 見かけURLは維持しつつ、実体は auth の index.html
  if (uri === "/login" || uri === "/select" || uri === "/callback") {
    r.uri = "/auth/index.html";
    return r;
  }

  // /auth /hub /map /stock の末尾スラッシュ正規化
  if (uri === "/auth") return { statusCode: 302, headers: { location: { value: "/auth/" } } };
  if (uri === "/hub")  return { statusCode: 302, headers: { location: { value: "/hub/" } } };
  if (uri === "/map")  return { statusCode: 302, headers: { location: { value: "/map/" } } };
  if (uri === "/stock") return { statusCode: 302, headers: { location: { value: "/stock/" } } };

  // /stock/content/* → /content/* (rdsystem-prod-stock-assets バケット用)
  if (uri.startsWith("/stock/content/")) {
    r.uri = uri.replace("/stock/content/", "/content/");
    return r;
  }

  // SPA 直叩き対応（拡張子なし＝ルーティング扱い）
  if (uri.startsWith("/auth/") && !hasExt) { r.uri = "/auth/index.html"; return r; }
  if (uri.startsWith("/hub/")  && !hasExt) { r.uri = "/hub/index.html";  return r; }
  if (uri.startsWith("/map/")  && !hasExt) { r.uri = "/map/index.html";  return r; }
  if (uri.startsWith("/stock/") && !hasExt) { r.uri = "/stock/index.html"; return r; }

  return r;
}
```

---

## Step 6: デプロイ

1. 環境変数 `VITE_STOCK_ASSETS_BASE_URL=https://d3uec5pspehg0b.cloudfront.net/stock/content` でビルド
2. `dist/` の内容を `stock/` プレフィックスで S3 にアップロード

```
dist/index.html → s3://rdsystem-prod-stock-assets/stock/index.html
dist/assets/*   → s3://rdsystem-prod-stock-assets/stock/assets/
```

3. 素材（content/csv/, content/image/）をステージングからコピーまたは本番用にアップロード

---

## ビヘイビアを 1 つ削除する場合

5 つ上限のため、削除候補を検討する必要があります。

| 候補 | 備考 |
|------|------|
| /__g*/* | Google タイル用。使用頻度が低ければ削除を検討 |
| その他 | 運用状況に応じて判断 |

---

## チェックリスト

- [ ] Step 1: S3 バケット rdsystem-prod-stock-assets を作成
- [ ] Step 1: バケットポリシー・CORS を設定
- [ ] Step 2: CloudFront にオリジンを追加
- [ ] Step 3: 既存ビヘイビアを 1 つ削除（必要に応じて）
- [ ] Step 3: ビヘイビア `/stock/*` を追加
- [ ] Step 4: CloudFront 関数を修正
- [ ] Step 3: ビルド成果物を stock/ にアップロード
- [ ] Step 2: 素材を content/ にアップロード
- [ ] 動作確認
