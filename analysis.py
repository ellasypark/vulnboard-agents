import json
import os
import boto3
import re
from typing import Dict, Any

# 환경 변수 및 설정
REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
BEDROCK_MODEL = os.environ.get("BEDROCK_MODEL", "claude-sonnet-4-20250514") # 또는 "anthropic.claude-3-5-sonnet-20241022-v2:0"

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

# 1. SYSTEM PROMPT
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
# ---- [추가된 시나리오] ----
- Scenario_F (Path Traversal): Encoded/plaintext directory traversal (../, %2e%2e%2f) targeting system files (/etc/passwd) from external IP = TP. Legacy internal system relative paths or normal filenames with dots from internal/safe IP = FP.
- Scenario_G (Credential Stuffing): High freq login attempts to auth endpoints with DIFFERENT usernames/credentials from single/proxy IP = TP. High freq from single NAT IP with SAME username (human error) or normal business hours burst = FP.
# ---------------------------

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
  # ---- [출력 포맷에 시나리오 F, G 추가] ----
  "matched_scenario": "Scenario_A" | "Scenario_B" | "Scenario_C" | "Scenario_D" | "Scenario_F" | "Scenario_G" | "None"
}
"""

def call_bedrock_analysis(context_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Bedrock Claude를 호출하여 WAF 이벤트를 분석하고 JSON 결과를 반환합니다.
    """
    prompt = f"Analyze this WAF event Context JSON:\n{json.dumps(context_json, ensure_ascii=False)}"

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

        # 기본 반환값 설정
        analysis_verdict = {
            "decision": "NEEDS_REVIEW",
            "confidence_score": 0,
            "reason": "JSON Parsing Failed",
            "matched_scenario": "None"
        }

        # ---------------------------------------------------------
        # [수정된 부분] 추출한 JSON이 최종 결과(decision 포함)인지 검증
        # ---------------------------------------------------------
        # 1. 마크다운 ```json ... ``` 형태 모두 추출
        json_matches = re.findall(r'```json\s*(.*?)\s*```', final_text, re.DOTALL)
        parsed_successfully = False

        for j_str in json_matches:
            try:
                temp_dict = json.loads(j_str)
                # 추출한 JSON에 'decision' 키가 존재해야만 최종 결과로 인정
                if "decision" in temp_dict:
                    analysis_verdict = temp_dict
                    parsed_successfully = True
                    break
            except json.JSONDecodeError:
                continue

        # 2. 마크다운이 없다면 텍스트 내에서 "decision" 키워드가 포함된 최종 JSON 객체 탐색
        if not parsed_successfully:
            start_idx = final_text.rfind('{"decision"')
            if start_idx == -1:
                start_idx = final_text.rfind('{\n  "decision"')
            
            if start_idx != -1:
                end_idx = final_text.rfind('}') + 1
                try:
                    temp_dict = json.loads(final_text[start_idx:end_idx])
                    if "decision" in temp_dict:
                        analysis_verdict = temp_dict
                except json.JSONDecodeError as e:
                    print(f"[Analysis] JSON 디코딩 실패: {e}")
            else:
                print(f"[Analysis] 'decision' 키워드를 포함한 JSON 패턴을 찾을 수 없습니다.")

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
    """
    print(f"[Analysis] 분석 시작: {json.dumps(event, ensure_ascii=False)}")

    detection_result = event.get("detection_result")

    if not detection_result:
        return {
            "status": "ERROR",
            "message": "No detection result found in input event"
        }

    # 분석 수행
    analysis_result = call_bedrock_analysis(detection_result)

    # ---------------------------------------------------------
    # [수정된 부분] KeyError 방지를 위해 딕셔너리의 .get() 메서드 사용
    # ---------------------------------------------------------
    decision = analysis_result.get("decision", "NEEDS_REVIEW")
    confidence = analysis_result.get("confidence_score", 0)
    
    print(f"[Analysis] 분석 완료: {decision} ({confidence}%)")

    # 다음 단계(Report)를 위해 결과 병합하여 반환
    return {
        "analysis_result": analysis_result,
        "detection_result": detection_result,
        "original_log": event.get("original_log")
    }