# 대시보드 타이틀 위치 변경

## 📅 업데이트 일자
2026-05-08

## 🎯 변경 목적
대시보드의 모든 차트 요소의 타이틀을 박스 내부에서 **박스 외부 좌측 상단**으로 이동하여 'WAF 룰 관리'와 동일한 레이아웃 적용

---

## 🔄 변경된 컴포넌트

### 1. 지역별 트래픽 (GeoMap.js)
#### 변경 전
```jsx
<div className="card">
  <div className="card-title">
    <i className="fas fa-globe"></i> 지역별 트래픽
  </div>
  <div className="map-container">
    {/* 지도 내용 */}
  </div>
</div>
```

#### 변경 후
```jsx
<div className="chart-wrapper">
  <h2 className="section-title">
    <i className="fas fa-globe"></i> 지역별 트래픽
  </h2>
  <div className="card">
    <div className="map-container">
      {/* 지도 내용 */}
    </div>
  </div>
</div>
```

---

### 2. 주간 공격 현황 (HourlyChart.js)
#### 변경 전
```jsx
<div className="card">
  <div className="card-title">
    <i className="fas fa-chart-line"></i> 주간 공격 현황 (최근 7일)
  </div>
  <div style={{ height: '300px' }}>
    {/* 차트 내용 */}
  </div>
</div>
```

#### 변경 후
```jsx
<div className="chart-wrapper">
  <h2 className="section-title">
    <i className="fas fa-chart-line"></i> 주간 공격 현황 (최근 7일)
  </h2>
  <div className="card">
    <div style={{ height: '300px' }}>
      {/* 차트 내용 */}
    </div>
  </div>
</div>
```

---

### 3. 월별 공격 유형 (AttackTypeChart.js)
#### 변경 전
```jsx
<div className="card">
  <div className="card-title">
    <i className="fas fa-chart-pie"></i> 월별 공격 유형
  </div>
  <div style={{ height: '300px' }}>
    {/* 차트 내용 */}
  </div>
</div>
```

#### 변경 후
```jsx
<div className="chart-wrapper">
  <h2 className="section-title">
    <i className="fas fa-chart-pie"></i> 월별 공격 유형
  </h2>
  <div className="card">
    <div style={{ height: '300px' }}>
      {/* 차트 내용 */}
    </div>
  </div>
</div>
```

---

### 4. WAF 로그 (LogTable.js)
#### 변경 전
```jsx
<div className="card" ref={tableRef}>
  <div className="card-title-row">
    <div className="card-title">
      <i className="fas fa-list"></i> WAF 로그
    </div>
    <button className="filter-toggle-btn">
      {/* 필터 버튼 */}
    </button>
  </div>
  {/* 테이블 내용 */}
</div>
```

#### 변경 후
```jsx
<div className="chart-wrapper">
  <div className="section-title-row">
    <h2 className="section-title">
      <i className="fas fa-list"></i> WAF 로그
    </h2>
    <button className="filter-toggle-btn">
      {/* 필터 버튼 */}
    </button>
  </div>
  <div className="card" ref={tableRef}>
    {/* 테이블 내용 */}
  </div>
</div>
```

---

## 🎨 새로운 CSS 스타일

### App.css에 추가된 스타일

```css
/* 차트 래퍼 - 타이틀을 박스 외부에 배치 */
.chart-wrapper {
  margin-bottom: 1.5rem;
}

/* 섹션 타이틀 - WAF 룰 관리와 동일한 스타일 */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: var(--accent);
  font-size: 1.1rem;
}

.section-title .filter-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-left: 0.5rem;
}

/* 섹션 타이틀 행 (필터 버튼 포함) */
.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
```

---

## 📊 변경 전후 비교

### 레이아웃 구조

