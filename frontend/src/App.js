import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './components/Header';
import GeoMap from './components/GeoMap';
import HourlyChart from './components/HourlyChart';
import AttackTypeChart from './components/AttackTypeChart';
import RuleManagement from './components/RuleManagement';
import LogTable from './components/LogTable';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [geoData, setGeoData] = useState({});
  const [hourlyData, setHourlyData] = useState({});
  const [attackTypeData, setAttackTypeData] = useState({});
  const [attackTypeColors, setAttackTypeColors] = useState({});
  const [aiRules, setAiRules] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [geo, hourly, attackType, after, logsData] = await Promise.all([
        axios.get('/api/geographic-data'),
        axios.get('/api/hourly-attacks'),
        axios.get('/api/monthly-attack-types'),
        axios.get('/api/rules/after'),  // AI 추천 룰 (개선 후 룰)
        axios.get('/api/logs?page=1&per_page=10000')  // 전체 로그 가져오기
      ]);

      setGeoData(geo.data);
      setHourlyData(hourly.data);
      setAttackTypeData(attackType.data.data || attackType.data);
      setAttackTypeColors(attackType.data.colors || {});
      setAiRules(after.data.rules);
      setLogs(logsData.data.logs);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.body.classList.toggle('dark-mode');
    
    try {
      await axios.post('/api/theme', { theme: newTheme ? 'dark' : 'light' });
    } catch (error) {
      console.error('테마 변경 오류:', error);
      // 에러 발생 시 UI는 이미 변경되었으므로 그대로 유지
    }
  };

  const downloadReport = () => {
    window.location.href = '/api/download-report';
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

        {/* 중앙: WAF 룰 관리 (3단 레이아웃) */}
        <RuleManagement 
          aiRules={aiRules}
          attackTypeColors={attackTypeColors}
          isDarkMode={isDarkMode}
        />

        {/* 최하단: 로그 테이블 */}
        <LogTable logs={logs} />
      </div>
    </div>
  );
}

export default App;
