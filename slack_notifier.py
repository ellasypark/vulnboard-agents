import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from datetime import datetime

SLACK_TOKEN   = os.environ.get("SLACK_BOT_TOKEN")
SLACK_CHANNEL = os.environ.get("SLACK_CHANNEL", "#보안-알림")

client = WebClient(token=SLACK_TOKEN) if SLACK_TOKEN else None

def send_rule_alert(rule: dict):
    """
    AI 제안 룰이 생성됐을 때 Slack 알림
    """
    if not client:
        print("[Slack] 토큰 없음 - 알림 스킵")
        return False

    risk_score = rule.get('risk_score', 0)

    # 위험도에 따라 이모지/색상 변경
    if risk_score >= 70:
        color   = "#dc2626"   # 빨강
        urgency = ":red_circle: 높음"
    elif risk_score >= 40:
        color   = "#f59e0b"   # 노랑
        urgency = ":yellow_circle: 중간"
    else:
        color   = "#10b981"   # 초록
        urgency = ":green_circle: 낮음"

    try:
        client.chat_postMessage(
            channel=SLACK_CHANNEL,
            text=f":shield: AI 제안 룰 생성됨: {rule.get('name')}",
            attachments=[
                {
                    "color": color,
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*:shield: AI 제안 룰이 생성되었습니다*"
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {"type": "mrkdwn", "text": f"*룰 이름*\n{rule.get('name')}"},
                                {"type": "mrkdwn", "text": f"*카테고리*\n{rule.get('category')}"},
                                {"type": "mrkdwn", "text": f"*위험도*\n{urgency} ({risk_score}점)"},
                                {"type": "mrkdwn", "text": f"*WCU*\n{rule.get('wcu')} WCU"},
                                {"type": "mrkdwn", "text": f"*탐지 건수*\n{rule.get('total_detections', 0)}건"},
                                {"type": "mrkdwn", "text": f"*시간*\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"},
                            ]
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*설명*\n{rule.get('description', '')}"
                            }
                        },
                        {
                            "type": "actions",
                            "elements": [
                                {
                                    "type": "button",
                                    "text": {"type": "plain_text", "text": ":white_check_mark: 대시보드에서 적용"},
                                    "url": "http://localhost:3000",
                                    "style": "primary"
                                }
                            ]
                        }
                    ]
                }
            ]
        )
        print(f"[Slack] 알림 전송 완료: {rule.get('name')}")
        return True

    except SlackApiError as e:
        print(f"[Slack] 알림 전송 실패: {e.response['error']}")
        return False


def send_rule_applied_alert(rule_name: str, priority: int):
    """
    룰이 실제 AWS WAF에 적용됐을 때 알림
    """
    if not client:
        return False
    try:
        client.chat_postMessage(
            channel=SLACK_CHANNEL,
            text=f":white_check_mark: WAF 룰 적용 완료: {rule_name}",
            attachments=[
                {
                    "color": "#10b981",
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"*:white_check_mark: AWS WAF 룰이 실제로 적용되었습니다*\n"
                                        f"룰명: `{rule_name}`\n"
                                        f"Priority: {priority}\n"
                                        f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                            }
                        }
                    ]
                }
            ]
        )
        return True
    except SlackApiError as e:
        print(f"[Slack] 적용 알림 실패: {e.response['error']}")
        return False