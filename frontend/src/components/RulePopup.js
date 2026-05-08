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
            {type === 'before' ? '개선 전' : '개선 후'} WAF 룰 상세
          </h2>
          <button className="popup-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="popup-content">
          <div className="detail-row">
            <div className="detail-label">룰 이름</div>
            <div className="detail-value" style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {rule.name || 'N/A'}
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">카테고리</div>
            <div className="detail-value">
              <span style={{ 
                background: '#e0f2fe', 
                color: '#0369a1', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                {rule.category || 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">WCU (Web ACL Capacity Units)</div>
            <div className="detail-value">
              <strong style={{ fontSize: '1.2rem', color: '#2563eb' }}>{rule.wcu || 0}</strong> WCU
            </div>
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
            <div className="detail-label">설명</div>
            <div className="detail-value">{rule.description || 'N/A'}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">탐지 통계</div>
            <div className="detail-value">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  background: '#f0f9ff', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>총 탐지</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369a1' }}>
                    {rule.total_detections || 0}건
                  </div>
                </div>
                <div style={{ 
                  background: '#fef2f2', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>차단</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>
                    {rule.blocked_count || 0}건
                  </div>
                </div>
                <div style={{ 
                  background: '#f0fdf4', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>허용</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
                    {rule.allowed_count || 0}건
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">주요 공격 유형</div>
            <div className="detail-value">
              {rule.attack_summary && rule.attack_summary.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {rule.attack_summary.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                '탐지된 공격 없음'
              )}
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">효과성</div>
            <div className="detail-value">{rule.effectiveness || 'N/A'}</div>
          </div>
          
          {type === 'before' && rule.limitations && (
            <div className="detail-row">
              <div className="detail-label">한계점</div>
              <div className="detail-value">
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#dc2626' }}>
                  {rule.limitations.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>⚠️ {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {type === 'after' && rule.improvements && (
            <div className="detail-row">
              <div className="detail-label">AI 개선 사항</div>
              <div className="detail-value">
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#16a34a' }}>
                  {rule.improvements.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>✅ {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {rule.expected_effect && (
            <div className="detail-row">
              <div className="detail-label">기대 효과</div>
              <div className="detail-value" style={{ 
                color: 'var(--accent)', 
                fontWeight: 600,
                background: '#f0fdf4',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #86efac'
              }}>
                🎯 {rule.expected_effect}
              </div>
            </div>
          )}
          
          <div className="detail-row">
            <div className="detail-label">마지막 업데이트</div>
            <div className="detail-value">
              {rule.timestamp ? new Date(rule.timestamp).toLocaleString('ko-KR') : 'N/A'}
            </div>
          </div>
        </div>
        
        <div className="popup-footer">
          <button 
            className="nav-btn" 
            onClick={() => onNavigate(-1)}
            disabled={index === 0}
          >
            <i className="fas fa-chevron-left"></i> 이전 룰
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {index + 1} / {rules.length}
          </span>
          <button 
            className="nav-btn" 
            onClick={() => onNavigate(1)}
            disabled={index === rules.length - 1}
          >
            다음 룰 <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </>
  );
}

export default RulePopup;
