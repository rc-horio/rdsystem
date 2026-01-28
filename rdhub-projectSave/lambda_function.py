import json
import os
import boto3
import base64
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
s3 = boto3.client("s3")

# CORS 許可先（本番は自ドメインに変更）
ALLOW_ORIGIN = os.getenv("ALLOW_ORIGIN", "http://localhost:5173")

def lambda_handler(event, context):
    # ★ 環境変数からバケット名を取得
    bucket = os.getenv("BUCKET_NAME", "")
    if not bucket:
        return _res(500, {"error": "BUCKET_NAME is not set"})

    try:
        body = event.get("body", "")
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")
        data = json.loads(body or "{}")
    except Exception as e:
        logger.exception("Invalid JSON")
        return _res(400, {"error": f"invalid json: {e}"})

    key = data.get("key")
    content = data.get("body")
    content_type = data.get("contentType", "application/json; charset=utf-8")

    if not key or content is None:
        return _res(400, {"error": "key and body are required"})

    try:
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(content, ensure_ascii=False),
            ContentType=content_type,
            CacheControl="no-cache",
        )
        logger.info(f"✅ Uploaded to s3://{bucket}/{key}")
        return _res(200, {"ok": True, "key": key, "bucket": bucket})
    except Exception as e:
        logger.exception("S3 put_object failed")
        return _res(500, {"error": str(e)})

def _res(status, body):
    """HTTPレスポンスを整形"""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            # Function URLが自動でCORSヘッダを付与する場合は明示不要
        },
        "body": json.dumps(body, ensure_ascii=False),
    }
