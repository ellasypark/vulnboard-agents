import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function HourlyChart({ data, isDarkMode }) {
  // data는 이제 { '01/15': 5, '01/16': 8, ... } 형식
  const dates = Object.keys(data);
  const counts = Object.values(data);

  const chartData = {
    labels: dates,
    datasets: [{
      label: '일별 공격 횟수',
      data: counts,
      borderColor: '#4a90e2',
      backgroundColor: 'rgba(74, 144, 226, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#4a90e2',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        titleColor: isDarkMode ? '#f3f4f6' : '#111827',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `공격 횟수: ${context.parsed.y}건`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          font: { size: 11 }
        }
      },
      y: { 
        beginAtZero: true,
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <i className="fas fa-chart-line"></i> 주간 공격 현황 (최근 7일)
      </div>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default HourlyChart;
