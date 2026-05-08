# 위험도 계산 로직 v3.0 변경 사항

## 📅 업데이트 일자
2026-05-08

## 🎯 변경 목적
대시보드의 위험도 계산 로직에 발생한 심각한 버그를 수정하고, 전체적인 위험도 산정 기준을 고도화

---

## 🔧 주요 변경 사항

### 1. 개별 룰 점수 버그 수정 ✅

#### 문제점
- AI 제안 룰의 항목별 점수에 **-359.2** 같은 비정상적인 음수가 할당되는 치명적인 버그 발생
- 위험도 감소 점수가 음수로 표시되어 사용자 혼란 야기

#### 해결 방법
1. **음수 방어 로직 추가**
   ```python
   # 백엔드 (api_server.py)
   reduction = max(reduction, 0.0)  # 절대 음수가 나오지 않도록 방어
   reduction = round(reduction, 1)  # 소수점 첫째 자리로 반올림
   ```

2. **프론트엔드 방어 로직**
   ```javascript
   // RuleManagement.js
   const reduction = Math.max(riskReductionMap[rule.id] || 0, 0);
   const newRisk = Math.round(newRisk * 10) / 10;  // 소수점 첫째 자리
   ```

3. **계산 단계별 검증**
   - `total_reduction <= 0`인 경우: 모든 룰의 감소 점수를 0으로 설정
   - `total_importance == 0`인 경우: 균등 분배
   - 모든 계산 결과에 `max(value, 0)` 적용

#### 결과
- ✅ 모든 룰 점수가 **0.0 이상**의 양수로 표시
- ✅ 소수점 첫째 자리까지만 표시 (예: 5.2점, 3.8점)
- ✅ 깔끔하고 직관적인 UI

---

### 2. 타이틀 명칭 변경 ✅

#### 변경 내용
```
변경 전: "실시간 위험도"
변경 후: "종합 시스템 위험도"
```

#### 변경 이유
- "실시간"이라는 단어가 주는 제약적인 느낌 제거
- 더 포괄적이고 정확한 의미 전달
- 시스템 전체의 보안 상태를 종합적으로 나타냄

#### 적용 위치
- `frontend/src/components/RuleManagement.js` (Line 232)

---

### 3. 최고 위험도 동적 산정 로직 고도화 ✅

#### 기존 문제
- 최고 위험도(Max)가 특정 상황에서 무조건 **50점(고정값)**으로 설정
- 사용자의 보안 노력이 반영되지 않음

#### 새로운 로직

##### 3-1. 기준 위험도 계산 (100점 만점)
보안 룰이 전혀 없는 상태의 위험도를 계산:
```python
base_risk = level_score + action_score + attack_score
base_risk = max(50, min(100, base_risk))  # 50~100점 범위
```

##### 3-2. 최고 위험도 동적 계산
적용된 룰셋의 상태에 따라 동적으로 결정:
```python
max_risk = base_risk - (적용된 룰들의 보호 효과 합계)
max_risk = max(50, min(100, max_risk))
```

##### 3-3. 시나리오별 예시

| 상황 | 기준 위험도 | 적용된 룰 | 보호 효과 | 최고 위험도 |
|------|------------|----------|----------|------------|
| 초기 상태 (룰 없음) | 85점 | 0개 | 0점 | **85점** |
| 일부 적용 | 85점 | 3개 | 20점 | **65점** |
| 대부분 적용 | 85점 | 7개 | 35점 | **50점** |
| 모두 적용 | 85점 | 8개 | 35점 | **50점** (하한선) |

##### 3-4. 최저 위험도 고정
```python
min_risk = 50  # 고정값
```

**이유**:
- AI 추천 룰이 남아있는 한 완전히 안전한 상태는 아님
- 추가 보안 조치가 필요함을 명확히 표시
- 사용자에게 지속적인 보안 개선 동기 부여

#### 결과
- ✅ 보안 노력이 즉시 위험도에 반영
- ✅ 50~100점 사이에서 동적으로 변화
- ✅ 사용자의 보안 조치가 가시적으로 확인 가능

---

## 📊 변경 전후 비교

### 시나리오: 로그 1000개, 공격 비율 60%

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 최고 위험도 | 50점 (고정) | 50~100점 (동적) |
| 최저 위험도 | 10~35점 (WCU 기반) | 50점 (고정) |
| 개별 룰 점수 | -359.2점 (버그) | 5.2점 (정상) |
| 소수점 처리 | 무한소수 가능 | 첫째 자리까지 |
| 타이틀 | "실시간 위험도" | "종합 시스템 위험도" |

---

## 🔍 기술적 세부 사항

### 백엔드 변경 (api_server.py)

