# 🚀 S3 로그 연동 빠른 시작 가이드

## ✅ 현재 상태

모든 코드가 준비되었습니다! 이제 바로 실행할 수 있습니다.

---

## 📋 체크리스트

### ✅ 완료된 항목
- [x] `s3_log_loader.py` - S3 로그 로더 모듈
- [x] `api_server.py` - S3 연동 로직
- [x] `.env` - 환경 변수 설정
- [x] `requirements.txt` - boto3 패키지 포함

### 🔲 확인 필요 항목
- [ ] AWS 자격 증명 설정
- [ ] Python 패키지 설치

---

## 🎯 3단계로 시작하기

### 1️⃣ AWS 자격 증명 확인

**방법 A: AWS CLI 설정 확인**
```bash
aws configure list
```

출력 예시:
```
      Name                    Value             Type    Location
      ----                    -----             ----    --------
   profile                <not set>             None    None
access_key     ****************CRFS shared-credentials-file    
secret_key     ****************wXns shared-credentials-file    
    region           ap-northeast-2      config-file    ~/.aws/config
```

**방법 B: 환경 변수 확인**
```bash
# Windows PowerShell
echo $env:AWS_ACCESS_KEY_ID
echo $env:AWS_SECRET_ACCESS_KEY

# Linux/Mac
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

**이미 `.env` 파일에 설정되어 있음**:
```env
AWS_ACCESS_KEY_ID=********************
AWS_SECRET_ACCESS_KEY=********************
```

---

### 2️⃣ Python 패키지 설치

```bash
pip install -r requirements.txt
```

필요한 패키지:
- `boto3` - AWS SDK
- `python-dotenv` - 환경 변수 로드
- `flask`, `flask-cors` - API 서버
- `reportlab` - PDF 생성

---

### 3️⃣ S3 연결 테스트

```bash
python test_s3_connection.py
```

**성공 시 출력**:
```
============================================================
🧪 S3 연결 테스트 시작
============================================================

📋 환경 변수 설정:
   USE_S3_LOGS: True
   S3_BUCKET_NAME: aws-waf-logs-attack-683123960885-ap-northeast-2-an
   S3_REGION: ap-northeast-2

🔌 S3 클라이언트 초기화 중...
✅ S3 클라이언트 초기화 완료 (리전: ap-northeast-2)

📂 최근 1시간의 로그 파일 확인 중...

   📁 2026/05/08/09/
      파일 개수: 3개
      - aws-waf-logs-my-data-1-2026-05-08-09-03-22-....gz
      - aws-waf-logs-my-data-1-2026-05-08-09-15-33-....gz
      - aws-waf-logs-my-data-1-2026-05-08-09-28-45-....gz

✅ 총 3개의 로그 파일을 발견했습니다.

📥 샘플 로그 다운로드 테스트...
   파일: aws-waf-logs-my-data-1-2026-05-08-09-03-22-....gz
   ✅ 45개의 로그 엔트리 파싱 완료

============================================================
✅ S3 연결 테스트 완료!
============================================================
```

---

## 🚀 대시보드 실행

### 백엔드 서버 시작

```bash
python api_server.py
```

**출력 예시**:
```
============================================================
🌐 S3 버킷에서 WAF 로그 로드 시도...
============================================================
✅ S3 클라이언트 초기화 완료 (리전: ap-northeast-2)
📂 S3 버킷에서 로그 로드 시작...
   버킷: aws-waf-logs-attack-683123960885-ap-northeast-2-an
   조회 범위: 최근 24시간
   📁 2026/05/08/09/: 3개 파일 발견
      ✅ aws-waf-logs-my-data-1-2026-05-08-09-03-22-....gz: 45개 로그
      ✅ aws-waf-logs-my-data-1-2026-05-08-09-15-33-....gz: 38개 로그
      ✅ aws-waf-logs-my-data-1-2026-05-08-09-28-45-....gz: 52개 로그
✅ 총 135개의 로그를 로드했습니다.
✅ 로그를 waf_logs.json에 저장했습니다. (135개)
✅ 135개의 WAF 로그를 성공적으로 파싱했습니다.
============================================================
WAF 보안 대시보드 API 서버 시작
API 서버 URL: http://localhost:5000
============================================================
```

### 프론트엔드 시작

```bash
cd frontend
npm start
```

### 브라우저에서 확인

```
http://localhost:3000
```

---

## ⚙️ 설정 변경

### 로그 조회 범위 변경

`api_server.py`의 `initialize_data()` 함수에서:

```python
s3_logs = loader.load_logs_from_s3(
    hours_back=24,           # 최근 24시간 → 원하는 시간으로 변경
    max_files_per_hour=10,   # 시간당 최대 10개 파일
    max_total_logs=500       # 최대 500개 로그
)
```

**예시**:
```python
# 최근 1시간만 (빠름)
hours_back=1, max_total_logs=100

# 최근 7일 (느림)
hours_back=168, max_total_logs=5000
```

---

## 🐛 문제 해결

### 1. AWS 자격 증명 오류

**증상**:
```
❌ AWS 자격 증명을 찾을 수 없습니다.
```

**해결**:
```bash
# AWS CLI 설정
aws configure

# 입력 항목
AWS Access Key ID: ********************
AWS Secret Access Key: ********************
Default region name: ap-northeast-2
Default output format: json
```

---

### 2. S3 접근 권한 오류

**증상**:
```
❌ S3 파일 목록 조회 실패: Access Denied
```

**해결**:
IAM 사용자에게 다음 권한 추가:
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::aws-waf-logs-attack-683123960885-ap-northeast-2-an",
    "arn:aws:s3:::aws-waf-logs-attack-683123960885-ap-northeast-2-an/*"
  ]
}
```

---

### 3. 로그 파일이 없음

**증상**:
```
⚠️  S3에서 로그를 찾을 수 없습니다.
```

**해결**:
1. S3 콘솔에서 버킷 확인
2. 로그가 실제로 생성되고 있는지 확인
3. `hours_back` 값 증가 (예: 24 → 168)

---

### 4. 모듈 임포트 오류

**증상**:
```
ModuleNotFoundError: No module named 'boto3'
```

**해결**:
```bash
pip install boto3 python-dotenv
```

---

## 📊 현재 설정 요약

### S3 버킷 정보
- **버킷 이름**: `aws-waf-logs-attack-683123960885-ap-northeast-2-an`
- **리전**: `ap-northeast-2`
- **디렉토리 구조**: `YYYY/MM/DD/HH/`
- **파일 형식**: `.gz` (gzip 압축)

### 환경 변수 (`.env`)
```env
USE_S3_LOGS=true
S3_BUCKET_NAME=aws-waf-logs-attack-683123960885-ap-northeast-2-an
S3_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=********************
AWS_SECRET_ACCESS_KEY=********************
```

### 로그 로드 설정
- **조회 범위**: 최근 24시간
- **시간당 최대 파일**: 10개
- **최대 로그 개수**: 500개

---

## 🎉 완료!

이제 S3 버킷에서 실시간으로 WAF 로그를 가져와서 대시보드에 표시할 수 있습니다!

**다음 단계**:
1. `python test_s3_connection.py` - 연결 테스트
2. `python api_server.py` - 백엔드 시작
3. `cd frontend && npm start` - 프론트엔드 시작
4. 브라우저에서 `http://localhost:3000` 접속

---

**작성일**: 2026-05-08
**버전**: 1.0.0
