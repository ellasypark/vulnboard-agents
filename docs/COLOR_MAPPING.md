# 색상 매핑 가이드

## 🎨 도넛 그래프 ↔ WAF 룰 태그 색상 통일

WAF 룰 관리 시스템의 태그 색상은 월별 공격 유형 도넛 그래프의 색상과 **완전히 동일**합니다.

## 📊 색상 매핑 테이블

| WAF 룰 카테고리 | 도넛 그래프 공격 유형 | 색상 코드 | 색상 미리보기 |
|----------------|---------------------|----------|-------------|
| IP Reputation | IP Reputation | `#3b82f6` | 🔵 파란색 |
| Common Vulnerabilities | Common Vulnerabilities | `#ec4899` | 🌸 핑크색 |
| Known Bad Inputs | Known Bad Inputs | `#14b8a6` | 🐚 청록색 |
| SQL Injection Protection | SQL Injection | `#ef4444` | 🔴 빨간색 |
| Linux Protection | Linux Protection | `#84cc16` | 🍏 라임색 |
| Unix Protection | Unix Protection | `#a3e635` | 🟢 연두색 |
| Rate Limiting | Rate Limiting | `#f43f5e` | 🌹 장미색 |
| Geo Blocking | Geo Blocking | `#8b5cf6` | 💜 보라색 |

## 🔄 매핑 로직

### 백엔드 (`api_server.py`)

```python
# 공격 유형별 색상 매핑
color_map = {
    'SQL Injection': '#ef4444',
    'SQL Injection (Pattern Detected)': '#dc2626',
    'Cross-Site Scripting (XSS)': '#f97316',
    'Cross-Site Scripting (XSS Pattern)': '#ea580c',
    'Command Injection': '#8b5cf6',
    'Command Injection (Pattern)': '#7c3aed',
    'Path Traversal': '#06b6d4',
    'File Inclusion': '#10b981',
    'Size Restrictions Violation': '#f59e0b',
    'Unknown': '#6b7280',
    'IP Reputation': '#3b82f6',
    'Common Vulnerabilities': '#ec4899',
    'Known Bad Inputs': '#14b8a6',
    'Linux Protection': '#84cc16',
    'Unix Protection': '#a3e635',
    'Rate Limiting': '#f43f5e',
    'Geo Blocking': '#8b5cf6'
}
```

### 프론트엔드 (`RuleManagement.js`)

```javascript
// 카테고리 → 공격 유형 매핑
const categoryToAttackType = {
  'IP Reputation': 'IP Reputation',
  'Common Vulnerabilities': 'Common Vulnerabilities',
  'Known Bad Inputs': 'Known Bad Inputs',
  'SQL Injection Protection': 'SQL Injection',
  'Linux Protection': 'Linux Protection',
  'Unix Protection': 'Unix Protection',
  'Rate Limiting': 'Rate Limiting',
  'Geo Blocking': 'Geo Blocking'
};

// 도넛 그래프 색상 가져오기
const attackType = categoryToAttackType[category];
const color = colorMap[attackType];
```

## 🎯 사용 예시

### 1. IP Reputation 룰
- **카테고리**: `IP Reputation`
- **도넛 그래프**: `IP Reputation` 공격 유형
- **색상**: `#3b82f6` (파란색)

### 2. SQL Injection Protection 룰
- **카테고리**: `SQL Injection Protection`
- **도넛 그래프**: `SQL Injection` 공격 유형
- **색상**: `#ef4444` (빨간색)

### 3. Common Vulnerabilities 룰
- **카테고리**: `Common Vulnerabilities`
- **도넛 그래프**: `Common Vulnerabilities` 공격 유형
- **색상**: `#ec4899` (핑크색)

## 🔍 디버그 방법

개발 모드에서 브라우저 콘솔을 열면 색상 매핑 정보를 확인할 수 있습니다:

```
카테고리 "IP Reputation" → 공격 유형 "IP Reputation" → 색상 "#3b82f6"
카테고리 "SQL Injection Protection" → 공격 유형 "SQL Injection" → 색상 "#ef4444"
카테고리 "Common Vulnerabilities" → 공격 유형 "Common Vulnerabilities" → 색상 "#ec4899"
...
```

## ⚠️ 주의사항

1. **카테고리 이름 정확성**
   - 백엔드의 `category` 필드와 프론트엔드의 `categoryToAttackType` 매핑이 정확히 일치해야 합니다.
   - 오타나 공백 차이가 있으면 기본 색상(회색)이 적용됩니다.

2. **색상 코드 일관성**
   - 백엔드의 `color_map`과 프론트엔드의 `attackTypeColors`가 동일해야 합니다.
   - API 응답의 `colors` 객체를 통해 전달됩니다.

3. **기본 색상**
   - 매핑되지 않은 카테고리는 `#6b7280` (회색)이 적용됩니다.

## 🎨 색상 팔레트

### 주요 색상
- 🔴 빨간색 계열: SQL Injection, XSS
- 🔵 파란색 계열: IP Reputation, Path Traversal
- 💜 보라색 계열: Command Injection, Geo Blocking
- 🟢 초록색 계열: File Inclusion, Linux/Unix Protection
- 🌸 핑크색 계열: Common Vulnerabilities, Rate Limiting
- 🐚 청록색 계열: Known Bad Inputs
- 🟠 주황색 계열: Size Restrictions Violation

### 색상 선택 기준
- **위험도 높음**: 빨간색 계열
- **네트워크 관련**: 파란색 계열
- **시스템 관련**: 초록색 계열
- **일반 보안**: 핑크/청록색 계열

---

**작성일**: 2026-05-08  
**버전**: 2.1  
**작성자**: Kiro AI Assistant
