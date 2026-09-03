/**
 * catalog の S3 キーから、ブラウザが読める公開 URL（CloudFront）を作る。
 * バケット直リンクは非公開のため 403 になる。
 */
export function catalogPublicUrlFromKey(key: string): string {
  const trimmed = String(key || "").replace(/^\/+/, "");
  if (!trimmed.startsWith("catalog/v1/")) return "";

  const catalog = String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(
    /\/+$/,
    ""
  );
  if (!catalog) return "";

  const origin = catalog.replace(/\/catalog\/v1$/i, "");
  if (!origin) return "";

  return `${origin}/${encodeURI(trimmed)}`;
}
