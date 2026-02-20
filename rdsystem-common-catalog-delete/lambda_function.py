"""
rdsystem-prod-common-catalog-delete
カタログ（areas, projects 等）の S3 オブジェクト削除用 Lambda。
RD Map / RD Hub の両方から利用可能。
"""
import json
import os
import boto3
import base64
import logging
import uuid
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

ALLOWED_PREFIX = "catalog/v1/"

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
CORS_HEADERS = [
    "Content-Type",
    "X-User-Sub",
    "X-User-Email",
]


def _cors_headers(event=None):
    """CORS ヘッダー。event を渡すとリクエストの Origin をそのまま返す"""
    origin = CORS_ORIGINS
    if event:
        headers = event.get("headers") or {}
        req_origin = None
        if isinstance(headers, dict):
            for k, v in headers.items():
                if k.lower() == "origin" and v:
                    req_origin = v
                    break
        if req_origin:
            if CORS_ORIGINS == "*":
                origin = req_origin
            else:
                allowed = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]
                if req_origin in allowed:
                    origin = req_origin
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": ", ".join(CORS_HEADERS),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    }


def _res(status, body, event=None):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            **_cors_headers(event),
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def _get_headers(event):
    """Lambda Function URL のヘッダーを取得（キーは小文字）"""
    headers = event.get("headers") or {}
    if isinstance(headers, dict):
        return {k.lower(): v for k, v in headers.items()}
    return {}


def _action_from_key(key):
    """S3 キーから action を推定"""
    if not key:
        return "catalog_delete"
    key_lower = key.lower()
    if "/areas/" in key_lower and "/index.json" in key_lower:
        return "area_delete"
    if "/projects/" in key_lower and "/index.json" in key_lower:
        return "project_delete"
    return "catalog_delete"


def _put_audit_log(action, user_id, user_email, target, details=None):
    """DynamoDB に操作ログを書き込む（失敗しても握りつぶす）"""
    table_name = os.getenv("AUDIT_TABLE_NAME", "")
    if not table_name:
        return

    try:
        now = datetime.utcnow()
        date_str = now.strftime("%Y-%m-%d")
        ts = now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        item_id = str(uuid.uuid4())[:8]

        user_id_val = (user_id or "").strip() or "anonymous"
        user_email_val = (user_email or "").strip() or ""

        table = dynamodb.Table(table_name)
        item = {
            "pk": f"DATE#{date_str}",
            "sk": f"{ts}#{item_id}",
            "action": action,
            "userId": user_id_val,
            "userEmail": user_email_val,
            "timestamp": ts,
            "target": target or "",
        }
        if details:
            item["details"] = details

        table.put_item(Item=item)
        logger.info(f"Audit log written: {action} for {target}")
    except Exception as e:
        logger.warning("audit log failed: %s", e)


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": {**{"Content-Type": "application/json"}, **_cors_headers(event)},
            "body": "",
        }

    bucket = os.getenv("BUCKET_NAME", "")
    if not bucket:
        return _res(500, {"error": "BUCKET_NAME is not set"}, event)

    try:
        body = event.get("body", "")
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")
        data = json.loads(body or "{}")
    except Exception as e:
        logger.exception("Invalid JSON")
        return _res(400, {"error": f"invalid json: {e}"}, event)

    keys = data.get("keys")
    if keys is None:
        key = data.get("key")
        keys = [key] if key else []

    if not isinstance(keys, list):
        keys = []

    keys = [str(k).strip() for k in keys if k]

    if not keys:
        return _res(400, {"error": "key or keys required"}, event)

    for k in keys:
        if not k.startswith(ALLOWED_PREFIX):
            return _res(403, {"error": f"key must start with {ALLOWED_PREFIX}"}, event)

    headers = _get_headers(event)
    deleted = []
    errors = []

    try:
        for key in keys:
            try:
                s3.delete_object(Bucket=bucket, Key=key)
                deleted.append(key)
                _put_audit_log(
                    action=_action_from_key(key),
                    user_id=headers.get("x-user-sub", ""),
                    user_email=headers.get("x-user-email", ""),
                    target=key,
                    details={"key": key},
                )
            except Exception as e:
                logger.warning("delete failed for %s: %s", key, e)
                errors.append({"key": key, "error": str(e)})

        ok = len(errors) == 0
        return _res(200, {"ok": ok, "deleted": deleted, "errors": errors}, event)
    except Exception as e:
        logger.exception("S3 delete failed")
        return _res(500, {"error": str(e)}, event)
