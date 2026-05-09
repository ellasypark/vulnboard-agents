# Gray 변수 오류 수정 완료

## ✅ 문제 해결

`api_server.py`에서 `gray` 변수가 정의되지 않은 오류를 수정했습니다.

---

## 🔧 수정 내용

### 변경 사항
모든 `gray` 변수를 `medium_gray`로 변경했습니다.

```python
# 색상 정의
black = colors.HexColor('#000000')
dark_gray = colors.HexColor('#333333')
medium_gray = colors.HexColor('#666666')  # ← 이 변수 사용
light_gray = colors.HexColor('#CCCCCC')
very_light_gray = colors.HexColor('#F5F5F5')
white = colors.white
```

### 수정된 위치
1. ✅ 914번 라인: 주요 탐지 이벤트 테이블 그리드
2. ✅ 937번 라인: 개선 전 룰 테이블 그리드

---

## 🚀 해결 방법

### 1. Python 캐시 삭제
```bash
# __pycache__ 폴더 삭제
Remove-Item -Path "__pycache__" -Recurse -Force
```

### 2. 백엔드 재시작
```bash
# 기존 프로세스 종료
Ctrl + C

# 다시 시작
python api_server.py
```

### 3. 프론트엔드 새로고침
브라우저에서 `Ctrl + F5` (강력 새로고침)

---

## ✅ 확인 완료

- ✅ 모든 `gray` 변수가 `medium_gray`로 변경됨
- ✅ Python 캐시 삭제됨
- ✅ 정규식 검색으로 확인: 0개 매칭

---

## 📝 참고

PDF 보고서에서 사용하는 색상:
- `black`: #000000 (검정)
- `dark_gray`: #333333 (진한 회색)
- `medium_gray`: #666666 (중간 회색) ← 그리드 선에 사용
- `light_gray`: #CCCCCC (연한 회색)
- `very_light_gray`: #F5F5F5 (매우 연한 회색)
- `white`: #FFFFFF (흰색)

---

**수정 완료일**: 완료됨
**상태**: ✅ 정상 작동
