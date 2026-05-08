@echo off
chcp 65001 >nul
echo ========================================
echo WAF 대시보드 재시작
echo ========================================
echo.

echo [1/3] 기존 서버 종료 중...
call stop.bat

echo.
echo [2/3] 잠시 대기 중...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] 서버 재시작 중...
call start.bat
