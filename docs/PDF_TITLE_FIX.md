# PDF 보고서 제목 수정 완료

## 🐛 문제
PDF 보고서 다운로드 시 문서 제목(title)이 `(anonymous)`로 표시되는 문제

## 🔍 원인
- `SimpleDocTemplate` 생성 시 PDF 메타데이터(title, author, subject)가 설정되지 않음
- 파일명만 설정되고 문서 속성은 비어있어서 PDF 뷰어에서 "(anonymous)" 표시

## ✅ 해결 방법

### 1. PDF 메타데이터 설정
```python
# PDF 파일명 및 제목 생성
report_title = f'WAF_로그_및_이벤트_분석_보고서_{datetime.now().strftime("%Y%m%d_%H%M%S")}'

doc = SimpleDocTemplate(
    buffer, 
    pagesize=A4, 
    topMargin=0.5*inch, 
    bottomMargin=0.5*inch,
    title=report_title,  # PDF 메타데이터 제목 설정
    author='WAF Security Dashboard',
    subject='WAF 로그 및 이벤트 분석 보고서'
)
```

### 2. 파일명 일관성 유지
```python
# 파일명은 이미 위에서 생성한 report_title 사용
filename = f'{report_title}.pdf'

# Flask 버전에 따라 download_name 또는 attachment_filename 사용
try:
    return send_file(
        buffer, 
        mimetype='application/pdf', 
        as_attachment=True, 
        download_name=filename
    )
```

## 📋 변경 사항

### Before
```python
doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
# ... 중간 생략 ...
filename = f'WAF_로그_및_이벤트_분석_보고서_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
```

### After
```python
# PDF 파일명 및 제목 생성 (한 번만 생성)
report_title = f'WAF_로그_및_이벤트_분석_보고서_{datetime.now().strftime("%Y%m%d_%H%M%S")}'

doc = SimpleDocTemplate(
    buffer, 
    pagesize=A4, 
    topMargin=0.5*inch, 
    bottomMargin=0.5*inch,
    title=report_title,  # PDF 메타데이터 제목
    author='WAF Security Dashboard',
    subject='WAF 로그 및 이벤트 분석 보고서'
)
# ... 중간 생략 ...
filename = f'{report_title}.pdf'
```

## 🎯 효과

### 1. PDF 메타데이터 정상 표시
- **Title**: `WAF_로그_및_이벤트_분석_보고서_20260509_143000`
- **Author**: `WAF Security Dashboard`
- **Subject**: `WAF 로그 및 이벤트 분석 보고서`

### 2. 파일명과 제목 일치
- 다운로드 파일명: `WAF_로그_및_이벤트_분석_보고서_20260509_143000.pdf`
- PDF 문서 제목: `WAF_로그_및_이벤트_분석_보고서_20260509_143000`
- 완벽하게 일치하여 혼란 방지

### 3. PDF 뷰어에서 정상 표시
- Adobe Acrobat Reader
- Chrome PDF Viewer
- Edge PDF Viewer
- 기타 모든 PDF 뷰어에서 제목 정상 표시

## 📝 PDF 메타데이터 필드

### SimpleDocTemplate 지원 메타데이터
```python
SimpleDocTemplate(
    filename,
    pagesize=A4,
    title='문서 제목',           # PDF 제목
    author='작성자',             # 작성자
    subject='주제',              # 문서 주제
    creator='생성 프로그램',      # 생성 프로그램
    producer='생성 도구',         # PDF 생성 도구
    keywords='키워드1, 키워드2'  # 검색 키워드
)
```

### 현재 설정된 메타데이터
- ✅ **title**: 파일명과 동일한 고유 제목
- ✅ **author**: WAF Security Dashboard
- ✅ **subject**: WAF 로그 및 이벤트 분석 보고서

## 🧪 테스트 방법

### 1. 보고서 다운로드
```bash
# 프론트엔드에서 "보고서 다운로드" 버튼 클릭
# 또는 직접 API 호출
curl http://localhost:5000/api/download-report -o test_report.pdf
```

### 2. PDF 메타데이터 확인

#### Windows (PowerShell)
```powershell
# PDF 속성 확인
Get-ItemProperty "WAF_로그_및_이벤트_분석_보고서_*.pdf" | Select-Object Name, Length, CreationTime
```

#### PDF 뷰어에서 확인
1. PDF 파일 열기
2. 파일 → 속성 (또는 Ctrl+D)
3. "문서 속성" 탭에서 확인
   - 제목: `WAF_로그_및_이벤트_분석_보고서_YYYYMMDD_HHMMSS`
   - 작성자: `WAF Security Dashboard`
   - 주제: `WAF 로그 및 이벤트 분석 보고서`

#### Python으로 확인
```python
from PyPDF2 import PdfReader

reader = PdfReader('WAF_로그_및_이벤트_분석_보고서_20260509_143000.pdf')
metadata = reader.metadata

print(f"Title: {metadata.title}")
print(f"Author: {metadata.author}")
print(f"Subject: {metadata.subject}")
```

## 📚 관련 문서
- [ReportLab Documentation - SimpleDocTemplate](https://www.reportlab.com/docs/reportlab-userguide.pdf)
- [PDF Metadata Standards](https://www.adobe.com/devnet/pdf/pdf_reference.html)

## ✨ 완료!
이제 PDF 보고서의 제목이 "(anonymous)" 대신 실제 파일명과 동일한 의미 있는 제목으로 표시됩니다! 🎉
