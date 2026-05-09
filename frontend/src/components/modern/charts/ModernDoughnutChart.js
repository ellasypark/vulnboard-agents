import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../../theme/ThemeContext';
import './ModernCharts.css';

const ModernDoughnutChart = ({ data, title }) => {
  const { isDarkMode } = useTheme();

  const labels = Object.keys(data);
  const values = Object.values(data);

  // 색상 팔레트 (디자인 시스템 기반)
  const colors = [
    '#1970DF', // primary
    '#609EFF', // secondary-lightblue
    '#5949D3', // secondary-purple
    '#3F43AD', // secondary-bluepurple
    '#9EF06F', // accent-bg
    '#FB4C2E', // alert-red
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
          font: {
            size: 12,
          },
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
    <div className="modern-chart">
      <div style={{ height: '300px', position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
        <div className="doughnut-center">
          <div className="doughnut-center-value">{total.toLocaleString()}</div>
          <div className="doughnut-center-label">Total</div>
        </div>
      </div>
    </div>
  );
};

export default ModernDoughnutChart;
