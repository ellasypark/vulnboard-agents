"""
공격 유형 탐지 테스트 스크립트
"""

import json
from api_server import parse_waf_log

# waf_logs.json에서 샘플 로그 읽기
with open('waf_logs.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()[:10]  # 처음 10개만

print("="*80)
print("🔍 공격 유형 탐지 테스트")
print("="*80)

attack_counts = {}

for i, line in enumerate(lines, 1):
    log_entry = json.loads(line)
    parsed = parse_waf_log(log_entry)
    
    attack_type = parsed['attack_type']
    attack_counts[attack_type] = attack_counts.get(attack_type, 0) + 1
    
    print(f"\n📋 로그 #{i}")
    print(f"   소스 IP: {parsed['source_ip']}")
    print(f"   국가: {parsed['source_country']}")
    print(f"   URI: {parsed['uri']}")
    print(f"   Args: {parsed['args'][:80]}...")
    print(f"   공격 유형: {parsed['attack_type']}")
    print(f"   위험 점수: {parsed['risk_score']}/100")
    print(f"   WAF 조치: {parsed['waf_action']}")

print("\n" + "="*80)
print("📊 공격 유형 통계")
print("="*80)
for attack_type, count in sorted(attack_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"   {attack_type}: {count}개")

print("\n✅ 테스트 완료!")
