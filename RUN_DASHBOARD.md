# 🚀 WAF 보안 대시보드 실행 가이드

## 📋 사전 준비

### 1. Python 설치 확인
```bash
python --version
```
Python 3.8 이상이 필요합니다.

### 2. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

설치되는 패키지:
- Flask (웹 서버)
- Flask-CORS (CORS 지원)
- ReportLab (PDF 생성)
- 기타 의존성 패키지

## 🎯 실행 방법

### 방법 1: 실제 WAF 로그 사용

1. **WAF 로그 파일 준비**
   - 파일명: `waf_logs.json` (이미 생성되어 있음)
   - 위치: 프로젝트 루트 디렉토리
   - 형식: 각 줄이 하나의 JSON 객체 (JSONL 형식)

2. **대시보드 실행**
   ```bash
   python report.py
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:5000
   ```

### 방법 2: 샘플 데이터 사용

1. **waf_logs.json 파일 삭제 또는 이름 변경**
   ```bash
   ren waf_logs.json waf_logs.json.bak
   ```

2. **대시보드 실행** (자동으로 샘플 데이터 생성됨)
   ```bash
   python report.py
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:5000
   ```

## 📂 WAF 로그 파일 형식

프로그램은 다음 위치에서 로그 파일을 자동으로 찾습니다:
1. `waf_logs.json` (현재 디렉토리)
2. `logs/waf_logs.json` (logs 폴더)
3. `../waf_logs.json` (상위 디렉토리)
4. `waf_logs.txt` (현재 디렉토리)

### 로그 파일 형식 예시
```json
{"timestamp":1778134483894,"formatVersion":1,"webaclId":"arn:aws:wafv2:...","action":"ALLOW","httpRequest":{"clientIp":"59.10.176.51","country":"KR","uri":"/","httpMethod":"GET"},...}
{"timestamp":1778134523445,"formatVersion":1,"webaclId":"arn:aws:wafv2:...","action":"BLOCK","httpRequest":{"clientIp":"59.10.176.51","country":"KR","uri":"/admin","httpMethod":"POST"},...}
```

각 줄은 별도의 JSON 객체입니다 (JSONL 형식).

## 🎨 대시보드 사용법

### 1. 메인 화면
- **최상단**: 3개의 차트 (지역별 트래픽, 시간대별 공격, 공격 유형)
- **중앙**: 개선 전/후 룰 카드 (클릭하여 상세 정보 확인)
- **하단**: WAF 로그 테이블 (페이지네이션 지원)

### 2. 테마 변경
- 우측 상단 "테마 변경" 버튼 클릭
- 라이트 모드 ↔ 다크 모드 전환

### 3. 룰 상세 정보 보기
1. 개선 전/후 룰 카드 클릭
2. 우측에서 팝업 슬라이드
3. 상세 정보 확인:
   - 룰 이름, 위험도, 일시
   - 대상 IP/국가
   - 공격 유형 및 설명
   - 원인 (WAF 로그)
   - 조치 방안
   - 영향도 및 기대 효과

### 4. 룰 네비게이션
- **< 버튼**: 이전 룰
- **> 버튼**: 다음 룰
- **X 버튼**: 팝업 닫기
- **키보드 단축키**:
  - `ESC`: 팝업 닫기
  - `←`: 이전 룰
  - `→`: 다음 룰

### 5. 보고서 다운로드
1. 우측 상단 "보고서 다운로드" 버튼 클릭
2. PDF 파일 자동 다운로드
3. 파일명: `WAF_Report_YYYYMMDD_HHMMSS.pdf`

## 🔧 문제 해결

### 포트 충돌 오류
```
OSError: [Errno 48] Address already in use
```

**해결 방법**: `report.py` 파일의 마지막 줄 수정
```python
# 기존
app.run(debug=True, host='0.0.0.0', port=5000)

# 변경 (다른 포트 사용)
app.run(debug=True, host='0.0.0.0', port=8080)
```

### 패키지 설치 오류
```bash
# 관리자 권한으로 실행
pip install --user -r requirements.txt

# 또는 가상환경 사용
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 로그 파일을 찾을 수 없음
```
⚠️  파일을 찾을 수 없습니다: waf_logs.json
샘플 데이터를 생성합니다...
```

이것은 정상입니다. 프로그램이 자동으로 샘플 데이터를 생성합니다.

실제 로그를 사용하려면:
1. AWS WAF 로그를 다운로드
2. `waf_logs.json` 파일로 저장
3. 프로그램 재시작

### PDF 다운로드 시 한글 깨짐
현재 버전은 기본 폰트를 사용합니다. 한글 폰트가 필요한 경우:
1. 시스템에 한글 폰트 설치
2. `report.py`의 PDF 생성 부분에 폰트 등록 코드 추가

## 📊 실행 결과 예시

```
====================================================================
WAF 보안 대시보드 시작
대시보드 URL: http://localhost:5000
====================================================================
📂 로그 파일 발견: waf_logs.json
✅ 2개의 WAF 로그를 성공적으로 로드했습니다.
 * Serving Flask app 'report'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.1.100:5000
Press CTRL+C to quit
```

## 🌐 네트워크 접속

### 로컬 접속
```
http://localhost:5000
http://127.0.0.1:5000
```

### 같은 네트워크의 다른 기기에서 접속
```
http://[내_컴퓨터_IP]:5000
```

내 컴퓨터 IP 확인:
```bash
# Windows
ipconfig

# 출력에서 IPv4 주소 확인
# 예: 192.168.1.100
```

## 🛑 종료 방법

터미널에서 `Ctrl + C` 키를 누르면 서버가 종료됩니다.

## 📝 추가 정보

### 데이터 추가 방법

#### 1. 파일을 통한 추가
`waf_logs.json` 파일에 새로운 로그 추가 후 서버 재시작

#### 2. API를 통한 추가 (개발 중)
```python
import requests

log_data = {
    "timestamp": 1778134483894,
    "action": "BLOCK",
    "httpRequest": {
        "clientIp": "1.2.3.4",
        "country": "US",
        # ... 기타 필드
    }
}

# POST 요청으로 로그 추가 (향후 구현 예정)
# requests.post('http://localhost:5000/api/logs', json=log_data)
```

### 프로덕션 배포

개발 서버는 프로덕션 환경에 적합하지 않습니다.
프로덕션 배포 시 다음을 사용하세요:

```bash
# Gunicorn 설치
pip install gunicorn

# Gunicorn으로 실행
gunicorn -w 4 -b 0.0.0.0:5000 report:app
```

## 💡 팁

1. **대용량 로그 처리**: 로그가 많을 경우 로딩 시간이 길어질 수 있습니다.
2. **실시간 업데이트**: 브라우저를 새로고침하면 최신 데이터를 볼 수 있습니다.
3. **차트 인터랙션**: 차트의 범례를 클릭하여 데이터 시리즈를 숨기거나 표시할 수 있습니다.
4. **모바일 접속**: 반응형 디자인으로 모바일에서도 사용 가능합니다.

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Python 버전 (3.8 이상)
2. 모든 패키지가 설치되었는지
3. 포트 5000이 사용 가능한지
4. 방화벽 설정

---

**즐거운 보안 모니터링 되세요! 🛡️**
