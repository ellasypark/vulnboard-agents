# WAF 보안 대시보드 - 기능 구현 가이드

## 📋 구현 완료 항목

### 1️⃣ PDF 보고서 다운로드 기능 ✅

**파일**: `api_server.py`

**구현 내용**:
- 서버 사이드 PDF 생성 로직 구현 (ReportLab 사용)
- 한글 폰트 지원 (Malgun Gothic)
- 비즈니스 스타일 디자인 (네이비/블루 색상 팔레트)

**보고서 포함 요소**:
1. **전체 통계 요약**
   - 총 로그 수
   - 개선 전/후 룰 수
   - 탐지된 공격 유형 수

2. **주요 탐지 이벤트** (최근 5개)
   - 탐지일시
   - 탐지명 (공격 유형)
   - 위험도 점수
   - 출발지 IP/국가
   - 목적지 IP
   - WAF 조치

3. **WAF 룰 개선 전후 비교**
   - 개선 전 룰 (최대 3개)
     - 룰 이름, 위험도, 위험 점수
     - 탐지 일시, 대상 IP/국가
     - 공격 유형, 설명
     - 원인 (WAF 로그)
     - 조치 방안
     - 영향도
   
   - 개선 후 룰 (최대 3개)
     - 위 항목 + 기대 효과

**API 엔드포인트**:
```
GET /api/download-report
```

**사용 방법**:
```javascript
// 프론트엔드에서 호출
window.open('http://localhost:5000/api/download-report', '_blank');
```

---

### 2️⃣ 주간 시간대별 공격 현황 차트 로직 수정 ✅

**파일**: 
- `api_server.py` (백엔드)
- `frontend/src/components/HourlyChart.js` (프론트엔드)

**변경 사항**:
- ❌ 기존: 요일별 24시간 집계 (월~일, 0~23시)
- ✅ 신규: **일별 집계** (최근 7일, 날짜 기준)

**집계 방식**:
- X축: 날짜 (MM/DD 형식)
- Y축: 일별 공격 횟수
- 기본 기간: 최근 7일
- **파라미터화**: `days` 파라미터로 조회 기간 조절 가능

**API 엔드포인트**:
```
GET /api/hourly-attacks?days=7
```

**파라미터**:
- `days` (optional): 조회할 일수 (기본값: 7)

