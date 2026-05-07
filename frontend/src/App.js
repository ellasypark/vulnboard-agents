import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import GeoMap from './components/GeoMap';
import HourlyChart from './components/HourlyChart';
import AttackTypeChart from './components/AttackTypeChart';
import RuleCard from './components/RuleCard';
import RuleComparison from './components/RuleComparison';
import LogTable from './components/LogTable';
import RulePopup from './components/RulePopup';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [geoData, setGeoData] = useState({});
  const [hourlyData, setHourlyData] = useState({});
  const [attackTypeData, setAttackTypeData] = useState({});
  const [rulesBefore, setRulesBefore] = useState([]);
  const [rulesAfter, setRulesAfter] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedRuleType, setSelectedRuleType] = useState(null);
  const [popupData, setPopupData] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [geo, hourly, attackType, before, after, logsData] = await Promise.all([
        axios.get('/api/geographic-data'),
        axios.get('/api/hourly-attacks'),
        axios.get('/api/monthly-attack-types'),
        axios.get('/api/rules/before'),
        axios.get('/api/rules/after'),
        axios.get('/api/logs?page=1&per_page=20')
      ]);

      setGeoData(geo.data);
      setHourlyData(hourly.data);
      setAttackTypeData(attackType.data);
      setRulesBefore(before.data.rules);
      setRulesAfter(after.data.rules);
      setLogs(logsData.data.logs);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
    axios.post('/api/theme', { theme: !isDarkMode ? 'dark' : 'light' });
  };

  const downloadReport = () => {
    window.location.href = '/api/download-report';
  };

  const selectRule = (type) => {
    setSelectedRuleType(type);
  };

  const applyRule = () => {
    if (!selectedRuleType) {
      alert('룰을 먼저 선택해주세요.');
      return;
    }
    
    const ruleName = selectedRuleType === 'before' ? '개선 전 룰' : '개선 후 룰';
    const confirmed = window.confirm(`${ruleName}을(를) WAF에 적용하시겠습니까?\n\n이 작업은 실제 WAF 설정을 변경합니다.`);
    
    if (confirmed) {
      alert(`✅ ${ruleName}이(가) 성공적으로 적용되었습니다!`);
    }
  };

  const showPopup = (type, index) => {
    const rules = type === 'before' ? rulesBefore : rulesAfter;
    if (rules && rules.length > index) {
      setPopupData({ type, index, rule: rules[index], rules });
    }
  };

  const closePopup = () => {
    setPopupData(null);
  };

  return (
    <div className="App">
      <Header 
        onToggleTheme={toggleTheme}
        onDownloadReport={downloadReport}
        isDarkMode={isDarkMode}
      />
      
      <div className="container">
        {/* 최상단: 지도, 시간대별 공격, 월별 공격 유형 */}
        <div className="grid grid-3">
          <GeoMap data={geoData} isDarkMode={isDarkMode} />
          <HourlyChart data={hourlyData} isDarkMode={isDarkMode} />
          <AttackTypeChart data={attackTypeData} isDarkMode={isDarkMode} />
        </div>

        {/* 중앙: 개선 전/후 룰 */}
        <div className="grid grid-2">
          <RuleCard 
            title="개선 전 룰"
            icon="exclamation-triangle"
            rules={rulesBefore}
            type="before"
            selectedType={selectedRuleType}
            onSelect={selectRule}
            onShowDetail={showPopup}
            isDarkMode={isDarkMode}
          />
          <RuleCard 
            title="개선 후 룰"
            icon="check-circle"
            rules={rulesAfter}
            type="after"
            selectedType={selectedRuleType}
            onSelect={selectRule}
            onShowDetail={showPopup}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* 룰 비교 및 적용 */}
        <RuleComparison 
          selectedType={selectedRuleType}
          onApply={applyRule}
        />

        {/* 최하단: 로그 테이블 */}
        <LogTable logs={logs} />
      </div>

      {/* 팝업 */}
      {popupData && (
        <RulePopup 
          data={popupData}
          onClose={closePopup}
          onNavigate={(direction) => {
            const newIndex = popupData.index + direction;
            if (newIndex >= 0 && newIndex < popupData.rules.length) {
              showPopup(popupData.type, newIndex);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
