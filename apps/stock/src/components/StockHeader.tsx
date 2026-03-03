const AUTH_BASE = String(import.meta.env.VITE_AUTH_BASE_URL || "/auth/");
const selectUrl = `${AUTH_BASE.replace(/\/+$/, "")}/select`;

export function StockHeader() {
  const logoUrl = "/apple-touch-icon.png";

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