#### 변경 전
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ 📊 타이틀 (박스 내부)    │ │
│ ├─────────────────────────┤ │
│ │                         │ │
│ │   차트 내용             │ │
│ │                         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### 변경 후
```
📊 타이틀 (박스 외부)
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │   차트 내용             │ │
│ │                         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## ✅ 장점

### 1. 일관성
- 모든 대시보드 요소가 동일한 레이아웃
- 'WAF 룰 관리'와 통일된 디자인

### 2. 공간 효율성
- 박스 내부 공간을 차트/테이블에 더 많이 할당
- 타이틀이 차지하는 수직 공간 감소

### 3. 시각적 명확성
- 타이틀이 박스 외부에 있어 섹션 구분이 명확
- 아이콘과 텍스트가 더 돋보임

### 4. 확장성
- 새로운 차트 추가 시 동일한 패턴 적용 가능
- 유지보수 용이

---

## 🔧 수정된 파일 목록

### JavaScript 컴포넌트
1. **`frontend/src/components/GeoMap.js`**
   - 타이틀을 `chart-wrapper`와 `section-title`로 이동

2. **`frontend/src/components/HourlyChart.js`**
   - 타이틀을 `chart-wrapper`와 `section-title`로 이동

3. **`frontend/src/components/AttackTypeChart.js`**
   - 타이틀을 `chart-wrapper`와 `section-title`로 이동

4. **`frontend/src/components/LogTable.js`**
   - 타이틀과 필터 버튼을 `section-title-row`로 이동

### CSS 파일
1. **`frontend/src/App.css`**
   - `.chart-wrapper` 스타일 추가
   - `.section-title` 스타일 추가
   - `.section-title-row` 스타일 추가
   - 반응형 스타일 추가

2. **`frontend/src/components/GeoMap.css`**
   - `.card-title` 스타일 제거

3. **`frontend/src/components/LogTable.css`**
   - `.card-title-row` 스타일 제거
   - `.card-title` 스타일 제거
   - `.filter-count` 스타일 제거 (App.css로 이동)

---

## 📱 반응형 디자인

### 모바일 (768px 이하)
```css
@media (max-width: 768px) {
  .section-title {
    font-size: 1.1rem;
  }
  
  .section-title i {
    font-size: 1rem;
  }
}
```

---

## 🎯 WAF 룰 관리와의 일관성

### WAF 룰 관리 구조
```jsx
<div className="rule-management-container">
  <h2 className="section-title">
    <i className="fas fa-shield-alt"></i> WAF 룰 관리
  </h2>
  <div className="rule-management-grid">
    {/* 룰 관리 내용 */}
  </div>
</div>
```

### 다른 차트들의 구조 (변경 후)
```jsx
<div className="chart-wrapper">
  <h2 className="section-title">
    <i className="fas fa-icon"></i> 차트 제목
  </h2>
  <div className="card">
    {/* 차트 내용 */}
  </div>
</div>
```

✅ 동일한 `section-title` 클래스 사용으로 완벽한 일관성 확보

---

## 🚀 배포 방법

### 1. 프론트엔드 재빌드
```bash
cd frontend
npm run build
```

### 2. 브라우저 캐시 클리어
- Ctrl + Shift + R (하드 리프레시)

### 3. 확인 사항
- [ ] 모든 차트의 타이틀이 박스 외부에 표시되는가?
- [ ] 타이틀 스타일이 'WAF 룰 관리'와 동일한가?
- [ ] 아이콘 색상이 accent 색상으로 표시되는가?
- [ ] 모바일에서도 정상적으로 표시되는가?
- [ ] 다크모드에서도 정상적으로 표시되는가?

---

## 🐛 알려진 이슈

현재 없음

---

## 📞 문의

문제가 발생하거나 추가 개선이 필요한 경우:
1. 브라우저 개발자 도구에서 CSS 확인
2. `App.css`의 `.section-title` 스타일 확인
3. 각 컴포넌트의 구조 확인

---

**작성자**: Kiro AI Assistant  
**버전**: 1.0  
**최종 업데이트**: 2026-05-08
