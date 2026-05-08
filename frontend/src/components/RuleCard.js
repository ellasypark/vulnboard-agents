import React, { useEffect, useRef } from 'react';
import './RuleCard.css';

function RuleCard({ title, icon, rules, type, selectedType, onSelect, onShowDetail, isDarkMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !rules || rules.length === 0) return;

    const avgRisk = rules.reduce((sum, rule) => sum + rule.risk_score, 0) / rules.length;
    drawGauge(canvasRef.current, avgRisk, isDarkMode);
  }, [rules, isDarkMode]);

  const drawGauge = (canvas, value, darkMode) => {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 20;
    const radius = 80;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 호
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = darkMode ? '#404040' : '#e0e0e0';
    ctx.stroke();

    // 값에 따른 색상
    const percentage = value;
    let color;
    if (percentage >= 70) color = '#e74c3c';
    else if (percentage >= 40) color = '#f39c12';
    else color = '#27ae60';

    // 값 호
    const endAngle = Math.PI + (Math.PI * (value / 100));
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 중앙 값
    ctx.fillStyle = darkMode ? '#ffffff' : '#1a1a1a';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(percentage) + '%', centerX, centerY - 10);

    // 라벨
    ctx.font = '14px Arial';
    ctx.fillStyle = darkMode ? '#b0b0b0' : '#6c757d';
    ctx.fillText('위험도', centerX, centerY + 15);
  };

  const avgRisk = rules && rules.length > 0 
    ? rules.reduce((sum, rule) => sum + rule.risk_score, 0) / rules.length 
    : 0;

  return (
    <div className="card">
      <div className="card-title">
        <i className={`fas fa-${icon}`}></i> {title}
      </div>
      <div className="gauge-container">
        <canvas ref={canvasRef} width="200" height="120"></canvas>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          총 {rules?.length || 0}개의 룰 | 평균 위험도: {Math.round(avgRisk)}%
        </p>
        <button 
          onClick={() => {
            console.log('상세 보기 클릭:', type, rules);
            if (rules && rules.length > 0) {
              onShowDetail(type, 0);
            } else {
              alert('표시할 룰이 없습니다.');
            }
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#357abd';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#4a90e2';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <i className="fas fa-info-circle"></i> 상세 보기
        </button>
      </div>
      <div className="rule-actions">
        <button 
          className={`select-rule-btn ${selectedType === type ? 'selected' : ''}`}
          onClick={() => onSelect(type)}
        >
          <i className="fas fa-check-circle"></i> 이 룰 선택
        </button>
      </div>
    </div>
  );
}

export default RuleCard;
