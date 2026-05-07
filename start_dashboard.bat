@echo off
chcp 65001 >nul
echo ====================================================================
echo WAF 보안 대시보드 시작
echo ====================================================================
echo.
echo [1/3] Python 버전 확인 중...
python --version
if errorlevel 1 (
    echo ❌ Python이 설치되어 있지 않습니다.
    echo Python 3.8 이상을 설치해주세요: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo.

echo [2/3] 필요한 패키지 확인 중...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Flask가 설치되어 있지 않습니다.
    echo 패키지를 설치하시겠습니까? (Y/N)
    set /p install="입력: "
    if /i "%install%"=="Y" (
        echo 패키지 설치 중...
        pip install -r requirements.txt
    ) else (
        echo 설치를 취소했습니다.
        pause
        exit /b 1
    )
)
echo ✅ 패키지 확인 완료
echo.

echo [3/3] 대시보드 실행 중...
echo.
echo ====================================================================
echo 브라우저에서 다음 주소로 접속하세요:
echo.
echo     http://localhost:5000
echo.
echo 종료하려면 Ctrl+C를 누르세요.
echo ====================================================================
echo.

python report.py

pause
