# S3 WAF 로그 연동 가이드

## 📋 개요

S3 버킷에 저장된 AWS WAF 로그를 자동으로 가져와서 대시보드에 표시하는 기능입니다.

---

## 🔧 설정 방법

### 1️⃣ AWS 자격 증명 설정

다음 중 **하나**를 선택하여 설정하세요:

#### 옵션 A: AWS CLI 설정 (권장)
```bash
aws configure
```

입력 항목:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `ap-northeast-2`
- Default output format: `json`

#### 옵션 B: 환경 변수 설정
```bash
# Windows (PowerShell)
$env:AWS_ACCESS_KEY_ID="your_access_key"
$env:AWS_SECRET_ACCESS_KEY="your_secret_key"
$env:AWS_DEFAULT_REGION="ap-northeast-2"

# Linux/Mac
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_DEFAULT_REGION="ap-northeast-2"
```

#### 옵션 C: IAM Role 사용 (EC2/Lambda)
EC2나 Lambda에서 실행하는 경우, IAM Role을 인스턴스에 연결하면 자동으로 자격 증명이 제공됩니다.

**필요한 IAM 권한**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
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
  ]
}
```

---

### 2️⃣ 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 내용:
```env
# S3 WAF 로그 사용 여부
USE_S3_LOGS=true

# S3 버킷 이름
S3_BUCKET_NAME=aws-waf-logs-attack-683123960885-ap-northeast-2-an

# AWS 리전
S3_REGION=ap-northeast-2
```

---

### 3️⃣ Python 패키지 설치

```bash
pip install -r requirements.txt
```

필요한 패키지:
- `boto3`: AWS SDK
- `python-dotenv`: 환경 변수 로드

---

## 🚀 실행 방법

### 방법 1: API 서버 실행 (자동 로드)

```bash
python api_server.py
```

서버 시작 시 자동으로 S3에서 로그를 가져옵니다.

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
✅ 총 83개의 로그를 로드했습니다.
```

---

### 방법 2: 수동 로그 다운로드

S3에서 로그를 다운로드하여 `waf_logs.json` 파일로 저장:

```bash
python s3_log_loader.py
```

**설정 변경** (필요시 `s3_log_loader.py` 수정):
```python
# S3 버킷 설정
BUCKET_NAME = 'aws-waf-logs-attack-683123960885-ap-northeast-2-an'
REGION = 'ap-northeast-2'

# 로그 로드 (최근 24시간)
logs = loader.load_logs_from_s3(
    hours_back=24,           # 최근 24시간
    max_files_per_hour=10,   # 시간당 최대 10개 파일
    max_total_logs=1000      # 최대 1000개 로그
)
```

---

## 📂 S3 버킷 구조

```
aws-waf-logs-attack-683123960885-ap-northeast-2-an/
├── 2026/
│   └── 05/
│       └── 08/
│           ├── 09/
│           │   ├── aws-waf-logs-my-data-1-2026-05-08-09-03-22-....gz
│           │   ├── aws-waf-logs-my-data-1-2026-05-08-09-15-33-....gz
│           │   └── ...
│           ├── 10/
│           │   └── ...
│           └── ...
```

**파일 형식**:
- 압축: `.gz` (gzip)
- 내용: JSONL (각 줄이 JSON 객체)

---

## 🔍 동작 원리

### 1. 로그 로드 우선순위

```
1. S3 버킷 (USE_S3_LOGS=true인 경우)
   ↓ 실패 시
2. 로컬 waf_logs.json 파일
   ↓ 없으면
3. 샘플 데이터 생성
```

### 2. S3 로그 로드 프로세스

```
1. 최근 N시간의 디렉토리 경로 생성
   예: 2026/05/08/09/, 2026/05/08/10/, ...

2. 각 디렉토리에서 .gz 파일 목록 조회
   (시간당 최대 max_files_per_hour개)

3. 각 파일 다운로드 및 압축 해제

4. JSONL 형식 파싱 (각 줄이 JSON 객체)

5. 파싱된 로그를 메모리에 저장

6. 로컬 파일로 백업 (waf_logs.json)
```

---

## ⚙️ 설정 파라미터

### 환경 변수 (`.env`)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `USE_S3_LOGS` | S3 사용 여부 | `false` |
| `S3_BUCKET_NAME` | S3 버킷 이름 | `aws-waf-logs-attack-683123960885-ap-northeast-2-an` |
| `S3_REGION` | AWS 리전 | `ap-northeast-2` |

### 코드 파라미터 (`api_server.py`)

```python
loader.load_logs_from_s3(
    hours_back=24,           # 조회할 시간 범위 (시간)
    max_files_per_hour=10,   # 시간당 최대 파일 개수
    max_total_logs=500       # 최대 로그 개수
)
```

---

## 🐛 트러블슈팅

### 1. AWS 자격 증명 오류

**증상**:
```
❌ AWS 자격 증명을 찾을 수 없습니다.
```

**해결**:
- `aws configure` 실행
- 환경 변수 확인: `echo $AWS_ACCESS_KEY_ID`
- IAM Role 확인 (EC2/Lambda)

---

### 2. S3 접근 권한 오류

**증상**:
```
❌ S3 파일 목록 조회 실패: Access Denied
```

**해결**:
- IAM 정책에 `s3:GetObject`, `s3:ListBucket` 권한 추가
- 버킷 이름 확인
- 리전 확인

---

### 3. 로그 파일이 없음

**증상**:
```
⚠️  S3에서 로그를 찾을 수 없습니다.
```

**해결**:
- S3 버킷에 실제 로그가 있는지 확인
- `hours_back` 값 증가 (예: 24 → 72)
- 디렉토리 구조 확인 (`YYYY/MM/DD/HH/`)

---

### 4. 압축 해제 오류

**증상**:
```
❌ 로그 압축 해제 실패
```

**해결**:
- 파일이 실제로 gzip 형식인지 확인
- 파일 다운로드가 완료되었는지 확인

---

## 📊 성능 최적화

### 1. 로그 개수 제한

대량의 로그를 처리할 때는 파라미터를 조정하세요:

```python
# 빠른 로드 (최근 데이터만)
loader.load_logs_from_s3(
    hours_back=6,            # 최근 6시간만
    max_files_per_hour=5,    # 시간당 5개 파일
    max_total_logs=200       # 최대 200개 로그
)

# 전체 로드 (느림)
loader.load_logs_from_s3(
    hours_back=168,          # 최근 7일
    max_files_per_hour=50,   # 시간당 50개 파일
    max_total_logs=10000     # 최대 10,000개 로그
)
```

### 2. 캐싱 전략

로컬 파일을 캐시로 사용:

```bash
# 1. S3에서 로그 다운로드 (1회)
python s3_log_loader.py

# 2. 로컬 파일 사용 (빠름)
USE_S3_LOGS=false python api_server.py
```

---

## 🔄 자동화

### Cron Job (Linux/Mac)

매시간 자동으로 로그 업데이트:

```bash
# crontab -e
0 * * * * cd /path/to/project && python s3_log_loader.py
```

### Task Scheduler (Windows)

1. 작업 스케줄러 열기
2. 새 작업 만들기
3. 트리거: 매시간
4. 동작: `python s3_log_loader.py`

---

## 📝 참고 자료

- [AWS WAF 로그 형식](https://docs.aws.amazon.com/waf/latest/developerguide/logging.html)
- [Boto3 S3 문서](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)
- [AWS CLI 설정](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

---

**작성일**: 2026-05-08
**버전**: 1.0.0
