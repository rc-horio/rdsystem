# Stock 本番環境セットアップ手順

## 前提

- AWS アカウント: ステージングと別
- CloudFront URL: https://d3uec5pspehg0b.cloudfront.net
- ディストリビューション例: `E1CBVWG3CVL11E`（実 ID はコンソールで確認）
- **ビヘイビア数**: CloudFront の拡張により、**5 つを超えて追加可能**。既存ビヘイビアを削らず Stock 用を足せる。

---

## 方針（オリジンとビヘイビア）

本番が **ビルド用バケット**と**素材用バケット**に分かれている場合（例: `rdsystem-prod-stock` / `rdsystem-prod-stock-assets`）、CloudFront でも **オリジンを 2 つ**用意し、パスで振り分ける。**素材バケットだけ**をオリジンにすると、`/stock/index.html` 等が存在せず **404 になる**。

- **ビヘイビア**: 次の **2 本**（**上から先にマッチする順**。`/stock/content/*` を **`/stock/*` より上**に置く）。

| 優先順（上ほど先） | パスパターン | オリジン（S3） | 役割 |
|--------------------|--------------|----------------|------|
| 1 | `/stock/content/*` | `rdsystem-prod-stock-assets` | 関数で `/content/*` にリライトし、`content/image/...` 等を取得 |
| 2 | `/stock/*` | `rdsystem-prod-stock` | `stock/index.html`・`stock/assets/*`（ビルド成果物） |

どちらのビヘイビアでも **Viewer protocol policy**: Redirect HTTP to HTTPS。**オリジンアクセス**: バケットごとに OAC とバケットポリシー。**Viewer request** にはどちらも **同じ関数**を紐づけ（`/stock/content/` のリライトと SPA 用 `/stock/index.html` 振り替えが効く）。

キャッシュは例として `/stock/content/*` は Managed-CachingOptimized（更新時は invalidation）、`/stock/*` も同様。HTML の即時反映が必要なら `/stock/*` だけ別ポリシーを検討。

**1 バケットにまとめる運用**に変えたい場合のみ、単一オリジン＋`/stock/*` 1 本でもよい（そのときは `stock/` と `content/` を同じバケットに配置し、関数のリライトはそのまま）。

---

## Step 1: S3 バケットとオブジェクト配置

### 1.1 ビルド成果物（SPA）— `rdsystem-prod-stock`

- リージョン: ap-northeast-1（既存に合わせる）
- オブジェクト例:

```
s3://rdsystem-prod-stock/
└── stock/
    ├── index.html
    └── assets/
        ├── index-xxx.js
        └── index-xxx.css
```

### 1.2 素材 — `rdsystem-prod-stock-assets`

- リージョン: ap-northeast-1
- オブジェクト例（ブラウザは `/stock/content/...` で触り、CloudFront 関数が `/content/...` にリライト）:

```
s3://rdsystem-prod-stock-assets/
└── content/
    ├── csv/
    └── image/
        └── motif/
            └── icon/
                └── sc_0001_HappyNewYear.jpg
```

### 1.3 バケットポリシー（CloudFront OAC 用）

**両バケット**に、同一ディストリビューションからの `s3:GetObject` を許可する（バケット ARN だけ差し替え）。

※ `AWS:SourceArn` は本番のディストリビューション ID に合わせる。

`rdsystem-prod-stock` 用:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": { "Service": "cloudfront.amazonaws.com" },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::rdsystem-prod-stock/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::<本番アカウントID>:distribution/E1CBVWG3CVL11E"
                }
            }
        }
    ]
}
```

`rdsystem-prod-stock-assets` 用: 上記の `Resource` を `arn:aws:s3:::rdsystem-prod-stock-assets/*` に変更。

### 1.4 CORS 設定

素材バケット側で、フロントのオリジンから読む必要があれば許可する。例:

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

ディストリビューションに **次の 2 オリジン**を登録する（未登録のものだけ追加）。

| 名前（例） | オリジンドメイン | オリジンパス | 用途 |
|-------------|------------------|--------------|------|
| rdsystem-prod-stock | rdsystem-prod-stock.s3.ap-northeast-1.amazonaws.com | （空） | SPA・`/stock/assets/*` |
| rdsystem-prod-stock-assets | rdsystem-prod-stock-assets.s3.ap-northeast-1.amazonaws.com | （空） | リライト後の `/content/*` |

どちらも **Origin Access**: OAC 推奨（バケットポリシーと対応させる）。

---

## Step 3: CloudFront ビヘイビアの追加

既存ビヘイビアを削除する必要はない（ビヘイビア数に余裕がある前提）。

1. **`/stock/content/*`** を追加（`/stock/*` より**上**の順序にする）  
   - **オリジン**: `rdsystem-prod-stock-assets`
2. **`/stock/*`** を追加  
   - **オリジン**: `rdsystem-prod-stock`

両方に **同じ** Viewer request 関数（Step 4〜5）を関連付ける。

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
2. `dist/` の内容を **ビルド用バケット**へ `stock/` プレフィックスでアップロード

```
dist/index.html → s3://rdsystem-prod-stock/stock/index.html
dist/assets/*   → s3://rdsystem-prod-stock/stock/assets/
```

3. 素材は **素材用バケット**の `content/` 以下へ（例: `s3://rdsystem-prod-stock-assets/content/image/motif/icon/sc_0001_HappyNewYear.jpg`）

---

## チェックリスト

- [ ] Step 1: `rdsystem-prod-stock` に `stock/index.html`・`stock/assets/*` を配置
- [ ] Step 1: `rdsystem-prod-stock-assets` に `content/` 以下を配置
- [ ] Step 1: 両バケットに OAC 用バケットポリシー（必要なら CORS）
- [ ] Step 2: CloudFront にオリジン `rdsystem-prod-stock`・`rdsystem-prod-stock-assets` を追加
- [ ] Step 3: ビヘイビア `/stock/content/*` → 素材オリジン（`/stock/*` より上）
- [ ] Step 3: ビヘイビア `/stock/*` → ビルド用オリジン
- [ ] Step 4: CloudFront Viewer request 関数を更新し、上記 2 ビヘイビアに関連付け
- [ ] Step 6: ビルドは `rdsystem-prod-stock`、素材は `rdsystem-prod-stock-assets` にデプロイ
- [ ] `apps/auth/.env.production` の `VITE_STOCK_READY=true` に変更し Auth を再デプロイ
- [ ] 動作確認（`/stock/`・素材 URL・プロジェクト選択からの遷移）
