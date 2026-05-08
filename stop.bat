@echo off
chcp 65001 >nul
echo ========================================
echo WAF 대시보드 종료
echo ========================================
echo.

echo [1/2] 백엔드 서버 종료 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo 프로세스 ID %%a 종료 중...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] 프론트엔드 서버 종료 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo 프로세스 ID %%a 종료 중...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo [OK] 모든 서버가 종료되었습니다!
echo ========================================
pause
