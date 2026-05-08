# 디렉토리 구조 가이드

## 📁 프로젝트 구조

```
04/
├── 📄 README.md                 # 프로젝트 메인 문서
├── 📄 .env                      # 환경 변수 설정
├── 📄 .gitignore                # Git 제외 파일 목록
├── 📄 requirements.txt          # Python 의존성
│
├── 🐍 Python 모듈 (루트)
│   ├── analysis.py              # 로그 분석 모듈
│   ├── api_server.py            # Flask API 서버 (메인)
│   ├── automation.py            # 자동화 모듈
│   ├── detection.py             # 공격 탐지 모듈
│   ├── orchestrator.py          # 오케스트레이터
│   ├── report.py                # 보고서 생성 모듈
│   ├── s3_log_loader.py         # S3 로그 로더
│   └── test_local.py            # 로컬 테스트
│
├── 🚀 실행 스크립트 (루트)
│   ├── start.bat                # 통합 시작 스크립트
│   ├── stop.bat                 # 통합 종료 스크립트
│   └── restart.bat              # 재시작 스크립트
│
├── 📂 frontend/                 # React 프론트엔드
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js               # 메인 앱 컴포넌트
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── components/          # React 컴포넌트
│   │       ├── Header.js
│   │       ├── Header.css
│   │       ├── GeoMap.js        # 지도 컴포넌트
│   │       ├── GeoMap.css
│   │       ├── HourlyChart.js   # 시간대별 차트
│   │       ├── AttackTypeChart.js # 공격 유형 차트
│   │       ├── RuleManagement.js  # 룰 관리 (v2.0)
│   │       ├── RuleManagement.css
│   │       ├── LogTable.js      # 로그 테이블
│   │       └── LogTable.css
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── 📂 templates/                # HTML 템플릿
│   └── dashboard.html           # 레거시 대시보드
│
├── 📂 data/                     # 데이터 파일
│   ├── .gitkeep                 # Git 추적용
│   ├── waf_logs.json            # WAF 로그 데이터
│   └── step_functions.json      # Step Functions 설정
│
├── 📂 docs/                     # 문서
│   ├── S3_LOG_SETUP.md          # S3 설정 가이드
│   ├── START_WITH_S3.md         # S3 시작 가이드
│   ├── UPDATE_GUIDE_V2.md       # 업데이트 가이드 v2.0
│   └── DIRECTORY_STRUCTURE.md   # 이 문서
│
├── 📂 scripts/                  # 유틸리티 스크립트
│   ├── restart_backend.bat      # 백엔드만 재시작
│   └── start_dashboard.bat      # 레거시 대시보드 시작
│
└── 📂 tests/                    # 테스트 파일
    ├── test_attack_detection.py # 공격 탐지 테스트
    └── test_s3_connection.py    # S3 연결 테스트
```

## 📋 디렉토리 설명

### 루트 디렉토리
프로젝트의 핵심 Python 모듈과 실행 스크립트가 위치합니다.

**주요 파일:**
- `api_server.py`: Flask 기반 백엔드 API 서버 (메인 진입점)
- `start.bat`: 백엔드 + 프론트엔드 동시 시작
- `stop.bat`: 모든 서버 종료
- `test_local.py`: 로컬 환경 테스트

### `/frontend`
React 기반 프론트엔드 애플리케이션

**주요 컴포넌트:**
- `RuleManagement.js`: WAF 룰 관리 시스템 v2.0 (3단 레이아웃)
- `GeoMap.js`: 지역별 공격 트래픽 지도 (빨간색 계열)
- `LogTable.js`: WAF 로그 테이블 (페이지네이션)

### `/data`
런타임 데이터 파일 저장소

**파일:**
- `waf_logs.json`: S3에서 가져온 WAF 로그 (백업)
- `step_functions.json`: AWS Step Functions 설정

**주의:** 이 디렉토리의 JSON 파일은 `.gitignore`에 포함되어 있습니다.

### `/docs`
프로젝트 문서 모음

**문서:**
- `S3_LOG_SETUP.md`: AWS S3 버킷 설정 방법
- `START_WITH_S3.md`: S3 로그 연동 시작 가이드
- `UPDATE_GUIDE_V2.md`: v2.0 업데이트 상세 가이드
- `DIRECTORY_STRUCTURE.md`: 디렉토리 구조 설명 (이 문서)

### `/scripts`
유틸리티 및 보조 스크립트

