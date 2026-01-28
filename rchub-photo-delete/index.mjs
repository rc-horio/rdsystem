import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;

// Function URL 側で CORS を返す前提なので、ここでは Content-Type だけ
const respond = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";

  // CORS は Function URL に任せるので OPTIONS はここまで来ない想定。
  // 万が一来てもエラーにせず 204 を返しても良い。
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { "Content-Type": "application/json" },
      body: "",
    };
  }

  try {
    if (!BUCKET) {
      return respond(500, { ok: false, error: "BUCKET_NAME env is missing" });
    }
    if (method !== "POST") {
      return respond(405, { ok: false, error: "Method Not Allowed" });
    }

    const raw = typeof event.body === "string" ? event.body : (event.body || "");
    const bodyStr = event.isBase64Encoded
      ? Buffer.from(raw, "base64").toString("utf8")
      : raw;

    let body = {};
    try {
      body = bodyStr ? JSON.parse(bodyStr) : {};
    } catch (e) {
      console.error("JSON parse error:", e);
      return respond(400, { ok: false, error: "Invalid JSON" });
    }

    const keys = Array.isArray(body.keys)
      ? body.keys
      : body.key
      ? [String(body.key)]
      : [];

    if (!keys.length) {
      return respond(400, { ok: false, error: "No keys provided" });
    }

    if (keys.length === 1) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: keys[0] }));
      return respond(200, { ok: true, deleted: [keys[0]], errors: [] });
    }

    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys.map((k) => ({ Key: k })) },
      })
    );

    const deleted = (res.Deleted || []).map((d) => d.Key).filter(Boolean);
    const errors = (res.Errors || []).map((e) => ({
      key: e.Key,
      code: e.Code,
      msg: e.Message,
    }));

    return respond(200, { ok: errors.length === 0, deleted, errors });
  } catch (err) {
    console.error("Unhandled delete error:", err);
    return respond(500, { ok: false, error: String(err?.message || err) });
  }
};
