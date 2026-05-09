import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import './DetailedAnalysis.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

function DetailedAnalysis() {
  const [logs, setLogs] = useState([]);
  const [hourlyData, setHourlyData] = useState({});
  const [attackTypeData, setAttackTypeData] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;

  useEffect(() => {
    loadData();
    // 다크모드 감지
    setIsDarkMode(document.body.classList.contains('dark-mode'));
  }, [currentPage]);

  const loadData = async () => {
    try {
      const [logsRes, hourlyRes, attackTypeRes] = await Promise.all([
        axios.get(`/api/logs?page=${currentPage}&per_page=${logsPerPage}`),
        axios.get('/api/hourly-attacks?days=30'),
        axios.get('/api/monthly-attack-types')
      ]);

      setLogs(logsRes.data.logs);
      setTotalLogs(logsRes.data.total);
      setHourlyData(hourlyRes.data);
      setAttackTypeData(attackTypeRes.data.data || attackTypeRes.data);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const goBack = () => {
    window.location.href = '/';
  };

  // 시간대별 공격 분포 차트
  const hourlyDistributionData = () => {
    const hourCounts = Array(24).fill(0);
    logs.forEach(log => {
      if (log.timestamp) {
        const hour = new Date(log.timestamp).getHours();
        hourCounts[hour]++;
      }
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}시`),
      datasets: [{
        label: '시간대별 공격 횟수',
        data: hourCounts,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: '#ef4444',
        borderWidth: 1
      }]
    };
  };

  // 30일 트렌드 차트
  const trendChartData = {
    labels: Object.keys(hourlyData),
    datasets: [{
      label: '일별 공격 횟수',
      data: Object.values(hourlyData),
      borderColor: '#4a90e2',
      backgroundColor: 'rgba(74, 144, 226, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  };

  // WAF 액션 분포
  const actionDistributionData = () => {
    const actions = { BLOCK: 0, ALLOW: 0, COUNT: 0 };
    logs.forEach(log => {
      const action = log.waf_action || 'UNKNOWN';
      if (actions.hasOwnProperty(action)) {
        actions[action]++;
      }
    });

    return {
      labels: ['차단 (BLOCK)', '허용 (ALLOW)', '카운트 (COUNT)'],
      datasets: [{
        data: [actions.BLOCK, actions.ALLOW, actions.COUNT],
        backgroundColor: ['#ef4444', '#10b981', '#f59e0b']
      }]
    };
  };

  // 위험도 분포
  const riskDistributionData = () => {
    const risks = { critical: 0, high: 0, medium: 0, low: 0 };
    logs.forEach(log => {
      const score = log.risk_score || 0;
      if (score >= 85) risks.critical++;
      else if (score >= 70) risks.high++;
      else if (score >= 40) risks.medium++;
      else risks.low++;
    });

    return {
      labels: ['치명적 (85+)', '높음 (70-84)', '중간 (40-69)', '낮음 (<40)'],
      datasets: [{
        data: [risks.critical, risks.high, risks.medium, risks.low],
        backgroundColor: ['#dc2626', '#f97316', '#f59e0b', '#10b981']
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: { size: 11 }
        }
      }
    },
    scales: {
      x: {
        grid: { color: isDarkMode ? '#374151' : '#e5e7eb' },
        ticks: { color: isDarkMode ? '#9ca3af' : '#6b7280', font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: isDarkMode ? '#374151' : '#e5e7eb' },
        ticks: { color: isDarkMode ? '#9ca3af' : '#6b7280', font: { size: 10 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: { size: 11 }
        }
      }
    }
  };

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  return (
    <div className="detailed-analysis">
      <div className="analysis-header">
        <button onClick={goBack} className="back-button">
          <i className="fas fa-arrow-left"></i> 대시보드로 돌아가기
        </button>
        <h1><i className="fas fa-chart-area"></i> 상세 보안 분석</h1>
      </div>

      <div className="analysis-grid">
        {/* 30일 트렌드 */}
        <div className="analysis-card wide">
          <h3><i className="fas fa-chart-line"></i> 30일 공격 트렌드</h3>
          <div style={{ height: '300px' }}>
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>

        {/* 시간대별 분포 */}
        <div className="analysis-card">
          <h3><i className="fas fa-clock"></i> 시간대별 공격 분포</h3>
          <div style={{ height: '250px' }}>
            <Bar data={hourlyDistributionData()} options={chartOptions} />
          </div>
        </div>

        {/* WAF 액션 분포 */}
        <div className="analysis-card">
          <h3><i className="fas fa-shield-alt"></i> WAF 액션 분포</h3>
          <div style={{ height: '250px' }}>
            <Doughnut data={actionDistributionData()} options={doughnutOptions} />
          </div>
        </div>

        {/* 위험도 분포 */}
        <div className="analysis-card">
          <h3><i className="fas fa-exclamation-triangle"></i> 위험도 분포</h3>
          <div style={{ height: '250px' }}>
            <Doughnut data={riskDistributionData()} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="logs-section">
        <h2><i className="fas fa-list"></i> 전체 로그 목록 ({totalLogs}건)</h2>
        <div className="table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>출발지 IP</th>
                <th>국가</th>
                <th>공격 유형</th>
                <th>HTTP 메서드</th>
                <th>URI</th>
                <th>WAF 액션</th>
                <th>위험도</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td>{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                  <td><code>{log.source_ip}</code></td>
                  <td>{log.source_country}</td>
                  <td>
                    <span className={`attack-badge ${log.attack_type.includes('SQL') ? 'sql' : log.attack_type.includes('XSS') ? 'xss' : 'other'}`}>
                      {log.attack_type}
                    </span>
                  </td>
                  <td><span className="method-badge">{log.http_method}</span></td>
                  <td className="uri-cell">{log.uri}</td>
                  <td>
                    <span className={`action-badge ${log.waf_action.toLowerCase()}`}>
                      {log.waf_action}
                    </span>
                  </td>
                  <td>
                    <span className={`risk-badge ${log.risk_score >= 85 ? 'critical' : log.risk_score >= 70 ? 'high' : log.risk_score >= 40 ? 'medium' : 'low'}`}>
                      {log.risk_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i> 이전
          </button>
          <span>페이지 {currentPage} / {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            다음 <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailedAnalysis;
