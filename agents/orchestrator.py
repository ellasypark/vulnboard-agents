"""
Orchestrator Agent
- S3에서 공격 로그를 읽어 Detection/Analysis Agent에 전달
- 결과를 취합해 Automation Agent 호출 여부 결정
- Bedrock Claude claude-sonnet-4-20250514 기반
"""

import json
import boto3
import os
from datetime import datetime, timezone

# ── 설정 ──────────────────────────────────────────────
REGION = "ap-northeast-2"
S3_BUCKET = "vulnboard-attack-logs"
WAF_ARN = "arn:aws:wafv2:ap-northeast-2:683123960885:regional/webacl/CreatedByALB-vulnboard-alb/db5db7cb-bba8-44df-840f-ae4243dc1d93"
BEDROCK_MODEL = "claude-sonnet-4-20250514"

bedrock = boto3.client("bedrock-runtime", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)


def read_log_from_s3(bucket: str, key: str) -> dict:
    """S3에서 공격 로그 JSON 읽기"""
    response = s3.get_object(Bucket=bucket, Key=key)
    return json.loads(response["Body"].read().decode("utf-8"))


def call_bedrock(prompt: str) -> str:
    """Bedrock Claude 호출"""
    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL,
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}]
        }),
        contentType="application/json",
        accept="application/json"
    )
    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


def orchestrate(log_data: dict) -> dict:
    """
    로그 데이터를 받아 Detection/Analysis 결과를 취합하고
    Automation Agent 호출 여부를 결정
    """
    # Detection Agent 호출
    from detection import detect
    detection_result = detect(log_data)

    # Analysis Agent 호출
    from analysis import analyze
    analysis_result = analyze(log_data, detection_result)

    # Orchestrator가 Bedrock으로 최종 판단
    prompt = f"""
당신은 보안 오케스트레이터입니다. 아래 공격 로그와 탐지/분석 결과를 보고 최종 판단을 내려주세요.

[공격 로그]
{json.dumps(log_data, ensure_ascii=False, indent=2)}

[탐지 결과]
{json.dumps(detection_result, ensure_ascii=False, indent=2)}

[분석 결과]
{json.dumps(analysis_result, ensure_ascii=False, indent=2)}

다음 JSON 형식으로만 응답하세요:
{{
  "should_block": true/false,
  "reason": "차단 또는 미차단 이유",
  "severity": "HIGH/MEDIUM/LOW",
  "block_type": "IP/PATTERN/NONE",
  "block_value": "차단할 IP 또는 패턴값"
}}
"""
    response_text = call_bedrock(prompt)

    # JSON 파싱
    try:
        # 코드블록 제거 후 파싱
        clean = response_text.strip().replace("```json", "").replace("```", "").strip()
        decision = json.loads(clean)
    except Exception:
        decision = {
            "should_block": False,
            "reason": "파싱 실패",
            "severity": "LOW",
            "block_type": "NONE",
            "block_value": ""
        }

    return {
        "log": log_data,
        "detection": detection_result,
        "analysis": analysis_result,
        "decision": decision,
        "waf_arn": WAF_ARN,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def lambda_handler(event, context):
    """Lambda 진입점 - S3 PUT 이벤트로 트리거"""
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        print(f"[Orchestrator] 로그 수신: s3://{bucket}/{key}")

        # S3에서 로그 읽기
        log_data = read_log_from_s3(bucket, key)

        # 오케스트레이션 실행
        result = orchestrate(log_data)

        print(f"[Orchestrator] 최종 판단: {json.dumps(result['decision'], ensure_ascii=False)}")

        # Automation Agent로 결과 전달 (Step Functions에서 자동 연결)
        return result


# ── 로컬 테스트 ──────────────────────────────────────────────
if __name__ == "__main__":
    # 테스트용 샘플 로그
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
    print(json.dumps(result, ensure_ascii=False, indent=2))
