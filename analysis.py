import json
import os
import boto3
from typing import Dict, Any

# 환경 변수 및 설정
REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
BEDROCK_MODEL = os.environ.get("BEDROCK_MODEL", "claude-sonnet-4-20250514") # 또는 "anthropic.claude-3-5-sonnet-20241022-v2:0"

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

# 1. 기존 SYSTEM_PROMPT 유지 (agent.py에서 복사)
SYSTEM_PROMPT = """You are an elite Tier-3 Web Security SOC Analyst AI Agent.

Your job: investigate Web Application Firewall (WAF) logs (Context JSON) and produce a structured security verdict.
You have tools to investigate external URLs, IPs, or domains found in the logs (e.g., inside parameters or headers).

Tools available:
- fetch_url_metadata    : HTTP/SSL metadata
- check_url_reputation  : Threat-intel lookup
- whois_lookup          : Domain registration
- analyze_page_content  : HTML analysis
- dns_lookup            : DNS records

[Contextual Investigation Guidelines]
- Scenario_A (DDoS/Bot): High freq (>100) to auth endpoints = TP. High freq to static assets from domestic/internal = FP.
- Scenario_B (XSS): Malicious script in search = TP. Code in developer forums (/forum/post) = FP.
- Scenario_C (Scanner): curl probing hidden files = TP. curl calling health checks from internal IP = FP.
- Scenario_D (SSRF/OOB): Long strings with OOB domains (interactsh.com) = TP. Internal webhooks/base64 = FP.

Investigation strategy:
1. Review the enriched WAF Context JSON.
2. If the log contains suspicious external domains (e.g., SSRF callback URLs), use your tools to investigate them.
3. Determine if the event is TP, FP, or NEEDS_REVIEW based on the scenarios.
4. STOP calling tools as soon as you have enough evidence.

When you have a verdict, respond with text containing ONLY a JSON object in this exact shape:
{
  "decision": "TP" | "FP" | "NEEDS_REVIEW",
  "confidence_score": <int between 0 and 100>,
  "reason": "short logical deduction",
  "matched_scenario": "Scenario_A" | "Scenario_B" | "Scenario_C" | "Scenario_D" | "None"
}
"""

def call_bedrock_analysis(context_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Bedrock Claude를 호출하여 WAF 이벤트를 분석하고 JSON 결과를 반환합니다.
    """
    prompt = f"Analyze this WAF event Context JSON:\n{json.dumps(context_json, ensure_ascii=False)}"

    # Bedrock용 Anthropic Messages API 페이로드 구성
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0
    })

    try:
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL,
            body=body,
            contentType="application/json",
            accept="application/json"
        )

        response_body = json.loads(response["body"].read())
        final_text = response_body["content"][0]["text"]

        # 3. JSON 추출 및 파싱 로직 (agent.py 방식 유지)
        analysis_verdict = {
            "decision": "NEEDS_REVIEW",
            "confidence_score": 0,
            "reason": "JSON Parsing Failed",
            "matched_scenario": "None"
        }

        start = final_text.find("{")
        end = final_text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                analysis_verdict = json.loads(final_text[start:end])
            except json.JSONDecodeError:
                print(f"[Analysis] JSON 디코딩 실패: {final_text}")

        return analysis_verdict

    except Exception as e:
        print(f"[Analysis] Bedrock 호출 오류: {str(e)}")
        return {
            "decision": "NEEDS_REVIEW",
            "confidence_score": 0,
            "reason": f"Analysis Error: {str(e)}",
            "matched_scenario": "None"
        }

def lambda_handler(event, context):
    """
    Step Functions 진입점
    - event: detection.py로부터 전달받은 데이터 {'detection_result': ..., 'original_log': ...}
    """
    print(f"[Analysis] 분석 시작: {json.dumps(event, ensure_ascii=False)}")

    # 3. detection.py의 결과값을 event에서 추출
    detection_result = event.get("detection_result")

    if not detection_result:
        return {
            "status": "ERROR",
            "message": "No detection result found in input event"
        }

    # 분석 수행
    analysis_result = call_bedrock_analysis(detection_result)

    print(f"[Analysis] 분석 완료: {analysis_result['decision']} ({analysis_result['confidence_score']}%)")

    # 다음 단계(Report)를 위해 결과 병합하여 반환
    return {
        "analysis_result": analysis_result,
        "detection_result": detection_result, # Report 단계에서 참조하기 위해 전달
        "original_log": event.get("original_log")
    }