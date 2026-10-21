import { getAuditHeaders } from "@/lib/auditHeaders";

const CATALOG = String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(
  /\/+$/,
  ""
);
const CATALOG_WRITE_URL = String(
  import.meta.env.VITE_CATALOG_WRITE_URL || ""
).replace(/\/+$/, "");

let pendingWords: string[] = [];
const catalogListeners = new Set<(words: string[]) => void>();

export function setPendingCatalogWords(words: string[]) {
  pendingWords = [...words];
}

export function getPendingCatalogWords(): string[] {
  return [...pendingWords];
}

export function subscribeCatalogWords(
  listener: (words: string[]) => void
): () => void {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

function normalizeWords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const words: string[] = [];
  for (const item of raw) {
    const word = String(item ?? "").trim();
    if (!word || words.includes(word)) continue;
    words.push(word);
  }
  return words;
}

export async function fetchCatalogWords(): Promise<string[] | null> {
  if (!CATALOG) return null;
  try {
    const res = await fetch(`${CATALOG}/words.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return normalizeWords(data);
  } catch {
    return null;
  }
}

export async function writeCatalogJson(
  key: string,
  body: unknown
): Promise<boolean> {
  if (!CATALOG_WRITE_URL) return false;
  try {
    const auditHeaders = await getAuditHeaders();
    const res = await fetch(CATALOG_WRITE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auditHeaders },
      body: JSON.stringify({
        key,
        body,
        contentType: "application/json; charset=utf-8",
      }),
    });
    const raw = await res.text();
    let data: { error?: string } | null = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (!res.ok) return false;
      }
    }
    return res.ok && !data?.error;
  } catch {
    return false;
  }
}

async function writeCatalogWords(words: string[]): Promise<boolean> {
  return writeCatalogJson("catalog/v1/words.json", words);
}

/** 保存ボタン用。既にある語は足さず、新しい語だけ末尾に書く */
export async function appendCatalogWords(words: string[]): Promise<boolean> {
  const incoming = normalizeWords(words);
  if (!incoming.length) return true;
  const latest = await fetchCatalogWords();
  if (latest === null) return false;
  const saved = [...latest];
  for (const word of incoming) {
    if (saved.includes(word)) continue;
    saved.push(word);
  }
  if (saved.length !== latest.length) {
    const wrote = await writeCatalogWords(saved);
    if (!wrote) return false;
  }
  pendingWords = pendingWords.filter((word) => !saved.includes(word));
  for (const listener of catalogListeners) listener(saved);
  return true;
}

/** 共有一覧から一つの語を外す。無いときはそのまま成功にする */
export async function removeCatalogWord(word: string): Promise<boolean> {
  const target = word.trim();
  if (!target) return false;
  const latest = await fetchCatalogWords();
  if (latest === null) return false;
  const saved = latest.filter((item) => item !== target);
  if (saved.length !== latest.length) {
    const wrote = await writeCatalogWords(saved);
    if (!wrote) return false;
  }
  pendingWords = pendingWords.filter((item) => item !== target);
  for (const listener of catalogListeners) listener(saved);
  return true;
}
