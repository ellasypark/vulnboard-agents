# WAF 보안 대시보드 - 프론트엔드 (React)

## 📋 개요

기존 Flask 템플릿 기반 대시보드를 React로 분리한 프론트엔드 애플리케이션입니다.

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 백엔드 서버 실행 (별도 터미널)

```bash
# 프로젝트 루트 디렉토리에서
python report.py
```

백엔드 서버가 `http://localhost:5000`에서 실행됩니다.

### 3. 프론트엔드 개발 서버 실행

```bash
# frontend 디렉토리에서
npm start
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

## 📁 프로젝트 구조

```
frontend/
├── public/
│   └── index.html          # HTML 템플릿
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── Header.js       # 헤더 (테마, 다운로드)
│   │   ├── GeoMap.js       # 세계 지도
│   │   ├── HourlyChart.js  # 시간대별 차트
│   │   ├── AttackTypeChart.js  # 공격 유형 차트
│   │   ├── RuleCard.js     # 룰 카드 (개선 전/후)
│   │   ├── RuleComparison.js   # 룰 비교 섹션
│   │   ├── LogTable.js     # 로그 테이블
│   │   └── RulePopup.js    # 룰 상세 팝업
│   ├── App.js              # 메인 앱 컴포넌트
│   ├── App.css             # 앱 스타일
│   ├── index.js            # 진입점
│   └── index.css           # 전역 스타일
├── package.json            # 의존성 관리
└── README.md               # 이 파일
```

## 🎨 주요 기능

### 컴포넌트 구조

#### 1. **Header** (`Header.js`)
- 테마 변경 버튼
- 보고서 다운로드 버튼

#### 2. **GeoMap** (`GeoMap.js`)
- Leaflet 기반 세계 지도
- 국가별 공격 빈도 시각화
- 마커 클릭 시 상세 정보

#### 3. **HourlyChart** (`HourlyChart.js`)
- Chart.js 기반 라인 차트
- 요일별, 시간대별 공격 패턴

#### 4. **AttackTypeChart** (`AttackTypeChart.js`)
- Chart.js 기반 도넛 차트
- 공격 유형별 분포

#### 5. **RuleCard** (`RuleCard.js`)
- 속도계 스타일 게이지
- 룰 선택 버튼
- 상세 보기 버튼

#### 6. **RuleComparison** (`RuleComparison.js`)
- 선택한 룰 표시
- 룰 적용 버튼

#### 7. **LogTable** (`LogTable.js`)
- WAF 로그 테이블
- 페이지네이션

#### 8. **RulePopup** (`RulePopup.js`)
- 룰 상세 정보 팝업
- 이전/다음 네비게이션

## 🔧 API 연동

프론트엔드는 다음 API 엔드포인트를 사용합니다:

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/geographic-data` | GET | 지역별 트래픽 |
| `/api/hourly-attacks` | GET | 시간대별 공격 |
| `/api/monthly-attack-types` | GET | 공격 유형 |
| `/api/rules/before` | GET | 개선 전 룰 |
| `/api/rules/after` | GET | 개선 후 룰 |
| `/api/logs` | GET | 로그 데이터 |
| `/api/theme` | POST | 테마 설정 |
| `/api/download-report` | GET | PDF 다운로드 |

## 📦 의존성

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1"
}
```

## 🎯 개발 가이드

### 새 컴포넌트 추가

1. `src/components/` 디렉토리에 새 파일 생성
2. React 컴포넌트 작성
3. `App.js`에서 import 및 사용

예시:
```javascript
// src/components/NewComponent.js
import React from 'react';

function NewComponent({ data }) {
  return (
    <div className="card">
      <h2>New Component</h2>
      {/* 컴포넌트 내용 */}
    </div>
  );
}

export default NewComponent;
```

### 스타일 수정

- 전역 스타일: `src/index.css`
- 컴포넌트별 스타일: 각 컴포넌트 파일에 CSS 모듈 사용

### API 호출 추가

```javascript
import axios from 'axios';

const fetchData = async () => {
  try {
    const response = await axios.get('/api/your-endpoint');
    console.log(response.data);
  } catch (error) {
    console.error('API 호출 오류:', error);
  }
};
```

## 🏗️ 빌드

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

### 빌드 파일 서빙

```bash
# 빌드 후
npx serve -s build
```

## 🐛 문제 해결

### 포트 충돌

프론트엔드 포트 변경:
```bash
# .env 파일 생성
PORT=3001
```

### CORS 오류

`package.json`에 proxy 설정 확인:
```json
{
  "proxy": "http://localhost:5000"
}
```

### 의존성 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

## 📝 TODO

- [ ] 컴포넌트 파일 생성 (Header, GeoMap 등)
- [ ] 상태 관리 라이브러리 추가 (Redux/Zustand)
- [ ] 테스트 코드 작성
- [ ] TypeScript 마이그레이션
- [ ] 성능 최적화 (React.memo, useMemo)

## 🔗 관련 문서

- [React 공식 문서](https://react.dev/)
- [Chart.js 문서](https://www.chartjs.org/)
- [Leaflet 문서](https://leafletjs.com/)
- [Axios 문서](https://axios-http.com/)

## 📄 라이선스

MIT License
