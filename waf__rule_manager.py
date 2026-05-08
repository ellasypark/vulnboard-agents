"""
WAF Rule Manager
- UI에서 룰 적용/제거 시 실제 AWS WAF API를 호출하는 모듈
- automation.py의 IP 차단 로직과 동일한 패턴으로 구현
"""

import os
import boto3
import json
from datetime import datetime
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

REGION   = os.environ.get("AWS_REGION", "ap-northeast-2")
WAF_NAME = os.environ.get("WAF_NAME", "CreatedByALB-vulnboard-alb")
WAF_ID   = os.environ.get("WAF_ID",   "db5db7cb-bba8-44df-840f-ae4243dc1d93")

waf = boto3.client("wafv2", region_name=REGION)

# ──────────────────────────────────────────────
# 룰 이름 → AWS WAF Statement 매핑 테이블
# UI의 "AI-Enhanced-AWS-..." 이름을 실제 AWS 룰 구성으로 변환
# ──────────────────────────────────────────────
RULE_DEFINITIONS = {
    "AI-Enhanced-AWS-AWSManagedRulesAmazonIpReputationList": {
        "type": "managed",
        "vendor": "AWS",
        "name":   "AWSManagedRulesAmazonIpReputationList",
    },
    "AI-Enhanced-AWS-AWSManagedRulesCommonRuleSet": {
        "type": "managed",
        "vendor": "AWS",
        "name":   "AWSManagedRulesCommonRuleSet",
    },
    "AI-Enhanced-AWS-AWSManagedRulesKnownBadInputsRuleSet": {
        "type": "managed",
        "vendor": "AWS",
        "name":   "AWSManagedRulesKnownBadInputsRuleSet",
    },
    "AI-Enhanced-AWS-AWSManagedRulesSQLiRuleSet": {
        "type": "managed",
        "vendor": "AWS",
        "name":   "AWSManagedRulesSQLiRuleSet",
    },
    "AI-Enhanced-AWS-AWSManagedRulesLinuxRuleSet": {
        "type": "managed",
        "vendor": "AWS",
        "name":   "AWSManagedRulesLinuxRuleSet",
    },
    "AI-Enhanced-AWS-AWSManagedRulesUnixRuleSet": {
        "type": "managed",
        "vendor": "AWS",
        "name":   "AWSManagedRulesUnixRuleSet",
    },
    "AI-Enhanced-Custom-RateLimitRule": {
        "type":       "rate_based",
        "limit":      2000,          # 5분간 IP당 최대 요청 수
        "aggregate":  "IP",
    },
    "AI-Enhanced-Custom-GeoBlockingRule": {
        "type":     "geo",
        "countries": ["CN", "RU", "KP"],  # 필요에 따라 수정
    },
}


def _get_web_acl():
    """현재 Web ACL 정보와 LockToken 반환"""
    resp = waf.get_web_acl(Name=WAF_NAME, Scope="REGIONAL", Id=WAF_ID)
    return resp["LockToken"], resp["WebACL"]


