"""
Automation Agent
- Orchestrator의 판단 결과를 받아 차단 여부를 사용자에게 팝업으로 알림
- 사용자가 Yes → WAF Custom Rule 자동 적용 (IP 또는 패턴 차단)
- 사용자가 No → 무시
"""

import json
import os
import time
import boto3
from datetime import datetime, timezone
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# ── 설정 ──────────────────────────────────────────────
REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
WAF_ARN = os.environ.get("WAF_ARN")
WAF_NAME = os.environ.get("WAF_NAME", "CreatedByALB-vulnboard-alb")
WAF_ID = os.environ.get("WAF_ID", "")
PENDING_BLOCKS_TABLE = os.environ.get("PENDING_BLOCKS_TABLE", "pending_blocks")

waf = boto3.client("wafv2", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)


# ── WAF Custom Rule 적용 ──────────────────────────────────────────────

def get_waf_lock_token():
    """WAF 업데이트에 필요한 lock token 가져오기"""
    response = waf.get_web_acl(
        Name=WAF_NAME,
        Scope="REGIONAL",
        Id=WAF_ID
    )
    return response["LockToken"], response["WebACL"]


def create_ip_set(ip: str, name: str) -> str:
    """WAF IP Set 생성 후 ARN 반환"""
    response = waf.create_ip_set(
        Name=name,
        Scope="REGIONAL",
        IPAddressVersion="IPV4",
        Addresses=[f"{ip}/32"]
    )
    return response["Summary"]["ARN"]


def block_by_ip(ip: str, reason: str) -> bool:
    """IP 기반 WAF Custom Rule 추가"""
    try:
        lock_token, web_acl = get_waf_lock_token()
        existing_rules = web_acl.get("Rules", [])
        rule_name = f"Block-IP-{ip.replace('.', '-')}"

        new_rule = {
            "Name": rule_name,
            "Priority": 1,
            "Statement": {
                "IPSetReferenceStatement": {
                    "ARN": create_ip_set(ip, rule_name)
                }
            },
            "Action": {"Block": {}},
            "VisibilityConfig": {
                "SampledRequestsEnabled": True,
                "CloudWatchMetricsEnabled": True,
                "MetricName": rule_name
            }
        }

        waf.update_web_acl(
            Name=WAF_NAME,
            Scope="REGIONAL",
            Id=WAF_ID,
            DefaultAction=web_acl["DefaultAction"],
            Rules=existing_rules + [new_rule],
            VisibilityConfig=web_acl["VisibilityConfig"],
            LockToken=lock_token
        )
        print(f"[Automation] IP 차단 완료: {ip}")
        return True
    except Exception as e:
        print(f"[Automation] IP 차단 실패: {e}")
        return False


def block_by_pattern(pattern: str, reason: str) -> bool:
    """패턴 기반 WAF Custom Rule 추가 (User-Agent, URI 등)"""
    try:
        lock_token, web_acl = get_waf_lock_token()
        existing_rules = web_acl.get("Rules", [])
        rule_name = f"Block-Pattern-{int(time.time())}"

        new_rule = {
            "Name": rule_name,
            "Priority": 2,
            "Statement": {
                "ByteMatchStatement": {
                    "SearchString": pattern.encode("utf-8"),
                    "FieldToMatch": {"UriPath": {}},
                    "TextTransformations": [{"Priority": 0, "Type": "LOWERCASE"}],
                    "PositionalConstraint": "CONTAINS"
                }
            },
            "Action": {"Block": {}},
            "VisibilityConfig": {
                "SampledRequestsEnabled": True,
                "CloudWatchMetricsEnabled": True,
                "MetricName": rule_name
            }
        }

        waf.update_web_acl(
            Name=WAF_NAME,
            Scope="REGIONAL",
            Id=WAF_ID,
            DefaultAction=web_acl["DefaultAction"],
            Rules=existing_rules + [new_rule],
            VisibilityConfig=web_acl["VisibilityConfig"],
            LockToken=lock_token
        )
        print(f"[Automation] 패턴 차단 완료: {pattern}")
        return True
    except Exception as e:
        print(f"[Automation] 패턴 차단 실패: {e}")
        return False


