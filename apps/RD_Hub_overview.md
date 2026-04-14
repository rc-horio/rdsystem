# RD Hub 機能概要

`RD Hub` は、案件データを編集・運用するためのメイン画面です。  
画面は PC / モバイル両対応で、案件内のスケジュール単位で情報を管理します。

## 主な役割

- 案件の編集ハブとして、`リソース` `エリア` `オペレーション` `現場写真` を一元管理
- スケジュールの作成・選択・複製・削除
- 案件データの保存（保存中オーバーレイ表示あり）
- `RD Map` との連携（エリア情報・UUIDを介した遷移）

## タブ別機能

### 1. リソース

- 現場情報（場所）や機材・人員関連データを入力
- 例: ドローン、バッテリー、モジュール、車両、備品、ホテル、人員
- スケジュールごとの resource 情報を深めマージで更新
- モバイルはアコーディオン、PCは3ペイン構成

### 2. エリア

- エリア情報（座標・配置関連値など）の確認／編集
- 案件名・スケジュール名を使った帳票出力
- ダンスファイル指示書のエクスポート（PDF / PPTX）
- 必要に応じて地図キャプチャを取得して資料に反映

### 3. オペレーション

- 機体配置のグリッド設定（x/y、間隔）を管理
- エリア情報の値を参照しつつ配置パラメータを同期
- 入力値の正規化、複数ブロック向け表示モデル生成
- モバイル利用時の画面回転・リサイズでもフルスクリーン状態を復元

### 4. 現場写真

- 画像アップロード、一覧管理、プレビュー表示
- HEIC 画像の JPEG 変換に対応
- スケジュール単位で写真メモを保持
- 画像削除やアップロード処理を編集モードに連動

## 画面構成の特徴

- PC は左固定サイドバー + 右タブ表示
- モバイルは上部ヘッダー + 横スクロールタブ
- 認証必須（開発時は `VITE_DISABLE_AUTH=true` でバイパス可能）
- 変更内容はスケジュール単位で管理

## 関連ファイル（実装起点）

- `apps/hub/src/pages/HubPage/HubPage.tsx`
- `apps/hub/src/pages/HubPage/DesktopLayout.tsx`
- `apps/hub/src/pages/HubPage/MobileLayout.tsx`
- `apps/hub/src/features/hub/tabs/Resource/index.tsx`
- `apps/hub/src/features/hub/tabs/AreaInfo/index.tsx`
- `apps/hub/src/features/hub/tabs/Operation/index.tsx`
- `apps/hub/src/features/hub/tabs/SitePhotos/index.tsx`
