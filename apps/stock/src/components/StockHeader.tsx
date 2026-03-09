const AUTH_BASE = String(import.meta.env.VITE_AUTH_BASE_URL || "/auth/");
const selectUrl = `${AUTH_BASE.replace(/\/+$/, "")}/select`;

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
