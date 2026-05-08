@echo off
echo ========================================
echo WAF 대시보드 백엔드 재시작
echo ========================================
echo.

echo [1/3] 기존 프로세스 종료 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo 프로세스 ID %%a 종료 중...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [2/3] 백엔드 서버 시작 중...
start "WAF Backend" cmd /k "python api_server.py"
timeout /t 3 /nobreak >nul

echo [3/3] 서버 상태 확인 중...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo.
    echo ✅ 백엔드 서버가 성공적으로 시작되었습니다!
    echo    URL: http://localhost:5000
    echo.
) else (
    echo.
    echo ❌ 백엔드 서버 시작 실패
    echo    수동으로 'python api_server.py'를 실행해주세요.
    echo.
)

echo ========================================
pause
