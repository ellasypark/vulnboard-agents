"""
Automation Agent
- Report Agent의 action_type을 받아 차단 여부 결정
- IMMEDIATE_BLOCK → WAF 즉시 차단
- SLACK_REVIEW_REQ → DynamoDB 저장 → 대시보드 팝업 (Yes/No)
- LOG_IGNORE → 무시
"""

import json
import os
import time
import boto3
from datetime import datetime, timezone
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
WAF_ARN = os.environ.get("WAF_ARN")
WAF_NAME = os.environ.get("WAF_NAME", "CreatedByALB-vulnboard-alb")
WAF_ID = os.environ.get("WAF_ID", "")
PENDING_BLOCKS_TABLE = os.environ.get("PENDING_BLOCKS_TABLE", "pending_blocks")

waf = boto3.client("wafv2", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)


def ensure_table_exists():
    """DynamoDB 테이블이 없으면 자동으로 생성합니다."""
    try:
        dynamodb.meta.client.describe_table(TableName=PENDING_BLOCKS_TABLE)
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        print(f"[Automation] '{PENDING_BLOCKS_TABLE}' 테이블이 없어서 새로 생성합니다 (서울 리전)...")
        table = dynamodb.create_table(
            TableName=PENDING_BLOCKS_TABLE,
            KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        # 테이블이 완전히 생성될 때까지 대기
        table.meta.client.get_waiter('table_exists').wait(TableName=PENDING_BLOCKS_TABLE)
        print("[Automation] 테이블 생성 완료!")

# 스크립트가 실행될 때 무조건 한 번 테이블 상태를 체크하도록 호출
ensure_table_exists()


def get_waf_lock_token():
    response = waf.get_web_acl(
        Name=WAF_NAME,
        Scope="REGIONAL",
        Id=WAF_ID
    )
    return response["LockToken"], response["WebACL"]


def create_ip_set(ip: str, name: str) -> str:
    try:
        # 먼저 새로 생성 시도
        response = waf.create_ip_set(
            Name=name,
            Scope="REGIONAL",
            IPAddressVersion="IPV4",
            Addresses=[f"{ip}/32"]
        )
        return response["Summary"]["ARN"]
    except waf.exceptions.WAFDuplicateItemException:
        # 이미 같은 이름의 IP Set이 존재한다면, 목록을 뒤져서 ARN을 찾아 반환
        print(f"[Automation] IP Set '{name}'이 이미 존재하여 기존 리소스를 사용합니다.")
        
        # 주의: IP Set 목록이 많을 경우 pagination이 필요할 수 있으나, 해커톤 수준에서는 기본 호출로 충분 - 실 도입 시 수정
        list_response = waf.list_ip_sets(Scope="REGIONAL")
        for ip_set in list_response.get("IPSets", []):
            if ip_set["Name"] == name:
                return ip_set["ARN"]
        
        # 만약 목록에서도 못 찾았다면 (거의 발생하지 않음) 에러 발생
        raise Exception(f"IP Set '{name}' is duplicate but ARN could not be found.")


def block_by_ip(ip: str, reason: str) -> bool:
    try:
        lock_token, web_acl = get_waf_lock_token()
        existing_rules = web_acl.get("Rules", [])
        rule_name = f"Block-IP-{ip.replace('.', '-')}"

        # 1. 이미 동일한 이름의 차단 룰이 WAF에 적용되어 있는지 확인
        for rule in existing_rules:
            if rule["Name"] == rule_name:
                print(f"[Automation] 해당 IP({ip})에 대한 차단 룰이 이미 WAF에 적용되어 있습니다.")
                return True

        # 2. 고유한 Priority(우선순위) 자동 계산 (기존 룰 중 가장 큰 Priority + 1)
        if existing_rules:
            new_priority = max([rule["Priority"] for rule in existing_rules]) + 1
        else:
            new_priority = 1

        new_rule = {
            "Name": rule_name,
            "Priority": new_priority,  # <--- 계산된 고유 우선순위 적용
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
        print(f"[Automation] IP 차단 완료: {ip} (Priority: {new_priority})")
        return True
    except Exception as e:
        print(f"[Automation] IP 차단 실패: {e}")
        return False


def save_pending_block(report_result: dict) -> str:
    """SLACK_REVIEW_REQ → DynamoDB 저장 (대시보드 팝업용)"""
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    item_id = f"{report_result.get('target_ip', 'unknown')}_{int(time.time())}"

    table.put_item(Item={
        "id": item_id,
        "ip": report_result.get("target_ip", "UNKNOWN"),
        "action_type": report_result.get("action_type"),
        "summary_message": report_result.get("summary_message", ""),
        "tags": report_result.get("tags", []),
        "analysis_details": json.dumps(report_result.get("analysis_details", {})),
        "status": "PENDING",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "waf_arn": WAF_ARN
    })

    print(f"[Automation] 승인 대기 저장: {item_id}")
    return item_id


def approve_block(item_id: str) -> bool:
    """대시보드에서 Yes 클릭 시 호출"""
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    response = table.get_item(Key={"id": item_id})
    item = response.get("Item")

    if not item:
        print(f"[Automation] 항목 없음: {item_id}")
        return False

    success = block_by_ip(item["ip"], item.get("summary_message", ""))

    table.update_item(
        Key={"id": item_id},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "APPROVED" if success else "FAILED"}
    )
    return success


def reject_block(item_id: str):
    """대시보드에서 No 클릭 시 호출"""
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    table.update_item(
        Key={"id": item_id},
        UpdateExpression="SET #s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "REJECTED"}
    )
    print(f"[Automation] 차단 거부: {item_id}")


def get_pending_blocks() -> list:
    """대시보드용 승인 대기 목록 조회"""
    table = dynamodb.Table(PENDING_BLOCKS_TABLE)
    response = table.scan(
        FilterExpression="#s = :s",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "PENDING"}
    )
    return response.get("Items", [])


def lambda_handler(event, context):
    """
    Report 결과를 받아 action_type에 따라 처리
    - IMMEDIATE_BLOCK → WAF 즉시 차단
    - SLACK_REVIEW_REQ → DynamoDB 저장 (대시보드 팝업)
    - LOG_IGNORE → 무시
    """
    action_type = event.get("action_type", "LOG_IGNORE")
    target_ip = event.get("target_ip", "UNKNOWN")

    print(f"[Automation] action_type: {action_type}, IP: {target_ip}")

    if action_type == "IMMEDIATE_BLOCK":
        success = block_by_ip(target_ip, event.get("summary_message", ""))
        return {
            "status": "BLOCKED" if success else "FAILED",
            "ip": target_ip
        }

    elif action_type == "SLACK_REVIEW_REQ":
        item_id = save_pending_block(event)
        return {
            "status": "PENDING_APPROVAL",
            "item_id": item_id,
            "ip": target_ip,
            "summary_message": event.get("summary_message")
        }

    else:
        print(f"[Automation] 오탐 처리 - 무시: {target_ip}")
        return {"status": "IGNORED", "ip": target_ip}


if __name__ == "__main__":
    sample = {
        "action_type": "SLACK_REVIEW_REQ",
        "target_ip": "1.208.179.255",
        "summary_message": "SQLi 시도 탐지",
        "tags": ["WARNING"],
        "analysis_details": {
            "decision": "NEEDS_REVIEW",
            "confidence_score": 70,
            "reason": "SQLi 패턴 감지",
            "matched_scenario": "None"
        }
    }
    result = lambda_handler(sample, None)
    print(json.dumps(result, ensure_ascii=False, indent=2))