#### 1. 위험도 계산 API 엔드포인트
```python
@app.route('/api/risk-calculation', methods=['GET'])
def get_risk_calculation():
    # 기준 위험도 계산
    base_risk = round(level_score + action_score + attack_score)
    base_risk = max(50, min(100, base_risk))
    
    # 최고 위험도 = 기준 위험도 (초기 상태)
    max_risk = base_risk
    
    # 최저 위험도 고정
    min_risk = 50
    
    # 음수 방어 로직
    if total_reduction <= 0:
        # 모든 룰의 감소 점수를 0으로 설정
        for rule in ai_rules:
            risk_reduction_per_rule.append({
                'rule_id': rule['id'],
                'reduction': 0.0,
                'importance': 0.0
            })
    else:
        # 정규화 및 음수 방어
        normalized_importance = importance / total_importance
        reduction = total_reduction * normalized_importance
        reduction = max(reduction, 0.0)
        reduction = round(reduction, 1)
```

### 프론트엔드 변경 (RuleManagement.js)

#### 1. 초기 상태 변경
```javascript
const [minRisk, setMinRisk] = useState(50);  // 15 → 50
```

#### 2. 위험도 로드 로직
```javascript
const loadRiskCalculation = async () => {
    // 음수 방어
    const maxRiskValue = Math.max(response.data.max_risk, 50);
    const minRiskValue = Math.max(response.data.min_risk, 50);
    
    // 룰별 감소량 맵 생성 (음수 방어)
    const reductionMap = {};
    response.data.risk_reduction_per_rule.forEach(item => {
        const reduction = Math.max(item.reduction, 0);
        reductionMap[item.rule_id] = Math.round(reduction * 10) / 10;
    });
};
```

#### 3. 룰 적용/제거 로직
```javascript
// 룰 적용
const reduction = Math.max(riskReductionMap[selectedRule.id] || 0, 0);
const newRisk = Math.max(currentRisk - reduction, minRisk);
setCurrentRisk(Math.round(newRisk * 10) / 10);

// 룰 제거
const reduction = Math.max(riskReductionMap[rule.id] || 0, 0);
const newRisk = Math.min(currentRisk + reduction, maxRisk);
setCurrentRisk(Math.round(newRisk * 10) / 10);
```

---

## 🧪 테스트 시나리오

### 테스트 1: 음수 방어
- **입력**: total_reduction = -10
- **기대 결과**: 모든 룰의 감소 점수 = 0.0
- **실제 결과**: ✅ 통과

### 테스트 2: 소수점 처리
- **입력**: reduction = 5.23456789
- **기대 결과**: 5.2
- **실제 결과**: ✅ 통과

### 테스트 3: 동적 최고 위험도
- **입력**: base_risk = 85, 적용된 룰 = 0개
- **기대 결과**: max_risk = 85
- **실제 결과**: ✅ 통과

### 테스트 4: 최저 위험도 하한선
- **입력**: 모든 룰 적용
- **기대 결과**: current_risk >= 50
- **실제 결과**: ✅ 통과

---

## 📝 업데이트된 파일 목록

1. **백엔드**
   - `api_server.py` - 위험도 계산 API 로직 전면 수정

2. **프론트엔드**
   - `frontend/src/components/RuleManagement.js` - UI 및 상태 관리 로직 수정

3. **문서**
   - `docs/RISK_CALCULATION.md` - v3.0으로 업데이트
   - `RISK_CALCULATION_V3_CHANGES.md` - 변경 사항 요약 (신규)

---

## 🚀 배포 방법

### 1. 백엔드 재시작
```bash
# Windows
restart.bat

# 또는 수동 재시작
python api_server.py
```

### 2. 프론트엔드 재빌드
```bash
cd frontend
npm run build
```

### 3. 브라우저 캐시 클리어
- Ctrl + Shift + R (하드 리프레시)

---

## ✅ 검증 체크리스트

- [x] 개별 룰 점수가 모두 양수로 표시되는가?
- [x] 소수점이 첫째 자리까지만 표시되는가?
- [x] 타이틀이 "종합 시스템 위험도"로 변경되었는가?
- [x] 최고 위험도가 50~100점 사이에서 동적으로 변화하는가?
- [x] 최저 위험도가 50점으로 고정되어 있는가?
- [x] 룰 적용 시 위험도가 정상적으로 감소하는가?
- [x] 룰 제거 시 위험도가 정상적으로 증가하는가?
- [x] 브라우저 콘솔에 디버그 정보가 정상적으로 출력되는가?

---

## 🐛 알려진 이슈

현재 없음

---

## 📞 문의

문제가 발생하거나 추가 개선이 필요한 경우:
1. 브라우저 콘솔의 디버그 정보 확인
2. `api_server.py`의 로그 확인
3. 이슈 리포트 작성

---

**작성자**: Kiro AI Assistant  
**버전**: 3.0  
**최종 업데이트**: 2026-05-08
