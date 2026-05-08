# WAF 대시보드 업데이트 가이드 v2.0

## 📋 주요 변경사항

### 1. 지도 컴포넌트 개선 ✅
**백엔드 변경 (`api_server.py`)**
- ✅ 상대적 퍼센티지(%) 기준으로 공격 빈도 계산
- ✅ 사용자 친화적인 인덱스 범위 생성 (1, 5, 10, 20 단위)
- ✅ 빨간색 계열 색상으로 변경 (보안 경각심 강화)
  - `#fecaca` (낮음) → `#dc2626` (높음)
- ✅ 퍼센티지 정보 추가 전달

**프론트엔드 변경 (`GeoMap.js`)**
- ✅ 지도 마커 색상을 빨간색 계열로 변경
- ✅ 하단 범례 유지 (오버레이 제거 완료)
- ✅ 상대적 threshold 기반 마커 색상 결정

---

### 2. WAF 룰 관리 시스템 전면 개편 ✅

#### 새로운 3단 레이아웃
```
┌─────────────────┬─────────────────┬─────────────────┐
│  AI 제안 룰     │   적용된 룰     │  통합 위험도    │
│  (좌측)         │   (중앙)        │  (우측)         │
└─────────────────┴─────────────────┴─────────────────┘
```

**새 컴포넌트 생성**
- ✅ `RuleManagement.js` - 통합 룰 관리 컴포넌트
- ✅ `RuleManagement.css` - 전용 스타일시트

**주요 기능**
1. **AI 제안 룰 (좌측)**
   - 8개의 AWS WAF 관리형 룰 표시
   - 각 룰의 카테고리 태그 (월별 공격 유형 색상과 동기화)
   - WCU, 탐지 건수, 위험도 감소 점수 표시
   - "상세 보기" 버튼으로 모달 열기

2. **적용된 룰 (중앙)**
   - 초기 상태: 빈 상태 (Empty State)
   - 적용된 룰 표시
   - 각 룰마다 삭제(X) 버튼
   - 삭제 시 좌측으로 롤백

3. **통합 실시간 위험도 (우측)**
   - 원형 게이지 (100점 만점)
   - 위험도 바 (최저~최고)
   - 통계 정보:
     - 적용된 룰 개수
     - 남은 제안 개수
     - 위험도 감소량

**상세 보기 모달**
- ✅ 룰 기본 정보 (WCU, 카테고리, 위험도 감소)
- ✅ 설명
- ✅ 탐지 통계 (총 탐지, 차단, 허용)
- ✅ 주요 공격 유형 Top 5
- ✅ AI 개선 사항
- ✅ **[적용]** 버튼: 룰을 중앙으로 이동 + WAF 적용
- ✅ **[취소]** 버튼: 모달만 닫기

**실시간 위험도 계산 로직**
```javascript
// 초기 위험도
maxRisk = 100 (아무 룰도 적용 안 함)
minRisk = 15 (모든 룰 적용)

// 각 룰의 위험도 감소 점수 (WCU 기반 가중치)
ruleScore = (maxRisk - minRisk) × (룰 WCU / 전체 WCU)

// 룰 적용 시
currentRisk -= ruleScore

// 룰 제거 시
currentRisk += ruleScore
```

---

### 3. 백엔드 API 추가 ✅

**새로운 엔드포인트**

1. **`POST /api/apply-rule`**
   - 개별 룰 적용 (AI 제안 → 적용된 룰)
   - Request: `{ "rule_id": "RULE-AFTER-..." }`
   - Response: `{ "success": true, "message": "...", "rule_id": "..." }`

2. **`POST /api/remove-rule`**
   - 적용된 룰 제거 (적용된 룰 → AI 제안)
   - Request: `{ "rule_id": "RULE-AFTER-..." }`
   - Response: `{ "success": true, "message": "...", "rule_id": "..." }`

3. **`GET /api/risk-calculation`**
   - 위험도 계산 정보 반환
   - Response:
     ```json
     {
       "success": true,
       "max_risk": 100,
       "min_risk": 15,
       "current_risk": 100,
       "risk_reduction_per_rule": [
         { "rule_id": "...", "reduction": 10.5 },
         ...
       ]
     }
     ```

---

### 4. App.js 통합 ✅

**변경사항**
- ✅ 기존 `RuleCard`, `RuleComparison`, `RulePopup` 제거
- ✅ 새로운 `RuleManagement` 컴포넌트 통합
- ✅ `rulesBefore`, `rulesAfter` → `aiRules`로 단순화
- ✅ 불필요한 상태 제거 (`selectedRuleType`, `popupData`)

