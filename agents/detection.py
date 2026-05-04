"""
Detection Agent
- AWS WAF 로그 실시간 분석
- HTTP Flood, SQLi, XSS, Bad Bot 패턴 탐지
- 이상 징후 감지 시 Orchestrator에게 알림
- 탐지된 IP의 평판 조회 (IPstack API or AbuseIPDB API)

TODO: 팀원 작성
"""


def detect(log_data: dict) -> dict:
    """
    Args:
        log_data: S3에서 읽은 공격 로그 JSON
    Returns:
        detection_result: 탐지 결과 dict
    """
    # TODO: 구현 필요
    pass


def lambda_handler(event, context):
    """Lambda 진입점"""
    # TODO: 구현 필요
    pass
