"""
Orchestrator Agent
- S3에서 공격 로그를 읽어 Detection으로 전달
- Bedrock 판단은 Analysis에서 수행
"""

import json
import os
import boto3
from datetime import datetime, timezone
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
S3_BUCKET = os.environ.get("S3_BUCKET", "vulnboard-attack-logs")
WAF_ARN = os.environ.get("WAF_ARN")

s3 = boto3.client("s3", region_name=REGION)


def read_log_from_s3(bucket: str, key: str) -> dict:
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception as e:
        print(f"[Orchestrator] S3 읽기 오류: {str(e)}")
        raise e


def lambda_handler(event, context):
    try:
        if "Records" in event:
            record = event["Records"][0]
            bucket = record["s3"]["bucket"]["name"]
            key = record["s3"]["object"]["key"]
            print(f"[Orchestrator] S3 로그 수신: s3://{bucket}/{key}")
            log_data = read_log_from_s3(bucket, key)
        else:
            log_data = event
            print("[Orchestrator] 직접 입력 로그 수신")

        timestamp = datetime.now(timezone.utc).isoformat()
        print(f"[Orchestrator] 로그 처리 시작: {timestamp}")
        print(f"[Orchestrator] 대상 IP: {log_data.get('ip', log_data.get('src_ip', 'UNKNOWN'))}")

        return {
            "log": log_data,
            "waf_arn": WAF_ARN,
            "processed_at": timestamp
        }

    except Exception as e:
        print(f"[Orchestrator] 치명적 오류 발생: {str(e)}")
        raise e


if __name__ == "__main__":
    sample_log = {
        "timestamp": "2026-05-04T04:37:12.613252+00:00",
        "ip": "1.208.179.255",
        "user": "anonymous",
        "method": "POST",
        "path": "/login",
        "action": "LOGIN_SQLI_ATTEMPT",
        "detail": "username=' OR 1=1-- password=anything",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "level": "WARNING"
    }
    result = lambda_handler(sample_log, None)
    print(json.dumps(result, ensure_ascii=False, indent=2))