---

## 🚀 실행 방법

### 1. 백엔드 재시작
```bash
# 기존 서버 종료 (Ctrl+C)

# 백엔드 서버 시작
python api_server.py
```

### 2. 프론트엔드 재시작
```bash
cd frontend
npm start
```

### 3. 통합 스크립트 사용 (권장)
```bash
# 전체 시작
.\start.bat

# 전체 종료
.\stop.bat

# 재시작
.\restart.bat
```

---

## 🎨 UI/UX 개선사항

### 색상 테마
- **지도**: 빨간색 계열 (`#fecaca` → `#dc2626`)
- **태그**: 월별 공격 유형 그래프와 동일한 색상
- **위험도 게이지**:
  - 높음 (70+): `#dc2626` (빨강)
  - 중간 (40-69): `#f59e0b` (주황)
  - 낮음 (<40): `#10b981` (초록)

### 반응형 디자인
- 1200px 이하: 3단 레이아웃 → 1단 레이아웃
- 768px 이하: 모달 전체 화면, 버튼 세로 배치

---

## 📊 데이터 흐름

```
1. 페이지 로드
   ↓
2. /api/rules/after → AI 추천 룰 로드
   ↓
3. /api/risk-calculation → 위험도 계산 정보 로드
   ↓
4. 사용자가 "상세 보기" 클릭
   ↓
5. 모달 표시
   ↓
6. 사용자가 "적용" 클릭
   ↓
7. POST /api/apply-rule → 백엔드에 룰 적용 요청
   ↓
8. 프론트엔드 상태 업데이트:
   - suggestedRules에서 제거
   - appliedRules에 추가
   - currentRisk 감소
   ↓
9. UI 실시간 업데이트
```

---

## 🔧 트러블슈팅

### 문제 1: 백엔드 서버가 시작되지 않음
**해결책:**
```bash
# 포트 5000이 사용 중인지 확인
netstat -ano | findstr :5000

# 프로세스 종료
taskkill /PID <PID> /F

# 서버 재시작
python api_server.py
```

### 문제 2: 프론트엔드에서 API 호출 실패
**해결책:**
1. 백엔드 서버가 실행 중인지 확인 (`http://localhost:5000`)
2. CORS 설정 확인 (`api_server.py`에 `CORS(app)` 있음)
3. 브라우저 콘솔에서 에러 확인

### 문제 3: 룰 적용 후 UI가 업데이트되지 않음
**해결책:**
1. 브라우저 콘솔에서 에러 확인
2. React DevTools로 상태 확인
3. 페이지 새로고침 (F5)

---

## 📝 주요 파일 목록

### 백엔드
- `api_server.py` - Flask API 서버 (수정됨)

### 프론트엔드
- `src/App.js` - 메인 앱 컴포넌트 (수정됨)
- `src/components/GeoMap.js` - 지도 컴포넌트 (수정됨)
- `src/components/RuleManagement.js` - 룰 관리 컴포넌트 (신규)
- `src/components/RuleManagement.css` - 룰 관리 스타일 (신규)

### 기타
- `start.bat` - 통합 시작 스크립트
- `stop.bat` - 통합 종료 스크립트
- `restart.bat` - 재시작 스크립트

---

## ✅ 체크리스트

- [x] 지도 컴포넌트 빨간색 계열로 변경
- [x] 상대적 퍼센티지 기준 적용
- [x] 3단 레이아웃 구현 (AI 제안 | 적용된 룰 | 위험도)
- [x] 태그 UI 구현 및 색상 동기화
- [x] 상세 보기 모달에 적용/취소 버튼 추가
- [x] 룰 적용/제거 로직 구현
- [x] 실시간 위험도 계산 로직 구현
- [x] 백엔드 API 엔드포인트 추가
- [x] App.js 통합
- [x] 반응형 디자인 적용

---

## 🎯 다음 단계

1. **실제 AWS WAF API 연동**
   - boto3를 사용한 실제 WAF 룰 적용/제거
   - AWS 자격 증명 설정

2. **룰 적용 이력 관리**
   - 데이터베이스 연동
   - 적용/제거 이력 저장

3. **알림 기능**
   - 룰 적용 성공/실패 토스트 알림
   - 실시간 위험도 변화 알림

4. **성능 최적화**
   - 룰 목록 가상 스크롤
   - API 응답 캐싱

---

**작성일:** 2026-05-08  
**버전:** 2.0  
**작성자:** Kiro AI Assistant