**스크립트:**
- `restart_backend.bat`: 백엔드 서버만 재시작
- `start_dashboard.bat`: 레거시 HTML 대시보드 시작

### `/tests`
테스트 코드 모음

**테스트:**
- `test_attack_detection.py`: 공격 탐지 로직 테스트
- `test_s3_connection.py`: S3 연결 및 로그 로드 테스트

### `/templates`
Flask 템플릿 (레거시)

**파일:**
- `dashboard.html`: 초기 버전 HTML 대시보드 (현재 미사용)

## 🔄 파일 이동 이력

### v2.0 정리 작업 (2026-05-08)

**삭제된 파일:**
- ❌ `CHANGELOG.md`
- ❌ `CURRENT_STATUS.md`
- ❌ `FINAL_UPDATE.md`
- ❌ `FRONTEND_SEPARATION_GUIDE.md`
- ❌ `IMPLEMENTATION_GUIDE.md`
- ❌ `ISSUE_RESOLUTION.md`
- ❌ `QUICK_START.md`
- ❌ `README_DASHBOARD.md`
- ❌ `RUN_DASHBOARD.md`
- ❌ `UPDATE_NOTES.md`

**이동된 파일:**
- 📄 `S3_LOG_SETUP.md` → `docs/`
- 📄 `START_WITH_S3.md` → `docs/`
- 📄 `UPDATE_GUIDE_V2.md` → `docs/`
- 📄 `waf_logs.json` → `data/`
- 📄 `step_functions.json` → `data/`
- 📄 `test_attack_detection.py` → `tests/`
- 📄 `test_s3_connection.py` → `tests/`
- 📄 `restart_backend.bat` → `scripts/`
- 📄 `start_dashboard.bat` → `scripts/`

**신규 생성:**
- ✅ `README.md` (루트)
- ✅ `docs/DIRECTORY_STRUCTURE.md`
- ✅ `data/.gitkeep`

## 📝 파일 경로 규칙

### Python 모듈
- **위치**: 루트 디렉토리
- **이유**: 상호 import가 쉽고, 실행 스크립트와 같은 레벨

### 실행 스크립트
- **위치**: 루트 디렉토리
- **이유**: 사용자가 쉽게 찾고 실행 가능

### 프론트엔드
- **위치**: `/frontend` 디렉토리
- **이유**: 백엔드와 명확히 분리, npm 프로젝트 독립성

### 데이터 파일
- **위치**: `/data` 디렉토리
- **이유**: 런타임 데이터와 코드 분리, .gitignore 관리 용이

### 문서
- **위치**: `/docs` 디렉토리
- **이유**: 문서 집중화, 루트 디렉토리 정리

### 테스트
- **위치**: `/tests` 디렉토리
- **이유**: 표준 Python 프로젝트 구조 준수

## 🚀 실행 경로

### 백엔드 시작
```bash
# 루트 디렉토리에서
python api_server.py
```

### 프론트엔드 시작
```bash
# 루트 디렉토리에서
cd frontend
npm start
```

### 통합 시작
```bash
# 루트 디렉토리에서
.\start.bat
```

## 🔍 파일 찾기

### 설정 파일
- 환경 변수: `.env` (루트)
- Python 의존성: `requirements.txt` (루트)
- Frontend 의존성: `frontend/package.json`

### 로그 데이터
- WAF 로그: `data/waf_logs.json`
- 애플리케이션 로그: 콘솔 출력

### 문서
- 메인 문서: `README.md` (루트)
- 상세 가이드: `docs/` 디렉토리

### 테스트
- 모든 테스트: `tests/` 디렉토리
- 로컬 테스트: `test_local.py` (루트)

## ⚠️ 주의사항

1. **경로 변경 금지 파일**
   - `analysis.py`
   - `detection.py`
   - `automation.py`
   - `api_server.py`
   - `orchestrator.py`
   - `report.py`
   - `start.bat`
   - `stop.bat`
   - `test_local.py`

2. **데이터 파일**
   - `data/` 디렉토리의 JSON 파일은 Git에 커밋되지 않습니다
   - `.gitkeep` 파일로 디렉토리 구조만 유지

3. **프론트엔드**
   - `frontend/` 디렉토리는 독립적인 npm 프로젝트
   - `node_modules/`는 Git에 포함되지 않음

---

**작성일**: 2026-05-08  
**버전**: 2.0  
**작성자**: Kiro AI Assistant
