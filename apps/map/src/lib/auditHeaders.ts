/**
 * 操作ログ用に Cognito のユーザー情報を取得し、Lambda リクエストヘッダーとして返す
 */
import { getCurrentUser } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";

export interface AuditHeaders {
  "X-User-Sub": string;
  "X-User-Email": string;
}

export async function getAuditHeaders(): Promise<AuditHeaders> {
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