**차트 스타일**:
- Line Chart (단일 라인)
- 파란색 계열 (#4a90e2)
- Fill 효과 적용
- 반응형 툴팁

---

### 3️⃣ 룰 상세 보기 Drawer 모달 ✅

**파일**: 
- `frontend/src/components/RulePopup.js`
- `frontend/src/components/RulePopup.css`

**UI 특징**:
- **Drawer 스타일**: 화면 우측에서 슬라이드 인
- **너비**: 화면의 35% (최소 400px, 최대 600px)
- **높이**: 100vh (브라우저 뷰포트 전체 높이)
- **애니메이션**: `transform: translateX()` 사용

**기능**:
- ESC 키로 닫기
- 오버레이 클릭으로 닫기
- X 버튼으로 닫기
- 좌우 화살표 키로 이전/다음 룰 탐색
- 하단 네비게이션 버튼 (< 이전, 다음 >)

**표시 정보**:
- 룰 이름
- 위험도 (HIGH/MEDIUM/LOW 배지)
- 위험 점수 (/100)
- 일시
- 대상 (IP/국가)
- 공격 유형
- 설명
- 원인 (WAF 로그)
- 조치 방안 (WAF 룰)
- 영향도
- 기대 효과 (개선 후 룰만)

**반응형 디자인**:
- 1024px 이하: 너비 45%
- 768px 이하: 너비 85%

---

### 4️⃣ 로그 테이블 정렬 및 필터링 기능 ✅

**파일**: 
- `frontend/src/components/LogTable.js`
- `frontend/src/components/LogTable.css`

#### 정렬 기능 (Sorting)

**구현 방식**:
- 컬럼 헤더 클릭으로 정렬
- 오름차순 ↔ 내림차순 토글
- 정렬 아이콘 표시 (fa-sort, fa-sort-up, fa-sort-down)
- 활성 정렬 컬럼은 노란색 아이콘

**정렬 가능 컬럼**:
- 발생일시 (timestamp) - 날짜 정렬
- 소스 IP (source_ip) - 문자열 정렬
- 목적 IP (dest_ip) - 문자열 정렬
- HTTP 요청 (http_request) - 문자열 정렬
- HTTP 응답 (http_response) - 숫자 정렬
- 공격 유형 (attack_type) - 문자열 정렬
- WAF 조치 (waf_action) - 문자열 정렬

#### 필터링 기능 (Filtering)

**구현 방식**:
- 필터 토글 버튼으로 필터 패널 표시/숨김
- 활성 필터 개수 배지 표시
- 실시간 필터링 (입력 즉시 적용)
- 다중 필터 동시 적용 가능

**필터 항목**:
1. **소스 IP**: 텍스트 입력 (부분 일치)
2. **목적 IP**: 텍스트 입력 (부분 일치)
3. **공격 유형**: 텍스트 입력 (부분 일치)
4. **WAF 조치**: 드롭다운 선택 (BLOCK/ALLOW/COUNT)

**추가 기능**:
- 필터 초기화 버튼
- 필터링된 결과 개수 표시 (예: 15 / 50)
- 필터 조건에 맞는 데이터 없을 시 안내 메시지

**UI 스타일**:
- 그리드 레이아웃 (반응형)
- 파란색 필터 버튼
- 빨간색 초기화 버튼
- 부드러운 애니메이션

---

## 🚀 실행 방법

### 백엔드 서버 시작
```bash
cd c:\Users\USER\Desktop\MEGATHON\IAM_HALO\04
python api_server.py
```

서버 주소: `http://localhost:5000`

### 프론트엔드 개발 서버 시작
```bash
cd c:\Users\USER\Desktop\MEGATHON\IAM_HALO\04\frontend
npm start
```

프론트엔드 주소: `http://localhost:3000`

---

## 📦 필요한 Python 패키지

```bash
pip install flask flask-cors reportlab
```

**주요 패키지**:
- `flask`: 웹 서버 프레임워크
- `flask-cors`: CORS 지원
- `reportlab`: PDF 생성

---

## 🎨 코딩 스타일 가이드

### 주석 작성 규칙
- **한국어**: 기능 설명, 로직 설명
- **영어**: 변수명, 함수명, 클래스명, 기술 용어

**예시**:
```python
# 최근 N일간의 일별 공격 현황 집계
def get_hourly_attacks(self, days: int = 7) -> Dict[str, List[int]]:
    """
    최근 N일간의 일별 공격 현황 집계
    
    Args:
        days: 집계할 일수 (기본값: 7일)
    
    Returns:
        날짜별 공격 횟수 딕셔너리
    """
    # 로그를 날짜별로 집계
    for log in self.logs:
        # 최근 N일 이내의 로그만 집계
        if (now - dt).days < days:
            daily_data[date_str] += 1
```

---

## 🔧 주요 기술 스택

### 백엔드
- Python 3.x
- Flask (웹 프레임워크)
- ReportLab (PDF 생성)

### 프론트엔드
- React 18
- Chart.js (차트 라이브러리)
- Leaflet (지도 라이브러리)
- Axios (HTTP 클라이언트)
- Font Awesome (아이콘)

---

## 📝 API 엔드포인트 목록

| 메서드 | 엔드포인트 | 설명 | 파라미터 |
|--------|-----------|------|----------|
| GET | `/api/geographic-data` | 지역별 트래픽 데이터 | - |
| GET | `/api/hourly-attacks` | 일별 공격 현황 | `days` (optional) |
| GET | `/api/monthly-attack-types` | 월별 공격 유형 | - |
| GET | `/api/rules/before` | 개선 전 룰 목록 | - |
| GET | `/api/rules/after` | 개선 후 룰 목록 | - |
| GET | `/api/logs` | WAF 로그 목록 | `page`, `per_page` |
| GET/POST | `/api/theme` | 테마 설정 | `theme` (POST) |
| GET | `/api/download-report` | PDF 보고서 다운로드 | - |

---

## 🎯 향후 개선 가능 사항

1. **페이지네이션**: 로그 테이블에 페이지 네비게이션 추가
2. **엑셀 내보내기**: 필터링된 로그를 Excel로 내보내기
3. **실시간 업데이트**: WebSocket을 통한 실시간 로그 스트리밍
4. **고급 필터**: 날짜 범위, 위험도 범위 필터
5. **차트 확대**: 차트 클릭 시 상세 뷰 모달
6. **룰 적용 API**: 실제 WAF에 룰 적용하는 API 연동
7. **알림 기능**: 고위험 이벤트 발생 시 알림
8. **대시보드 커스터마이징**: 사용자별 위젯 배치 설정

---

## 🐛 트러블슈팅

### PDF 다운로드 시 한글 깨짐
- Windows 폰트 경로 확인: `C:\Windows\Fonts\malgun.ttf`
- 폰트가 없으면 기본 폰트(Helvetica)로 대체됨

### CORS 오류
- `api_server.py`에서 `CORS(app)` 설정 확인
- 프론트엔드 `package.json`의 `proxy` 설정 확인

### 차트가 표시되지 않음
- Chart.js 등록 확인: `ChartJS.register(...)`
- 데이터 형식 확인: 객체 구조가 올바른지 확인

### 필터가 작동하지 않음
- `useMemo` 의존성 배열 확인
- 필터 상태 업데이트 확인

---

## 📞 문의 및 지원

구현 중 문제가 발생하면 다음을 확인하세요:
1. 브라우저 개발자 도구 콘솔 (F12)
2. 백엔드 서버 로그
3. 네트워크 탭에서 API 응답 확인

---

**작성일**: 2026-05-07
**버전**: 1.0.0
