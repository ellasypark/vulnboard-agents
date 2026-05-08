import React from 'react';
import './RuleComparison.css';

function RuleComparison({ selectedType, onApply }) {
  return (
    <div className="compare-section">
      <h3 style={{ marginBottom: '1rem' }}>선택한 룰을 WAF에 적용하시겠습니까?</h3>
      <p className="selected-rule-info">
        {selectedType === 'before' && (
          <>
            <i className="fas fa-exclamation-triangle"></i> <strong>개선 전 룰</strong>이 선택되었습니다.
          </>
        )}
        {selectedType === 'after' && (
          <>
            <i className="fas fa-check-circle"></i> <strong>개선 후 룰</strong>이 선택되었습니다. (권장)
          </>
        )}
        {!selectedType && '룰을 선택해주세요'}
      </p>
      <button 
        className="compare-btn" 
        onClick={onApply}
        disabled={!selectedType}
      >
        <i className="fas fa-shield-alt"></i> 선택한 룰 적용하기
      </button>
    </div>
  );
}

export default RuleComparison;
