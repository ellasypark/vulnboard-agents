# WAF 보안 대시보드

AI 기반 AWS WAF 로그 분석 및 룰 관리 시스템

## 📋 프로젝트 구조

```
04/
├── analysis.py              # 로그 분석 모듈
├── api_server.py            # Flask API 서버 (메인)
├── automation.py            # 자동화 모듈
├── detection.py             # 공격 탐지 모듈
├── orchestrator.py          # 오케스트레이터
├── report.py                # 보고서 생성 모듈
├── s3_log_loader.py         # S3 로그 로더
├── test_local.py            # 로컬 테스트
├── .env                     # 환경 변수 설정
├── requirements.txt         # Python 의존성
│
├── start.bat                # 통합 시작 스크립트
├── stop.bat                 # 통합 종료 스크립트
├── restart.bat              # 재시작 스크립트
│
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── GeoMap.js           # 지도 컴포넌트
│   │   │   ├── HourlyChart.js      # 시간대별 차트
│   │   │   ├── AttackTypeChart.js  # 공격 유형 차트
│   │   │   ├── RuleManagement.js   # 룰 관리 (신규)
│   │   │   ├── LogTable.js         # 로그 테이블
│   │   │   └── Header.js           # 헤더
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── templates/               # HTML 템플릿
│   └── dashboard.html
│
├── data/                    # 데이터 파일
│   ├── waf_logs.json       # WAF 로그 데이터
│   └── step_functions.json # Step Functions 설정
│
├── docs/                    # 문서
│   ├── S3_LOG_SETUP.md     # S3 설정 가이드
│   ├── START_WITH_S3.md    # S3 시작 가이드
│   └── UPDATE_GUIDE_V2.md  # 업데이트 가이드 v2.0
│
├── scripts/                 # 유틸리티 스크립트
│   ├── restart_backend.bat
│   └── start_dashboard.bat
│
└── tests/                   # 테스트 파일
    ├── test_attack_detection.py
    └── test_s3_connection.py
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# Python 의존성 설치
pip install -r requirements.txt

# 프론트엔드 의존성 설치
cd frontend
npm install
cd ..
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
AWS_REGION=ap-northeast-2
WAF_ARN=your_waf_arn
WAF_NAME=your_waf_name
WAF_ID=your_waf_id
BEDROCK_MODEL=global.anthropic.claude-sonnet-4-6
PENDING_BLOCKS_TABLE=pending_blocks

# AbuseIPDB API 설정
ABUSEIPDB_API_KEY=your_abuseipdb_api_key

# S3 WAF 로그 설정
USE_S3_LOGS=true
S3_BUCKET=vulnboard-attack-logs
S3_BUCKET_NAME=aws-waf-logs-attack-683123960885-ap-northeast-2-an
S3_REGION=ap-northeast-2

# AWS 자격 증명 (선택사항 - AWS CLI 설정이나 IAM Role 사용 권장)

# AWS 자격 증명 (선택사항 - AWS CLI 설정 사용 가능)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. 서버 시작

**옵션 1: 통합 스크립트 (권장)**
```bash
.\start.bat
```

**옵션 2: 수동 실행**
```bash
# 터미널 1: 백엔드
python api_server.py

# 터미널 2: 프론트엔드
cd frontend
npm start
```

### 4. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 📊 주요 기능

### 1. 실시간 대시보드
- 지역별 공격 트래픽 지도 (빨간색 계열)
- 시간대별 공격 현황 차트
- 월별 공격 유형 분석

### 2. WAF 룰 관리 시스템 v2.0
- **AI 제안 룰**: 8개의 AWS WAF 관리형 룰
- **적용된 룰**: 실시간 적용 상태 관리
- **통합 위험도**: 동적 위험도 계산 (100점 만점)

#### 위험도 계산 로직
1. **최고 위험도**: 현재 로그 기반 위험도 (아무 룰도 적용 안 함)
2. **최저 위험도**: 모든 AI 룰 적용 시 도달 가능한 최소 위험도
3. **룰별 점수**: WCU(70%) + 탐지 건수(30%) 기반 중요도 계산
4. **실시간 업데이트**: 룰 적용 시 뺄셈(-), 제거 시 덧셈(+)

### 3. S3 로그 연동
- AWS S3 버킷에서 자동 로그 수집
- gzip 압축 파일 자동 처리
- 최대 1000개 로그 로드

### 4. 공격 탐지
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- File Inclusion
- 패턴 기반 자동 탐지

## 🔧 API 엔드포인트

### 데이터 조회
- `GET /api/geographic-data` - 지역별 공격 데이터
- `GET /api/hourly-attacks` - 시간대별 공격 현황
- `GET /api/monthly-attack-types` - 월별 공격 유형
- `GET /api/logs` - WAF 로그 목록
- `GET /api/rules/before` - 개선 전 룰
- `GET /api/rules/after` - 개선 후 룰 (AI 추천)

### 룰 관리
- `GET /api/risk-calculation` - 위험도 계산 정보
- `POST /api/apply-rule` - 개별 룰 적용
- `POST /api/remove-rule` - 적용된 룰 제거

### 기타
- `GET /api/theme` - 테마 조회
- `POST /api/theme` - 테마 변경
- `GET /api/download-report` - PDF 보고서 다운로드

## 📚 문서

- [S3 로그 설정 가이드](docs/S3_LOG_SETUP.md)
- [S3로 시작하기](docs/START_WITH_S3.md)
- [업데이트 가이드 v2.0](docs/UPDATE_GUIDE_V2.md)

## 🧪 테스트

```bash
# 로컬 테스트
python test_local.py

# S3 연결 테스트
python tests/test_s3_connection.py

# 공격 탐지 테스트
python tests/test_attack_detection.py
```

## 🛠️ 기술 스택

### Backend
- Python 3.8+
- Flask
- boto3 (AWS SDK)
- ReportLab (PDF 생성)

### Frontend
- React 18
- Axios
- Leaflet (지도)
- Recharts (차트)
- Font Awesome (아이콘)

## 📝 변경 이력

### v2.0 (2026-05-08)
- ✅ 지도 컴포넌트 빨간색 계열로 변경
- ✅ 상대적 퍼센티지 기준 공격 빈도 계산
- ✅ WAF 룰 관리 3단 레이아웃 구현
- ✅ 실시간 위험도 동적 계산
- ✅ 태그 UI 및 색상 동기화
- ✅ 개별 룰 적용/제거 기능

### v1.0
- 초기 대시보드 구현
- S3 로그 연동
- 기본 공격 탐지

## 🤝 기여

이슈 및 PR은 언제나 환영합니다!

## 📄 라이선스

MIT License

## 👥 팀

MEGATHON - IAM_HALO Team

---

**마지막 업데이트**: 2026-05-08  
**버전**: 2.0
