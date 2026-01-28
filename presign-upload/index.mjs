import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const s3 = new S3Client({ region: "ap-northeast-1" });
const BUCKET = process.env.BUCKET || "rc-rdsystem-dev-catalog";

export const handler = async (event) => {
  try {
    // Function URL の CORS 機能を使うので、ここでは CORS ヘッダーは付けない
    // preflight(OPTIONS) も Function URL 側で処理されるので分岐不要


    const { projectId, scheduleId, filename, contentType } = JSON.parse(
      event.body || "{}"
    );

    if (!projectId || !scheduleId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "projectId and scheduleId are required",
        }),
      };
    }

    const rawName = filename || "photo.jpg";
    const extMatch = rawName.match(/(\.[^.]+)?$/);
    const ext = extMatch?.[1] || ".jpg";

    // S3 の key は安全な UUID ベース + 拡張子
    const key = `catalog/v1/projects/${projectId}/photos/${scheduleId}/${crypto.randomUUID()}${ext}`;

    const putCmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "image/jpeg",
    });

    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 300 });

    // URL 用には key 全体を encode
    const publicUrl = `https://${BUCKET}.s3.ap-northeast-1.amazonaws.com/${encodeURI(
      key
    )}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ key, uploadUrl, publicUrl }),
    };
  } catch (e) {
    console.error("presign error", e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "internal_error",
        message: String(e && e.message ? e.message : e),
      }),
    };
  }
};
