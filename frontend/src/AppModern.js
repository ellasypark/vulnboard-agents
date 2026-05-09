import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from './theme/ThemeContext';
import TopBar from './components/modern/TopBar';
import DashboardGrid, { GridPanel } from './components/modern/DashboardGrid';
import ModernLineChart from './components/modern/charts/ModernLineChart';
import ModernDoughnutChart from './components/modern/charts/ModernDoughnutChart';
import StatCard from './components/modern/StatCard';
import './theme/theme.css';

// Chart.js 등록
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AppModern() {
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState({});
  const [hourlyData, setHourlyData] = useState({});
  const [attackTypeData, setAttackTypeData] = useState({});
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    blockedCount: 0,
    allowedCount: 0,
    criticalCount: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [geo, hourly, attackType, logsData] = await Promise.all([
        axios.get('/api/geographic-data'),
        axios.get('/api/hourly-attacks'),
        axios.get('/api/monthly-attack-types'),
        axios.get('/api/logs?page=1&per_page=1000')
      ]);

      setGeoData(geo.data.data || geo.data);
      setHourlyData(hourly.data);
      setAttackTypeData(attackType.data.data || attackType.data);
      setLogs(logsData.data.logs || []);

      // 통계 계산
      const allLogs = logsData.data.logs || [];
      setStats({
        totalLogs: allLogs.length,
        blockedCount: allLogs.filter(log => log.waf_action === 'BLOCK').length,
        allowedCount: allLogs.filter(log => log.waf_action === 'ALLOW').length,
        criticalCount: allLogs.filter(log => log.risk_score >= 85).length
      });

      setLoading(false);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    window.location.href = '/api/download-report';
  };

  const handleRefresh = () => {
    loadAllData();
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          background: 'var(--bg-primary)'
        }}>
          <div className="panel-loading">
            <i className="fas fa-spinner"></i>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="app-modern">
        <TopBar 
          onDownloadReport={handleDownloadReport}
          onRefresh={handleRefresh}
        />
        
        <DashboardGrid>
          {/* 상단 통계 카드 */}
          <GridPanel size="small" className="fade-in">
            <StatCard
              title="Total Events"
              value={stats.totalLogs.toLocaleString()}
              change="+12.5%"
              changeType="positive"
              icon="chart-line"
              subtitle="Last 24 hours"
            />
          </GridPanel>

          <GridPanel size="small" className="fade-in">
            <StatCard
              title="Blocked Attacks"
              value={stats.blockedCount.toLocaleString()}
              change="+8.3%"
              changeType="positive"
              icon="shield-alt"
              subtitle="Successfully blocked"
            />
          </GridPanel>

          <GridPanel size="small" className="fade-in">
            <StatCard
              title="Critical Threats"
              value={stats.criticalCount.toLocaleString()}
              change="-5.2%"
              changeType="negative"
              icon="exclamation-triangle"
              subtitle="Risk score ≥ 85"
            />
          </GridPanel>

          <GridPanel size="small" className="fade-in">
            <StatCard
              title="Allowed Traffic"
              value={stats.allowedCount.toLocaleString()}
              change="+15.7%"
              changeType="positive"
              icon="check-circle"
              subtitle="Legitimate requests"
            />
          </GridPanel>

          {/* 트래픽 차트 */}
          <GridPanel 
            size="large" 
            title="Traffic Overview"
            subtitle="Daily traffic patterns over the last 7 days"
            className="fade-in"
            actions={
              <>
                <button className="btn-icon">
                  <i className="fas fa-expand"></i>
                </button>
                <button className="btn-icon">
                  <i className="fas fa-download"></i>
                </button>
              </>
            }
          >
            <ModernLineChart data={hourlyData} title="Traffic" />
          </GridPanel>

          {/* 공격 유형 분포 */}
          <GridPanel 
            size="large" 
            title="Attack Type Distribution"
            subtitle="Breakdown of detected attack patterns"
            className="fade-in"
            actions={
              <button className="btn-icon">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            }
          >
            <ModernDoughnutChart data={attackTypeData} title="Attack Types" />
          </GridPanel>

          {/* 지리적 분포 */}
          <GridPanel 
            size="medium" 
            title="Geographic Distribution"
            subtitle="Attack sources by country"
            className="fade-in"
          >
            <div className="geo-list">
              {Object.entries(geoData).slice(0, 10).map(([country, count], idx) => (
                <div key={idx} className="geo-item">
                  <span className="geo-country">{country}</span>
                  <div className="geo-bar-container">
                    <div 
                      className="geo-bar" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(geoData))) * 100}%`,
                        background: 'var(--gradient-official)'
                      }}
                    ></div>
                  </div>
                  <span className="geo-count">{count}</span>
                </div>
              ))}
            </div>
          </GridPanel>

          {/* 최근 로그 */}
          <GridPanel 
            size="full" 
            title="Recent Security Events"
            subtitle="Latest detected threats and activities"
            className="fade-in"
            actions={
              <>
                <button className="btn-secondary">
                  <i className="fas fa-filter"></i>
                  Filter
                </button>
                <button className="btn-secondary">
                  <i className="fas fa-download"></i>
                  Export
                </button>
              </>
            }
          >
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Source IP</th>
                    <th>Country</th>
                    <th>Attack Type</th>
                    <th>Action</th>
                    <th>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map((log, idx) => (
                    <tr key={idx}>
                      <td>{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                      <td><code>{log.source_ip}</code></td>
                      <td>{log.source_country}</td>
                      <td>
                        <span className="attack-badge">{log.attack_type}</span>
                      </td>
                      <td>
                        <span className={`action-badge ${log.waf_action.toLowerCase()}`}>
                          {log.waf_action}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-badge ${log.risk_score >= 85 ? 'critical' : log.risk_score >= 70 ? 'high' : 'medium'}`}>
                          {log.risk_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GridPanel>
        </DashboardGrid>
      </div>
    </ThemeProvider>
  );
}

export default AppModern;
