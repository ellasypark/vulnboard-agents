"""
로컬 전체 흐름 테스트
Orchestrator → Detection → Analysis → Report → Automation
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from orchestrator import lambda_handler as orchestrator_handler
from detection import lambda_handler as detection_handler
from analysis import lambda_handler as analysis_handler
from report import lambda_handler as report_handler
from automation import lambda_handler as automation_handler

SAMPLE_LOG = {
    "timestamp": "2026-05-04T04:37:12.613252+00:00",
    "ip": "1.208.179.255",
    "user": "anonymous",
    "method": "POST",
    "path": "/login",
    "action": "LOGIN_SQLI_ATTEMPT",
    "detail": "username=' OR 1=1-- password=anything",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "level": "WARNING"
}


def run_pipeline(log_data: dict):
    print("\n" + "="*50)
    print("전체 파이프라인 테스트 시작")
    print("="*50)

    print("\n[1/5] Orchestrator")
    orch_result = orchestrator_handler(log_data, None)
    print(json.dumps(orch_result, ensure_ascii=False, indent=2))

    print("\n[2/5] Detection")
    detect_result = detection_handler(orch_result, None)
    print(json.dumps(detect_result, ensure_ascii=False, indent=2))

    print("\n[3/5] Analysis")
    analysis_result = analysis_handler(detect_result, None)
    print(json.dumps(analysis_result, ensure_ascii=False, indent=2))

    print("\n[4/5] Report")
    report_result = report_handler(analysis_result, None)
    print(json.dumps(report_result, ensure_ascii=False, indent=2))

    print("\n[5/5] Automation")
    auto_result = automation_handler(report_result, None)
    print(json.dumps(auto_result, ensure_ascii=False, indent=2))

    print("\n" + "="*50)
    print(f"최종 결과: {auto_result.get('status')}")
    print("="*50)


if __name__ == "__main__":
    run_pipeline(SAMPLE_LOG)