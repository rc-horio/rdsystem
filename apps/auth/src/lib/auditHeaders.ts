/**
 * 操作ログ用に Cognito のユーザー情報を取得し、Lambda リクエストヘッダーとして返す
 * 開発環境（VITE_DISABLE_AUTH=true または import.meta.env.DEV）では Cognito 未認証でも
 * 保存可能なよう、プレースホルダーを返す
 */
import { getCurrentUser } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";

export interface AuditHeaders {
  "X-User-Sub": string;
  "X-User-Email": string;
}

const DEV_AUDIT_HEADERS: AuditHeaders = {
  "X-User-Sub": "dev-local",
  "X-User-Email": "local@dev",
};

export async function getAuditHeaders(): Promise<AuditHeaders> {
  const isDevBypass =
    import.meta.env.VITE_DISABLE_AUTH === "true" || import.meta.env.DEV;
  if (isDevBypass) {
    return DEV_AUDIT_HEADERS;
  }

  try {
    const [user, session] = await Promise.all([
      getCurrentUser(),
      fetchAuthSession(),
    ]);
    const payload = session?.tokens?.idToken?.payload as Record<string, unknown> | undefined;
    const email = (payload?.email ?? payload?.preferred_username ?? "") as string;
    return {
      "X-User-Sub": user?.userId ?? "",
      "X-User-Email": typeof email === "string" ? email : "",
    };
  } catch {
    return { "X-User-Sub": "", "X-User-Email": "" };
  }
}
