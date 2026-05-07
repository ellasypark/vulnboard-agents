import React, { useEffect } from 'react';
import './RulePopup.css';

function RulePopup({ data, onClose, onNavigate }) {
  const { type, index, rule, rules } = data;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  if (!rule) return null;

  return (
    <>
      <div className="overlay active" onClick={onClose}></div>
      <div className="popup active">
        <div className="popup-header">
          <h2>
            <i className={`fas fa-${type === 'before' ? 'exclamation-triangle' : 'check-circle'}`}></i>{' '}
            {type === 'before' ? '개선 전' : '개선 후'} 룰 상세
          </h2>
          <button className="popup-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="popup-content">
          <div className="detail-row">
            <div className="detail-label">룰 이름</div>
            <div className="detail-value">{rule.name || 'N/A'}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">위험도</div>
            <div className="detail-value">
              <span className={`risk-badge risk-${(rule.risk_level || 'MEDIUM').toLowerCase()}`}>
                {rule.risk_level || 'MEDIUM'}
              </span>
              <span style={{ marginLeft: '1rem' }}>위험 점수: {rule.risk_score || 0}/100</span>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">일시</div>
            <div className="detail-value">
              {rule.timestamp ? new Date(rule.timestamp).toLocaleString('ko-KR') : 'N/A'}
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">대상</div>
            <div className="detail-value">
              {rule.target_ip || 'N/A'} / {rule.target_country || 'N/A'}
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">유형</div>
            <div className="detail-value"><strong>{rule.attack_type || 'N/A'}</strong></div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">설명</div>
            <div className="detail-value">{rule.attack_description || 'N/A'}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">원인 (WAF 로그)</div>
            <div className="detail-value" style={{ wordBreak: 'break-all' }}>
              {rule.cause || 'N/A'}
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">조치 방안 (WAF 룰)</div>
            <div className="detail-value">{rule.action || 'N/A'}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">영향도</div>
            <div className="detail-value">{rule.impact || 'N/A'}</div>
          </div>
          
          {rule.expected_effect && (
            <div className="detail-row">
              <div className="detail-label">기대 효과</div>
              <div className="detail-value" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {rule.expected_effect}
              </div>
            </div>
          )}
        </div>
        
        <div className="popup-footer">
          <button 
            className="nav-btn" 
            onClick={() => onNavigate(-1)}
            disabled={index === 0}
          >
            <i className="fas fa-chevron-left"></i> 이전
          </button>
          <button 
            className="nav-btn" 
            onClick={() => onNavigate(1)}
            disabled={index === rules.length - 1}
          >
            다음 <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </>
  );
}

export default RulePopup;
