# 변경사항 요약 v2.0

## 🎯 주요 변경사항

### 1. 위험도 계산 로직 개선 ✅

#### 백엔드 (`api_server.py`)
```python
# 1. 현재 위험도 (최고 위험도) - 로그 기반 실제 계산
max_risk = (고위험 로그 비율 × 100) + (중위험 로그 비율 × 50)
# 최소 50점 보장

# 2. 최저 위험도 - 모든 AI 룰 적용 시
if total_wcu >= 1500: min_risk = 15
elif total_wcu >= 1000: min_risk = 25
elif total_wcu >= 500: min_risk = 35
else: min_risk = 45

# 3. 각 룰의 위험도 감소 점수 - 중요도 기반
importance = (WCU 가중치 × 0.7) + (탐지 건수 가중치 × 0.3)
reduction = total_reduction × importance

# 4. 룰 적용/제거 시 덧셈/뺄셈
# 적용: currentRisk -= reduction
# 제거: currentRisk += reduction
```

#### 프론트엔드 (`RuleManagement.js`)
- 룰 적용 시: 위험도 감소 알림 표시 (`-X.X점 감소`)
- 룰 제거 시: 위험도 증가 알림 표시 (`+X.X점 증가`)
- 실시간 위험도 게이지 업데이트

---

### 2. 디렉토리 구조 정리 ✅

#### 새로운 디렉토리 구조
```
04/
├── 📄 루트 파일 (변경 금지)
│   ├── analysis.py
│   ├── api_server.py
│   ├── automation.py
│   ├── detection.py
│   ├── orchestrator.py
│   ├── report.py
│   ├── start.bat
│   ├── stop.bat
│   └── test_local.py
│
├── 📂 frontend/          # React 프론트엔드
├── 📂 data/              # 데이터 파일 (신규)
├── 📂 docs/              # 문서 (신규)
├── 📂 scripts/           # 유틸리티 스크립트 (신규)
├── 📂 tests/             # 테스트 파일 (신규)
└── 📂 templates/         # HTML 템플릿
```

#### 삭제된 파일 (10개)
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

#### 이동된 파일
**→ `docs/`**
- `S3_LOG_SETUP.md`
- `START_WITH_S3.md`
- `UPDATE_GUIDE_V2.md`

**→ `data/`**
- `waf_logs.json`
- `step_functions.json`

**→ `tests/`**
- `test_attack_detection.py`
- `test_s3_connection.py`

**→ `scripts/`**
- `restart_backend.bat`
- `start_dashboard.bat`

#### 신규 생성된 파일
- ✅ `README.md` (프로젝트 메인 문서)
- ✅ `docs/DIRECTORY_STRUCTURE.md` (디렉토리 구조 가이드)
- ✅ `data/.gitkeep` (Git 추적용)
- ✅ `.gitignore` (업데이트)

---

## 📝 수정된 파일

### Backend
1. **`api_server.py`**
   - `/api/risk-calculation` 엔드포인트 로직 개선
   - 로그 기반 실제 위험도 계산
   - WCU + 탐지 건수 기반 중요도 계산
   - `data/waf_logs.json` 경로 업데이트

### Frontend
2. **`frontend/src/components/RuleManagement.js`**
   - 룰 적용/제거 시 알림 메시지에 점수 변화 표시
   - 위험도 덧셈/뺄셈 로직 명확화

### Configuration
3. **`.gitignore`**
   - `data/` 디렉토리 패턴 추가
   - 더 상세한 제외 규칙

---

## 🔄 경로 변경 영향

### API 서버
```python
# 변경 전
loader.save_logs_to_file(s3_logs, 'waf_logs.json')
possible_paths = ['waf_logs.json', ...]

# 변경 후
loader.save_logs_to_file(s3_logs, 'data/waf_logs.json')
possible_paths = ['data/waf_logs.json', 'waf_logs.json', ...]
```

### 하위 호환성
- 기존 `waf_logs.json` 경로도 지원 (fallback)
- 점진적 마이그레이션 가능

---

## 🚀 실행 방법 (변경 없음)

```bash
# 통합 시작
.\start.bat

# 통합 종료
.\stop.bat

# 재시작
.\restart.bat
```

---

## 📊 위험도 계산 예시

### 시나리오
- 총 로그: 1000개
- 고위험 로그: 100개 (10%)
- 중위험 로그: 300개 (30%)
- AI 룰 총 WCU: 1528

### 계산 결과
```
1. 최고 위험도 (현재)
   = (100/1000 × 100) + (300/1000 × 50)
   = 10 + 15
   = 25점
   → max(50, 25) = 50점 (최소 보장)

2. 최저 위험도 (모든 룰 적용 시)
   = 15점 (WCU >= 1500)

3. 전체 감소 가능 범위
   = 50 - 15 = 35점

4. 각 룰의 감소 점수 (예: CommonRuleSet)
   WCU: 700 (45.8%)
   탐지: 200건 (20%)
   importance = (0.458 × 0.7) + (0.2 × 0.3) = 0.381
   reduction = 35 × 0.381 = 13.3점
```

---

## ✅ 테스트 체크리스트

### 위험도 계산
- [ ] 초기 로드 시 위험도 정확히 계산되는지 확인
- [ ] 룰 적용 시 위험도 감소 확인
- [ ] 룰 제거 시 위험도 증가 확인
- [ ] 알림 메시지에 점수 변화 표시 확인
- [ ] 최저/최고 위험도 범위 제한 확인

### 디렉토리 구조
- [ ] `data/waf_logs.json` 경로에서 로그 로드 확인
- [ ] S3 로그 저장 시 `data/` 디렉토리에 저장 확인
- [ ] 기존 경로 fallback 동작 확인
- [ ] 문서 링크 정상 작동 확인

### 일반 기능
- [ ] 백엔드 서버 정상 시작
- [ ] 프론트엔드 정상 시작
- [ ] 통합 스크립트 정상 동작
- [ ] 지도 컴포넌트 정상 표시
- [ ] 룰 관리 3단 레이아웃 정상 표시

---

## 🎯 Git Commit Message

```bash
git commit -m "feat: 위험도 계산 로직 개선 및 디렉토리 구조 정리

위험도 계산:
- 로그 기반 실제 위험도 계산 (최고 위험도)
- WCU + 탐지 건수 기반 중요도 계산
- 룰 적용/제거 시 실시간 덧셈/뺄셈
- 알림 메시지에 점수 변화 표시

디렉토리 정리:
- 불필요한 MD 파일 10개 삭제
- 새로운 디렉토리 구조 (data, docs, scripts, tests)
- 데이터 파일을 data/ 디렉토리로 이동
- 문서를 docs/ 디렉토리로 이동
- 테스트를 tests/ 디렉토리로 이동
- README.md 및 DIRECTORY_STRUCTURE.md 생성
- .gitignore 업데이트

BREAKING CHANGE: waf_logs.json 경로가 data/waf_logs.json으로 변경 (하위 호환성 유지)"
```

---

## 📚 관련 문서

- [README.md](../README.md) - 프로젝트 메인 문서
- [DIRECTORY_STRUCTURE.md](docs/DIRECTORY_STRUCTURE.md) - 디렉토리 구조 가이드
- [UPDATE_GUIDE_V2.md](docs/UPDATE_GUIDE_V2.md) - 업데이트 가이드 v2.0

---

**작성일**: 2026-05-08  
**버전**: 2.0  
**작성자**: Kiro AI Assistant
