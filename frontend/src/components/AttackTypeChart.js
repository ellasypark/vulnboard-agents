import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function AttackTypeChart({ data, isDarkMode }) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  // 디자인 시스템 색상 팔레트
  const colors = [
    '#1970DF', // primary
    '#609EFF', // secondary-lightblue
    '#5949D3', // secondary-purple
    '#FB4C2E', // alert-red
    '#9EF06F', // accent-bg
    '#3F43AD', // secondary-bluepurple
  ];

  const chartData = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: isDarkMode ? '#172A3D' : '#FFFFFF',
      borderWidth: 2,
      hoverOffset: 8,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: isDarkMode ? '#D1D5DB' : '#6B7280',
          font: { size: 12 },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? '#172A3D' : '#FFFFFF',
        titleColor: isDarkMode ? '#F9FAFB' : '#17293D',
        bodyColor: isDarkMode ? '#D1D5DB' : '#6B7280',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#ECECEC',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  // 중앙 텍스트 계산
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="chart-wrapper">
      <h2 className="section-title">
        <i className="fas fa-chart-pie"></i> 공격 유형
      </h2>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-shield-virus"></i>
            Attack Type Distribution
          </h3>
          <div className="card-actions">
            <button className="card-action-btn" title="Options">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
        <div className="card-body">
          <div style={{ height: '300px', position: 'relative' }}>
            <Doughnut data={chartData} options={options} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '25%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                lineHeight: 1
              }}>
                {total.toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '0.25rem'
              }}>
                Total
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttackTypeChart;
