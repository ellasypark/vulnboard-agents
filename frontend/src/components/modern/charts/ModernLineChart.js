import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../../theme/ThemeContext';
import './ModernCharts.css';

const ModernLineChart = ({ data, title, subtitle }) => {
  const { isDarkMode } = useTheme();

  const dates = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels: dates,
    datasets: [{
      label: title || '트래픽',
      data: values,
      borderColor: '#609EFF',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(96, 158, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(96, 158, 255, 0)');
        return gradient;
      },
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#609EFF',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? '#172A3D' : '#FFFFFF',
        titleColor: isDarkMode ? '#F9FAFB' : '#17293D',
        bodyColor: isDarkMode ? '#D1D5DB' : '#6B7280',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#ECECEC',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            return `${context.parsed.y.toLocaleString()} 건`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          font: {
            size: 11,
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          font: {
            size: 11,
          },
          callback: (value) => {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="modern-chart">
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ModernLineChart;
