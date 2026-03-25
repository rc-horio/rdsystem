const AUTH_BASE = String(import.meta.env.VITE_AUTH_BASE_URL || "/auth/").replace(
  /\/+$/,
  ""
);

/**
 * プロジェクト選択へ。本番・ステージングは CloudFront 直下の /select（Hub LogoButton と同じ）。
 * ローカルは auth 開発サーバーの /auth/select へ。
 */
const selectUrl = import.meta.env.DEV
  ? `${AUTH_BASE}/select`
  : `${window.location.origin}/select`;

/** base 相対パスでロゴを参照（/stock/ 配下でも正しく解決される） */
const logoUrl = `${import.meta.env.BASE_URL}apple-touch-icon.png`;

export function StockHeader() {

  return (
    <header>
      <div id="headTop" className="stock-head-top">
        <a
          href={selectUrl}
          className="stock-logo-link"
          aria-label="メニューに戻る"
        >
          <img
            className="headpos stock-logo"
            src={logoUrl}
            alt="Redcliff"
          />
        </a>
        <div className="headpos stock-subtitle">ストックコンテンツ</div>
      </div>
    </header>
  );
}
