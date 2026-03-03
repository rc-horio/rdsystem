export const ASSETS_BASE = String(
  import.meta.env.VITE_STOCK_ASSETS_BASE_URL || "/stock/assets"
).replace(/\/+$/, "");
