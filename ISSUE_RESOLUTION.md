# 문제 해결 가이드

생성일시: 2026-05-08

## 🔍 발견된 문제

### 문제: "상세 보기" 버튼 클릭 시 모달이 표시되지 않음

**원인:**
- 개선 전/후 룰이 **0개** 생성됨
- 기존 코드는 `BLOCK` 또는 `COUNT` 액션인 경우에만 룰을 생성
- 하지만 실제 로그는 대부분 `ALLOW` 액션 (WAF가 차단하지 않음)
- 패턴 기반으로 탐지된 공격(SQL Injection, XSS 등)도 `ALLOW` 상태

**해결 방법:**
- `api_server.py`의 `initialize_data()` 및 `load_waf_logs_from_file()` 함수 수정
- 공격 패턴이 탐지된 경우에도 룰을 생성하도록 변경

## ✅ 적용된 수정 사항

### 1. api_server.py - 룰 생성 조건 개선

**수정 전:**
```python
if log_entry.get('action') in ['BLOCK', 'COUNT']:
    create_rule_from_log(log_entry, parsed_log)
```

**수정 후:**
```python
# BLOCK/COUNT 액션이거나 공격 패턴이 탐지된 경우 룰 생성
if log_entry.get('action') in ['BLOCK', 'COUNT'] or \
   any(pattern in parsed_log.get('attack_type', '') for pattern in 
       ['SQL Injection', 'XSS', 'Command Injection', 'Path Traversal', 'File Inclusion']):
    create_rule_from_log(log_entry, parsed_log)
```

**변경 이유:**
- WAF가 차단하지 못한 공격(ALLOW 상태)도 AI가 탐지한 경우 룰 생성
- 이를 통해 "개선 전 룰"과 "개선 후 룰" 비교 가능
- 사용자에게 AI 기반 개선 효과를 명확히 보여줌

### 2. 적용 위치
- `initialize_data()` 함수 (S3 로그 로드 시)
- `load_waf_logs_from_file()` 함수 (로컬 파일 로드 시)

## 🚀 백엔드 재시작 방법

### 방법 1: 배치 파일 사용 (권장)
```bash
restart_backend.bat
```

### 방법 2: 수동 재시작
1. 기존 프로세스 종료
   ```bash
   # PowerShell에서
   Get-Process -Name python | Where-Object {$_.MainWindowTitle -like "*api_server*"} | Stop-Process -Force
   ```

2. 새로 시작
   ```bash
   python api_server.py
   ```

## 📊 예상 결과

### 재시작 후 확인 사항

1. **로그 개수 확인**
   ```bash
   curl "http://localhost:5000/api/logs?page=1&per_page=1" | ConvertFrom-Json | Select-Object total
   ```
   - 예상: 900개 이상

2. **개선 전 룰 개수 확인**
   ```bash
   $response = Invoke-WebRequest -Uri "http://localhost:5000/api/rules/before" -UseBasicParsing | ConvertFrom-Json
   Write-Host "개선 전 룰: $($response.rules.Count)개"
   ```
   - 예상: 50개 이상 (SQL Injection, XSS 등 패턴 탐지된 로그 수)

3. **개선 후 룰 개수 확인**
   ```bash
   $response = Invoke-WebRequest -Uri "http://localhost:5000/api/rules/after" -UseBasicParsing | ConvertFrom-Json
   Write-Host "개선 후 룰: $($response.rules.Count)개"
   ```
   - 예상: 50개 이상 (개선 전 룰과 동일)

## 🎯 테스트 시나리오

### 1. 백엔드 재시작
```bash
restart_backend.bat
```

### 2. 브라우저에서 확인
1. `http://localhost:3000` 접속
2. 브라우저 새로고침 (Ctrl+F5)

### 3. 페이지네이션 확인
- 로그 테이블 하단에 페이지 버튼 표시 확인
- `<< < 1 2 3 4 5 ... > >>` 형태
- 페이지 이동 테스트

### 4. 월별 공격 유형 확인
- "월별 공격 유형" 차트 확인
- Normal Traffic, Allowed Traffic이 **제외**되었는지 확인
- SQL Injection, XSS 등 실제 공격만 표시되는지 확인

### 5. 룰 상세 보기 모달 확인
1. "개선 전 룰" 카드에서 "상세 보기" 버튼 클릭
2. 우측에서 Drawer 스타일 모달이 나타나는지 확인
3. 룰 상세 정보 확인:
   - 룰 이름
   - 위험도 (HIGH/MEDIUM/LOW)
   - 위험 점수 (0-100)
   - 대상 IP/국가
   - 공격 유형
   - 설명, 원인, 조치 방안, 영향도
4. "이전"/"다음" 버튼으로 다른 룰 확인
5. ESC 키 또는 X 버튼으로 모달 닫기

6. "개선 후 룰" 카드에서도 동일하게 테스트

### 6. 로그 테이블 정렬 및 필터링 확인
1. 컬럼 헤더 클릭하여 정렬 테스트
   - 발생일시, 소스 IP, 공격 유형 등
2. "필터" 버튼 클릭
3. 필터 조건 입력:
   - 소스 IP: 특정 IP 입력
   - 공격 유형: "SQL" 입력
4. 필터링된 결과 확인
5. "필터 초기화" 버튼으로 초기화

## 🐛 문제 해결

### 문제 1: 백엔드 재시작 후에도 룰이 0개
**원인:** S3에서 로그를 가져오지 못함

**해결:**
1. `.env` 파일 확인
   ```
   USE_S3_LOGS=true
   S3_BUCKET_NAME=aws-waf-logs-attack-683123960885-ap-northeast-2-an
   S3_REGION=ap-northeast-2
   ```

2. AWS 자격 증명 확인
   ```bash
   aws s3 ls s3://aws-waf-logs-attack-683123960885-ap-northeast-2-an/
   ```

3. 로컬 파일 사용 (대안)
   - `.env`에서 `USE_S3_LOGS=false` 설정
   - `waf_logs.json` 파일이 존재하는지 확인

### 문제 2: 프론트엔드에서 데이터가 표시되지 않음
**원인:** CORS 오류 또는 API 연결 실패

**해결:**
1. 브라우저 콘솔(F12) 확인
2. 네트워크 탭에서 API 요청 상태 확인
3. 백엔드 로그 확인

### 문제 3: 페이지네이션이 표시되지 않음
**원인:** 로그 개수가 20개 미만

**해결:**
- 로그 개수 확인 (위 참조)
- 20개 이상이어야 페이지네이션 표시

## 📝 체크리스트

- [ ] 백엔드 재시작 완료
- [ ] 브라우저 새로고침 (Ctrl+F5)
- [ ] 개선 전 룰 개수 > 0 확인
- [ ] 개선 후 룰 개수 > 0 확인
- [ ] 페이지네이션 표시 확인
- [ ] 월별 공격 유형에서 정상 트래픽 제외 확인
- [ ] "상세 보기" 모달 표시 확인
- [ ] 로그 테이블 정렬 기능 확인
- [ ] 로그 테이블 필터링 기능 확인

## 🎉 완료!

모든 체크리스트 항목이 완료되면, 대시보드가 정상적으로 작동하는 것입니다.

---

**참고:** 
- 백엔드 재시작은 **필수**입니다. (룰 생성 로직 변경)
- 프론트엔드는 이미 최신 코드가 적용되어 있으므로 재시작 불필요
- 문제가 지속되면 `CURRENT_STATUS.md` 파일 참조
