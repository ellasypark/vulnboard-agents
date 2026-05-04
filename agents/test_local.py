"""
로컬 테스트 스크립트
- S3 실제 로그를 읽어 Orchestrator → Automation 흐름 테스트
- AWS 자격증명 필요 (IAM Role 또는 aws configure)
"""

import json
import boto3
import sys
import os

# agents 디렉토리를 경로에 추가
sys.path.insert(0, os.path.dirname(__file__))

from orchestrator import orchestrate, read_log_from_s3

REGION = "ap-northeast-2"
S3_BUCKET = "vulnboard-attack-logs"


def test_with_sample():
    """샘플 로그로 테스트"""
    print("=" * 50)
    print("샘플 로그로 테스트 시작")
    print("=" * 50)

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

    result = orchestrate(sample_log)
    print("\n[결과]")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def test_with_s3(key: str):
    """실제 S3 로그로 테스트"""
    print("=" * 50)
    print(f"S3 로그로 테스트: {key}")
    print("=" * 50)

    log_data = read_log_from_s3(S3_BUCKET, key)
    print(f"[로그 내용] {json.dumps(log_data, ensure_ascii=False)}")

    result = orchestrate(log_data)
    print("\n[결과]")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def list_recent_logs():
    """최근 S3 로그 목록 출력"""
    s3 = boto3.client("s3", region_name=REGION)
    response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="logs/", MaxKeys=10)
    objects = response.get("Contents", [])
    if not objects:
        print("로그 없음")
        return []
    print("[최근 로그 목록]")
    for obj in sorted(objects, key=lambda x: x["LastModified"], reverse=True):
        print(f"  {obj['Key']} ({obj['Size']} bytes)")
    return [obj["Key"] for obj in objects]


if __name__ == "__main__":
    print("VulnBoard Agent 로컬 테스트")
    print("1. 샘플 로그 테스트")
    print("2. 최근 S3 로그로 테스트")
    choice = input("선택 (1/2): ").strip()

    if choice == "1":
        test_with_sample()
    elif choice == "2":
        keys = list_recent_logs()
        if keys:
            print(f"\n가장 최근 로그로 테스트: {keys[0]}")
            test_with_s3(keys[0])
