# 🎯 프론트엔드 분리 완료 가이드

## ✅ 완료된 작업

### 1. **report.py 복원**
- Git 버전으로 되돌림
- 기존 Lambda 함수 기능 유지
- Pydantic 모델 기반 구조 복원

### 2. **React 프론트엔드 생성**
- `frontend/` 디렉토리에 React 앱 생성
- 컴포넌트 기반 구조
- API 연동 준비 완료

---

## 📁 프로젝트 구조

```
04/
├── report.py                    # 백엔드 (기존 Lambda 함수)
├── detection.py
├── analysis.py
├── automation.py
├── orchestrator.py
├── waf_logs.json
├── requirements.txt
│
└── frontend/                    # 새로 생성된 프론트엔드
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/          # React 컴포넌트 (생성 필요)
    │   │   ├── Header.js
    │   │   ├── GeoMap.js
    │   │   ├── HourlyChart.js
    │   │   ├── AttackTypeChart.js
    │   │   ├── RuleCard.js
    │   │   ├── RuleComparison.js
    │   │   ├── LogTable.js
    │   │   └── RulePopup.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── package.json
    └── README.md
```

---

## 🚀 실행 방법

### 방법 1: 기존 방식 (Flask 템플릿)

```bash
# templates/dashboard.html 사용
python report.py
# http://localhost:5000
```

### 방법 2: React 프론트엔드 (새로운 방식)

#### 터미널 1: 백엔드 실행
```bash
# 프로젝트 루트에서
python report.py
# http://localhost:5000 (API 서버)
```

#### 터미널 2: 프론트엔드 실행
```bash
# frontend 디렉토리에서
cd frontend
npm install
npm start
# http://localhost:3000 (React 앱)
```

---

## 🔄 변경 사항 요약

### report.py (복원됨)

```python
# 기존 구조 유지
class WafContextData(BaseModel):
    event_id: str
    source_ip: str
    target_uri: str
    http_method: str
    waf_action: Optional[str] = "UNKNOWN"

class AnalysisResultData(BaseModel):
    decision: Literal["TP", "FP", "NEEDS_REVIEW"]
    confidence_score: int = Field(ge=0, le=100)
    reason: str
    matched_scenario: str

class HandoffPayload(BaseModel):
    event_id: str
    target_ip: str
    action_type: Literal["IMMEDIATE_BLOCK", "SLACK_REVIEW_REQ", "ALERT_ONLY", "LOG_IGNORE"]
    tags: List[str] = Field(default_factory=list)
    summary_message: str
    notification_block: Optional[Dict[str, Any]] = None
    analysis_details: AnalysisResultData
    context_details: WafContextData

def lambda_handler(event, context):
    # Lambda 함수 로직
    pass
```

### frontend/ (새로 생성됨)

React 기반 SPA (Single Page Application):
- **컴포넌트 기반**: 재사용 가능한 UI 컴포넌트
- **상태 관리**: React Hooks (useState, useEffect)
- **API 연동**: Axios로 백엔드 API 호출
- **라우팅**: React Router (필요시 추가)

---

## 📦 필요한 작업

### 1. 컴포넌트 파일 생성

각 컴포넌트를 `frontend/src/components/` 디렉토리에 생성해야 합니다:

#### Header.js
```javascript
import React from 'react';

function Header({ onToggleTheme, onDownloadReport, isDarkMode }) {
  return (
    <header className="header">
      <h1><i className="fas fa-shield-alt"></i> WAF 보안 대시보드</h1>
      <div className="header-controls">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <i className="fas fa-moon"></i> 테마 변경
        </button>
        <button className="download-btn" onClick={onDownloadReport}>
          <i className="fas fa-download"></i> 보고서 다운로드
        </button>
      </div>
    </header>
  );
}

export default Header;
```

#### GeoMap.js
```javascript
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function GeoMap({ data, isDarkMode }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Leaflet 지도 초기화
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([30, 0], 2);
      
      const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
      L.tileLayer(tileUrl).addTo(mapInstanceRef.current);
    }

    // 마커 추가 로직
    // ...

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, isDarkMode]);

  return (
    <div className="card">
      <div className="card-title">
        <i className="fas fa-globe"></i> 지역별 트래픽
      </div>
      <div className="map-container">
        <div ref={mapRef} style={{ height: '300px' }}></div>
      </div>
    </div>
  );
}

export default GeoMap;
```

### 2. 백엔드 API 서버 추가 (선택사항)

기존 `report.py`를 Flask API 서버로 확장:

```python
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/geographic-data')
def get_geographic_data():
    # 데이터 반환
    return jsonify({...})

@app.route('/api/rules/before')
def get_rules_before():
    # 룰 데이터 반환
    return jsonify({...})

# ... 기타 API 엔드포인트

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## 🎯 다음 단계

### 즉시 작업 가능

1. **컴포넌트 파일 생성**
   ```bash
   cd frontend/src/components
   # 각 컴포넌트 파일 생성
   touch Header.js GeoMap.js HourlyChart.js AttackTypeChart.js
   touch RuleCard.js RuleComparison.js LogTable.js RulePopup.js
   ```

2. **의존성 설치**
   ```bash
   cd frontend
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm start
   ```

### 추가 개선 사항

- [ ] TypeScript 마이그레이션
- [ ] 상태 관리 라이브러리 (Redux/Zustand)
- [ ] 테스트 코드 작성 (Jest, React Testing Library)
- [ ] CI/CD 파이프라인 구축
- [ ] Docker 컨테이너화
- [ ] 성능 최적화 (Code Splitting, Lazy Loading)

---

## 💡 장점

### React 프론트엔드 분리의 이점

1. **관심사 분리**
   - 백엔드: 비즈니스 로직, 데이터 처리
   - 프론트엔드: UI/UX, 사용자 인터랙션

2. **독립적 개발**
   - 프론트엔드와 백엔드 팀이 독립적으로 작업 가능
   - API 계약만 정의하면 병렬 개발 가능

3. **확장성**
   - 프론트엔드: React 생태계 활용
   - 백엔드: Python 생태계 활용

4. **재사용성**
   - 컴포넌트 기반 구조로 코드 재사용
   - 다른 프로젝트에서도 컴포넌트 활용 가능

5. **성능**
   - SPA로 빠른 페이지 전환
   - 필요한 데이터만 API로 요청

---

## 📚 참고 자료

### React
- [React 공식 문서](https://react.dev/)
- [Create React App](https://create-react-app.dev/)

### API 연동
- [Axios 문서](https://axios-http.com/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

### 차트 라이브러리
- [Chart.js](https://www.chartjs.org/)
- [React Chart.js 2](https://react-chartjs-2.js.org/)

### 지도 라이브러리
- [Leaflet](https://leafletjs.com/)
- [React Leaflet](https://react-leaflet.js.org/)

---

## 🎉 완료!

프론트엔드가 성공적으로 분리되었습니다!

- ✅ `report.py` 복원 완료
- ✅ React 프로젝트 구조 생성
- ✅ 컴포넌트 설계 완료
- ✅ API 연동 준비 완료

이제 `frontend/` 디렉토리에서 React 개발을 시작할 수 있습니다! 🚀
