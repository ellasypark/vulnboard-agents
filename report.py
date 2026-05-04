import json
from typing import Literal, List, Optional, Dict, Any
from pydantic import BaseModel, Field, ValidationError

# ==========================================
# 1. Pydantic 모델 정의 (기존 코드 유지)
# ==========================================

class WafContextData(BaseModel):
    """Detection 단계에서 넘어온 정규화된 컨텍스트 데이터"""
    event_id: str
    source_ip: str
    target_uri: str
    http_method: str
    waf_action: Optional[str] = "UNKNOWN"

class AnalysisResultData(BaseModel):
    """Analysis 단계에서 생성된 LLM 분석 결과"""
    decision: Literal["TP", "FP", "NEEDS_REVIEW"]
    confidence_score: int = Field(ge=0, le=100)
    reason: str
    matched_scenario: str

class HandoffPayload(BaseModel):
    """최종적으로 반환될 보고서 및 액션 페이로드 구조"""
    event_id: str
    target_ip: str
    action_type: Literal["IMMEDIATE_BLOCK", "SLACK_REVIEW_REQ", "ALERT_ONLY", "LOG_IGNORE"]
    tags: List[str] = Field(default_factory=list)
    summary_message: str
    notification_block: Optional[Dict[str, Any]] = None
    analysis_details: AnalysisResultData
    context_details: WafContextData

# ==========================================
# 2. 로직 처리 클래스
# ==========================================

class ReportHandoffAgent:
    """분석 결과를 기반으로 최종 라우팅 및 페이로드 패키징을 수행"""

    def _format_slack_block(self, context: WafContextData, analysis: AnalysisResultData) -> dict:
        """Slack 전송용 Block Kit JSON 구조체 생성"""
        return {
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "🚨 [WAF 수동 검토 요청]", "emoji": True}
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*IP:*\n{context.source_ip}"},
                        {"type": "mrkdwn", "text": f"*URI:*\n{context.target_uri}"},
                        {"type": "mrkdwn", "text": f"*AI Confidence:*\n{analysis.confidence_score}%"},
                        {"type": "mrkdwn", "text": f"*AI Reason:*\n{analysis.reason}"}
                    ]
                },
                {
                    "type": "actions",
                    "elements": [
                        {"type": "button", "text": {"type": "plain_text", "text": "차단 (Block)"}, "style": "danger", "value": "block_ip"},
                        {"type": "button", "text": {"type": "plain_text", "text": "무시 (Ignore)"}, "value": "ignore_ip"}
                    ]
                }
            ]
        }

    def generate_payload(self, context_raw: dict, analysis_raw: dict) -> dict:
        try:
            # Pydantic 데이터 검증
            context = WafContextData(**context_raw)
            analysis = AnalysisResultData(**analysis_raw)
        except ValidationError as e:
            return self._build_error_payload(context_raw, str(e))

        # 조건별 라우팅 및 페이로드 구성
        if analysis.decision == "TP" and analysis.confidence_score > 80:
            payload = HandoffPayload(
                event_id=context.event_id,
                target_ip=context.source_ip,
                action_type="IMMEDIATE_BLOCK",
                tags=["즉시 차단", "CRITICAL", analysis.matched_scenario],
                summary_message=f"[자동 차단] {context.source_ip}에서 확실한 공격({analysis.matched_scenario})이 탐지되었습니다.",
                analysis_details=analysis,
                context_details=context
            )

        elif analysis.decision == "NEEDS_REVIEW" or (analysis.decision == "TP" and analysis.confidence_score <= 80):
            payload = HandoffPayload(
                event_id=context.event_id,
                target_ip=context.source_ip,
                action_type="SLACK_REVIEW_REQ",
                tags=["수동 검토 필요", "WARNING"],
                summary_message=f"[검토 요청] {context.source_ip}의 요청에 대한 인간 보안 담당자의 판단이 필요합니다.",
                notification_block=self._format_slack_block(context, analysis),
                analysis_details=analysis,
                context_details=context
            )

        else:
            payload = HandoffPayload(
                event_id=context.event_id,
                target_ip=context.source_ip,
                action_type="LOG_IGNORE",
                tags=["오탐", "SAFE"],
                summary_message=f"[오탐 처리] 정상적인 요청으로 판단됨 ({analysis.reason})",
                analysis_details=analysis,
                context_details=context
            )

        return payload.model_dump()

    def _build_error_payload(self, context_raw: dict, error_msg: str) -> dict:
        """데이터 검증 실패 시의 Fallback 페이로드"""
        return {
            "event_id": context_raw.get("event_id", "UNKNOWN"),
            "target_ip": context_raw.get("source_ip", "UNKNOWN"),
            "action_type": "SLACK_REVIEW_REQ",
            "tags": ["DATA_ERROR", "ERROR"],
            "summary_message": "분석 데이터 형식 오류로 인해 자동 처리에 실패했습니다.",
            "notification_block": {"error_detail": error_msg},
            "analysis_details": {"decision": "NEEDS_REVIEW", "confidence_score": 0, "reason": "Data Validation Error", "matched_scenario": "None"},
            "context_details": {"event_id": "UNKNOWN", "source_ip": "UNKNOWN", "target_uri": "/", "http_method": "UNKNOWN"}
        }

# ==========================================
# 3. Lambda 진입점
# ==========================================

def lambda_handler(event, context):
    """
    Step Functions 진입점
    - event: Analysis 단계에서 반환한 결과값
    """
    print(f"[Report] 결과 생성 시작. Event: {json.dumps(event, ensure_ascii=False)}")

    # 상위 단계(Analysis)에서 전달한 키값 추출
    analysis_result = event.get("analysis_result")
    detection_result = event.get("detection_result")

    if not analysis_result or not detection_result:
        print("[Report] 필수 데이터 누락")
        return {"status": "ERROR", "message": "Missing input data from previous stage"}

    agent = ReportHandoffAgent()
    final_report = agent.generate_payload(detection_result, analysis_result)

    print(f"[Report] 최종 페이로드 생성 완료: {final_report['action_type']}")

    # 이 반환값은 Step Functions의 최종 출력물이 되거나,
    # 이후 알림 발송용 Automation Lambda의 입력값으로 사용됨
    return final_report