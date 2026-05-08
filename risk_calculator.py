"""
WAF 위험도 계산 모듈

종합 시스템 위험도를 계산하는 핵심 로직을 담당합니다.
설정된 WAF 룰의 개수와 각 룰의 중요도/안전도를 복합적으로 고려하여
최고 위험도(50~100)와 최저 위험도(0~50)를 동적으로 산정합니다.
"""

from typing import List, Dict, Any, Tuple
import math


class RiskCalculator:
    """WAF 위험도 계산기"""
    
    # 룰 카테고리별 중요도 (1~10 스케일)
    CATEGORY_IMPORTANCE = {
        'IP Reputation': 8,              # IP 평판 - 매우 중요
        'Common Vulnerabilities': 10,    # 일반 취약점 - 최고 중요도
        'Known Bad Inputs': 9,           # 알려진 악성 입력 - 매우 중요
        'SQL Injection Protection': 10,  # SQL 인젝션 - 최고 중요도
        'Linux Protection': 7,           # Linux 보호 - 중요
        'Unix Protection': 7,            # Unix 보호 - 중요
        'Rate Limiting': 6,              # 속도 제한 - 중간 중요도
        'Geo Blocking': 5,               # 지역 차단 - 중간 중요도
        'Unknown': 3                     # 알 수 없음 - 낮은 중요도
    }
    
    # WCU 기반 안전도 가중치 (WCU가 높을수록 더 포괄적인 보호)
    WCU_WEIGHT_FACTOR = 0.001  # WCU 1당 0.1% 가중치
    
    # 기본값
    DEFAULT_MAX_RISK = 75
    DEFAULT_MIN_RISK = 25
    
    def __init__(self):
        """초기화"""
        pass
    
    def calculate_rule_safety_score(self, rule: Dict[str, Any]) -> float:
        """
        개별 룰의 안전도 점수 계산
        
        Args:
            rule: 룰 정보 딕셔너리
                - category: 룰 카테고리
                - wcu: WCU 값
                - total_detections: 총 탐지 건수
                - blocked_count: 차단 건수
        
        Returns:
            안전도 점수 (0~100)
        """
        category = rule.get('category', 'Unknown')
        wcu = rule.get('wcu', 100)
        detections = rule.get('total_detections', 0)
        blocked = rule.get('blocked_count', 0)
        
        # 1. 카테고리 중요도 (0~10)
        importance = self.CATEGORY_IMPORTANCE.get(category, 3)
        
        # 2. WCU 기반 포괄성 점수 (0~10)
        # WCU가 높을수록 더 많은 공격 패턴을 커버
        wcu_score = min(wcu * self.WCU_WEIGHT_FACTOR * 10, 10)
        
        # 3. 탐지 효율성 점수 (0~10)
        # 탐지 건수가 많을수록 실제로 위협을 막고 있음
        if detections > 0:
            detection_score = min(math.log10(detections + 1) * 2, 10)
        else:
            detection_score = 0
        
        # 4. 차단 효율성 점수 (0~10)
        # 차단 비율이 높을수록 효과적
        if detections > 0:
            block_ratio = blocked / detections
            block_score = block_ratio * 10
        else:
            block_score = 0
        
        # 종합 안전도 점수 계산 (가중 평균)
        # 중요도 > WCU > 탐지 효율 > 차단 효율
        safety_score = (
            importance * 0.4 +      # 카테고리 중요도 40%
            wcu_score * 0.3 +       # WCU 포괄성 30%
            detection_score * 0.2 + # 탐지 효율 20%
            block_score * 0.1       # 차단 효율 10%
        )
        
        # 0~100 스케일로 변환
        safety_score = (safety_score / 10) * 100
        
        return round(safety_score, 2)
    
    def calculate_risk_levels(
        self, 
        applied_rules: List[Dict[str, Any]], 
        suggested_rules: List[Dict[str, Any]],
        total_logs: int = 0
    ) -> Dict[str, Any]:
        """
        최고 위험도와 최저 위험도를 동적으로 계산
        
        Args:
            applied_rules: 현재 적용된 룰 목록
            suggested_rules: AI 제안 룰 목록 (아직 적용 안 됨)
            total_logs: 총 로그 수 (선택적)
        
        Returns:
            {
                'max_risk': 최고 위험도 (50~100),
                'min_risk': 최저 위험도 (0~50),
                'current_risk': 현재 위험도,
                'applied_safety_score': 적용된 룰의 총 안전도,
                'potential_safety_score': 잠재적 안전도 (모든 룰 적용 시),
                'risk_reduction_per_rule': 룰별 위험도 감소 점수
            }
        """
        
        # 1. 적용된 룰의 안전도 점수 계산
        applied_safety_scores = []
        for rule in applied_rules:
            score = self.calculate_rule_safety_score(rule)
            applied_safety_scores.append({
                'rule_id': rule['id'],
                'safety_score': score
            })
        
        total_applied_safety = sum(item['safety_score'] for item in applied_safety_scores)
        applied_rule_count = len(applied_rules)
        
        # 2. 제안된 룰의 안전도 점수 계산
        suggested_safety_scores = []
        for rule in suggested_rules:
            score = self.calculate_rule_safety_score(rule)
            suggested_safety_scores.append({
                'rule_id': rule['id'],
                'safety_score': score
            })
        
        total_suggested_safety = sum(item['safety_score'] for item in suggested_safety_scores)
        suggested_rule_count = len(suggested_rules)
        
        # 3. 전체 잠재적 안전도 (모든 룰 적용 시)
        total_potential_safety = total_applied_safety + total_suggested_safety
        total_rule_count = applied_rule_count + suggested_rule_count
        
        # 4. 최고 위험도 계산 (50~100)
        # 적용된 룰이 많고 안전도가 높을수록 최고 위험도는 낮아짐
        
        if total_rule_count == 0:
            # 룰이 하나도 없으면 기본값
            max_risk = self.DEFAULT_MAX_RISK
        else:
            # 룰 개수 기여도 (가중치 낮음 - 20%)
            rule_count_factor = applied_rule_count / total_rule_count
            
            # 안전도 기여도 (가중치 높음 - 80%)
            if total_potential_safety > 0:
                safety_factor = total_applied_safety / total_potential_safety
            else:
                safety_factor = 0
            
            # 종합 보안 수준 (0~1)
            security_level = (rule_count_factor * 0.2) + (safety_factor * 0.8)
            
            # 최고 위험도 계산
            # 보안 수준이 0이면 100점, 1이면 50점
            max_risk = 100 - (security_level * 50)
            
            # 50~100 범위 제한
            max_risk = max(50, min(100, max_risk))
        
        max_risk = round(max_risk, 1)
        
        # 5. 최저 위험도 계산 (0~50)
        # 모든 룰을 적용했을 때 도달 가능한 최소 위험도
        
        if total_rule_count == 0:
            # 룰이 하나도 없으면 기본값
            min_risk = self.DEFAULT_MIN_RISK
        else:
            # 전체 룰 개수 기여도 (가중치 낮음 - 20%)
            # 룰이 많을수록 최저 위험도는 낮아짐
            rule_count_contribution = min(total_rule_count / 10, 1.0)  # 10개 이상이면 최대
            
            # 전체 안전도 기여도 (가중치 높음 - 80%)
            # 평균 안전도가 높을수록 최저 위험도는 낮아짐
            if total_rule_count > 0:
                avg_safety = total_potential_safety / total_rule_count
                safety_contribution = min(avg_safety / 100, 1.0)
            else:
                safety_contribution = 0
            
            # 종합 보호 수준 (0~1)
            protection_level = (rule_count_contribution * 0.2) + (safety_contribution * 0.8)
            
            # 최저 위험도 계산
            # 보호 수준이 0이면 50점, 1이면 0점
            min_risk = 50 - (protection_level * 50)
            
            # 0~50 범위 제한
            min_risk = max(0, min(50, min_risk))
        
        min_risk = round(min_risk, 1)
        
        # 6. 현재 위험도 = 최고 위험도 (초기 상태)
        current_risk = max_risk
        
        # 7. 각 제안 룰의 위험도 감소 점수 계산
        risk_reduction_per_rule = []
        total_reduction = max_risk - min_risk
        
        if total_reduction > 0 and total_suggested_safety > 0:
            for item in suggested_safety_scores:
                # 해당 룰의 안전도 비율에 따라 감소 점수 배분
                reduction_ratio = item['safety_score'] / total_suggested_safety
                reduction = total_reduction * reduction_ratio
                
                # 음수 방어 및 소수점 처리
                reduction = max(reduction, 0.0)
                reduction = round(reduction, 1)
                
                risk_reduction_per_rule.append({
                    'rule_id': item['rule_id'],
                    'reduction': reduction,
                    'safety_score': item['safety_score']
                })
        else:
            # 감소 불가능한 경우 모든 룰을 0으로 설정
            for item in suggested_safety_scores:
                risk_reduction_per_rule.append({
                    'rule_id': item['rule_id'],
                    'reduction': 0.0,
                    'safety_score': item['safety_score']
                })
        
        return {
            'max_risk': max_risk,
            'min_risk': min_risk,
            'current_risk': current_risk,
            'applied_safety_score': round(total_applied_safety, 2),
            'potential_safety_score': round(total_potential_safety, 2),
            'applied_rule_count': applied_rule_count,
            'suggested_rule_count': suggested_rule_count,
            'total_rule_count': total_rule_count,
            'risk_reduction_per_rule': risk_reduction_per_rule,
            'calculation_method': 'rule-based dynamic analysis v3.0'
        }
    
    def get_risk_level_info(self, risk_score: float) -> Dict[str, Any]:
        """
        위험도 점수에 따른 레벨 정보 반환
        
        Args:
            risk_score: 위험도 점수 (0~100)
        
        Returns:
            {
                'level': 레벨 코드,
                'label': 레벨 라벨,
                'color': 색상 코드
            }
        """
        if risk_score >= 80:
            return {
                'level': 'CRITICAL',
                'label': '매우 높음',
                'color': '#dc2626'
            }
        elif risk_score >= 70:
            return {
                'level': 'HIGH',
                'label': '높음',
                'color': '#ef4444'
            }
        elif risk_score >= 40:
            return {
                'level': 'MEDIUM',
                'label': '중간',
                'color': '#f59e0b'
            }
        elif risk_score >= 20:
            return {
                'level': 'LOW',
                'label': '낮음',
                'color': '#10b981'
            }
        else:
            return {
                'level': 'MINIMAL',
                'label': '매우 낮음',
                'color': '#059669'
            }


# 싱글톤 인스턴스
_calculator_instance = None

def get_risk_calculator() -> RiskCalculator:
    """위험도 계산기 싱글톤 인스턴스 반환"""
    global _calculator_instance
    if _calculator_instance is None:
        _calculator_instance = RiskCalculator()
    return _calculator_instance
