# apps（フロントエンド）

`rdsystem` モノレポ内の **SPA（React + Vite + TypeScript）** 群です。ドローン演出・運用まわりの案件データを扱う Web UI が、**認証・ハブ（案件編集）・地図・素材ストック** に分割されています。本番では同一オリジン配下のパス（`/auth/` `/hub/` `/map/` `/stock/`）として載せる想定です。

## システム概要（ざっくり）

| アプリ | パッケージ名 | 役割 |
|--------|--------------|------|
| **auth** | `rdauth-client` | ログイン（OIDC）、コールバック、認証後のプロジェクト選択。利用の入口。 |
| **hub** | `rdhub-client` | 案件単位のハブ。スケジュール／リソース／エリア情報／運用／現場写真などを編集・保存。帳票・エクスポート（PDF / PPTX 等）やローカルキャッシュ（Dexie）を利用。 |
| **map** | `rdmap-client` | Google マップ上での飛行エリア・地点の可視化・編集。空港周辺制限などの補助ロジック、KML 等の取り込み。クエリ（`areaName` 等）でハブからの遷移に連動可能。 |
| **stock** | `rdstock-client` | モチーフ・遷移など **素材カタログ** の閲覧・並べ替え・フッターへの組み立て、PDF 出力など。 |

**共通の技術要素**

- React 18、React Router 7、Tailwind CSS、AWS Amplify（バックエンド連携）
- 認証: `react-oidc-context` / `oidc-client-ts`（hub / map / stock は `RequireAuth` でガード。`VITE_DISABLE_AUTH=true` でローカルだけ認証オフ可）
- 静的アセット: リポジトリ直下の `static/` を各アプリの `publicDir` から参照

## サブシステム機能概要

- `RD Hub`: `RD_Hub_overview.md`
- `RD Map`: `RD_Map_overview.md`

## リポジトリからの起動

リポジトリルート（`C:\rdsystem\dev`）で:

| コマンド | 説明 |
|----------|------|
| `pnpm dev:hub` | Hub（既定ポート **5174**、`base: /hub/`） |
| `pnpm dev:map` | Map（既定ポート **5175**、`base: /map/`） |
| `pnpm dev:stock` | Stock（既定ポート **5176**、`base: /stock/`） |

**auth** はルート `package.json` にスクリプトが無いため、直接:

```bash
pnpm --filter ./apps/auth dev
```

（既定ポート **5173**、`base: /auth/`）

開発時、Hub の Vite が `/map` をローカルの Map 開発サーバーへプロキシする設定があるため、**Hub と Map を同時に立ち上げる**と横断動作の確認がしやすいです。

## ビルド・デプロイ

- ルート: `pnpm build` で `apps/**` をビルド（必要に応じて個別は `build:hub` / `build:map`）。
- 各アプリの `package.json` に **S3 同期用の `deploy` スクリプト**（`hub` / `map` はルートスクリプト、`stock` / `auth` はアプリ単体）があります。実行には AWS CLI とプロファイル等の前提があります。

## ディレクトリ

```
apps/
  auth/    # 認証・プロジェクト選択
  hub/     # 案件ハブ（メイン編集 UI）
  map/     # マップ・エリア
  stock/   # 素材ストック
```

各アプリの詳細な画面仕様や環境変数は、該当ディレクトリの `vite.config.ts`・`.env*`・ソース内コメントを参照してください。
