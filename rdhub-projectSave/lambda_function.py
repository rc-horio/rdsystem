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

# CORS をモジュール直下に定義
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
CORS_HEADERS = [
    "Content-Type",
    "X-User-Sub",
    "X-User-Email",
]


def _cors_headers(event=None):
    """CORS ヘッダー。event を渡すとリクエストの Origin をそのまま返す（CORS ブロック回避）"""
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
        return "project_save"
    key = key.lower()
    if key.endswith("projects.json"):
        return "projects_list_update"
    if "/projects/" in key and "/index.json" in key:
        return "project_save"
    if key.endswith("areas.json"):
        return "areas_update"
    if "/areas/" in key and "/index.json" in key:
        return "area_update"
    return "project_save"


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

        # GSI のキー属性(userId)は空文字不可のため、未認証時は "anonymous" を使用
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
    # OPTIONS プリフライト対応
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

    key = data.get("key")
    content = data.get("body")
    content_type = data.get("contentType", "application/json; charset=utf-8")

    if not key or content is None:
        return _res(400, {"error": "key and body are required"}, event)

    if not str(key).startswith(ALLOWED_PREFIX):
        return _res(403, {"error": f"key must start with {ALLOWED_PREFIX}"}, event)

    try:
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(content, ensure_ascii=False),
            ContentType=content_type,
            CacheControl="no-cache",
        )
        # 操作ログを DynamoDB に記録
        headers = _get_headers(event)
        _put_audit_log(
            action=_action_from_key(key),
            user_id=headers.get("x-user-sub", ""),
            user_email=headers.get("x-user-email", ""),
            target=key,
            details={"key": key},
        )
        return _res(200, {"ok": True, "key": key, "bucket": bucket}, event)
    except Exception as e:
        logger.exception("S3 put_object failed")
        return _res(500, {"error": str(e)}, event)
