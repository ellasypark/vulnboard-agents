import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import Header from './components/Header';
import GeoMap from './components/GeoMap';
import HourlyChart from './components/HourlyChart';
import AttackTypeChart from './components/AttackTypeChart';
import RuleManagement from './components/RuleManagement';
import LogTable from './components/LogTable';
import DetailedAnalysis from './components/DetailedAnalysis';

function AppContent() {
  const { isDarkMode } = useTheme();
  const [geoData, setGeoData] = useState({});
  const [hourlyData, setHourlyData] = useState({});
  const [attackTypeData, setAttackTypeData] = useState({});
  const [attackTypeColors, setAttackTypeColors] = useState({});
  const [aiRules, setAiRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'detailed'

  useEffect(() => {
    // URL 기반 라우팅
    const path = window.location.pathname;
    if (path === '/detailed-analysis') {
      setCurrentView('detailed');
    } else {
      setCurrentView('dashboard');
      loadAllData();
    }

    // popstate 이벤트 리스너 (뒤로가기 버튼 대응)
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentView(path === '/detailed-analysis' ? 'detailed' : 'dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  const downloadReport = () => {
    window.location.href = '/api/download-report';
  };

  // 상세 분석 페이지 표시
  if (currentView === 'detailed') {
    return <DetailedAnalysis />;
  }

  return (
    <div className="App">
      <Header 
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

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

