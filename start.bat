@echo off
chcp 65001 >nul
echo ========================================
echo WAF 대시보드 시작
echo ========================================
echo.

echo [1/2] Start Backend Server...
start "WAF Backend" cmd /k "python api_server.py"
timeout /t 3 /nobreak >nul

echo [2/2] Start Frontend Server...
start "WAF Frontend" cmd /k "cd frontend && npm start"
timeout /t 2 /nobreak >nul

echo.
echo [OK] 서버가 시작되었습니다!
echo.
echo 백엔드: http://localhost:5000
echo 프론트엔드: http://localhost:3000
echo.
echo 종료하려면 stop.bat을 실행하세요.
echo ========================================
pause
