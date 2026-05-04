import json
import ipaddress
from datetime import datetime

def _is_internal_ip(ip_str: str) -> bool:
    """IP가 사설망(10.x.x.x, 192.168.x.x 등)인지 판별"""
    if not ip_str:
        return False
    try:
        return ipaddress.ip_address(ip_str).is_private
    except ValueError:
        return False

def _get_requests_per_minute(ip_str: str) -> int:
    """
    해당 IP의 최근 1분 이내 요청 횟수 계산.
    Lambda는 Stateless하므로, 정확한 구현을 위해서는 Redis나 DynamoDB 조회가 필요합니다.
    현재는 단일 이벤트 분석을 위해 기본값(1)을 반환하거나 로직 뼈대만 유지합니다.
    """
    # TODO: DynamoDB 등을 활용하여 실시간 카운트 로직 구현 가능
    return 1

def detect(log_data: dict) -> dict:
    """
    원본 WAF 로그를 LLM 분석용 Context JSON으로 변환하고 정규화합니다.
    """
    # 1. 필드 추출 및 정규화 (detect.py 및 waf_detect_agent.py 로직 통합)
    src_ip = log_data.get("src_ip") or log_data.get("ip", "0.0.0.0")
    raw_url = log_data.get("url") or log_data.get("path", "/")
    method = log_data.get("method", "UNKNOWN")
    headers = {k.lower(): v for k, v in log_data.get("headers", {}).items()}

    # 2. 토큰 최적화를 위한 핵심 헤더 필터링
    target_headers = {"user-agent", "host", "content-type", "cookie", "referer", "x-forwarded-for"}
    filtered_headers = {k: v for k, v in headers.items() if k in target_headers}

    # 3. Enrichment (상황 강화 태깅)
    is_internal = _is_internal_ip(src_ip)
    req_per_min = _get_requests_per_minute(src_ip)

    # 4. 분석 컨텍스트 구성
    context = {
        "event_id": f"ev-{int(datetime.now().timestamp())}",
        "event_time": log_data.get("timestamp", datetime.now().isoformat()),
        "source_ip": src_ip,
        "target_uri": raw_url,
        "http_method": method,
        "headers": filtered_headers,
        "body_raw": log_data.get("body") or log_data.get("detail"),
        "waf_action": log_data.get("waf_action") or log_data.get("action"),
        "matched_rules": log_data.get("waf_rule_ids", []),
        "enrichment_tags": {
            "is_internal_ip": is_internal,
            "requests_last_1min": req_per_min,
            "suspicious_frequency": req_per_min > 30
        }
    }

    return context

def lambda_handler(event, context):
    """
    Step Functions 진입점
    - event: Orchestrator로부터 전달받은 로그 데이터 (log_data)
    """
    print(f"[Detection] 가공 시작: {json.dumps(event, ensure_ascii=False)}")

    try:
        # Step Functions의 상위 결과(orchestrator의 반환값) 구조에 따라 분기
        log_input = event.get("log") if "log" in event else event

        # 탐지 및 정규화 로직 수행
        detection_result = detect(log_input)

        print(f"[Detection] 가공 완료: {detection_result['event_id']}")

        # Step Functions의 다음 단계(Analysis)로 전달될 데이터
        return {
            "detection_result": detection_result,
            "original_log": log_input
        }

    except Exception as e:
        print(f"[Detection] 오류 발생: {str(e)}")
        raise e