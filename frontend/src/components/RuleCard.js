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
      
      <div className="rule-card-layout">
        {/* 왼쪽: 룰 목록 */}
        <div className="rule-list-section">
          <div className="rule-list-scroll">
            {rules && rules.length > 0 ? (
              rules.map((rule, index) => (
                <div key={index} className="rule-item">
                  <div className="rule-item-content">
                    <div className="rule-item-name">{rule.name}</div>
                    <div className="rule-item-info">
                      {rule.category || rule.attack_type} • {rule.total_detections || 0}건 탐지
                    </div>
                  </div>
                  <button 
                    className="rule-detail-btn"
                    onClick={() => onShowDetail(type, index)}
                    title="상세 보기"
                  >
                    상세 보기
                  </button>
                </div>
              ))
            ) : (
              <div className="rule-item-empty">
                룰이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 게이지 차트 */}
        <div className="rule-gauge-section">
          <canvas ref={canvasRef} width="200" height="120"></canvas>
          <div className="rule-stats">
            <div className="rule-stat-item">
              <span className="rule-stat-label">총 {rules?.length || 0}개 룰</span>
            </div>
            <div className="rule-stat-item">
              <span className="rule-stat-label">평균 위험도: {Math.round(avgRisk)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 이 룰 선택 버튼 */}
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
