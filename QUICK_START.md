# 🚀 WAF 대시보드 빠른 시작 가이드

## 📋 명령어 한 줄로 시작하기

### 1️⃣ 서버 시작
```bash
start.bat
```
- 백엔드 (Flask) + 프론트엔드 (React) 동시 시작
- 자동으로 2개의 터미널 창이 열립니다
- 백엔드: http://localhost:5000
- 프론트엔드: http://localhost:3000

### 2️⃣ 서버 종료
```bash
stop.bat
```
- 백엔드 + 프론트엔드 동시 종료
- 포트 5000, 3000 사용 중인 모든 프로세스 종료

### 3️⃣ 서버 재시작
```bash
restart.bat
```
- 기존 서버 종료 → 새로 시작
- 코드 변경 후 재시작할 때 유용

## 🎯 사용 방법

### 처음 시작하는 경우
1. `start.bat` 더블클릭
2. 2개의 터미널 창이 열림 (백엔드, 프론트엔드)
3. 브라우저에서 http://localhost:3000 접속
4. 대시보드 사용!

### 종료하는 경우
1. `stop.bat` 더블클릭
2. 모든 서버 자동 종료
3. 터미널 창 닫기

### 코드 수정 후 재시작
1. `restart.bat` 더블클릭
2. 자동으로 종료 → 재시작

## 📁 파일 설명

| 파일 | 설명 |
|------|------|
| `start.bat` | 백엔드 + 프론트엔드 시작 |
| `stop.bat` | 백엔드 + 프론트엔드 종료 |
| `restart.bat` | 재시작 (종료 → 시작) |
| `start_dashboard.bat` | (기존) 프론트엔드만 시작 |
| `restart_backend.bat` | (기존) 백엔드만 재시작 |

## 🔧 문제 해결

### 문제 1: "포트가 이미 사용 중입니다"
**해결:**
```bash
stop.bat
```
기존 프로세스를 모두 종료한 후 다시 시작

### 문제 2: 백엔드만 재시작하고 싶어요
**해결:**
```bash
restart_backend.bat
```

### 문제 3: 프론트엔드만 재시작하고 싶어요
**해결:**
1. `stop.bat` 실행
2. 터미널에서:
   ```bash
   cd frontend
   npm start
   ```

### 문제 4: 터미널 창이 너무 많아요
**해결:**
- 각 터미널 창 제목 확인:
  - "WAF Backend" = 백엔드 서버
  - "WAF Frontend" = 프론트엔드 서버
- 필요한 창만 유지하고 나머지는 닫기

## 💡 팁

### 개발 중일 때
- 백엔드 코드 수정: `restart_backend.bat` 사용
- 프론트엔드 코드 수정: 자동 새로고침 (저장만 하면 됨)
- 둘 다 수정: `restart.bat` 사용

### 데모/발표 전
1. `stop.bat`으로 모든 서버 종료
2. `start.bat`으로 깨끗하게 시작
3. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
4. http://localhost:3000 접속

### 로그 확인
- 백엔드 로그: "WAF Backend" 터미널 창 확인
- 프론트엔드 로그: "WAF Frontend" 터미널 창 확인
- 브라우저 콘솔: F12 → Console 탭

## 🎉 완료!

이제 `start.bat` 하나로 모든 서버를 시작할 수 있습니다!

---

**참고 문서:**
- S3 로그 설정: `START_WITH_S3.md`
- 프론트엔드 분리: `FRONTEND_SEPARATION_GUIDE.md`
- 구현 가이드: `IMPLEMENTATION_GUIDE.md`