# ── 승인 대기 목록 관리 (DynamoDB) ──────────────────────────────────────────────

def save_pending_block(orchestrator_result: dict) -> str:
    """
    차단 대기 항목을 DynamoDB에 저장
    웹 대시보드에서 이 목록을 읽어 팝업으로 표시
    """
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    decision = orchestrator_result["decision"]
    log = orchestrator_result["log"]
    item_id = f"{log['ip']}_{int(time.time())}"

    table.put_item(Item={
        "id": item_id,
        "ip": log["ip"],
        "action": log["action"],
        "detail": log["detail"],
        "severity": decision["severity"],
        "reason": decision["reason"],
        "block_type": decision["block_type"],
        "block_value": decision["block_value"],
        "status": "PENDING",  # PENDING / APPROVED / REJECTED
        "timestamp": orchestrator_result["timestamp"],
        "waf_arn": WAF_ARN
    })

    print(f"[Automation] 승인 대기 저장: {item_id}")
    return item_id


def approve_block(item_id: str) -> bool:
    """
    웹 대시보드에서 Yes 클릭 시 호출
    WAF Custom Rule 적용 후 DynamoDB 상태 업데이트
    """
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    response = table.get_item(Key={"id": item_id})
    item = response.get("Item")

    if not item:
        print(f"[Automation] 항목 없음: {item_id}")
        return False

    block_type = item["block_type"]
    block_value = item["block_value"]
    reason = item["reason"]

    success = False
    if block_type == "IP":
        success = block_by_ip(block_value, reason)
    elif block_type == "PATTERN":
        success = block_by_pattern(block_value, reason)

    table.update_item(
        Key={"id": item_id},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "APPROVED" if success else "FAILED"}
    )
    return success


def reject_block(item_id: str):
    """웹 대시보드에서 No 클릭 시 호출 - 무시"""
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    table.update_item(
        Key={"id": item_id},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "REJECTED"}
    )
    print(f"[Automation] 차단 거부: {item_id}")


def get_pending_blocks() -> list:
    """웹 대시보드용 - 승인 대기 목록 조회"""
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    response = table.scan(
        FilterExpression="#s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "PENDING"}
    )
    return response.get("Items", [])


# ── Lambda 진입점 ──────────────────────────────────────────────

def lambda_handler(event, context):
    """
    Step Functions에서 Orchestrator 결과를 받아 실행
    should_block=True면 DynamoDB에 저장 (대시보드 팝업용)
    """
    decision = event.get("decision", {})

    if not decision.get("should_block", False):
        print("[Automation] 차단 불필요 - 무시")
        return {"status": "SKIPPED"}

    item_id = save_pending_block(event)

    return {
        "status": "PENDING_APPROVAL",
        "item_id": item_id,
        "severity": decision.get("severity"),
        "block_type": decision.get("block_type"),
        "block_value": decision.get("block_value"),
        "reason": decision.get("reason")
    }


# ── 로컬 테스트 ──────────────────────────────────────────────
if __name__ == "__main__":
    sample_result = {
        "log": {
            "timestamp": "2026-05-04T04:37:12+00:00",
            "ip": "1.208.179.255",
            "action": "LOGIN_SQLI_ATTEMPT",
            "detail": "username=' OR 1=1--",
            "user_agent": "Mozilla/5.0"
        },
        "decision": {
            "should_block": True,
            "reason": "SQL Injection 시도 탐지",
            "severity": "HIGH",
            "block_type": "IP",
            "block_value": "1.208.179.255"
        },
        "waf_arn": WAF_ARN,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    result = lambda_handler(sample_result, None)
    print(json.dumps(result, ensure_ascii=False, indent=2))