def _build_rule_statement(rule_name: str, priority: int) -> dict:
    """
    룰 이름으로 AWS WAF Rule 객체 생성
    - Managed Rule: OverrideAction None  → 룰 자체 Block/Count 동작 따름
    - Custom Rule:  Action Block         → 직접 차단
    """
    defn = RULE_DEFINITIONS.get(rule_name)
    if not defn:
        raise ValueError(f"알 수 없는 룰 이름: {rule_name}")

    rtype = defn["type"]

    if rtype == "managed":
        return {
            "Name":     rule_name,
            "Priority": priority,
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": defn["vendor"],
                    "Name":       defn["name"],
                }
            },
            # OverrideAction None → 관리형 룰의 기본 동작(Block) 활성화
            "OverrideAction": {"None": {}},
            "VisibilityConfig": {
                "SampledRequestsEnabled":   True,
                "CloudWatchMetricsEnabled": True,
                "MetricName":               rule_name,
            },
        }

    elif rtype == "rate_based":
        return {
            "Name":     rule_name,
            "Priority": priority,
            "Statement": {
                "RateBasedStatement": {
                    "Limit":            defn["limit"],
                    "AggregateKeyType": defn["aggregate"],
                }
            },
            "Action": {"Block": {}},
            "VisibilityConfig": {
                "SampledRequestsEnabled":   True,
                "CloudWatchMetricsEnabled": True,
                "MetricName":               rule_name,
            },
        }

    elif rtype == "geo":
        return {
            "Name":     rule_name,
            "Priority": priority,
            "Statement": {
                "GeoMatchStatement": {
                    "CountryCodes": defn["countries"],
                }
            },
            "Action": {"Block": {}},
            "VisibilityConfig": {
                "SampledRequestsEnabled":   True,
                "CloudWatchMetricsEnabled": True,
                "MetricName":               rule_name,
            },
        }

    raise ValueError(f"지원하지 않는 룰 타입: {rtype}")


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def apply_rule_to_waf(rule_name: str) -> dict:
    """
    UI '적용' 버튼 → 실제 AWS WAF에 룰 추가
    Returns: { success, message, rule_name, aws_rule_name }
    """
    try:
        lock_token, web_acl = _get_web_acl()
        existing_rules = web_acl.get("Rules", [])

        # 이미 적용된 룰인지 확인
        for r in existing_rules:
            if r["Name"] == rule_name:
                return {
                    "success": True,
                    "message": f"이미 WAF에 적용된 룰입니다: {rule_name}",
                    "rule_name": rule_name,
                    "already_exists": True,
                }

        # 우선순위: 기존 룰 중 가장 큰 Priority + 1
        new_priority = (max(r["Priority"] for r in existing_rules) + 1) if existing_rules else 10

        new_rule = _build_rule_statement(rule_name, new_priority)

        waf.update_web_acl(
            Name=WAF_NAME,
            Scope="REGIONAL",
            Id=WAF_ID,
            DefaultAction=web_acl["DefaultAction"],
            Rules=existing_rules + [new_rule],
            VisibilityConfig=web_acl["VisibilityConfig"],
            LockToken=lock_token,
        )

        print(f"[WAFRuleManager] ✅ 룰 적용 완료: {rule_name} (Priority: {new_priority})")
        return {
            "success":   True,
            "message":   f"룰이 AWS WAF에 실제로 적용되었습니다: {rule_name}",
            "rule_name": rule_name,
            "priority":  new_priority,
        }

    except ValueError as e:
        return {"success": False, "message": str(e), "rule_name": rule_name}
    except Exception as e:
        print(f"[WAFRuleManager] ❌ 룰 적용 실패: {e}")
        return {"success": False, "message": f"AWS WAF 룰 적용 실패: {str(e)}", "rule_name": rule_name}


def remove_rule_from_waf(rule_name: str) -> dict:
    """
    UI '제거(X)' 버튼 → 실제 AWS WAF에서 룰 삭제
    Returns: { success, message, rule_name }
    """
    try:
        lock_token, web_acl = _get_web_acl()
        existing_rules = web_acl.get("Rules", [])

        # 해당 룰이 있는지 확인
        new_rules = [r for r in existing_rules if r["Name"] != rule_name]
        if len(new_rules) == len(existing_rules):
            return {
                "success": False,
                "message": f"WAF에서 해당 룰을 찾을 수 없습니다: {rule_name}",
                "rule_name": rule_name,
            }

        waf.update_web_acl(
            Name=WAF_NAME,
            Scope="REGIONAL",
            Id=WAF_ID,
            DefaultAction=web_acl["DefaultAction"],
            Rules=new_rules,
            VisibilityConfig=web_acl["VisibilityConfig"],
            LockToken=lock_token,
        )

        print(f"[WAFRuleManager] ✅ 룰 제거 완료: {rule_name}")
        return {
            "success":   True,
            "message":   f"룰이 AWS WAF에서 제거되었습니다: {rule_name}",
            "rule_name": rule_name,
        }

    except Exception as e:
        print(f"[WAFRuleManager] ❌ 룰 제거 실패: {e}")
        return {"success": False, "message": f"AWS WAF 룰 제거 실패: {str(e)}", "rule_name": rule_name}


def get_applied_rules_from_waf() -> list:
    """
    실제 AWS WAF에서 현재 적용된 룰 목록 조회
    UI와 AWS 상태 동기화에 사용
    """
    try:
        _, web_acl = _get_web_acl()
        return [r["Name"] for r in web_acl.get("Rules", [])]
    except Exception as e:
        print(f"[WAFRuleManager] ❌ 룰 목록 조회 실패: {e}")
        return []