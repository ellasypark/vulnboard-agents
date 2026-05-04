"""
Analysis Agent
- 공격 유형 분류 및 심각도 scoring
- Athena 쿼리로 공격 패턴 심층 분석
- 오탐/정탐 판별

TODO: 팀원 작성
"""


def analyze(log_data: dict, detection_result: dict) -> dict:
    """
    Args:
        log_data: S3에서 읽은 공격 로그 JSON
        detection_result: Detection Agent 결과
    Returns:
        analysis_result: 분석 결과 dict
    """
    # TODO: 구현 필요
    pass


def lambda_handler(event, context):
    """Lambda 진입점"""
    # TODO: 구현 필요
    pass
